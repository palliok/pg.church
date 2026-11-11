<?php

namespace App\Support;

/**
 * Номера телефонов. Российские приводятся к виду «+7 (911) 123-45-67», как их принято писать;
 * номер другой страны (с «+» и не 7) хранится и показывается как введён.
 */
final class Phone
{
    /**
     * Атрибуты поля ввода в админке: по data-phone-mask его находит маска (admin.phone-mask).
     */
    public const INPUT_ATTRIBUTES = ['data-phone-mask' => 'ru', 'inputmode' => 'tel', 'placeholder' => '+7 (___) ___-__-__'];

    /**
     * Номер в едином виде: «8 911 123 45 67», «89111234567», «+7(911)1234567» → «+7 (911) 123-45-67».
     */
    public static function format(?string $phone): ?string
    {
        $phone = trim((string) $phone);

        if ($phone === '') {
            return null;
        }

        $national = self::russianNational($phone);

        if ($national === null) {
            return $phone;
        }

        return sprintf('+7 (%s) %s-%s-%s', substr($national, 0, 3), substr($national, 3, 3), substr($national, 6, 2), substr($national, 8, 2));
    }

    /**
     * Ссылка для звонка: «tel:+79111234567».
     */
    public static function tel(?string $phone): ?string
    {
        $phone = trim((string) $phone);
        $digits = preg_replace('/\D/', '', $phone);

        if ($digits === '') {
            return null;
        }

        $national = self::russianNational($phone);

        return 'tel:+'.($national === null ? $digits : '7'.$national);
    }

    /**
     * Похоже ли на номер: российский из 10 цифр (с 7 или 8 впереди) или номер другой страны
     * с «+», не 7, и 8–15 цифрами. Кроме цифр допустимы пробелы, скобки, дефисы и «+» в начале.
     */
    public static function isValid(string $phone): bool
    {
        $phone = trim($phone);

        if (! preg_match('/^\+?[\d\s()-]+$/', $phone)) {
            return false;
        }

        if (self::russianNational($phone) !== null) {
            return true;
        }

        $digits = preg_replace('/\D/', '', $phone);

        return str_starts_with($phone, '+') && $digits[0] !== '7' && strlen($digits) >= 8 && strlen($digits) <= 15;
    }

    /**
     * Десять цифр российского номера без кода страны или null, если номер не российский.
     */
    private static function russianNational(string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', $phone);

        if (strlen($digits) === 11 && ($digits[0] === '7' || ($digits[0] === '8' && ! str_starts_with($phone, '+')))) {
            return substr($digits, 1);
        }

        if (strlen($digits) === 10 && ! str_starts_with($phone, '+')) {
            return $digits;
        }

        return null;
    }
}
