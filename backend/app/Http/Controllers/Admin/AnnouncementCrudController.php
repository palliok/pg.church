<?php

namespace App\Http\Controllers\Admin;

use App\Enums\AnnouncementWhen;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Announcement;
use App\Models\Event;
use App\Rules\ExistingLink;
use App\Rules\LinkPerLine;
use App\Rules\PhoneNumber;
use App\Support\Phone;
use App\Support\RuDate;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

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
        CRUD::orderBy('published_at', 'desc')->orderBy('id', 'desc');

        CRUD::column('title')->label('Заголовок');
        CRUD::column('when_summary')->label('Когда');
        CRUD::column('important')->label('Важно')->type('boolean');
        CRUD::column('is_published')->label('Опубликовано')->type('boolean');
        CRUD::column('published_at')->label('Дата публикации')->type('datetime');
        CRUD::column('visible_until')->label('Показывать до')->type('date');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('title')->label('Заголовок')->tab('Основное')->validationRules('required|string|max:255');
        CRUD::field('body')->label('Текст')->type('textarea')->tab('Основное')
            ->validationRules('nullable|string|max:5000');
        CRUD::field('important')->label('Важно')->type('switch')->tab('Основное')
            ->hint('Красная метка «Важно»; важные объявления всегда попадают в сторис');

        CRUD::field('when_type')->label('Когда')->type('radio')->tab('Когда')
            ->options(AnnouncementWhen::options())->default(AnnouncementWhen::None->value)
            ->validationRules($this->rules('required', Rule::enum(AnnouncementWhen::class)));
        CRUD::field('event_date')->label('День')->type('date')->tab('Когда')
            ->hint('Если событие на несколько дней — первый день')
            ->validationRules('exclude_unless:when_type,date|required|date');
        CRUD::field('event_date_end')->label('Последний день')->type('date')->tab('Когда')
            ->hint('Только для событий на несколько дней')
            ->validationRules('exclude_unless:when_type,date|nullable|date|after:event_date');
        CRUD::field('deadline')->label('До какого числа')->type('date')->tab('Когда')
            ->hint('Например, сбор вещей до 4 ноября')
            ->validationRules('exclude_unless:when_type,until|required|date');
        CRUD::field('weekday')->label('День недели')->type('select_from_array')->tab('Когда')
            ->options(RuDate::WEEKDAYS)->allows_null(true)
            ->validationRules('exclude_unless:when_type,weekly|required|integer|between:1,7');
        CRUD::field('weekly_time')->label('Время')->type('time')->tab('Когда')
            ->validationRules('exclude_unless:when_type,weekly|required|date_format:H:i');
        CRUD::field('when_note')->label('Время или уточнение')->tab('Когда')
            ->hint('Коротко: «С 10:00», «После служений»')
            ->validationRules('nullable|string|max:60');
        CRUD::field('event_id')->label('Событие из расписания')->type('select_search')->tab('Когда')
            ->entity('event')->model(Event::class)->attribute('display_name')
            ->options(fn ($query) => $query->where(fn ($query) => $query->published()->where('starts_at', '>=', today()))
                // Уже прошедшее связанное событие остаётся в списке, иначе сохранение молча сбросит связь.
                ->orWhere('id', CRUD::getCurrentEntry() ? CRUD::getCurrentEntry()->event_id : null)
                ->orderBy('starts_at')->limit(300)->get())
            ->hint('В сторис появится карточка события. Если у объявления нет своей даты, оно снимется после этого события')
            ->validationRules($this->rules('nullable', Rule::exists('events', 'id')));
        CRUD::field('form_script')->type('view')->view('admin.announcement-form')->tab('Когда')
            ->wrapper(['class' => 'd-none']);

        CRUD::field('place')->label('Где')->tab('Где и контакт')
            ->hint('Например: «Малый зал»')
            ->validationRules('nullable|string|max:120');
        CRUD::field('links_text')->label('Ссылки')->type('textarea')->tab('Где и контакт')
            ->attributes(['rows' => 4, 'placeholder' => 'Анкета для записи | https://forms.yandex.ru/…'])
            ->hint('По одной на строку: «Текст кнопки | ссылка». Не больше пяти');
        CRUD::field('contact_name')->label('Контакт: имя')->tab('Где и контакт')
            ->validationRules('nullable|string|max:60');
        CRUD::field('contact_phone')->label('Контакт: телефон')->tab('Где и контакт')
            ->hint('На сайте — номер с кнопкой звонка; крупной кнопкой внизу — если выбрать звонок основным действием')
            ->attributes(Phone::INPUT_ATTRIBUTES);
        // Варианты — «Нет», ссылки по номеру и звонок; подписи по тексту ссылок и имени контакта
        // ставит скрипт формы (admin.announcement-form) прямо при вводе.
        CRUD::field('main_choice')->label('Основное действие')->type('select_from_array')->tab('Где и контакт')
            ->options([
                'none' => 'Нет',
                ...collect(range(0, LinkPerLine::MAX - 1))->mapWithKeys(fn (int $index) => ['link:'.$index => 'Ссылка '.($index + 1)])->all(),
                'contact' => 'Позвонить контакту',
            ])->allows_null(false)
            ->default('none')
            ->hint('Крупная кнопка внизу объявления на телефоне: регистрация, анкета или звонок. Остальное — обычными плашками');

        CRUD::field('published_at')->label('Дата публикации')->type('datetime')->tab('Публикация')
            ->default(now()->format('Y-m-d H:i'))
            ->hint('Объявления идут по ней, новые сверху. Будущая дата — объявление появится в этот момент')
            ->validationRules('required|date');
        CRUD::field('visible_until')->label('Показывать до')->type('date')->tab('Публикация')
            ->hint('Включительно. Пусто — снимется само после своей даты, а регулярное и без даты — когда снимете с публикации')
            ->validationRules('nullable|date');
        CRUD::field('is_published')->label('Опубликовано')->type('switch')->default(true)->tab('Публикация');

        CRUD::setValidation([
            'links_text' => ['nullable', 'string', 'max:2000', new LinkPerLine],
            'contact_phone' => ['required_with:contact_name', 'required_if:main_choice,contact', 'nullable', 'string', 'max:30', new PhoneNumber],
            'main_choice' => ['required', 'regex:/^(none|contact|link:\d)$/', new ExistingLink(request()->input('links_text'))],
        ]);

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
