<?php

namespace App\Models;

use App\Support\Text;
use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'event_id', 'minister_id', 'topic', 'scripture_ref', 'intro',
    'verse', 'verse_ref', 'outline', 'audio_url', 'duration_minutes',
])]
class Sermon extends Model
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
            'duration_minutes' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * @return BelongsTo<Minister, $this>
     */
    public function minister(): BelongsTo
    {
        return $this->belongsTo(Minister::class);
    }

    /**
     * Пункты плана: по одному на строку.
     *
     * @return Attribute<list<string>, never>
     */
    protected function outlinePoints(): Attribute
    {
        return Attribute::get(fn () => Text::lines($this->outline));
    }
}
