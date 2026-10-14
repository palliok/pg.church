<?php

namespace Database\Seeders;

use App\Enums\SettingType;
use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    /**
     * Набор настроек сайта. Сидер можно запускать повторно: подписи и порядок
     * обновляются, а уже сохранённые значения не трогаются.
     */
    public function run(): void
    {
        foreach ($this->definitions() as $sort => [$key, $group, $label, $type, $value, $hint]) {
            $setting = Setting::query()->firstOrNew(['key' => $key]);

            $setting->fill([
                'group' => $group,
                'label' => $label,
                'type' => $type,
                'hint' => $hint,
                'sort' => $sort,
            ]);

            if (! $setting->exists) {
                $setting->value = $value;
            }

            $setting->save();
        }
    }

    /**
     * @return list<array{string, string, string, SettingType, ?string, ?string}>
     */
    private function definitions(): array
    {
        return [
            ['church_name', 'Контакты', 'Название церкви', SettingType::Text, 'Поклонная гора', null],
            ['church_city', 'Контакты', 'Город', SettingType::Text, 'Санкт-Петербург', null],
            ['church_address', 'Контакты', 'Адрес', SettingType::Text, 'Большая Озёрная, 27', null],
            ['church_metro', 'Контакты', 'Метро', SettingType::Text, 'Озерки · 7 минут пешком', null],
            ['church_phone', 'Контакты', 'Телефон', SettingType::Text, '+7 911 123-43-43', null],

            ['social_telegram', 'Соцсети', 'Telegram', SettingType::Url, null, 'Пустая ссылка скрывает значок на сайте'],
            ['social_youtube', 'Соцсети', 'YouTube', SettingType::Url, null, 'Пустая ссылка скрывает значок на сайте'],
            ['social_instagram', 'Соцсети', 'Instagram', SettingType::Url, null, 'Пустая ссылка скрывает значок на сайте'],

            ['stream_links', 'Трансляция', 'Ссылки на трансляцию', SettingType::UrlList, null, 'По одной ссылке на строке — YouTube, VK Видео, Rutube, Telegram и другие площадки. Пока есть хоть одна ссылка, на сайте видна плашка «В эфире» с кнопкой на каждую площадку. Очистите поле, когда трансляция закончится. Ссылки может задавать и Telegram-бот.'],
            ['stream_text', 'Трансляция', 'Текст плашки «В эфире»', SettingType::Text, 'Идёт воскресное богослужение — присоединяйся онлайн', null],

            ['duty_hours', 'Дежурство', 'Часы дежурства служителей', SettingType::Text, '10:00–18:00', null],

            ['donation_amounts', 'Пожертвования', 'Предлагаемые суммы, ₽', SettingType::Text, '500, 1000, 3000', 'Числа через запятую'],
        ];
    }
}
