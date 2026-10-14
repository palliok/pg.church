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

        // Кадры истории — отдельные записи; здесь их список и ссылки на редактирование.
        $story = CRUD::getCurrentEntry();

        if ($story) {
            $panels = $story->panels->map(fn ($panel) => '<li><a href="'.e(backpack_url("story-panel/{$panel->id}/edit")).'">'
                .e($panel->title).'</a> <span class="text-secondary">· '.e(StoryScene::tryFrom($panel->scene)?->label() ?? $panel->scene).'</span></li>')->implode('');

            CRUD::field('panels_overview')->type('custom_html')->value(
                '<label class="form-label">Кадры истории</label>'
                .($panels ? '<ol class="mb-2">'.$panels.'</ol>' : '<p class="text-secondary mb-2">Кадров пока нет.</p>')
                .'<a class="btn btn-sm btn-outline-primary" href="'.e(backpack_url('story-panel/create').'?story_id='.$story->id).'">Добавить кадр</a> '
                .'<a class="btn btn-sm btn-link" href="'.e(backpack_url('story-panel').'?story='.$story->id).'">Все кадры этой истории</a>'
            );
        }
    }
}
