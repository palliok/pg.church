<?php

use Database\Seeders\SettingSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Плашка «В эфире» видна, пока заданы ссылки на трансляцию (их ставит
     * Telegram-бот или администратор), — по одной на площадку. Переключатель
     * stream_live и одиночная ссылка stream_url заменяются списком stream_links.
     */
    public function up(): void
    {
        // На новой базе настроек ещё нет — их создаст db:seed. Обновляем только уже работающий сайт.
        if (! DB::table('settings')->exists()) {
            return;
        }

        $switch = DB::table('settings')->where('key', 'stream_live')->value('value');
        $url = DB::table('settings')->where('key', 'stream_url')->value('value');

        // Набор настроек и подписи задаёт сидер; сохранённые значения он не трогает.
        (new SettingSeeder)->run();

        // Прежняя ссылка переезжает в список, если плашка с ней была включена
        // (или переключателя уже не было). Ссылка при выключенной плашке
        // теперь бы её включила — такую не переносим.
        if (filled($url) && ($switch === null || filter_var($switch, FILTER_VALIDATE_BOOLEAN))) {
            DB::table('settings')->where('key', 'stream_links')->whereNull('value')->update(['value' => $url]);
        }

        DB::table('settings')->whereIn('key', ['stream_live', 'stream_url'])->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
