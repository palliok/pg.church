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
            self::Link => 'Ссылка',
            self::Contact => 'Позвонить контакту',
        };
    }
}
