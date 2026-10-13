<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * Русские подписи дат в том виде, в котором их показывает фронтенд.
 */
class RuDate
{
    /** Дни недели по ISO-8601: 1 — понедельник, 7 — воскресенье. */
    public const array WEEKDAYS = [
        1 => 'Понедельник',
        2 => 'Вторник',
        3 => 'Среда',
        4 => 'Четверг',
        5 => 'Пятница',
        6 => 'Суббота',
        7 => 'Воскресенье',
    ];

    public const array WEEKDAYS_SHORT = [
        1 => 'Пн',
        2 => 'Вт',
        3 => 'Ср',
        4 => 'Чт',
        5 => 'Пт',
        6 => 'Сб',
        7 => 'Вс',
    ];

    public const array MONTHS_SHORT = [
        1 => 'ЯНВ',
        2 => 'ФЕВ',
        3 => 'МАР',
        4 => 'АПР',
        5 => 'МАЙ',
        6 => 'ИЮН',
        7 => 'ИЮЛ',
        8 => 'АВГ',
        9 => 'СЕН',
        10 => 'ОКТ',
        11 => 'НОЯ',
        12 => 'ДЕК',
    ];

    public const array MONTHS_GENITIVE = [
        1 => 'января',
        2 => 'февраля',
        3 => 'марта',
        4 => 'апреля',
        5 => 'мая',
        6 => 'июня',
        7 => 'июля',
        8 => 'августа',
        9 => 'сентября',
        10 => 'октября',
        11 => 'ноября',
        12 => 'декабря',
    ];

    public static function weekday(CarbonInterface $date): string
    {
        return self::WEEKDAYS[$date->dayOfWeekIso];
    }

    public static function monthShort(CarbonInterface $date): string
    {
        return self::MONTHS_SHORT[$date->month];
    }

    /**
     * «14 июня»
     */
    public static function dayAndMonth(CarbonInterface $date): string
    {
        return $date->day.' '.self::MONTHS_GENITIVE[$date->month];
    }
}
