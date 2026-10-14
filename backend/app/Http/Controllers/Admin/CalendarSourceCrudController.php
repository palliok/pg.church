<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\CalendarSource;
use App\Services\Calendar\CalendarSync;
use App\Services\Calendar\CalendarSyncFailed;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\Facades\Alert;

/**
 * Внешние календари, из которых на сайт загружаются события. Синхронизация
 * идёт сама каждые 15 минут, после сохранения календаря и по кнопке.
 */
class CalendarSourceCrudController extends CrudController
{
    use CreateOperation { store as traitStore; }
    use DeleteOperation, ListOperation;
    use UpdateOperation { update as traitUpdate; }
    use ValidatesFromFields;

    private const string URL_HINT = 'Ссылка на календарь в формате iCal (.ics), а не на его страницу:'
        .'<br><b>Google</b> — настройки календаря → «Интеграция календаря» → «Закрытый адрес в формате iCal»;'
        .'<br><b>Outlook</b> — настройки → «Общие календари» → «Опубликовать календарь» → ссылка ICS;'
        .'<br><b>iCloud (Apple)</b> — «Поделиться календарём» → «Общедоступный календарь» → скопировать ссылку;'
        .'<br><b>Яндекс</b> — настройки календаря → «Экспорт» → ссылка ICS.';

    public function setup(): void
    {
        CRUD::setModel(CalendarSource::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/calendar-source');
        CRUD::setEntityNameStrings('календарь', 'календари для импорта');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('name');

        CRUD::column('name')->label('Название');
        CRUD::column('host')->label('Сервер')->type('text');
        CRUD::column('events')->label('Событий')->type('relationship_count')->suffix('');
        CRUD::column('last_synced_at')->label('Синхронизирован')->type('datetime');
        CRUD::column('last_error')->label('Ошибка')->limit(80);
        CRUD::column('is_active')->label('Включён')->type('boolean');

        CRUD::addButtonFromView('line', 'sync', 'calendar_sync', 'beginning');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('name')->label('Название')->hint('Например: «Календарь служений»')
            ->validationRules('required|string|max:255');
        CRUD::field('url')->label('Ссылка на календарь (iCal)')->type('text')
            ->attributes(['autocomplete' => 'off', 'spellcheck' => 'false'])
            ->hint(self::URL_HINT)
            ->validationRules('required|string|max:2000|starts_with:https://,http://,webcal://,webcals://');
        CRUD::field('is_active')->label('Синхронизировать')->type('switch')->default(true)
            ->hint('Выключенный календарь не обновляется, загруженные события остаются на сайте');
        CRUD::field('publish_events')->label('Сразу публиковать новые события')->type('switch')->default(true)
            ->hint('Если выключено, новые события появятся в админке скрытыми — их нужно опубликовать вручную');

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }

    /**
     * После сохранения календарь сразу синхронизируется, чтобы ошибка в ссылке была видна.
     */
    public function store()
    {
        $response = $this->traitStore();
        $this->syncAndReport($this->crud->entry);

        return $response;
    }

    public function update()
    {
        $response = $this->traitUpdate();

        if ($this->crud->entry->is_active) {
            $this->syncAndReport($this->crud->entry);
        }

        return $response;
    }

    /**
     * Кнопка «Синхронизировать» в списке.
     */
    public function sync(int $id): RedirectResponse
    {
        $source = CalendarSource::query()->find($id);

        // Список мог устареть: календарь уже удалил другой администратор.
        if ($source === null) {
            Alert::error('Календарь не найден — возможно, его уже удалили. Список обновлён.')->flash();

            return redirect(backpack_url('calendar-source'));
        }

        $this->syncAndReport($source);

        return redirect()->back();
    }

    private function syncAndReport(CalendarSource $source): void
    {
        try {
            $result = app(CalendarSync::class)->sync($source);
            Alert::success("«{$source->name}» синхронизирован: {$result->summary()}.")->flash();
        } catch (CalendarSyncFailed $e) {
            Alert::error("«{$source->name}» не синхронизирован. {$e->getMessage()}")->flash();
        }
    }
}
