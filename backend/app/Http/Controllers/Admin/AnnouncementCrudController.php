<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Announcement;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class AnnouncementCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Announcement::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/announcement');
        CRUD::setEntityNameStrings('объявление', 'объявления');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('sort')->orderBy('id', 'desc');

        CRUD::column('title')->label('Заголовок');
        CRUD::column('visible_until')->label('Показывать до')->type('date');
        CRUD::column('is_published')->label('Опубликовано')->type('boolean');
        CRUD::column('sort')->label('Порядок')->type('number');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('title')->label('Заголовок')->validationRules('required|string|max:255');
        CRUD::field('body')->label('Текст')->type('textarea')
            ->hint('Показывается, когда посетитель раскрывает объявление')
            ->validationRules('nullable|string|max:5000');
        CRUD::field('visible_until')->label('Показывать до')->type('date')
            ->hint('Включительно. Пусто — пока не снимете с публикации')
            ->validationRules('nullable|date');
        CRUD::field('sort')->label('Порядок')->type('number')->default(0)
            ->hint('Чем меньше число, тем выше в списке; при равном — новые выше')
            ->validationRules('required|integer|min:0|max:65535');
        CRUD::field('is_published')->label('Опубликовано')->type('switch')->default(true);

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
