<?php

namespace App\Http\Controllers\Admin\Concerns;

use Backpack\CRUD\app\Library\Widget;
use Closure;

/**
 * Фильтры над таблицей списка: выпадающие списки, значение которых попадает
 * в адрес страницы (?name=value). Таблица загружает строки отдельным запросом
 * с теми же параметрами, поэтому условие применяется и к нему.
 */
trait HasListFilters
{
    /** @var array<string, array{label: string, options: array<array-key, string>}> */
    private array $listFilters = [];

    /**
     * @param  array<array-key, string>  $options  значение => подпись
     * @param  Closure(string): void  $apply  добавляет условие в запрос списка
     */
    protected function addListFilter(string $name, string $label, array $options, Closure $apply): void
    {
        $this->listFilters[$name] = ['label' => $label, 'options' => $options];

        $value = request()->query($name);

        if (is_string($value) && array_key_exists($value, $options)) {
            $apply($value);
        }
    }

    /**
     * Показывает заданные фильтры над таблицей. Вызывается после всех addListFilter().
     */
    protected function showListFilters(): void
    {
        Widget::add([
            'type' => 'view',
            'view' => 'admin.list_filters',
            'filters' => $this->listFilters,
        ])->to('before_content');
    }
}
