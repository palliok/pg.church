<?php

namespace App\Enums;

enum SettingType: string
{
    case Text = 'text';
    case Textarea = 'textarea';
    case Url = 'url';
    case Boolean = 'boolean';
    /** Телефон: в админке — с маской, хранится как «+7 (911) 123-45-67». */
    case Phone = 'phone';
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
            self::Phone => 'text',
            default => $this->value,
        };
    }
}
