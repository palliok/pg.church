<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Minister;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class MinisterCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Minister::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/minister');
        CRUD::setEntityNameStrings('служителя', 'служители');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('name');

        CRUD::column('name')->label('Имя');
        CRUD::column('role')->label('Служение');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('name')->label('Имя')->hint('Имя и фамилия, например: «Алексей Синичкин»')
            ->validationRules('required|string|max:255');
        CRUD::field('role')->label('Служение')->hint('Например: «Старший пастор»')
            ->validationRules('nullable|string|max:255');

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
