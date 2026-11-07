<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * На странице пожертвований остались только реквизиты и QR-код:
     * цели пожертвований и предлагаемые суммы больше не нужны.
     */
    public function up(): void
    {
        Schema::dropIfExists('donation_targets');
        Setting::query()->where('key', 'donation_amounts')->delete();
    }

    /**
     * Таблица возвращается пустой, настройку вернёт SettingSeeder прошлой версии.
     */
    public function down(): void
    {
        Schema::create('donation_targets', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('description')->nullable();
            $table->string('color')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });
    }
};
