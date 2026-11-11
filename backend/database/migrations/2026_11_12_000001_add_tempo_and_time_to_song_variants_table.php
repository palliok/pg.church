<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Темп (ударов в минуту) и размер («6/8») варианта — как директивы ChordPro {tempo} и {time}.
     * У варианта, а не у песни: разные аранжировки играют в разном темпе.
     */
    public function up(): void
    {
        Schema::table('song_variants', function (Blueprint $table) {
            $table->unsignedSmallInteger('tempo')->nullable()->after('capo');
            $table->string('time', 8)->nullable()->after('tempo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('song_variants', function (Blueprint $table) {
            $table->dropColumn(['tempo', 'time']);
        });
    }
};
