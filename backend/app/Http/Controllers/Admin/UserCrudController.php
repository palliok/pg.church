<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\User;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;
use Illuminate\Validation\Rule;

/**
 * Администраторы панели. Каждый пользователь из таблицы users имеет полный доступ.
 */
class UserCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation;
    use UpdateOperation { update as traitUpdate; }
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(User::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/user');
        CRUD::setEntityNameStrings('администратора', 'администраторы');

        // Нельзя удалить самого себя и остаться без доступа к панели.
        CRUD::setAccessCondition('delete', fn ($user) => ! $user instanceof User || $user->isNot(backpack_user()));
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('name');

        CRUD::column('name')->label('Имя');
        CRUD::column('email')->label('Email')->type('email');
        CRUD::column('created_at')->label('Добавлен')->type('datetime');
    }

    protected function setupCreateOperation(): void
    {
        $this->addFields(passwordRequired: true);
    }

    protected function setupUpdateOperation(): void
    {
        $this->addFields(passwordRequired: false);
    }

    /**
     * Пустой пароль при редактировании означает «не менять».
     */
    public function update()
    {
        if (! CRUD::getRequest()->filled('password')) {
            CRUD::getRequest()->request->remove('password');
            CRUD::getRequest()->request->remove('password_confirmation');
        }

        return $this->traitUpdate();
    }

    private function addFields(bool $passwordRequired): void
    {
        CRUD::field('name')->label('Имя')->validationRules('required|string|max:255');
        CRUD::field('email')->label('Email')->type('email')
            ->validationRules($this->rules(
                'required', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore(CRUD::getCurrentEntryId() ?: null),
            ));
        CRUD::field('password')->label('Пароль')->type('password')
            ->hint($passwordRequired ? 'Не короче 8 символов' : 'Оставьте пустым, чтобы не менять пароль')
            ->validationRules($this->rules($passwordRequired ? 'required' : 'nullable', 'confirmed', 'min:8'));
        CRUD::field('password_confirmation')->label('Пароль ещё раз')->type('password');

        $this->useFieldLabelsInValidationErrors();
    }
}
