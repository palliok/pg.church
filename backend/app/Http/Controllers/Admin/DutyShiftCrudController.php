<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\DutyShift;
use App\Models\Minister;
use App\Support\RuDate;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

class DutyShiftCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(DutyShift::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/duty-shift');
        CRUD::setEntityNameStrings('дежурство', 'дежурства');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('weekday');

        CRUD::column('weekday')->label('День недели')->type('select_from_array')
            ->options(RuDate::WEEKDAYS);
        CRUD::column('minister_id')->label('Служитель')->type('select')
            ->entity('minister')->model(Minister::class)->attribute('name');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('weekday')->label('День недели')->type('select_from_array')
            ->options(RuDate::WEEKDAYS)->allows_null(false)
            ->validationRules($this->rules('required', Rule::in(array_keys(RuDate::WEEKDAYS))));
        CRUD::field('minister_id')->label('Служитель')->type('select')
            ->entity('minister')->model(Minister::class)->attribute('name')
            ->options(fn ($query) => $query->orderBy('name')->get())
            ->validationRules($this->rules('required', Rule::exists('ministers', 'id')));

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
