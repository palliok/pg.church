<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Гимны служения — конкретные варианты текста, а не песни: на служении поют
     * по определённому тексту. Уже выбранные песни получают свой основной вариант.
     */
    public function up(): void
    {
        Schema::create('event_song_variant', function (Blueprint $table) {
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('song_variant_id')->constrained()->cascadeOnDelete();
            $table->primary(['event_id', 'song_variant_id']);
        });

        DB::statement('
            insert into event_song_variant (event_id, song_variant_id)
            select es.event_id, v.id
            from event_song es
            join (
                select distinct on (song_id) id, song_id
                from song_variants order by song_id, is_default desc, letter
            ) v on v.song_id = es.song_id
        ');

        Schema::dropIfExists('event_song');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('event_song', function (Blueprint $table) {
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('song_id')->constrained()->cascadeOnDelete();
            $table->primary(['event_id', 'song_id']);
        });

        DB::statement('
            insert into event_song (event_id, song_id)
            select distinct ev.event_id, v.song_id
            from event_song_variant ev join song_variants v on v.id = ev.song_variant_id
        ');

        Schema::dropIfExists('event_song_variant');
    }
};
