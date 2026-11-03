<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Варианты текста песни (214а, 214б): у одной песни может быть несколько
     * текстов с подписью («3 хор», «PG music»), один из них — основной.
     * Текст, тональность и аккорды переезжают из songs в первый вариант.
     */
    public function up(): void
    {
        Schema::create('song_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('song_id')->constrained()->cascadeOnDelete();
            $table->string('letter', 4);
            $table->string('label')->nullable();
            $table->boolean('is_default')->default(false);
            $table->string('key', 16)->nullable();
            $table->text('chordpro')->nullable();
            $table->text('lyrics')->nullable();
            $table->timestamps();

            $table->unique(['song_id', 'letter']);
        });

        // Основной вариант у песни один.
        DB::statement('create unique index song_variants_default_unique on song_variants (song_id) where is_default');

        DB::statement("
            insert into song_variants (song_id, letter, is_default, key, chordpro, lyrics, created_at, updated_at)
            select id, 'а', true, key, chordpro, lyrics, now(), now() from songs
        ");

        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn(['key', 'chordpro', 'lyrics']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->string('key', 16)->nullable();
            $table->text('chordpro')->nullable();
            $table->text('lyrics')->nullable();
        });

        DB::statement('
            update songs set key = v.key, chordpro = v.chordpro, lyrics = v.lyrics
            from (
                select distinct on (song_id) song_id, key, chordpro, lyrics
                from song_variants order by song_id, is_default desc, letter
            ) v
            where v.song_id = songs.id
        ');

        Schema::dropIfExists('song_variants');
    }
};
