<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StoryScene;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Story;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

class StoryCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(Story::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/story');
        CRUD::setEntityNameStrings('историю', 'истории');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('sort')->orderBy('id');

        CRUD::column('title')->label('Заголовок');
        CRUD::column('kicker')->label('Рубрика');
        CRUD::column('slug')->label('Адрес');
        CRUD::column('panels')->label('Кадров')->type('relationship_count')->suffix('');
        CRUD::column('sort')->label('Порядок')->type('number');
        CRUD::column('is_published')->label('Опубликовано')->type('boolean');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('title')->label('Заголовок')->validationRules('required|string|max:255');
        CRUD::field('slug')->label('Адрес')
            ->hint('Латиницей, без пробелов: история откроется по адресу /story/<адрес>')
            ->validationRules($this->rules(
                'required', 'alpha_dash:ascii', 'max:255',
                Rule::unique('stories', 'slug')->ignore(CRUD::getCurrentEntryId() ?: null),
            ));
        CRUD::field('kicker')->label('Рубрика')->hint('Например: «Евангелие», «Рождество»')
            ->validationRules('required|string|max:255');
        CRUD::field('lead')->label('Подзаголовок')->validationRules('nullable|string|max:255');
        CRUD::field('cover_scene')->label('Иллюстрация обложки')->type('select_from_array')
            ->options(StoryScene::options())->allows_null(false)
            ->validationRules($this->rules('required', Rule::in(array_keys(StoryScene::options()))));
        CRUD::field('background')->label('Фон карточки')
            ->hint('CSS-значение, например: linear-gradient(135deg,#1d1b5c,#4a3585)')
            ->validationRules('nullable|string|max:255');
        CRUD::field('sort')->label('Порядок')->type('number')->default(0)
            ->hint('Чем меньше число, тем выше в списке')
            ->validationRules('required|integer|min:0|max:65535');
        CRUD::field('is_published')->label('Опубликовано')->type('switch')->default(true);

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
