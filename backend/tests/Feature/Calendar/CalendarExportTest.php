<?php

namespace Tests\Feature\Calendar;

use App\Models\Event;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Reader;
use Tests\TestCase;

class CalendarExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2026-10-14 12:00:00');
        config(['app.url' => 'https://pg.church', 'church.site_url' => 'https://site.pg.church', 'church.event_duration' => 90]);
        URL::forceRootUrl('https://pg.church');
        URL::forceScheme('https');
        $this->seed(SettingSeeder::class);
    }

    public function test_feed_is_a_valid_icalendar_with_published_events(): void
    {
        $service = Event::query()->create([
            'title' => 'Богослужение', 'starts_at' => '2026-10-18 11:00', 'place' => 'Главный зал',
            'address' => 'Большая Озёрная, 27', 'description' => "Первый абзац.\n\nВторой абзац; с точкой с запятой.",
        ]);
        $retreat = Event::query()->create([
            'title' => 'Выезд', 'starts_at' => '2026-10-24 00:00', 'ends_at' => '2026-10-25 00:00', 'all_day' => true,
        ]);
        $prayer = Event::query()->create(['title' => 'Молитва', 'starts_at' => '2026-10-21 19:00', 'ends_at' => '2026-10-21 20:15']);
        Event::query()->create(['title' => 'Черновик', 'starts_at' => '2026-10-20 19:00', 'is_published' => false]);
        Event::query()->create(['title' => 'Давно прошло', 'starts_at' => '2026-07-01 19:00']);
        Event::query()->create(['title' => 'Недавно прошло', 'starts_at' => '2026-09-01 19:00']);

        $response = $this->get('/api/v1/events.ics');

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/calendar; charset=utf-8')
            ->assertHeader('Content-Disposition', 'inline; filename="schedule.ics"');

        $ics = $response->getContent();
        $this->assertStringContainsString("\r\n", $ics);

        // Строки длиннее 75 байт должны быть перенесены (RFC 5545, 3.1).
        foreach (explode("\r\n", $ics) as $line) {
            $this->assertLessThanOrEqual(75, strlen($line), $line);
        }

        $calendar = Reader::read($ics);
        $this->assertInstanceOf(VCalendar::class, $calendar);
        $this->assertSame('Поклонная гора', (string) $calendar->{'X-WR-CALNAME'});
        $this->assertSame('PT1H', (string) $calendar->{'REFRESH-INTERVAL'});

        $events = collect($calendar->select('VEVENT'))->keyBy(fn ($vevent) => (string) $vevent->SUMMARY);
        $this->assertSame(['Недавно прошло', 'Богослужение', 'Молитва', 'Выезд'], $events->keys()->all());

        $vevent = $events['Богослужение'];
        $this->assertSame("event-{$service->id}@pg.church", (string) $vevent->UID);
        // 11:00 по Москве — 08:00 UTC; без окончания событие длится 90 минут.
        $this->assertSame('20261018T080000Z', $vevent->DTSTART->getValue());
        $this->assertSame('20261018T093000Z', $vevent->DTEND->getValue());
        $this->assertSame('Главный зал, Большая Озёрная, 27', (string) $vevent->LOCATION);
        $this->assertSame("Первый абзац.\n\nВторой абзац; с точкой с запятой.\n\nhttps://site.pg.church/schedule/{$service->id}", (string) $vevent->DESCRIPTION);
        $this->assertSame("https://site.pg.church/schedule/{$service->id}", (string) $vevent->URL);

        $this->assertSame('20261021T171500Z', $events['Молитва']->DTEND->getValue());
        $this->assertSame('Большая Озёрная, 27', (string) $events['Молитва']->LOCATION);

        // Событие на весь день: даты без времени, DTEND — день после последнего.
        $this->assertFalse($events['Выезд']->DTSTART->hasTime());
        $this->assertSame('20261024', $events['Выезд']->DTSTART->getValue());
        $this->assertSame('20261026', $events['Выезд']->DTEND->getValue());

        $this->assertStringNotContainsString('Черновик', $ics);
    }

    public function test_single_event_is_downloaded_as_ics_file(): void
    {
        $event = Event::query()->create(['title' => 'Богослужение', 'starts_at' => '2026-10-18 11:00']);
        $draft = Event::query()->create(['title' => 'Черновик', 'starts_at' => '2026-10-18 11:00', 'is_published' => false]);

        $response = $this->get("/api/v1/events/{$event->id}.ics");

        $response->assertOk()
            ->assertHeader('Content-Type', 'text/calendar; charset=utf-8')
            ->assertHeader('Content-Disposition', "attachment; filename=\"event-{$event->id}.ics\"");
        $this->assertCount(1, Reader::read($response->getContent())->select('VEVENT'));

        $this->get("/api/v1/events/{$draft->id}.ics")->assertNotFound();
        $this->get('/api/v1/events/999999.ics')->assertNotFound();
    }

    public function test_event_api_includes_add_to_calendar_links(): void
    {
        $event = Event::query()->create([
            'title' => 'Богослужение', 'starts_at' => '2026-10-18 11:00', 'ends_at' => '2026-10-18 12:30', 'place' => 'Главный зал',
        ]);
        $allDay = Event::query()->create(['title' => 'Выезд', 'starts_at' => '2026-10-24 00:00', 'all_day' => true]);

        $calendar = $this->getJson("/api/v1/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.endsAt', '2026-10-18T12:30:00+03:00')
            ->assertJsonPath('data.allDay', false)
            ->assertJsonPath('data.calendar.ics', "https://pg.church/api/v1/events/{$event->id}.ics")
            ->json('data.calendar');

        parse_str(parse_url($calendar['google'], PHP_URL_QUERY), $google);
        $this->assertStringStartsWith('https://calendar.google.com/calendar/render?', $calendar['google']);
        $this->assertSame('TEMPLATE', $google['action']);
        $this->assertSame('Богослужение', $google['text']);
        $this->assertSame('20261018T080000Z/20261018T093000Z', $google['dates']);
        // Адреса у события нет — подставляется адрес церкви из настроек.
        $this->assertSame('Главный зал, Большая Озёрная, 27', $google['location']);

        parse_str(parse_url($calendar['outlook'], PHP_URL_QUERY), $outlook);
        $this->assertStringStartsWith('https://outlook.live.com/calendar/0/deeplink/compose?', $calendar['outlook']);
        $this->assertSame('2026-10-18T08:00:00Z', $outlook['startdt']);
        $this->assertSame('2026-10-18T09:30:00Z', $outlook['enddt']);
        $this->assertSame('false', $outlook['allday']);

        $allDayCalendar = $this->getJson("/api/v1/events/{$allDay->id}")
            ->assertJsonPath('data.allDay', true)
            ->assertJsonPath('data.timeLabel', null)
            ->assertJsonPath('data.when', 'Суббота')
            ->json('data.calendar');

        parse_str(parse_url($allDayCalendar['google'], PHP_URL_QUERY), $google);
        $this->assertSame('20261024/20261025', $google['dates']);
        parse_str(parse_url($allDayCalendar['outlook'], PHP_URL_QUERY), $outlook);
        $this->assertSame(['2026-10-24', '2026-10-25', 'true'], [$outlook['startdt'], $outlook['enddt'], $outlook['allday']]);
    }

    public function test_church_api_gives_subscription_links(): void
    {
        $this->getJson('/api/v1/church')
            ->assertOk()
            ->assertJsonPath('data.calendarFeed.ics', 'https://pg.church/api/v1/events.ics')
            ->assertJsonPath('data.calendarFeed.webcal', 'webcal://pg.church/api/v1/events.ics')
            ->assertJsonPath('data.calendarFeed.google', 'https://calendar.google.com/calendar/render?cid=webcal%3A%2F%2Fpg.church%2Fapi%2Fv1%2Fevents.ics');
    }
}
