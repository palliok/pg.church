<?php

namespace App\Http\Controllers\Admin\Concerns;

use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

trait ValidatesFromFields
{
    /**
     * Backpack принимает правила поля только строкой, поэтому объекты Rule
     * (unique, exists, in) приводятся к строковой записи.
     */
    protected function rules(string|\Stringable ...$rules): string
    {
        return implode('|', $rules);
    }

    /**
     * Подставляет в сообщения об ошибках подписи полей вместо их имён.
     * Вызывается после того, как поля и их validationRules() заданы.
     */
    protected function useFieldLabelsInValidationErrors(): void
    {
        $rules = CRUD::getOperationSetting('validationRules') ?? [];
        $attributes = [];

        foreach (CRUD::fields() as $name => $field) {
            if (isset($rules[$name], $field['label'])) {
                $attributes[$name] = '«'.$field['label'].'»';
            }
        }

        CRUD::setValidationFromArray([], [], $attributes);
    }
}
