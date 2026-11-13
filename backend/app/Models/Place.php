<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * Место из справочника: подсказка для полей «Место» и «Адрес» события и «Где» объявления.
 * Значения копируются в запись, связи нет.
 */
#[Fillable(['name', 'address'])]
class Place extends Model
{
    use CrudTrait;
}
