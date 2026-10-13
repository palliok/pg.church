<?php

namespace App\Enums;

/**
 * Иллюстрации для историй-комиксов. Значения совпадают с идентификаторами
 * сцен во фронтенде (frontend/src/components/Scene.jsx).
 */
enum StoryScene: string
{
    case Dawn = 'dawn';
    case Bethlehem = 'bethlehem';
    case Field = 'field';
    case Magi = 'magi';
    case Desert = 'desert';
    case River = 'river';
    case Galilee = 'galilee';
    case Cross = 'cross';
    case Tomb = 'tomb';
    case City = 'city';
    case Supper = 'supper';

    public function label(): string
    {
        return match ($this) {
            self::Dawn => 'Рассвет',
            self::Bethlehem => 'Вифлеем',
            self::Field => 'Поле и пастухи',
            self::Magi => 'Мудрецы',
            self::Desert => 'Пустыня',
            self::River => 'Река',
            self::Galilee => 'Галилейское море',
            self::Cross => 'Крест',
            self::Tomb => 'Пустая гробница',
            self::City => 'Город',
            self::Supper => 'Вечеря',
        };
    }

    /**
     * @return array<string, string>
     */
    public static function options(): array
    {
        return array_column(
            array_map(fn (self $scene) => ['value' => $scene->value, 'label' => $scene->label()], self::cases()),
            'label',
            'value',
        );
    }
}
