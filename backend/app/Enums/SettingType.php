<?php

namespace App\Enums;

enum SettingType: string
{
    case Text = 'text';
    case Textarea = 'textarea';
    case Url = 'url';
    case Boolean = 'boolean';
    /** Несколько ссылок, по одной на строке. */
    case UrlList = 'url_list';

    /**
     * Тип поля Backpack, которым редактируется значение.
     */
    public function fieldType(): string
    {
        return match ($this) {
            self::Boolean => 'switch',
            self::UrlList => 'textarea',
            default => $this->value,
        };
    }
}
