<?php

namespace App\Enums;

enum PostType: string
{
    case News = 'news';
    case Blog = 'blog';

    public function label(): string
    {
        return match ($this) {
            self::News => 'Новость',
            self::Blog => 'Блог',
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
