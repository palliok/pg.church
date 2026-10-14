<?php

namespace App\Support;

/**
 * Ссылки на трансляцию: хранятся в настройке stream_links по одной на строке.
 * Площадка (YouTube, VK Видео, Rutube…) определяется по адресу ссылки.
 */
class StreamLinks
{
    /** Домен => [ключ площадки, название]. Поддомены (m., www.) тоже подходят. */
    private const array PLATFORMS = [
        'youtube.com' => ['youtube', 'YouTube'],
        'youtu.be' => ['youtube', 'YouTube'],
        'vkvideo.ru' => ['vk', 'VK Видео'],
        'vk.com' => ['vk', 'VK Видео'],
        'vk.ru' => ['vk', 'VK Видео'],
        'rutube.ru' => ['rutube', 'Rutube'],
        't.me' => ['telegram', 'Telegram'],
        'telegram.me' => ['telegram', 'Telegram'],
        'ok.ru' => ['ok', 'Одноклассники'],
        'twitch.tv' => ['twitch', 'Twitch'],
        'facebook.com' => ['facebook', 'Facebook'],
        'zoom.us' => ['zoom', 'Zoom'],
    ];

    /**
     * Ссылки из текста настройки в порядке строк.
     *
     * @return list<array{platform: string, name: string, url: string}>
     */
    public static function parse(?string $value): array
    {
        $links = [];

        foreach (preg_split('/\R/u', (string) $value) as $line) {
            $url = trim($line);

            if ($url !== '' && self::isUrl($url)) {
                $links[] = ['url' => $url, ...self::platform($url)];
            }
        }

        return $links;
    }

    /**
     * Текст настройки из списка ссылок; пустой список — null (плашки нет).
     *
     * @param  list<string>  $urls
     */
    public static function serialize(array $urls): ?string
    {
        $urls = array_values(array_unique(array_filter(array_map('trim', $urls))));

        return $urls === [] ? null : implode("\n", $urls);
    }

    /**
     * Добавляет ссылку; ссылка той же площадки заменяется (новый эфир вместо прошлого).
     *
     * @return list<string>
     */
    public static function with(?string $value, string $url): array
    {
        $platform = self::platform($url)['platform'];
        $kept = array_filter(self::parse($value), fn (array $link) => $link['platform'] !== $platform);

        return [...array_column($kept, 'url'), $url];
    }

    /**
     * Убирает ссылки одной площадки.
     *
     * @return list<string>
     */
    public static function without(?string $value, string $platform): array
    {
        return array_values(array_column(
            array_filter(self::parse($value), fn (array $link) => $link['platform'] !== $platform),
            'url',
        ));
    }

    /**
     * Площадка по адресу ссылки; незнакомая — по имени сайта.
     *
     * @return array{platform: string, name: string}
     */
    public static function platform(string $url): array
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        foreach (self::PLATFORMS as $domain => [$platform, $name]) {
            if ($host === $domain || str_ends_with($host, '.'.$domain)) {
                return ['platform' => $platform, 'name' => $name];
            }
        }

        $site = preg_replace('/^(www|m)\./', '', $host);

        return ['platform' => $site, 'name' => $site];
    }

    public static function isUrl(string $value): bool
    {
        return filter_var($value, FILTER_VALIDATE_URL) !== false
            && in_array(strtolower((string) parse_url($value, PHP_URL_SCHEME)), ['http', 'https'], true);
    }
}
