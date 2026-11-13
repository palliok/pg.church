<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Contact;
use App\Rules\PhoneNumber;
use App\Support\Phone;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class ContactCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Contact::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/contact');
        CRUD::setEntityNameStrings('контакт', 'контакты');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('name');

        CRUD::column('name')->label('Имя');
        CRUD::column('phone')->label('Телефон');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('name')->label('Имя')->hint('Как на сайте: «Андрей», «Мамы в молитве», «Дежурный администратор»')
            ->validationRules('required|string|max:60');
        CRUD::field('phone')->label('Телефон')->attributes(Phone::INPUT_ATTRIBUTES);
        CRUD::field('form_script')->type('view')->view('admin.phone-mask')->wrapper(['class' => 'd-none']);
        CRUD::field('notice')->type('custom_html')->value(
            '<p class="text-muted mb-0">Контакты подсказываются при заполнении объявлений. Значения копируются: '
            .'если поменять номер здесь, уже заполненные объявления не изменятся.</p>'
        );

        CRUD::setValidation(['phone' => ['required', 'string', 'max:30', new PhoneNumber]]);

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
