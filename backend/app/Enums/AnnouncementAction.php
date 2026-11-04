<?php

namespace App\Enums;

/**
 * Основное действие объявления — крупная кнопка внизу сторис.
 */
enum AnnouncementAction: string
{
    case None = 'none';
    case Link = 'link';
    case Contact = 'contact';

    public function label(): string
    {
        return match ($this) {
            self::None => 'Нет',
            self::Link => 'Первая ссылка',
            self::Contact => 'Позвонить контакту',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function options(): array
    {
        return array_column(
            array_map(fn (self $action) => ['value' => $action->value, 'label' => $action->label()], self::cases()),
            'label',
            'value',
        );
    }
}
