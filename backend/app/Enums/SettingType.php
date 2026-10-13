<?php

namespace App\Enums;

enum SettingType: string
{
    case Text = 'text';
    case Textarea = 'textarea';
    case Url = 'url';
    case Boolean = 'boolean';

    /**
     * Тип поля Backpack, которым редактируется значение.
     */
    public function fieldType(): string
    {
        return match ($this) {
            self::Boolean => 'switch',
            default => $this->value,
        };
    }
}
