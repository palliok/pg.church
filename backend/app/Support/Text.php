<?php

namespace App\Support;

class Text
{
    /**
     * Делит текст на блоки по пустым строкам: абзацы описания, куплеты песни.
     * Переводы строк внутри блока приводятся к «\n» (формы присылают «\r\n»).
     *
     * @return list<string>
     */
    public static function blocks(?string $text): array
    {
        $text = preg_replace('/\R/u', "\n", trim((string) $text));
        $blocks = preg_split('/\n\s*\n/u', $text);

        return array_values(array_filter(array_map('trim', $blocks), fn (string $block) => $block !== ''));
    }

    /**
     * Делит текст на непустые строки: пункты плана проповеди.
     *
     * @return list<string>
     */
    public static function lines(?string $text): array
    {
        $lines = preg_split('/\R/u', trim((string) $text));

        return array_values(array_filter(array_map('trim', $lines), fn (string $line) => $line !== ''));
    }

    /**
     * Текст для поиска: строчные буквы, «ё» как «е», знаки препинания — пробелы.
     * Тогда «Свят свят» находит «Свят, свят», а «твердо» — «Твёрдо».
     */
    public static function searchable(?string $text): string
    {
        $text = str_replace('ё', 'е', mb_strtolower((string) $text));

        return trim(preg_replace('/[^\p{L}\p{N}]+/u', ' ', $text));
    }

    /**
     * Слова поискового запроса после searchable(), без повторов.
     *
     * @return list<string>
     */
    public static function searchWords(?string $text): array
    {
        $text = self::searchable($text);

        return $text === '' ? [] : array_values(array_unique(explode(' ', $text)));
    }

    /**
     * Экранирует спецсимволы LIKE, чтобы пользовательский ввод искался буквально.
     */
    public static function escapeLike(string $value): string
    {
        return addcslashes($value, '\\%_');
    }
}
