<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Event;
use App\Models\Minister;
use App\Models\Sermon;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

class SermonCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Sermon::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/sermon');
        CRUD::setEntityNameStrings('проповедь', 'проповеди');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('id', 'desc');

        CRUD::column('event_id')->label('Событие')->type('select')
            ->entity('event')->model(Event::class)->attribute('display_name')
            ->searchLogic(false);
        CRUD::column('topic')->label('Тема');
        CRUD::column('scripture_ref')->label('Место Писания');
        CRUD::column('minister_id')->label('Проповедник')->type('select')
            ->entity('minister')->model(Minister::class)->attribute('name');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('event_id')->label('Событие')->type('select_search')
            ->entity('event')->model(Event::class)->attribute('display_name')
            ->options(fn ($query) => $query->orderByDesc('starts_at')->get())
            ->validationRules($this->rules(
                'required',
                Rule::exists('events', 'id'),
                Rule::unique('sermons', 'event_id')->ignore(CRUD::getCurrentEntryId() ?: null),
            ));
        CRUD::field('minister_id')->label('Проповедник')->type('select_search')
            ->entity('minister')->model(Minister::class)->attribute('name')
            ->validationRules($this->rules('nullable', Rule::exists('ministers', 'id')));
        CRUD::field('topic')->label('Тема')->validationRules('required|string|max:255');
        CRUD::field('scripture_ref')->label('Место Писания')->hint('Например: «Римлянам 5:1–5»')
            ->validationRules('nullable|string|max:255');
        CRUD::field('intro')->label('Вступление')->type('textarea')
            ->validationRules('nullable|string');
        CRUD::field('outline')->label('План')->type('textarea')
            ->attributes(['rows' => 6])
            ->hint('Каждый пункт с новой строки')
            ->validationRules('nullable|string');
        CRUD::field('verse')->label('Ключевой стих')->type('textarea')
            ->validationRules('nullable|string');
        CRUD::field('verse_ref')->label('Ссылка на ключевой стих')->hint('Например: «Римлянам 5:5»')
            ->validationRules('nullable|string|max:255');
        CRUD::field('audio_url')->label('Ссылка на аудиозапись')->type('url')
            ->validationRules('nullable|url|max:255');
        CRUD::field('duration_minutes')->label('Длительность, мин')->type('number')
            ->validationRules('nullable|integer|min:1|max:600');

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
