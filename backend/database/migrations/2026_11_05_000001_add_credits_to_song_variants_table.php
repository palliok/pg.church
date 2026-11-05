<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Каподастр и авторы варианта текста — как директивы ChordPro {capo}, {artist},
     * {composer}, {lyricist}. У варианта, а не у песни: у разных переводов разные
     * авторы слов, а лад каподастра зависит от тональности варианта.
     */
    public function up(): void
    {
        Schema::table('song_variants', function (Blueprint $table) {
            $table->unsignedTinyInteger('capo')->nullable()->after('key');
            $table->string('artist')->nullable()->after('capo');
            $table->string('composer')->nullable()->after('artist');
            $table->string('lyricist')->nullable()->after('composer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('song_variants', function (Blueprint $table) {
            $table->dropColumn(['capo', 'artist', 'composer', 'lyricist']);
        });
    }
};
