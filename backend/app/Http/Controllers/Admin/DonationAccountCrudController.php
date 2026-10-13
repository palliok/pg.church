<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\ValidatesFromFields;
use App\Models\DonationAccount;
use Backpack\CRUD\app\Http\Controllers\CrudController;
use Backpack\CRUD\app\Http\Controllers\Operations\CreateOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\DeleteOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\ListOperation;
use Backpack\CRUD\app\Http\Controllers\Operations\UpdateOperation;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

/**
 * Реквизиты для пожертвований. По каждым реквизитам сайт сам строит QR-код
 * для приложения банка, поэтому отдельной картинки с кодом загружать не нужно.
 */
class DonationAccountCrudController extends CrudController
{
    use CreateOperation, DeleteOperation, ListOperation, UpdateOperation;
    use ValidatesFromFields;

    public function setup(): void
    {
        CRUD::setModel(DonationAccount::class);
        CRUD::setRoute(config('backpack.base.route_prefix').'/donation-account');
        CRUD::setEntityNameStrings('реквизиты', 'реквизиты для пожертвований');
    }

    protected function setupListOperation(): void
    {
        CRUD::orderBy('sort')->orderBy('id');

        CRUD::column('title')->label('Название');
        CRUD::column('recipient')->label('Получатель')->limit(50);
        CRUD::column('bank_name')->label('Банк')->limit(40);
        CRUD::column('account')->label('Расчётный счёт');
        CRUD::column('qr')->label('QR-код')->type('custom_html')
            ->value(fn (DonationAccount $account) => $account->is_published
                ? '<a href="'.e(route('api.donation.qr', $account)).'" target="_blank">открыть</a>'
                : '—');
        CRUD::column('sort')->label('Порядок')->type('number');
        CRUD::column('is_published')->label('Опубликовано')->type('boolean');
    }

    protected function setupCreateOperation(): void
    {
        CRUD::field('title')->label('Название')
            ->hint('Заголовок блока на сайте, например: «На уставную деятельность», «На строительство». Можно не заполнять, если реквизиты одни.')
            ->validationRules('nullable|string|max:255');
        CRUD::field('recipient')->label('Получатель')
            ->hint('Полное название организации, как в банке')
            ->validationRules('required|string|max:255');
        CRUD::field('inn')->label('ИНН')->hint('10 цифр (организация) или 12 (ИП)')
            ->validationRules('required|regex:/^[0-9]{10}([0-9]{2})?$/');
        CRUD::field('kpp')->label('КПП')->validationRules('nullable|digits:9');
        CRUD::field('bank_name')->label('Банк')->validationRules('required|string|max:255');
        CRUD::field('account')->label('Расчётный счёт')->validationRules('required|digits:20');
        CRUD::field('correspondent_account')->label('Корреспондентский счёт')
            ->validationRules('required|digits:20');
        CRUD::field('bic')->label('БИК')->validationRules('required|digits:9');
        CRUD::field('payment_purpose')->label('Назначение платежа')
            ->hint('Например: «Пожертвование на уставную деятельность»')
            ->validationRules('nullable|string|max:210');
        CRUD::field('sort')->label('Порядок')->type('number')->default(0)
            ->hint('Чем меньше число, тем выше на странице')
            ->validationRules('required|integer|min:0|max:65535');
        CRUD::field('is_published')->label('Опубликовано')->type('switch')->default(true);

        $this->useFieldLabelsInValidationErrors();
    }

    protected function setupUpdateOperation(): void
    {
        $this->setupCreateOperation();
    }
}
