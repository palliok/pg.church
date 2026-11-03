<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\DefinesSongTextFields;
use App\Http\Controllers\Admin\Concerns\HasListFilters;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Song;
use App\Models\SongVariant;
use App\Support\Text;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

class SongVariantCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use DefinesSongTextFields, HasListFilters, ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(SongVariant::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/song-variant');
        CRUD::setEntityNameStrings('вариант', 'варианты песен');
    }

    protected function setupListOperation(): void
    {
        CRUD::addClause('with', 'song');
        CRUD::orderBy('song_id')->orderBy('letter');

        CRUD::column('song_id')->label('Песня')->type('select')
            ->entity('song')->model(Song::class)->attribute('display_name')
            ->searchLogic(fn ($query, $column, $searchTerm) => $query->orWhereHas('song', fn ($query) => $query
                ->where('title', 'ilike', '%'.Text::escapeLike($searchTerm).'%')
                ->when(ctype_digit($searchTerm), fn ($query) => $query->orWhere('number', (int) $searchTerm))));
        CRUD::column('letter')->label('Буква');
        CRUD::column('label')->label('Подпись');
        CRUD::column('is_default')->label('Основной')->type('boolean');
        CRUD::column('key')->label('Тональность');

        $this->addListFilter('song', 'Песня', Song::query()->orderBy('number')->get()->pluck('display_name', 'id')->all(),
            fn (string $song) => CRUD::addClause('where', 'song_id', (int) $song));
        $this->showListFilters();
    }

    protected function setupCreateOperation(): void
    {
        // Ссылка «Добавить вариант» со страницы песни передаёт её в адресе: ?song_id=…
        $songId = request()->integer('song_id') ?: null;

        CRUD::field('song_id')->label('Песня')->type('select_search')
            ->entity('song')->model(Song::class)->attribute('display_name')
            ->options(fn ($query) => $query->orderBy('number')->get())
            ->default($songId)
            ->validationRules($this->rules('required', Rule::exists('songs', 'id')));
        CRUD::field('letter')->label('Буква')
            ->default($songId ? SongVariant::nextLetter($songId) : 'а')
            ->hint('Пишется после номера: 214а, 214б. Пока вариант у песни один, буква на сайте не видна.')
            ->validationRules($this->rules(
                'required', 'string', 'max:4',
                Rule::unique('song_variants', 'letter')
                    ->where('song_id', request()->integer('song_id'))
                    ->ignore(CRUD::getCurrentEntryId() ?: null),
            ));
        CRUD::field('is_default')->label('Основной вариант')->type('switch')
            ->default($songId && ! SongVariant::query()->where('song_id', $songId)->exists())
            ->hint('Открывается на странице песни первым. Отметка снимается с прежнего основного варианта.');
        $this->addSongTextFields();

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
