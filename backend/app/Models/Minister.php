<?php

namespace App\Models;

use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'role'])]
class Minister extends Model
{
    use CrudTrait;

    /**
     * @return HasMany<DutyShift, $this>
     */
    public function dutyShifts(): HasMany
    {
        return $this->hasMany(DutyShift::class);
    }

    /**
     * @return HasMany<Sermon, $this>
     */
    public function sermons(): HasMany
    {
        return $this->hasMany(Sermon::class);
    }

    /**
     * «Алексей Синичкин» → «АС»
     */
    protected function initials(): Attribute
    {
        return Attribute::get(fn () => Str::of($this->name)
            ->explode(' ')
            ->filter()
            ->take(2)
            ->map(fn (string $word) => Str::upper(Str::substr($word, 0, 1)))
            ->implode(''));
    }
}
