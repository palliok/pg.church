<?php

use App\Support\Phone;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Телефоны контактов объявлений и телефон церкви — в едином виде «+7 (911) 123-45-67».
     * Новые номера так сохраняют модели, здесь приводятся уже введённые.
     */
    public function up(): void
    {
        DB::table('announcements')->whereNotNull('contact_phone')->get(['id', 'contact_phone'])
            ->each(fn (object $row) => DB::table('announcements')->where('id', $row->id)
                ->update(['contact_phone' => Phone::format($row->contact_phone)]));

        $setting = DB::table('settings')->where('key', 'church_phone')->first(['id', 'value']);

        if ($setting) {
            DB::table('settings')->where('id', $setting->id)
                ->update(['type' => 'phone', 'value' => Phone::format($setting->value)]);
        }
    }

    /**
     * Номера уже в едином виде, прежнее написание не восстановить; тип настройки возвращается к тексту.
     */
    public function down(): void
    {
        DB::table('settings')->where('key', 'church_phone')->update(['type' => 'text']);
    }
};
