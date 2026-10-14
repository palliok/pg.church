<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Внешний календарь (Google, Outlook, iCloud, Яндекс), события которого
 * загружаются на сайт по ссылке в формате iCalendar.
 */
#[Fillable(['name', 'url', 'is_active', 'publish_events'])]
#[Hidden(['url'])]
class CalendarSource extends Model
{
    use CrudTrait;

    /** Значения по умолчанию — те же, что в базе: календарь включён, события сразу публикуются. */
    protected $attributes = [
        'is_active' => true,
        'publish_events' => true,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'url' => 'encrypted',
            'is_active' => 'boolean',
            'publish_events' => 'boolean',
            'last_synced_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<Event, $this>
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /**
     * @param  Builder<CalendarSource>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * Адрес сервера календаря без секретной части ссылки — для списка в админке.
     */
    protected function host(): Attribute
    {
        return Attribute::get(fn () => parse_url((string) $this->url, PHP_URL_HOST) ?: null);
    }
}
