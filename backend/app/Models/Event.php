<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'title', 'tag', 'starts_at', 'place', 'address', 'description',
    'is_main', 'has_stream', 'stream_url', 'is_published',
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
