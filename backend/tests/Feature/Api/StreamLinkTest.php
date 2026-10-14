<?php

namespace Tests\Feature\Api;

use App\Models\Setting;
use Database\Seeders\SettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StreamLinkTest extends TestCase
{
    use RefreshDatabase;

    private const string TOKEN = 'bot-secret-token';

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(SettingSeeder::class);
        config(['church.stream_token' => self::TOKEN]);
    }

    public function test_banner_is_hidden_without_links(): void
    {
        $this->getJson('/api/v1/live')
            ->assertOk()
            ->assertExactJson(['data' => ['isLive' => false, 'links' => [], 'text' => null]]);
    }

    public function test_banner_lists_every_platform_from_settings(): void
    {
        $this->setLinks("https://www.youtube.com/watch?v=abc\nhttps://vkvideo.ru/video-1_2");

        $this->getJson('/api/v1/live')
            ->assertOk()
            ->assertHeader('Cache-Control', 'max-age=15, public')
            ->assertExactJson(['data' => [
                'isLive' => true,
                'links' => [
                    ['url' => 'https://www.youtube.com/watch?v=abc', 'platform' => 'youtube', 'name' => 'YouTube'],
                    ['url' => 'https://vkvideo.ru/video-1_2', 'platform' => 'vk', 'name' => 'VK Видео'],
                ],
                'text' => 'Идёт воскресное богослужение — присоединяйся онлайн',
            ]]);
    }

    public function test_bot_adds_links_one_by_one(): void
    {
        $this->bot()->postJson('/api/v1/stream', ['url' => 'https://www.youtube.com/watch?v=one'])
            ->assertOk()
            ->assertHeader('Cache-Control', 'no-store, private')
            ->assertJsonPath('data.links.*.platform', ['youtube']);

        $this->bot()->postJson('/api/v1/stream', ['url' => 'https://rutube.ru/live/video/r/'])
            ->assertJsonPath('data.links.*.platform', ['youtube', 'rutube']);

        // Новая ссылка YouTube заменяет прежнюю, а не добавляется второй.
        $this->bot()->postJson('/api/v1/stream', ['url' => 'https://youtu.be/two'])
            ->assertJsonPath('data.links.*.url', ['https://rutube.ru/live/video/r/', 'https://youtu.be/two']);

        $this->assertSame("https://rutube.ru/live/video/r/\nhttps://youtu.be/two", $this->links());
        $this->getJson('/api/v1/live')->assertJsonPath('data.isLive', true);
    }

    public function test_bot_replaces_and_clears_the_list(): void
    {
        $this->setLinks('https://www.youtube.com/watch?v=old');

        $this->bot()->putJson('/api/v1/stream', ['urls' => ['https://vkvideo.ru/video-1_2', 'https://t.me/pgora/5']])
            ->assertOk()
            ->assertJsonPath('data.links.*.platform', ['vk', 'telegram']);

        $this->bot()->deleteJson('/api/v1/stream?platform=vk')->assertOk()->assertJsonPath('data.links.*.platform', ['telegram']);
        $this->bot()->deleteJson('/api/v1/stream?platform=youtube')->assertOk()->assertJsonPath('data.links.*.platform', ['telegram']);

        $this->bot()->deleteJson('/api/v1/stream')->assertOk()->assertJsonPath('data.isLive', false);
        $this->assertNull($this->links());

        $this->bot()->putJson('/api/v1/stream', ['urls' => ['https://youtu.be/x']])->assertJsonPath('data.isLive', true);
        $this->bot()->putJson('/api/v1/stream', ['urls' => []])->assertJsonPath('data.isLive', false);
    }

    public function test_links_must_be_web_addresses(): void
    {
        foreach (['не ссылка', 'javascript:alert(1)', 'ftp://example.com/stream'] as $url) {
            $this->bot()->postJson('/api/v1/stream', ['url' => $url])->assertUnprocessable()->assertJsonValidationErrors('url');
            $this->bot()->putJson('/api/v1/stream', ['urls' => ['https://youtu.be/ok', $url]])->assertUnprocessable()->assertJsonValidationErrors('urls.1');
        }

        $this->bot()->postJson('/api/v1/stream', [])->assertUnprocessable()->assertJsonValidationErrors('url');
        $this->bot()->putJson('/api/v1/stream', [])->assertUnprocessable()->assertJsonValidationErrors('urls');
        $this->assertNull($this->links());
    }

    public function test_only_the_bot_with_the_token_can_change_links(): void
    {
        $this->postJson('/api/v1/stream', ['url' => 'https://evil.example.com'])
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Неверный ключ доступа.');
        $this->withToken('wrong')->putJson('/api/v1/stream', ['urls' => ['https://evil.example.com']])->assertUnauthorized();
        $this->withToken('wrong')->deleteJson('/api/v1/stream')->assertUnauthorized();

        // Ключ на сервере не задан — адрес отключён целиком.
        config(['church.stream_token' => null]);
        $this->withToken('')->postJson('/api/v1/stream', ['url' => 'https://evil.example.com'])->assertForbidden();

        $this->assertNull($this->links());
    }

    public function test_attempts_are_rate_limited(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->withToken('wrong')->postJson('/api/v1/stream', ['url' => 'https://example.com'])->assertUnauthorized();
        }

        $this->bot()->postJson('/api/v1/stream', ['url' => 'https://example.com'])->assertTooManyRequests();
    }

    private function bot(): static
    {
        return $this->withToken(self::TOKEN);
    }

    private function setLinks(?string $value): void
    {
        Setting::query()->where('key', 'stream_links')->update(['value' => $value]);
    }

    private function links(): ?string
    {
        return Setting::query()->where('key', 'stream_links')->value('value');
    }
}
