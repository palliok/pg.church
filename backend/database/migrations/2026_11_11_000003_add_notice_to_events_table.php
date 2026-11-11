<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Красная плашка события: «Нужна регистрация», «Запись закрыта», «Осталось 20 мест».
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('notice', 40)->nullable()->after('tag');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('notice');
        });
    }
};
