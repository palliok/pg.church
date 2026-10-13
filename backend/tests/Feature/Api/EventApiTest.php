<?php

namespace Tests\Feature\Api;

use App\Models\Event;
use App\Models\Minister;
use App\Models\Setting;
use App\Models\Song;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class EventApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Среда, 14 октября 2026 года.
        Carbon::setTestNow('2026-10-14 15:00:00');
    }

    public function test_index_lists_upcoming_published_events_in_chronological_order(): void
    {
        Event::query()->create(['title' => 'Прошедшее', 'starts_at' => '2026-10-13 19:00']);
        Event::query()->create(['title' => 'Черновик', 'starts_at' => '2026-10-16 19:00', 'is_published' => false]);
        Event::query()->create(['title' => 'Богослужение', 'starts_at' => '2026-10-18 11:00', 'place' => 'Главный зал', 'has_stream' => true]);
        Event::query()->create(['title' => 'Сегодня утром', 'starts_at' => '2026-10-14 09:00']);

        $response = $this->getJson('/api/v1/events');

        $response->assertOk()
            ->assertJsonPath('data.*.title', ['Сегодня утром', 'Богослужение'])
            ->assertJsonPath('data.1.startsAt', '2026-10-18T11:00:00+03:00')
            ->assertJsonPath('data.1.year', 2026)
            ->assertJsonPath('data.1.month', 10)
            ->assertJsonPath('data.1.day', 18)
            ->assertJsonPath('data.1.mon', 'ОКТ')
            ->assertJsonPath('data.1.dow', 7)
            ->assertJsonPath('data.1.dowLabel', 'Воскресенье')
            ->assertJsonPath('data.1.timeLabel', '11:00')
            ->assertJsonPath('data.1.when', 'Воскресенье · 11:00 · Главный зал')
            ->assertJsonPath('data.1.live', true)
            ->assertJsonMissingPath('data.1.sermon')
            ->assertJsonMissingPath('data.1.hymns');
    }

    public function test_index_filters_by_date_range_and_limit(): void
    {
        Event::query()->create(['title' => 'Сентябрь', 'starts_at' => '2026-09-06 11:00']);
        Event::query()->create(['title' => 'Октябрь', 'starts_at' => '2026-10-18 11:00']);
        Event::query()->create(['title' => 'Ноябрь', 'starts_at' => '2026-11-01 11:00']);

        $this->getJson('/api/v1/events?from=2026-09-01&to=2026-10-18')
            ->assertOk()
            ->assertJsonPath('data.*.title', ['Сентябрь', 'Октябрь']);

        $this->getJson('/api/v1/events?from=2026-09-01&limit=1')
            ->assertOk()
            ->assertJsonPath('data.*.title', ['Сентябрь']);

        $this->getJson('/api/v1/events?from=вчера')->assertUnprocessable()->assertJsonValidationErrors('from');
        $this->getJson('/api/v1/events?limit=0')->assertUnprocessable()->assertJsonValidationErrors('limit');
    }

    public function test_show_returns_event_with_sermon_and_hymns(): void
    {
        $event = Event::query()->create([
            'title' => 'Богослужение',
            'starts_at' => '2026-10-18 11:00',
            'description' => "Первый абзац.\n\nВторой абзац.",
            'is_main' => true,
        ]);
        $event->sermon()->create([
            'minister_id' => Minister::query()->create(['name' => 'Алексей Синичкин', 'role' => 'Старший пастор'])->id,
            'topic' => 'Надежда',
            'scripture_ref' => 'Римлянам 5:1–5',
            'outline' => "Первый пункт\nВторой пункт\n",
            'duration_minutes' => 42,
        ]);
        $event->songs()->attach([
            Song::query()->create(['number' => 214, 'title' => 'Радость моя', 'chordpro' => '[E]Текст'])->id,
            Song::query()->create(['number' => 88, 'title' => 'Ближе к Тебе', 'chordpro' => 'Текст'])->id,
        ]);

        $response = $this->getJson("/api/v1/events/{$event->id}");

        $response->assertOk()
            ->assertJsonPath('data.main', true)
            ->assertJsonPath('data.desc', ['Первый абзац.', 'Второй абзац.'])
            ->assertJsonPath('data.sermon.name', 'Алексей Синичкин')
            ->assertJsonPath('data.sermon.initial', 'АС')
            ->assertJsonPath('data.sermon.role', 'Старший пастор')
            ->assertJsonPath('data.sermon.ref', 'Римлянам 5:1–5')
            ->assertJsonPath('data.sermon.outline', [['n' => 1, 'text' => 'Первый пункт'], ['n' => 2, 'text' => 'Второй пункт']])
            ->assertJsonPath('data.sermon.durationLabel', 'Слушать 42 мин')
            ->assertJsonPath('data.hymns.*.num', [88, 214])
            ->assertJsonPath('data.hymnIds', $event->songs()->orderBy('number')->pluck('songs.id')->all())
            ->assertJsonMissingPath('data.hymns.0.sections');
    }

    public function test_event_without_own_address_falls_back_to_church_address(): void
    {
        $this->seed(SettingSeeder::class);
        Setting::query()->where('key', 'church_address')->update(['value' => 'Большая Озёрная, 27']);

        $own = Event::query()->create(['title' => 'Выезд', 'starts_at' => '2026-10-17 10:00', 'address' => 'Лесная, 1']);
        $default = Event::query()->create(['title' => 'Богослужение', 'starts_at' => '2026-10-18 11:00']);

        $this->getJson("/api/v1/events/{$own->id}")->assertJsonPath('data.addr', 'Лесная, 1');
        $this->getJson("/api/v1/events/{$default->id}")->assertJsonPath('data.addr', 'Большая Озёрная, 27');
        $this->getJson('/api/v1/events')->assertJsonPath('data.*.addr', ['Лесная, 1', 'Большая Озёрная, 27']);
    }

    public function test_show_hides_unpublished_and_unknown_events(): void
    {
        $draft = Event::query()->create(['title' => 'Черновик', 'starts_at' => '2026-10-18 11:00', 'is_published' => false]);

        $this->getJson("/api/v1/events/{$draft->id}")->assertNotFound();
        $this->getJson('/api/v1/events/999999')->assertNotFound();
        $this->getJson('/api/v1/events/e28')->assertNotFound();
        $this->getJson('/api/v1/events/99999999999999999999999')->assertNotFound();
    }

    public function test_sermon_endpoint_returns_sermon_or_404(): void
    {
        $withSermon = Event::query()->create(['title' => 'Богослужение', 'starts_at' => '2026-10-18 11:00']);
        $withSermon->sermon()->create(['topic' => 'Надежда', 'verse' => '«А надежда не постыжает»', 'verse_ref' => 'Римлянам 5:5']);
        $withoutSermon = Event::query()->create(['title' => 'Молитва', 'starts_at' => '2026-10-21 19:00']);

        $this->getJson("/api/v1/events/{$withSermon->id}/sermon")
            ->assertOk()
            ->assertJsonPath('data.topic', 'Надежда')
            ->assertJsonPath('data.verseRef', 'Римлянам 5:5')
            ->assertJsonPath('data.name', null)
            ->assertJsonPath('data.outline', [])
            ->assertJsonPath('data.durationLabel', null);

        $this->getJson("/api/v1/events/{$withoutSermon->id}/sermon")->assertNotFound();
    }
}
