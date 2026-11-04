<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Основное действие объявления выбирается явно: первая ссылка, звонок контакту или ничего.
     * Раньше была только «первая ссылка — главная», а без неё главным само становился звонок.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('main_action', 10)->default('none')->after('links');
        });

        DB::table('announcements')->where('primary_link', true)->whereNotNull('links')->update(['main_action' => 'link']);
        DB::table('announcements')->where('main_action', 'none')->whereNotNull('contact_phone')->update(['main_action' => 'contact']);

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn('primary_link');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->boolean('primary_link')->default(false)->after('links');
        });

        DB::table('announcements')->where('main_action', 'link')->update(['primary_link' => true]);

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn('main_action');
        });
    }
};
