<?php

namespace App\Models;

use App\Support\Phone;
use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

/**
 * Контакт из справочника: подсказка для контакта объявления. Значения копируются в объявление, связи нет.
 */
#[Fillable(['name', 'phone'])]
class Contact extends Model
{
    use CrudTrait;

    /**
     * Телефон — в том же виде, что у объявлений, иначе подставленный номер разойдётся с введённым руками.
     */
    protected function phone(): Attribute
    {
        return Attribute::make(set: fn (?string $value) => Phone::format($value));
    }
}
