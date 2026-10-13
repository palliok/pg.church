<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Tag;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class TagCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Tag::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/tag');
        CRUD::setEntityNameStrings('тег', 'теги');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('name');

        CRUD::column('name')->label('Название');
        CRUD::column('color')->label('Цвет фона');
        CRUD::column('text_color')->label('Цвет текста');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('name')->label('Название')->validationRules('required|string|max:255');
        CRUD::field('color')->label('Цвет фона')->default('#ffffff')
            ->hint('Цвет в CSS-формате: #f9c9a5 или переменная темы, например var(--c-main)')
            ->validationRules('required|string|max:255');
        CRUD::field('text_color')->label('Цвет текста')->default('#0d0d0d')
            ->validationRules('required|string|max:255');

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
