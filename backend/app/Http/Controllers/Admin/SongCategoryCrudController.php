<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\SongCategory;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class SongCategoryCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(SongCategory::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/song-category');
        CRUD::setEntityNameStrings('раздел', 'разделы сборника');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('sort')->orderBy('name');

        CRUD::column('name')->label('Название');
        CRUD::column('sort')->label('Порядок')->type('number');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('name')->label('Название')->validationRules('required|string|max:255');
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
