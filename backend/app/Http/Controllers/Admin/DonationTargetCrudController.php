<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\DonationTarget;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class DonationTargetCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(DonationTarget::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/donation-target');
        CRUD::setEntityNameStrings('направление', 'цели пожертвований');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('sort')->orderBy('id');

        CRUD::column('title')->label('Название');
        CRUD::column('description')->label('Описание');
        CRUD::column('sort')->label('Порядок')->type('number');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('title')->label('Название')->validationRules('required|string|max:255');
        CRUD::field('description')->label('Описание')->validationRules('nullable|string|max:255');
        CRUD::field('color')->label('Цвет значка')
            ->hint('Цвет в CSS-формате: #f9c9a5 или переменная темы, например var(--c-second)')
            ->validationRules('nullable|string|max:255');
        CRUD::field('sort')->label('Порядок')->type('number')->default(0)
            ->hint('Чем меньше число, тем выше в списке')
            ->validationRules('required|integer|min:0|max:65535');

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
