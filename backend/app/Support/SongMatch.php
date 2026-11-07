<?php

namespace App\Support;

use App\Models\Song;
use App\Models\SongVariant;

/**
 * Сопоставление слов запроса с песней: строка, по которой в списке видно, почему песня нашлась,
 * и точная проверка кандидатов поиска с опечатками.
 */
class SongMatch
{
    /**
     * Строка, где нашлось больше всего слов запроса, и буква её варианта, если он не основной.
     * При равенстве — из основного варианта и выше по тексту. Ничего не нашлось (песня найдена
     * по названию) — первая строка основного варианта.
     *
     * @param  iterable<SongVariant>  $variants  варианты песни, основной первым
     * @param  list<string>  $words  слова запроса (Text::searchWords)
     * @return array{line: ?string, variant: ?string}
     */
    public static function line(iterable $variants, array $words, bool $fuzzy = false): array
    {
        $best = ['line' => null, 'variant' => null];
        $bestScore = 0;
        $first = null;

        foreach ($variants as $variant) {
            foreach (Text::lines($variant->lyrics) as $line) {
                $first ??= $line;
                $score = self::score(self::tokens($line), $words, $fuzzy);

                if ($score > $bestScore) {
                    $bestScore = $score;
                    $best = ['line' => $line, 'variant' => $variant->is_default ? null : $variant->letter];
                }
            }
        }

        return $bestScore > 0 ? $best : ['line' => $first, 'variant' => null];
    }

    /**
     * Сколько слов запроса нашлось в названии — с опечатками. По нему найденные
     * с опечатками песни упорядочиваются: совпадение в названии выше.
     *
     * @param  list<string>  $words
     */
    public static function titleScore(string $title, array $words): int
    {
        return self::score(self::tokens($title), $words, true);
    }

    /**
     * Все слова запроса есть в названии или тексте одного варианта — точно или с опечаткой.
     *
     * @param  iterable<SongVariant>  $variants
     * @param  list<string>  $words
     */
    public static function fits(string $title, iterable $variants, array $words): bool
    {
        $titleTokens = self::tokens($title);

        foreach ($variants as $variant) {
            if (self::score([...$titleTokens, ...self::tokens($variant->lyrics)], $words, true) === count($words)) {
                return true;
            }
        }

        return self::score($titleTokens, $words, true) === count($words);
    }

    /**
     * Сколько слов запроса есть среди слов текста: с начала слова («спас» в «спасенья»),
     * а с fuzzy длинные — ещё и с опечаткой.
     *
     * @param  list<string>  $tokens
     * @param  list<string>  $words
     */
    private static function score(array $tokens, array $words, bool $fuzzy): int
    {
        return count(array_filter($words, fn (string $word) => self::found($word, $tokens, $fuzzy)));
    }

    /**
     * @param  list<string>  $tokens
     */
    private static function found(string $word, array $tokens, bool $fuzzy): bool
    {
        $length = mb_strlen($word);
        $fuzzy = $fuzzy && $length >= Song::FUZZY_MIN_LENGTH;
        // Одна ошибка на каждые четыре буквы: «благадать» находит «благодать», «гасподь» — «Господь».
        $allowed = intdiv($length, 4);

        foreach ($tokens as $token) {
            if (str_starts_with($token, $word)) {
                return true;
            }

            // Слово целиком или его начало той же длины — человек ещё печатает.
            if ($fuzzy && (self::distance($word, $token) <= $allowed || self::distance($word, mb_substr($token, 0, $length)) <= $allowed)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return list<string>
     */
    private static function tokens(?string $text): array
    {
        $text = Text::searchable($text);

        return $text === '' ? [] : explode(' ', $text);
    }

    /**
     * Расстояние Левенштейна по буквам, а не байтам: встроенный levenshtein() считает
     * каждую русскую букву за две. Буквы заменяются однобайтовыми кодами.
     */
    private static function distance(string $a, string $b): int
    {
        $codes = [];
        $encoded = ['', ''];

        foreach ([$a, $b] as $index => $text) {
            foreach (mb_str_split($text) as $char) {
                $codes[$char] ??= count($codes) % 256;
                $encoded[$index] .= chr($codes[$char]);
            }
        }

        return levenshtein(...$encoded);
    }
}
