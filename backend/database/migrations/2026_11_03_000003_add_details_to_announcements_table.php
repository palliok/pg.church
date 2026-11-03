<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Объявления по макету: «важно», когда (день, срок «до», каждую неделю), связанное событие,
     * место, ссылки и контакт. Порядок — по дате публикации, поэтому sort больше не нужен.
     */
    public function up(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->boolean('important')->default(false)->after('body');
            $table->string('when_type', 10)->default('none')->after('important');
            $table->date('event_date')->nullable()->after('when_type');
            $table->date('event_date_end')->nullable()->after('event_date');
            $table->date('deadline')->nullable()->after('event_date_end');
            $table->unsignedTinyInteger('weekday')->nullable()->after('deadline');
            $table->string('weekly_time', 5)->nullable()->after('weekday');
            $table->string('when_note', 60)->nullable()->after('weekly_time');
            $table->foreignId('event_id')->nullable()->after('when_note')->constrained()->nullOnDelete();
            $table->string('place', 120)->nullable()->after('event_id');
            $table->json('links')->nullable()->after('place');
            $table->boolean('primary_link')->default(false)->after('links');
            $table->string('contact_name', 60)->nullable()->after('primary_link');
            $table->string('contact_phone', 30)->nullable()->after('contact_name');
            $table->timestamp('published_at')->nullable()->after('contact_phone');
        });

        // Дата публикации — дата создания, но так, чтобы сохранился прежний порядок (sort, затем новые выше):
        // каждое следующее объявление публикуется хотя бы на секунду раньше предыдущего.
        $previous = null;

        foreach (DB::table('announcements')->orderBy('sort')->orderByDesc('id')->get(['id', 'created_at']) as $row) {
            $publishedAt = Carbon::parse($row->created_at ?? now());

            if ($previous && $publishedAt->gte($previous)) {
                $publishedAt = $previous->copy()->subSecond();
            }

            DB::table('announcements')->where('id', $row->id)->update(['published_at' => $publishedAt]);
            $previous = $publishedAt;
        }

        Schema::table('announcements', function (Blueprint $table) {
            $table->timestamp('published_at')->nullable(false)->change();
            $table->index(['is_published', 'published_at']);
            $table->dropColumn('sort');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->unsignedSmallInteger('sort')->default(0);
            $table->dropIndex(['is_published', 'published_at']);
            $table->dropConstrainedForeignId('event_id');
            $table->dropColumn([
                'important', 'when_type', 'event_date', 'event_date_end', 'deadline', 'weekday', 'weekly_time',
                'when_note', 'place', 'links', 'primary_link', 'contact_name', 'contact_phone', 'published_at',
            ]);
        });
    }
};
