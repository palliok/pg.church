<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StoryScene;
use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\Story;
use App\Models\StoryPanel;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

class StoryPanelCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(StoryPanel::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/story-panel');
        CRUD::setEntityNameStrings('кадр', 'кадры историй');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('story_id')->orderBy('sort')->orderBy('id');

        CRUD::column('story_id')->label('История')->type('select')
            ->entity('story')->model(Story::class)->attribute('title');
        CRUD::column('sort')->label('Порядок')->type('number');
        CRUD::column('title')->label('Заголовок');
        CRUD::column('tag')->label('Метка');
        CRUD::column('scene')->label('Иллюстрация')->type('select_from_array')
            ->options(StoryScene::options());
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('story_id')->label('История')->type('select')
            ->entity('story')->model(Story::class)->attribute('title')
            ->options(fn ($query) => $query->orderBy('sort')->orderBy('id')->get())
            ->validationRules($this->rules('required', Rule::exists('stories', 'id')));
        CRUD::field('sort')->label('Порядок')->type('number')->default(0)
            ->hint('Кадры показываются по возрастанию этого числа')
            ->validationRules('required|integer|min:0|max:65535');
        CRUD::field('scene')->label('Иллюстрация')->type('select_from_array')
            ->options(StoryScene::options())->allows_null(false)
            ->validationRules($this->rules('required', Rule::in(array_keys(StoryScene::options()))));
        CRUD::field('tag')->label('Метка')->hint('Например: «Начало», «Весть»')
            ->validationRules('nullable|string|max:255');
        CRUD::field('title')->label('Заголовок')->validationRules('required|string|max:255');
        CRUD::field('text')->label('Текст')->type('textarea')
            ->attributes(['rows' => 5])
            ->validationRules('nullable|string');

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
