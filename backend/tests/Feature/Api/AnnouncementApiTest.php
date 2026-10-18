<?php

namespace Tests\Feature\Api;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_only_visible_announcements_in_order(): void
    {
        $this->travelTo('2026-10-18 12:00');

        $older = Announcement::query()->create(['title' => 'Старое', 'body' => 'Текст']);
        $newer = Announcement::query()->create(['title' => 'Новое']);
        $pinned = Announcement::query()->create(['title' => 'Закреплённое', 'sort' => 0, 'visible_until' => '2026-10-18']);
        $older->update(['sort' => 1]);
        $newer->update(['sort' => 1]);
        Announcement::query()->create(['title' => 'Истекло', 'visible_until' => '2026-10-17']);
        Announcement::query()->create(['title' => 'Черновик', 'is_published' => false]);

        $this->getJson('/api/v1/announcements')
            ->assertOk()
            ->assertExactJson(['data' => [
                ['id' => $pinned->id, 'title' => 'Закреплённое', 'body' => null],
                ['id' => $newer->id, 'title' => 'Новое', 'body' => null],
                ['id' => $older->id, 'title' => 'Старое', 'body' => 'Текст'],
            ]]);
    }

    public function test_admin_creates_announcement(): void
    {
        $this->actingAs(User::factory()->create(), backpack_guard_name());

        $this->post('/admin/announcement', [
            'title' => 'Молитвенная неделя',
            'body' => 'Каждый вечер в 19:00',
            'visible_until' => '2026-11-01',
            'sort' => 0,
            'is_published' => '1',
        ])->assertRedirect();

        $this->assertDatabaseHas('announcements', ['title' => 'Молитвенная неделя', 'is_published' => true]);
    }
}
