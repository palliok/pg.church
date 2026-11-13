<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Place;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

class PlaceCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Place::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/place');
        CRUD::setEntityNameStrings('место', 'места');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('name');

        CRUD::column('name')->label('Название');
        CRUD::column('address')->label('Адрес');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('name')->label('Название')->hint('Как писать в событиях и объявлениях: «Главный зал», «Чайная»')
            ->validationRules($this->rules('required', 'string', 'max:120',
                Rule::unique('places', 'name')->ignore(CRUD::getCurrentEntryId())));
        CRUD::field('address')->label('Адрес')
            ->hint('Подставится в событие вместе с названием. Пусто — место в здании церкви, на сайте будет её адрес')
            ->validationRules('nullable|string|max:255');
        CRUD::field('notice')->type('custom_html')->value(
            '<p class="text-muted mb-0">Места подсказываются при заполнении событий и объявлений. Значения копируются: '
            .'если поменять место здесь, уже заполненные события и объявления не изменятся.</p>'
        );

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
