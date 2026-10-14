<?php

namespace App\Http\Controllers\Admin;

use App\Enums\SettingType;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Setting;
use App\Rules\UrlPerLine;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

/**
 * Настройки сайта. Набор настроек задаётся сидером (SettingSeeder),
 * в админке меняются только значения.
 */
class SettingCrudController extends CrudController
{
    use ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Setting::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/setting');
        CRUD::setEntityNameStrings('настройку', 'настройки');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('sort')->orderBy('id');
        CRUD::setDefaultPageLength(50);

        CRUD::column('group')->label('Раздел');
        CRUD::column('label')->label('Настройка');
        CRUD::column('value')->label('Значение')->limit(80);
    }

    protected function setupUpdateOperation(): void
    {
        /** @var Setting $setting */
        $setting = CRUD::getCurrentEntry();

        $field = CRUD::field('value')->label($setting->label)->type($setting->type->fieldType());

        if ($setting->hint) {
            $field->hint($setting->hint);
        }

        if ($setting->type === SettingType::UrlList) {
            // Правило-объект в validationRules() поля не передать: Backpack принимает там только строку.
            CRUD::setValidation(['value' => ['nullable', 'string', 'max:5000', new UrlPerLine]]);
            $field->attributes(['rows' => 5, 'spellcheck' => 'false']);
        } else {
            $field->validationRules(match ($setting->type) {
                SettingType::Boolean => 'boolean',
                SettingType::Url => 'nullable|url|max:2000',
                SettingType::Textarea => 'nullable|string|max:5000',
                SettingType::Text => 'nullable|string|max:1000',
            });
        }

        $this->useFieldLabelsInValidationErrors();
    }
}
