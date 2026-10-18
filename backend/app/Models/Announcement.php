<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'body', 'visible_until', 'sort', 'is_published'])]
class Announcement extends Model
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
            'visible_until' => 'date',
            'is_published' => 'boolean',
        ];
    }

    /**
     * Опубликованные объявления, срок показа которых не истёк (последний день включительно).
     *
     * @param  Builder<Announcement>  $query
     */
    public function scopeVisible(Builder $query): void
    {
        $query->where('is_published', true)
            ->where(fn (Builder $query) => $query->whereNull('visible_until')->orWhereDate('visible_until', '>=', today()));
    }
}
