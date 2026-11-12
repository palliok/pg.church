<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * У объявления со связанным событием дата, время и место берутся из события. Новые так сохраняет модель,
     * здесь у уже связанных очищаются свои «когда» и место; уточнение остаётся.
     */
    public function up(): void
    {
        DB::table('announcements')->whereNotNull('event_id')->update([
            'when_type' => 'none',
            'event_date' => null,
            'event_date_end' => null,
            'deadline' => null,
            'weekday' => null,
            'weekly_time' => null,
            'place' => null,
        ]);
    }

    /**
     * Очищенные поля не восстановить.
     */
    public function down(): void
    {
        //
    }
};
