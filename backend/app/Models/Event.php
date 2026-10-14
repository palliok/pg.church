<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

#[Fillable([
    'title', 'tag', 'starts_at', 'ends_at', 'all_day', 'place', 'address', 'description',
    'is_main', 'has_stream', 'stream_url', 'is_published', 'calendar_source_id', 'external_uid',
])]
class Event extends Model
{
    use CrudTrait;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'all_day' => 'boolean',
            'is_main' => 'boolean',
            'has_stream' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    /**
     * @return HasOne<Sermon, $this>
     */
    public function sermon(): HasOne
    {
        return $this->hasOne(Sermon::class);
    }

    /**
     * @return BelongsToMany<Song, $this>
     */
    public function songs(): BelongsToMany
    {
        return $this->belongsToMany(Song::class);
    }

    /**
     * Календарь, из которого событие загружено (null — заведено в админке).
     *
     * @return BelongsTo<CalendarSource, $this>
     */
    public function calendarSource(): BelongsTo
    {
        return $this->belongsTo(CalendarSource::class);
    }

    /**
     * Окончание для календарей: если оно не указано, событие длится
     * church.event_duration минут. У событий на весь день — последний день.
     */
    public function endsAtOrDefault(): Carbon
    {
        if ($this->all_day) {
            return ($this->ends_at ?? $this->starts_at)->copy()->startOfDay();
        }

        return $this->ends_at?->copy() ?? $this->starts_at->copy()->addMinutes(config('church.event_duration'));
    }

    /**
     * @param  Builder<Event>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true);
    }

    /**
     * «29.06.2025 11:00 · Богослужение» — подпись в выпадающих списках админки.
     */
    protected function displayName(): Attribute
    {
        return Attribute::get(fn () => $this->starts_at?->format('d.m.Y H:i').' · '.$this->title);
    }
}
