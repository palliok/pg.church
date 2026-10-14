<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PostType;
use App\Http\Controllers\Admin\Concerns\HasListFilters;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Post;
use App\Models\Tag;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PostCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use HasListFilters, ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Post::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/post');
        CRUD::setEntityNameStrings('запись', 'новости и блог');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('id', 'desc');

        // Путь берётся из базы как есть: после настройки поля загрузки Backpack отдаёт имя файла без каталога.
        CRUD::column('image')->label('Обложка')->type('image')->disk('public')->height('40px')->width('64px')
            ->value(fn (Post $post) => $post->getRawOriginal('image'));
        CRUD::column('type')->label('Тип')->type('enum')->enum_function('label');
        CRUD::column('title')->label('Заголовок');
        CRUD::column('published_at')->label('Опубликовано')->type('datetime');

        $this->addListFilter('type', 'Тип', PostType::options(),
            fn (string $type) => CRUD::addClause('where', 'type', $type));
        $this->addListFilter('status', 'Статус', ['published' => 'Опубликованные', 'scheduled' => 'Отложенные', 'draft' => 'Черновики'],
            fn (string $status) => match ($status) {
                'published' => CRUD::addClause('where', 'published_at', '<=', now()),
                'scheduled' => CRUD::addClause('where', 'published_at', '>', now()),
                'draft' => CRUD::addClause('whereNull', 'published_at'),
            });
        $this->showListFilters();
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('type')->label('Тип')->type('enum')->enum_function('label')
            ->default(PostType::News->value)
            ->validationRules($this->rules('required', Rule::in(array_keys(PostType::options()))));
        CRUD::field('title')->label('Заголовок')->validationRules('required|string|max:255');
        CRUD::field('excerpt')->label('Анонс')->type('textarea')
            ->hint('Короткий текст для карточки в списке')
            ->validationRules('nullable|string|max:1000');
        CRUD::field('body')->label('Текст')->type('summernote')
            ->validationRules('nullable|string');
        CRUD::field('image')->label('Обложка')->type('upload')
            ->withFiles(['disk' => 'public', 'path' => 'posts'])
            ->validationRules('nullable|file|mimes:jpg,jpeg,png,webp|max:5120');
        CRUD::field('tags')->label('Теги')->type('select_multiple_search')
            ->entity('tags')->model(Tag::class)->attribute('name')
            ->options(fn ($query) => $query->orderBy('name')->get())
            ->validationRules('nullable|array');
        CRUD::field('published_at')->label('Дата публикации')->type('datetime')
            ->hint('Пока дата не указана или ещё не наступила, запись на сайте не видна')
            ->validationRules('nullable|date');

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();

        // Превью обложки. Путь берётся из базы как есть: внутри формы Backpack отдаёт имя файла без каталога.
        $image = CRUD::getCurrentEntry()?->getRawOriginal('image');

        if ($image) {
            CRUD::field('image')->hint('<img src="'.e(Storage::disk('public')->url($image)).'" alt="" style="max-height: 160px; max-width: 100%; margin-top: 8px; border-radius: 8px">');
        }
    }
}
