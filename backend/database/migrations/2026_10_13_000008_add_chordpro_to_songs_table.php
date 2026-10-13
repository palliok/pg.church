<?php

use App\Support\ChordPro;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Текст песни теперь хранится в формате ChordPro (с аккордами) в колонке
     * chordpro, а lyrics — производная от него: только слова, для поиска.
     */
    public function up(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->renameColumn('lyrics', 'chordpro');
        });

        Schema::table('songs', function (Blueprint $table) {
            $table->text('lyrics')->nullable();
        });

        DB::table('songs')->whereNotNull('chordpro')->orderBy('id')->each(function (object $song) {
            DB::table('songs')->where('id', $song->id)->update([
                'lyrics' => ChordPro::plainText($song->chordpro) ?: null,
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('songs', function (Blueprint $table) {
            $table->dropColumn('lyrics');
        });

        Schema::table('songs', function (Blueprint $table) {
            $table->renameColumn('chordpro', 'lyrics');
        });
    }
};
