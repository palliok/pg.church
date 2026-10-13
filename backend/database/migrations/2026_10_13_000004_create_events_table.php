<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('tag')->nullable();
            $table->dateTime('starts_at')->index();
            $table->string('place')->nullable();
            $table->string('address')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_main')->default(false);
            $table->boolean('has_stream')->default(false);
            $table->string('stream_url')->nullable();
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });

        Schema::create('event_song', function (Blueprint $table) {
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('song_id')->constrained()->cascadeOnDelete();
            $table->primary(['event_id', 'song_id']);
        });

        Schema::create('sermons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('minister_id')->nullable()->constrained()->nullOnDelete();
            $table->string('topic');
            $table->string('scripture_ref')->nullable();
            $table->text('intro')->nullable();
            $table->text('verse')->nullable();
            $table->string('verse_ref')->nullable();
            $table->text('outline')->nullable();
            $table->string('audio_url')->nullable();
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sermons');
        Schema::dropIfExists('event_song');
        Schema::dropIfExists('events');
    }
};
