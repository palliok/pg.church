<?php

namespace App\Enums;

/**
 * Когда проходит то, о чём объявление: от этого зависят плитка даты на сайте и срок показа.
 */
enum AnnouncementWhen: string
{
    case None = 'none';
    case Date = 'date';
    case Until = 'until';
    case Weekly = 'weekly';

    public function label(): string
    {
        return match ($this) {
            self::None => 'Без даты',
            self::Date => 'В определённый день',
            self::Until => 'До определённого числа',
            self::Weekly => 'Каждую неделю',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function options(): array
    {
        return array_column(
            array_map(fn (self $type) => ['value' => $type->value, 'label' => $type->label()], self::cases()),
            'label',
            'value',
        );
    }
}
