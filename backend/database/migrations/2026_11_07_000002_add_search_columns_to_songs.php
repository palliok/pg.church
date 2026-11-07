<?php

use App\Support\Text;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Поиск по сборнику: название и слова песни без знаков препинания и с «ё» как «е»
     * (App\Support\Text::searchable), а расширение pg_trgm находит слова с опечатками.
     */
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        Schema::table('songs', function (Blueprint $table) {
            $table->string('search_title')->default('')->after('title');
        });

        Schema::table('song_variants', function (Blueprint $table) {
            $table->text('search_text')->nullable()->after('lyrics');
        });

        DB::table('songs')->orderBy('id')->each(fn (object $song) => DB::table('songs')
            ->where('id', $song->id)
            ->update(['search_title' => Text::searchable($song->title)]));

        DB::table('song_variants')->whereNotNull('lyrics')->orderBy('id')->each(fn (object $variant) => DB::table('song_variants')
            ->where('id', $variant->id)
            ->update(['search_text' => Text::searchable($variant->lyrics) ?: null]));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('song_variants', function (Blueprint $table) {
            $table->dropColumn('search_text');
        });

        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn('search_title');
        });
    }
};
