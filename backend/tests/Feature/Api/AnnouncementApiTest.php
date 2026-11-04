<?php

namespace Tests\Feature\Api;

use App\Models\Announcement;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_announcement_in_frontend_format(): void
    {
        $this->travelTo('2026-11-03 12:00');

        $announcement = Announcement::query()->create([
            'title' => 'Запись в детский лагерь',
            'body' => 'Мест: 30.',
            'important' => true,
            'when_type' => 'date',
            'event_date' => '2026-11-15',
            'event_date_end' => '2026-11-21',
            'when_note' => 'С 10:00',
            'place' => 'База «Сосновый бор»',
            'links_text' => "Анкета | https://forms.yandex.ru/\nЧто взять | https://pg.church/",
            'main_action' => 'link',
            'contact_name' => 'Марина',
            'contact_phone' => '8 911 000-45-67',
            'published_at' => '2026-11-01 10:00',
        ]);

        $this->getJson('/api/v1/announcements')
            ->assertOk()
            ->assertExactJson(['data' => [[
                'id' => $announcement->id,
                'title' => 'Запись в детский лагерь',
                'body' => 'Мест: 30.',
                'important' => true,
                'publishedAt' => '2026-11-01T10:00:00+03:00',
                'eventDate' => '2026-11-15',
                'eventDateEnd' => '2026-11-21',
                'deadline' => null,
                'weekly' => null,
                'event' => null,
                'details' => [
                    ['type' => 'when', 'text' => 'С 10:00'],
                    ['type' => 'where', 'text' => 'База «Сосновый бор»'],
                    ['type' => 'link', 'text' => 'Анкета', 'url' => 'https://forms.yandex.ru/', 'primary' => true],
                    ['type' => 'link', 'text' => 'Что взять', 'url' => 'https://pg.church/', 'primary' => false],
                ],
                'contact' => ['name' => 'Марина', 'phone' => '8 911 000-45-67', 'tel' => 'tel:+79110004567', 'primary' => false],
            ]]]);
    }

    public function test_main_action_marks_contact_or_nothing(): void
    {
        $call = Announcement::query()->create([
            'title' => 'Волонтёры', 'links_text' => 'Чат | https://t.me/', 'contact_phone' => '+7 905 000-78-90', 'main_action' => 'contact',
            'published_at' => now()->subDay(),
        ]);
        Announcement::query()->create([
            'title' => 'Сбор вещей', 'links_text' => 'Чат | https://t.me/', 'contact_phone' => '+7 921 000-12-34',
        ]);

        $this->getJson('/api/v1/announcements')
            ->assertOk()
            ->assertJsonPath('data.0.title', 'Сбор вещей')
            ->assertJsonPath('data.0.details.0.primary', false)
            ->assertJsonPath('data.0.contact.primary', false)
            ->assertJsonPath('data.1.id', $call->id)
            ->assertJsonPath('data.1.details.0.primary', false)
            ->assertJsonPath('data.1.contact.primary', true);
    }

    public function test_returns_weekly_announcement_with_linked_event(): void
    {
        $this->travelTo('2026-11-03 12:00');

        $event = Event::query()->create(['title' => 'Молодёжная встреча', 'starts_at' => '2026-11-06 19:00']);
        Announcement::query()->create([
            'title' => 'Изучение Библии', 'when_type' => 'weekly', 'weekday' => 5, 'weekly_time' => '19:00', 'event_id' => $event->id,
        ]);

        $this->getJson('/api/v1/announcements')
            ->assertOk()
            ->assertJsonPath('data.0.weekly', ['dow' => 5, 'time' => '19:00'])
            ->assertJsonPath('data.0.event.id', $event->id)
            ->assertJsonPath('data.0.event.title', 'Молодёжная встреча')
            ->assertJsonPath('data.0.details', [])
            ->assertJsonPath('data.0.contact', null);
    }

    public function test_returns_only_visible_announcements_newest_first(): void
    {
        $this->travelTo('2026-11-03 12:00');

        $past = Event::query()->create(['title' => 'Прошло', 'starts_at' => '2026-11-02 11:00']);
        $upcoming = Event::query()->create(['title' => 'Будет', 'starts_at' => '2026-11-08 11:00']);
        $hidden = Event::query()->create(['title' => 'Скрыто', 'starts_at' => '2026-11-08 11:00', 'is_published' => false]);

        $visible = fn (string $title, int $daysAgo, array $fields = []) => Announcement::query()->create([
            'title' => $title, 'published_at' => now()->subDays($daysAgo), ...$fields,
        ]);

        $visible('Без даты', 1);
        $visible('Последний день события сегодня', 2, ['when_type' => 'date', 'event_date' => '2026-11-01', 'event_date_end' => '2026-11-03']);
        $visible('Срок сегодня', 3, ['when_type' => 'until', 'deadline' => '2026-11-03']);
        $visible('Каждую неделю', 4, ['when_type' => 'weekly', 'weekday' => 3, 'weekly_time' => '19:30']);
        $visible('Событие впереди', 5, ['event_id' => $upcoming->id]);
        $visible('Событие скрыто', 6, ['event_id' => $hidden->id]);
        $visible('Продлено вручную', 7, ['when_type' => 'until', 'deadline' => '2026-10-30', 'visible_until' => '2026-11-03']);

        $visible('Событие прошло', 1, ['when_type' => 'date', 'event_date' => '2026-11-02']);
        $visible('Срок прошёл', 1, ['when_type' => 'until', 'deadline' => '2026-11-02']);
        $visible('Связанное событие прошло', 1, ['event_id' => $past->id]);
        $visible('Снято вручную', 1, ['visible_until' => '2026-11-02']);
        $visible('Черновик', 1, ['is_published' => false]);
        $visible('Отложено', -1);

        $response = $this->getJson('/api/v1/announcements')->assertOk();

        $this->assertSame([
            'Без даты', 'Последний день события сегодня', 'Срок сегодня', 'Каждую неделю',
            'Событие впереди', 'Событие скрыто', 'Продлено вручную',
        ], array_column($response->json('data'), 'title'));
        $response->assertJsonPath('data.5.event', null);
    }

    public function test_weekly_announcement_hides_past_linked_event(): void
    {
        $this->travelTo('2026-11-03 12:00');

        $event = Event::query()->create(['title' => 'Молодёжная встреча', 'starts_at' => '2026-10-31 19:00']);
        Announcement::query()->create([
            'title' => 'Изучение Библии', 'when_type' => 'weekly', 'weekday' => 5, 'weekly_time' => '19:00', 'event_id' => $event->id,
        ]);

        $this->getJson('/api/v1/announcements')
            ->assertOk()
            ->assertJsonPath('data.0.weekly', ['dow' => 5, 'time' => '19:00'])
            ->assertJsonPath('data.0.event', null);
    }

    public function test_announcement_without_date_expires_after_deleted_event_day(): void
    {
        $this->travelTo('2026-11-03 12:00');

        $event = Event::query()->create(['title' => 'Богослужение', 'starts_at' => '2026-11-08 11:00']);
        $announcement = Announcement::query()->create(['title' => 'Собрание', 'event_id' => $event->id]);
        $dated = Announcement::query()->create(['title' => 'Уборка', 'when_type' => 'date', 'event_date' => '2026-11-07', 'event_id' => $event->id]);

        // Событие пропало из календаря при синхронизации.
        $event->delete();

        $announcement->refresh();
        $this->assertNull($announcement->event_id);
        $this->assertSame('2026-11-08', $announcement->visible_until->toDateString());
        $this->assertNull($dated->fresh()->visible_until);

        $this->travelTo('2026-11-09 12:00');
        $this->getJson('/api/v1/announcements')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_admin_creates_announcement(): void
    {
        $this->actingAs(User::factory()->create(), backpack_guard_name());

        $this->post('/admin/announcement', [
            'title' => 'Молитвенная неделя',
            'when_type' => 'weekly',
            'weekday' => '3',
            'weekly_time' => '19:30',
            // Даты другого типа, оставшиеся в форме после переключения, не проверяются и не сохраняются.
            'event_date' => '2026-11-15',
            'event_date_end' => '2026-11-01',
            'deadline' => '2026-11-20',
            'links_text' => "Чат | https://t.me/chat\n\nАнкета | https://forms.yandex.ru/",
            'contact_name' => 'Анна',
            'contact_phone' => '+7 921 000-12-34',
            'published_at' => '2026-11-03 10:00',
            'main_action' => 'contact',
            'is_published' => '1',
        ])->assertRedirect()->assertSessionHasNoErrors();

        $announcement = Announcement::query()->sole();
        $this->assertSame(3, $announcement->weekday);
        $this->assertNull($announcement->event_date);
        $this->assertNull($announcement->deadline);
        $this->assertSame([
            ['text' => 'Чат', 'url' => 'https://t.me/chat'],
            ['text' => 'Анкета', 'url' => 'https://forms.yandex.ru/'],
        ], $announcement->links);
    }

    public function test_admin_requires_what_main_action_points_to(): void
    {
        $this->actingAs(User::factory()->create(), backpack_guard_name());

        foreach (['link' => 'links_text', 'contact' => 'contact_phone'] as $action => $field) {
            $this->post('/admin/announcement', [
                'title' => 'Запись', 'when_type' => 'none', 'main_action' => $action, 'published_at' => '2026-11-03 10:00',
            ])->assertSessionHasErrors($field);
        }

        $this->assertDatabaseCount('announcements', 0);
    }

    public function test_admin_rejects_incomplete_announcement(): void
    {
        $this->actingAs(User::factory()->create(), backpack_guard_name());

        $this->post('/admin/announcement', [
            'title' => 'Сбор вещей',
            'when_type' => 'until',
            'links_text' => "Анкета | https://forms.yandex.ru/\nНаписать | javascript:alert(1)",
            'contact_name' => 'Анна',
            'contact_phone' => '-- -- --',
            'main_action' => 'none',
            'published_at' => '2026-11-03 10:00',
        ])->assertSessionHasErrors(['deadline', 'links_text', 'contact_phone']);

        $this->assertDatabaseCount('announcements', 0);
    }
}
