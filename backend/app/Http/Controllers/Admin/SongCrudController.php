<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\DefinesSongTextFields;
use App\Http\Controllers\Admin\Concerns\HasListFilters;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Song;
use App\Models\SongCategory;
use App\Models\SongVariant;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class SongCrudController extends CrudController
{
    use CreateOperation { store as storeSong; }
    use DefinesSongTextFields, HasListFilters, ValidatesFromFields;
    use DeleteOperation, ListOperation, UpdateOperation;

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
        CRUD::column('variants')->label('Вариантов')->type('relationship_count')->suffix('');

        $this->addListFilter('category', 'Раздел', ['none' => 'Без раздела'] + SongCategory::query()->orderBy('sort')->orderBy('name')->pluck('name', 'id')->all(),
            fn (string $category) => $category === 'none'
                ? CRUD::addClause('whereNull', 'song_category_id')
                : CRUD::addClause('where', 'song_category_id', (int) $category));
        $this->addListFilter('chords', 'Аккорды', ['1' => 'С аккордами', '0' => 'Без аккордов'],
            fn (string $chords) => CRUD::addClause($chords === '1' ? 'whereHas' : 'whereDoesntHave', 'variants',
                fn ($query) => $query->where('chordpro', 'like', '%[%]%')));
        $this->showListFilters();
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

        // Первый вариант текста заводится вместе с песней, остальные — со страницы редактирования.
        if (! CRUD::getCurrentEntryId()) {
            $this->addSongTextFields();
        }

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();

        // Варианты текста — отдельные записи; здесь их список и ссылки на редактирование.
        $song = CRUD::getCurrentEntry();

        if ($song) {
            $variants = $song->variants()->defaultFirst()->get()->map(fn ($variant) => '<li><a href="'.e(backpack_url("song-variant/{$variant->id}/edit")).'">'
                .e($song->number.$variant->letter).'</a>'
                .($variant->label ? ' · '.e($variant->label) : '')
                .($variant->is_default ? ' <span class="text-secondary">· основной</span>' : '').'</li>')->implode('');

            CRUD::field('variants_overview')->type('custom_html')->value(
                '<label class="form-label">Варианты текста</label>'
                .($variants ? '<ul class="mb-2">'.$variants.'</ul>' : '<p class="text-secondary mb-2">Текста пока нет.</p>')
                .'<a class="btn btn-sm btn-outline-primary" href="'.e(backpack_url('song-variant/create').'?song_id='.$song->id).'">Добавить вариант</a>'
            );
        }
    }

    /**
     * Новая песня сохраняется вместе с первым, основным вариантом текста.
     */
    public function store(): Response
    {
        return DB::transaction(function () {
            $response = $this->storeSong();

            $this->crud->entry->variants()->create([
                'letter' => SongVariant::nextLetter($this->crud->entry->id),
                'is_default' => true,
                ...request()->only(['label', 'key', 'chordpro']),
            ]);

            return $response;
        });
    }
}
