<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['slug', 'kicker', 'title', 'lead', 'cover_scene', 'background', 'sort', 'is_published'])]
class Story extends Model
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
            'is_published' => 'boolean',
        ];
    }

    /**
     * @return HasMany<StoryPanel, $this>
     */
    public function panels(): HasMany
    {
        return $this->hasMany(StoryPanel::class)->orderBy('sort')->orderBy('id');
    }

    /**
     * @param  Builder<Story>  $query
     */
    public function scopePublished(Builder $query): void
    {
        $query->where('is_published', true);
    }
}
