<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Календари, из которых события загружаются на сайт, и поля событий,
     * нужные для обмена с календарями: окончание, «весь день», источник.
     */
    public function up(): void
    {
        Schema::create('calendar_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Ссылка хранится зашифрованной: у Google и iCloud она даёт доступ к календарю.
            $table->text('url');
            $table->boolean('is_active')->default(true);
            $table->boolean('publish_events')->default(true);
            $table->dateTime('last_synced_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dateTime('ends_at')->nullable()->after('starts_at');
            $table->boolean('all_day')->default(false)->after('ends_at');
            $table->foreignId('calendar_source_id')->nullable()->after('is_published')->constrained()->nullOnDelete();
            $table->string('external_uid')->nullable()->after('calendar_source_id');
            $table->unique(['calendar_source_id', 'external_uid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropUnique(['calendar_source_id', 'external_uid']);
            $table->dropConstrainedForeignId('calendar_source_id');
            $table->dropColumn(['ends_at', 'all_day', 'external_uid']);
        });

        Schema::dropIfExists('calendar_sources');
    }
};
