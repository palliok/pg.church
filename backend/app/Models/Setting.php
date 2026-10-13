<?php

namespace App\Models;

use App\Enums\SettingType;
use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

#[Fillable(['key', 'group', 'label', 'type', 'value', 'hint', 'sort'])]
class Setting extends Model
{
    use CrudTrait;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => SettingType::class,
        ];
    }

    /**
     * Все настройки в виде «ключ => значение»; булевы приведены к bool.
     *
     * @return Collection<string, string|bool|null>
     */
    public static function values(): Collection
    {
        return static::query()->get()->mapWithKeys(fn (self $setting) => [
            $setting->key => $setting->type === SettingType::Boolean
                ? filter_var($setting->value, FILTER_VALIDATE_BOOLEAN)
                : $setting->value,
        ]);
    }
}
