<?php

namespace Tests\Feature\Calendar;

use App\Models\CalendarSource;
use App\Models\Event;
use App\Models\Song;
use App\Services\Calendar\CalendarSync;
use App\Services\Calendar\CalendarSyncFailed;
use Closure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CalendarSyncTest extends TestCase
{
    use RefreshDatabase;

    private const string URL = 'https://calendar.google.com/calendar/ical/secret/basic.ics';

    /** Ответ сервера календаря; тест может менять его между синхронизациями. */
    private Closure $respond;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-14 12:00:00');

        // Http::fake() оставляет первую подошедшую заглушку, поэтому ответ подменяется через замыкание.
        $this->respond = fn () => Http::response('', 404);
        Http::fake(fn () => ($this->respond)());
    }

    public function test_imports_events_from_icalendar_feed(): void
    {
        $this->fakeCalendar($this->calendar());
        $source = $this->source();

        $result = app(CalendarSync::class)->sync($source);

        $this->assertSame([5, 0, 0, 0], [$result->created, $result->updated, $result->deleted, $result->hidden]);
        $this->assertSame('добавлено 5, обновлено 0, удалено 0', $result->summary());

        $events = Event::query()->orderBy('starts_at')->get();
        $this->assertSame(
            [
                ['Богослужение', '2026-10-18 11:00', '2026-10-18 12:30', false],
                ['Конференция в Нью-Йорке', '2026-10-20 17:00', '2026-10-20 19:00', false],
                ['Выезд', '2026-10-24 00:00', '2026-10-25 00:00', true],
                ['Богослужение (перенесено)', '2026-11-01 12:00', '2026-11-01 13:30', false],
                ['Богослужение', '2026-11-08 11:00', '2026-11-08 12:30', false],
            ],
            $events->map(fn (Event $e) => [$e->title, $e->starts_at->format('Y-m-d H:i'), $e->ends_at?->format('Y-m-d H:i'), $e->all_day])->all(),
        );

        $service = $events->first();
        $this->assertSame('Главный зал', $service->place);
        $this->assertSame("Воскресное служение\nПриходите заранее & берите друзей", $service->description);
        $this->assertSame('service@google.com#20261018T080000Z', $service->external_uid);
        $this->assertSame($source->id, $service->calendar_source_id);
        $this->assertTrue($events->every->is_published);

        $source->refresh();
        $this->assertNotNull($source->last_synced_at);
        $this->assertNull($source->last_error);
    }

    public function test_resync_updates_calendar_fields_but_keeps_site_additions(): void
    {
        $this->fakeCalendar($this->calendar());
        $source = $this->source();
        app(CalendarSync::class)->sync($source);

        // На сайте к служению добавили метку, гимн и сняли с публикации, к выезду — проповедь.
        $service = Event::query()->where('external_uid', 'service@google.com#20261018T080000Z')->sole();
        $service->update(['tag' => 'Воскресенье', 'is_main' => true, 'is_published' => false]);
        $service->songs()->attach(Song::query()->create(['number' => 1, 'title' => 'Гимн']));
        $retreat = Event::query()->where('external_uid', 'retreat@example.com')->sole();
        $retreat->sermon()->create(['topic' => 'Тема выезда']);

        // В календаре: служение переименовали, конференцию удалили, выезд удалили, повторов стало три.
        $changed = str_replace(
            ['SUMMARY:Богослужение'."\r\n", 'COUNT=4'],
            ['SUMMARY:Воскресное богослужение'."\r\n", 'COUNT=3'],
            $this->calendar(withConference: false, withRetreat: false),
        );
        $this->fakeCalendar($changed);

        $result = app(CalendarSync::class)->sync($source->refresh());

        $this->assertSame([0, 1, 2, 1], [$result->created, $result->updated, $result->deleted, $result->hidden]);

        $service->refresh();
        $this->assertSame('Воскресное богослужение', $service->title);
        $this->assertSame('Воскресенье', $service->tag);
        $this->assertTrue($service->is_main);
        $this->assertFalse($service->is_published);
        $this->assertCount(1, $service->songs);

        // Удалённое событие с проповедью не удаляется, а скрывается.
        $retreat->refresh();
        $this->assertFalse($retreat->is_published);
        $this->assertSame('Тема выезда', $retreat->sermon->topic);

        $this->assertSame(
            ['Воскресное богослужение', 'Выезд', 'Богослужение (перенесено)'],
            Event::query()->orderBy('starts_at')->pluck('title')->all(),
        );
    }

    public function test_events_outside_the_sync_window_and_other_sources_are_left_alone(): void
    {
        $this->fakeCalendar($this->calendar());
        $source = $this->source();
        $old = Event::query()->create([
            'title' => 'Прошлогоднее', 'starts_at' => '2025-10-18 11:00',
            'calendar_source_id' => $source->id, 'external_uid' => 'old@example.com',
        ]);
        $own = Event::query()->create(['title' => 'Своё событие', 'starts_at' => '2026-10-19 19:00']);

        app(CalendarSync::class)->sync($source);

        $this->assertModelExists($old);
        $this->assertModelExists($own);
    }

    public function test_new_events_can_be_imported_unpublished(): void
    {
        $this->fakeCalendar($this->calendar());

        app(CalendarSync::class)->sync($this->source(['publish_events' => false]));

        $this->assertSame(5, Event::query()->where('is_published', false)->count());
    }

    public function test_webcal_links_are_fetched_over_https(): void
    {
        $this->fakeCalendar($this->calendar());

        app(CalendarSync::class)->sync($this->source(['url' => 'webcal://p01-calendars.icloud.com/published/2/secret']));

        Http::assertSent(fn (Request $request) => $request->url() === 'https://p01-calendars.icloud.com/published/2/secret');
    }

    public function test_failures_are_recorded_and_events_are_kept(): void
    {
        $source = $this->source();
        $event = Event::query()->create([
            'title' => 'Уже загружено', 'starts_at' => '2026-10-18 11:00',
            'calendar_source_id' => $source->id, 'external_uid' => 'kept@example.com',
        ]);

        $cases = [
            [Http::response('Not found', 404), 'Календарь ответил ошибкой 404'],
            [Http::response('<html><body>Google Calendar</body></html>', 200), 'не календарь в формате iCalendar'],
            [fn () => throw new ConnectionException('timeout'), 'Не удалось подключиться к календарю'],
        ];

        foreach ($cases as [$response, $message]) {
            $this->respond = $response instanceof Closure ? $response : fn () => $response;

            try {
                app(CalendarSync::class)->sync($source->refresh());
                $this->fail('Синхронизация должна была завершиться ошибкой');
            } catch (CalendarSyncFailed $e) {
                $this->assertStringContainsString($message, $e->getMessage());
            }

            $this->assertStringContainsString($message, $source->refresh()->last_error);
            $this->assertModelExists($event);
        }
    }

    public function test_command_syncs_active_sources(): void
    {
        $this->fakeCalendar($this->calendar());
        $this->source(['name' => 'Служения']);
        $this->source(['name' => 'Выключенный', 'is_active' => false]);

        $this->artisan('calendars:sync')
            ->expectsOutput('«Служения»: добавлено 5, обновлено 0, удалено 0')
            ->doesntExpectOutputToContain('Выключенный')
            ->assertSuccessful();

        $this->respond = fn () => Http::response('nope', 500);

        $this->artisan('calendars:sync')
            ->expectsOutputToContain('«Служения»: Календарь ответил ошибкой 500')
            ->assertFailed();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function source(array $attributes = []): CalendarSource
    {
        return CalendarSource::query()->create(['name' => 'Календарь служений', 'url' => self::URL, ...$attributes]);
    }

    private function fakeCalendar(string $ics): void
    {
        $this->respond = fn () => Http::response($ics, 200, ['Content-Type' => 'text/calendar']);
    }

    /**
     * Календарь в том виде, как его отдаёт Google: повторяющееся служение с исключением
     * и перенесённым повтором, событие в другом часовом поясе, событие на весь день,
     * а также события, которые на сайт попасть не должны.
     */
    private function calendar(bool $withConference = true, bool $withRetreat = true): string
    {
        $events = [
            <<<'ICS'
            BEGIN:VEVENT
            UID:service@google.com
            SUMMARY:Богослужение
            DTSTART;TZID=Europe/Moscow:20261018T110000
            DTEND;TZID=Europe/Moscow:20261018T123000
            RRULE:FREQ=WEEKLY;COUNT=4
            EXDATE;TZID=Europe/Moscow:20261025T110000
            LOCATION:Главный зал
            DESCRIPTION:Воскресное служение<br>Приходите заранее &amp; берите друзей
            END:VEVENT
            BEGIN:VEVENT
            UID:service@google.com
            RECURRENCE-ID;TZID=Europe/Moscow:20261101T110000
            SUMMARY:Богослужение (перенесено)
            DTSTART;TZID=Europe/Moscow:20261101T120000
            DTEND;TZID=Europe/Moscow:20261101T133000
            END:VEVENT
            ICS,
            $withConference ? <<<'ICS'
            BEGIN:VEVENT
            UID:conference@example.com
            SUMMARY:Конференция в Нью-Йорке
            DTSTART;TZID=America/New_York:20261020T100000
            DURATION:PT2H
            END:VEVENT
            ICS : '',
            $withRetreat ? <<<'ICS'
            BEGIN:VEVENT
            UID:retreat@example.com
            SUMMARY:Выезд
            DTSTART;VALUE=DATE:20261024
            DTEND;VALUE=DATE:20261026
            END:VEVENT
            ICS : '',
            <<<'ICS'
            BEGIN:VEVENT
            UID:cancelled@example.com
            SUMMARY:Отменённое
            STATUS:CANCELLED
            DTSTART:20261021T160000Z
            END:VEVENT
            BEGIN:VEVENT
            UID:private@example.com
            SUMMARY:Личное: врач
            CLASS:PRIVATE
            DTSTART:20261022T090000Z
            END:VEVENT
            BEGIN:VEVENT
            UID:last-year@example.com
            SUMMARY:Прошлый год
            DTSTART:20251018T080000Z
            END:VEVENT
            BEGIN:VEVENT
            UID:far@example.com
            SUMMARY:Через два года
            DTSTART:20281018T080000Z
            END:VEVENT
            ICS,
        ];

        $body = implode("\n", array_filter($events));

        return str_replace("\n", "\r\n", "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Google Inc//Google Calendar 70.9054//EN\nX-WR-TIMEZONE:Europe/Moscow\n{$body}\nEND:VCALENDAR\n");
    }
}
