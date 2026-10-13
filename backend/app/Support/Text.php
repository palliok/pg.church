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
     * Экранирует спецсимволы LIKE, чтобы пользовательский ввод искался буквально.
     */
    public static function escapeLike(string $value): string
    {
        return addcslashes($value, '\\%_');
    }
}
