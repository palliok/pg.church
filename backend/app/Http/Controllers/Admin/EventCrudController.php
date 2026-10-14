<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\CalendarSource;
use App\Models\Event;
use App\Models\Song;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

class EventCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Event::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/event');
        CRUD::setEntityNameStrings('событие', 'события');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('starts_at', 'desc');

        CRUD::column('starts_at')->label('Начало')->type('datetime');
        CRUD::column('title')->label('Название');
        CRUD::column('tag')->label('Метка');
        CRUD::column('place')->label('Место');
        CRUD::column('is_main')->label('Главное')->type('boolean');
        CRUD::column('has_stream')->label('Трансляция')->type('boolean');
        CRUD::column('is_published')->label('Опубликовано')->type('boolean');
        CRUD::column('calendar_source_id')->label('Из календаря')->type('select')
            ->entity('calendarSource')->model(CalendarSource::class)->attribute('name');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('title')->label('Название')->validationRules('required|string|max:255');
        CRUD::field('starts_at')->label('Дата и время начала')->type('datetime')
            ->validationRules('required|date');
        CRUD::field('ends_at')->label('Дата и время окончания')->type('datetime')
            ->hint('Можно не указывать: в календарях посетителей событие займёт '.config('church.event_duration').' минут')
            ->validationRules('nullable|date|after_or_equal:starts_at');
        CRUD::field('all_day')->label('Весь день')->type('switch')
            ->hint('Время начала и окончания не учитывается, только даты');
        CRUD::field('tag')->label('Метка')->hint('Например: «Воскресенье», «Будни», «Молодёжь»')
            ->validationRules('nullable|string|max:255');
        CRUD::field('place')->label('Место')->hint('Например: «Главный зал»')
            ->validationRules('nullable|string|max:255');
        CRUD::field('address')->label('Адрес')
            ->hint('Если не заполнено, на сайте показывается адрес церкви из настроек')
            ->validationRules('nullable|string|max:255');
        CRUD::field('description')->label('Описание')->type('textarea')
            ->attributes(['rows' => 6])
            ->hint('Абзацы разделяйте пустой строкой')
            ->validationRules('nullable|string');
        CRUD::field('songs')->label('Гимны служения')->type('select_multiple')
            ->entity('songs')->model(Song::class)->attribute('display_name')
            ->options(fn ($query) => $query->orderBy('number')->get())
            ->validationRules('nullable|array');
        CRUD::field('is_main')->label('Главное событие')->type('switch');
        CRUD::field('has_stream')->label('Есть трансляция')->type('switch');
        CRUD::field('stream_url')->label('Ссылка на трансляцию')->type('url')
            ->validationRules('nullable|url|max:255');
        CRUD::field('is_published')->label('Опубликовано')->type('switch')->default(true);

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $source = CRUD::getCurrentEntry()?->calendarSource;

        if ($source) {
            CRUD::field('calendar_notice')->type('custom_html')->value(
                '<div class="alert alert-info mb-0">Событие загружено из календаря «'.e($source->name).'». '
                .'Название, описание, место и время обновляются при каждой синхронизации — меняйте их в самом календаре. '
                .'Метку, гимны, трансляцию и публикацию можно менять здесь.</div>'
            );
        }

        $this->setupCreateOperation();
    }
}
