<?php

namespace Tests\Unit;

use App\Support\StreamLinks;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class StreamLinksTest extends TestCase
{
    /**
     * @return array<string, array{string, string, string}>
     */
    public static function platforms(): array
    {
        return [
            'YouTube' => ['https://www.youtube.com/watch?v=abc', 'youtube', 'YouTube'],
            'YouTube, короткая' => ['https://youtu.be/abc', 'youtube', 'YouTube'],
            'YouTube, мобильная' => ['https://m.youtube.com/live/abc', 'youtube', 'YouTube'],
            'VK Видео' => ['https://vkvideo.ru/video-123_456', 'vk', 'VK Видео'],
            'VK' => ['https://vk.com/video-123_456', 'vk', 'VK Видео'],
            'Rutube' => ['https://rutube.ru/live/video/abc/', 'rutube', 'Rutube'],
            'Telegram' => ['https://t.me/pgora/123', 'telegram', 'Telegram'],
            'Одноклассники' => ['https://ok.ru/live/123', 'ok', 'Одноклассники'],
            'незнакомая' => ['https://www.stream.example.org/live', 'stream.example.org', 'stream.example.org'],
            'похожий домен' => ['https://notyoutube.com/x', 'notyoutube.com', 'notyoutube.com'],
        ];
    }

    #[DataProvider('platforms')]
    public function test_detects_platform_by_address(string $url, string $platform, string $name): void
    {
        $this->assertSame(['platform' => $platform, 'name' => $name], StreamLinks::platform($url));
    }

    public function test_parses_one_link_per_line_and_skips_garbage(): void
    {
        $links = StreamLinks::parse("  https://youtu.be/abc  \r\n\r\nне ссылка\njavascript:alert(1)\nhttps://vkvideo.ru/video-1_2\n");

        $this->assertSame(
            [['youtube', 'https://youtu.be/abc'], ['vk', 'https://vkvideo.ru/video-1_2']],
            array_map(fn (array $link) => [$link['platform'], $link['url']], $links),
        );
        $this->assertSame([], StreamLinks::parse(null));
    }

    public function test_new_link_replaces_the_same_platform(): void
    {
        $value = "https://www.youtube.com/watch?v=old\nhttps://rutube.ru/live/video/r/";

        $this->assertSame(
            ['https://rutube.ru/live/video/r/', 'https://youtu.be/new'],
            StreamLinks::with($value, 'https://youtu.be/new'),
        );
        $this->assertSame(
            ['https://www.youtube.com/watch?v=old', 'https://rutube.ru/live/video/r/', 'https://vkvideo.ru/video-1_2'],
            StreamLinks::with($value, 'https://vkvideo.ru/video-1_2'),
        );
    }

    public function test_removes_one_platform_and_serializes(): void
    {
        $value = "https://www.youtube.com/watch?v=old\nhttps://rutube.ru/live/video/r/";

        $this->assertSame(['https://rutube.ru/live/video/r/'], StreamLinks::without($value, 'youtube'));
        $this->assertSame("https://a.example\nhttps://b.example", StreamLinks::serialize([' https://a.example ', '', 'https://b.example', 'https://a.example']));
        $this->assertNull(StreamLinks::serialize([]));
    }
}
