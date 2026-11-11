<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ссылки события — [{text, url}], например регистрация. Как в объявлениях.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->json('links')->nullable()->after('stream_url');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('links');
        });
    }
};
