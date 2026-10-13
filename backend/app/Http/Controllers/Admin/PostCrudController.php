<?php

namespace App\Http\Controllers\Admin;

use App\Enums\PostType;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Post;
use App\Models\Tag;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

class PostCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Post::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/post');
        CRUD::setEntityNameStrings('запись', 'новости и блог');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('id', 'desc');

        CRUD::column('type')->label('Тип')->type('enum')->enum_function('label');
        CRUD::column('title')->label('Заголовок');
        CRUD::column('published_at')->label('Опубликовано')->type('datetime');
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
        CRUD::field('tags')->label('Теги')->type('select_multiple')
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
    }
}
