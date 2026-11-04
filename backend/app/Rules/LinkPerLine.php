<?php

namespace App\Rules;

use App\Support\StreamLinks;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Каждая непустая строка — «Текст | https://…» (ссылки в объявлениях).
 */
class LinkPerLine implements ValidationRule
{
    /** Больше ссылок в объявлении не помещается. */
    public const int MAX = 5;

    public function __construct(private int $max = self::MAX) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $count = 0;

        foreach (preg_split('/\R/u', (string) $value) as $number => $line) {
            if (trim($line) === '') {
                continue;
            }

            $separator = mb_strrpos($line, '|');
            $text = $separator === false ? '' : trim(mb_substr($line, 0, $separator));
            $url = $separator === false ? '' : trim(mb_substr($line, $separator + 1));

            if ($text === '' || ! StreamLinks::isUrl($url)) {
                $fail('Строка '.($number + 1).' поля :attribute — «'.mb_strimwidth(trim($line), 0, 60, '…').'». Пишите так: «Текст кнопки | https://…».');

                return;
            }

            if (++$count > $this->max) {
                $fail('В поле :attribute не больше '.$this->max.' ссылок.');

                return;
            }
        }
    }
}
