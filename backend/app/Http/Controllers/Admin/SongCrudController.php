<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Song;
use App\Models\SongCategory;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

class SongCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Song::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/song');
        CRUD::setEntityNameStrings('песню', 'песни');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('number');

        CRUD::column('number')->label('№')->type('number')->thousands_sep('')
            ->searchLogic(function ($query, $column, $searchTerm) {
                if (ctype_digit($searchTerm)) {
                    $query->orWhere('number', (int) $searchTerm);
                }
            });
        CRUD::column('title')->label('Название');
        CRUD::column('song_category_id')->label('Раздел')->type('select')
            ->entity('category')->model(SongCategory::class)->attribute('name');
        CRUD::column('key')->label('Тональность');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('number')->label('Номер')->type('number')
            ->validationRules($this->rules(
                'required', 'integer', 'min:1',
                Rule::unique('songs', 'number')->ignore(CRUD::getCurrentEntryId() ?: null),
            ));
        CRUD::field('title')->label('Название')->validationRules('required|string|max:255');
        CRUD::field('song_category_id')->label('Раздел')->type('select')
            ->entity('category')->model(SongCategory::class)->attribute('name')
            ->options(fn ($query) => $query->orderBy('sort')->orderBy('name')->get())
            ->validationRules($this->rules('nullable', Rule::exists('song_categories', 'id')));
        CRUD::field('key')->label('Тональность')->hint('Например: E, Am, F#m')
            ->validationRules('nullable|string|max:16');
        CRUD::field('chordpro')->label('Текст и аккорды')->type('textarea')
            ->attributes(['rows' => 22, 'spellcheck' => 'false', 'style' => 'font-family: monospace'])
            ->hint(
                'Куплеты и припевы разделяйте пустой строкой, заголовок («Куплет 1», «Припев») пишите отдельной строкой. '
                .'Аккорды — в квадратных скобках перед слогом: <code>[E]Свят, свят, свят Гос[A]подь</code>. '
                .'Текст с аккордами над строками можно вставить как есть: при сохранении аккорды сами встанут в скобки. '
                .'Си — <code>H</code>, си-бемоль — <code>B</code>.'
            )
            ->validationRules('nullable|string|max:20000');

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
