<?php

namespace App\Rules;

use App\Support\StreamLinks;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Каждая непустая строка — ссылка http(s)://… (настройки со списком ссылок).
 */
class UrlPerLine implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        foreach (preg_split('/\R/u', (string) $value) as $number => $line) {
            $line = trim($line);

            if ($line !== '' && ! StreamLinks::isUrl($line)) {
                $fail('Строка '.($number + 1).' поля :attribute — не ссылка: «'.mb_strimwidth($line, 0, 60, '…').'». Каждая ссылка — с новой строки и начинается с https://.');

                return;
            }
        }
    }
}
