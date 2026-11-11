<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\HasListFilters;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\CalendarSource;
use App\Models\Event;
use App\Models\SongVariant;
use App\Rules\ExistingLink;
use App\Rules\LinkPerLine;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Prologue\Alerts\Facades\Alert;

class EventCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use HasListFilters, ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Event::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/event');
        CRUD::setEntityNameStrings('событие', 'события');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('starts_at', 'desc');
        CRUD::addButtonFromView('line', 'copy', 'event_copy');

        CRUD::column('starts_at')->label('Начало')->type('datetime');
        CRUD::column('title')->label('Название');
        CRUD::column('tag')->label('Метка');
        CRUD::column('place')->label('Место');
        CRUD::column('is_main')->label('Главное')->type('boolean');
        CRUD::column('has_stream')->label('Трансляция')->type('boolean');
        CRUD::column('is_published')->label('Опубликовано')->type('event_published')->searchLogic(false);
        CRUD::column('calendar_source_id')->label('Из календаря')->type('select')
            ->entity('calendarSource')->model(CalendarSource::class)->attribute('name');

        $this->addListFilter('period', 'Когда', ['upcoming' => 'Предстоящие', 'past' => 'Прошедшие'],
            fn (string $period) => CRUD::addClause('where', 'starts_at', $period === 'upcoming' ? '>=' : '<', today()));
        $this->addListFilter('published', 'Публикация', ['1' => 'Опубликованные', '0' => 'Скрытые'],
            fn (string $published) => CRUD::addClause('where', 'is_published', $published === '1'));
        $this->addListFilter('source', 'Откуда', ['site' => 'Созданы на сайте'] + CalendarSource::query()->orderBy('name')->pluck('name', 'id')->all(),
            fn (string $source) => $source === 'site'
                ? CRUD::addClause('whereNull', 'calendar_source_id')
                : CRUD::addClause('where', 'calendar_source_id', (int) $source));
        $this->showListFilters();
    }

    public function copy(Event $event): RedirectResponse
    {
        CRUD::hasAccessOrFail('create');

        $copy = DB::transaction(function () use ($event) {
            $copy = $event->replicate(['calendar_source_id', 'external_uid']);
            $copy->is_published = false;
            $copy->save();
            $copy->hymns()->attach($event->hymns()->allRelatedIds());

            if ($event->sermon) {
                $copy->sermon()->save($event->sermon->replicate());
            }

            return $copy;
        });

        Alert::success('Копия события создана.')->flash();

        return redirect(backpack_url('event/'.$copy->getKey().'/edit'));
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
        CRUD::field('notice')->label('Плашка')
            ->hint('Красная пометка на карточке события, коротко: «Нужна регистрация», «Запись закрыта», «Осталось 20 мест». Пусто — без плашки')
            ->validationRules('nullable|string|max:40');
        CRUD::field('place')->label('Место')->hint('Например: «Главный зал»')
            ->validationRules('nullable|string|max:255');
        CRUD::field('address')->label('Адрес')
            ->hint('Если не заполнено, на сайте показывается адрес церкви из настроек')
            ->validationRules('nullable|string|max:255');
        CRUD::field('description')->label('Описание')->type('textarea')
            ->attributes(['rows' => 6])
            ->hint('Абзацы разделяйте пустой строкой')
            ->validationRules('nullable|string');
        CRUD::field('hymns')->label('Гимны служения')->type('select_multiple_search')
            ->entity('hymns')->model(SongVariant::class)->attribute('display_name')
            ->options(fn ($query) => $query->with(['song' => fn ($query) => $query->withCount('variants')])->orderBySong()->get())
            ->hint('У песни с несколькими вариантами текста выберите нужный: 214а, 214б')
            ->validationRules('nullable|array');
        CRUD::field('links_text')->label('Ссылки')->type('textarea')->attributes(['rows' => 3])
            ->hint('По одной на строку: «Текст кнопки | ссылка», например «Регистрация | https://…». Не больше пяти');
        // Подписи вариантов по тексту ссылок ставит скрипт формы (admin.event-form) прямо при вводе.
        CRUD::field('main_choice')->label('Основная ссылка')->type('select_from_array')
            ->options([
                'none' => 'Нет',
                ...collect(range(0, LinkPerLine::MAX - 1))->mapWithKeys(fn (int $index) => ['link:'.$index => 'Ссылка '.($index + 1)])->all(),
            ])->allows_null(false)
            ->default('none')
            ->hint('Крупная кнопка в карточке события, например «Регистрация». Остальные ссылки — плашками в описании');
        CRUD::field('form_script')->type('view')->view('admin.event-form');
        CRUD::field('is_main')->label('Главное событие')->type('switch');
        CRUD::field('has_stream')->label('Есть трансляция')->type('switch');
        CRUD::field('stream_url')->label('Ссылка на трансляцию')->type('url')
            ->validationRules('nullable|url|max:255');
        CRUD::field('is_published')->label('Опубликовано')->type('switch')->default(true);

        CRUD::setValidation([
            'links_text' => ['nullable', 'string', 'max:2000', new LinkPerLine],
            'main_choice' => ['nullable', 'regex:/^(none|link:\d)$/', new ExistingLink(request()->input('links_text'))],
        ]);

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
