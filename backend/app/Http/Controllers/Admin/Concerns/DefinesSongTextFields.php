<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\SongVariant;
use Backpack\CRUD\app\Library\CrudPanel\CrudPanelFacade as CRUD;

/**
 * Поля варианта песни — подпись, тональность, каподастр, авторы, текст с аккордами. Общие для формы
 * варианта и для формы новой песни, где первый вариант заводится сразу с ней.
 */
trait DefinesSongTextFields
{
    protected function addSongTextFields(): void
    {
        // Подписи повторяются от песни к песне: уже введённые браузер предлагает в подсказке.
        $labels = SongVariant::query()->whereNotNull('label')->distinct()->orderBy('label')->pluck('label');

        CRUD::field('label')->label('Подпись варианта')
            ->hint('Откуда этот текст, например: «3 хор», «PG music». Видна в переключателе вариантов на странице песни.')
            ->attributes(['list' => 'song-variant-labels', 'autocomplete' => 'off'])
            ->validationRules('nullable|string|max:60');
        CRUD::field('label_options')->type('custom_html')->value(
            '<datalist id="song-variant-labels">'.$labels->map(fn (string $label) => '<option value="'.e($label).'">')->implode('').'</datalist>'
        );
        CRUD::field('key')->label('Тональность')->hint('Например: E, Am, F#m')
            ->validationRules('nullable|string|max:16');
        CRUD::field('capo')->label('Каподастр')->type('number')
            ->hint('Лад, на котором стоит каподастр. На сайте виден только с аккордами.')
            ->wrapper(['class' => 'form-group col-md-3'])
            ->validationRules('nullable|integer|min:1|max:12');
        CRUD::field('composer')->label('Музыка')->hint('Автор музыки')
            ->wrapper(['class' => 'form-group col-md-3'])
            ->validationRules('nullable|string|max:255');
        CRUD::field('lyricist')->label('Слова')->hint('Автор слов или переводчик')
            ->wrapper(['class' => 'form-group col-md-3'])
            ->validationRules('nullable|string|max:255');
        CRUD::field('artist')->label('Исполнитель')->hint('Группа или исполнитель оригинала')
            ->wrapper(['class' => 'form-group col-md-3'])
            ->validationRules('nullable|string|max:255');
        CRUD::field('chordpro')->label('Текст и аккорды')->type('textarea')
            ->attributes(['rows' => 22, 'spellcheck' => 'false', 'style' => 'font-family: monospace'])
            ->hint(
                'Куплеты и припевы разделяйте пустой строкой, заголовок («Куплет 1», «Припев») пишите отдельной строкой. '
                .'Аккорды — в квадратных скобках перед слогом: <code>[E]Свят, свят, свят Гос[A]подь</code>. '
                .'Текст с аккордами над строками можно вставить как есть: при сохранении аккорды сами встанут в скобки. '
                .'Си — <code>H</code>, си-бемоль — <code>B</code>.'
            )
            ->validationRules('nullable|string|max:20000');
    }
}
