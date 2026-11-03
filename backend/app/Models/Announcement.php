<?php

namespace App\Models;

use App\Enums\AnnouncementWhen;
use App\Support\RuDate;
use Backpack\CRUD\app\Models\Traits\CrudTrait;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'title', 'body', 'important', 'when_type', 'event_date', 'event_date_end', 'deadline', 'weekday', 'weekly_time',
    'when_note', 'event_id', 'place', 'links', 'links_text', 'primary_link', 'contact_name', 'contact_phone',
    'published_at', 'visible_until', 'is_published',
])]
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
            'important' => 'boolean',
            'when_type' => AnnouncementWhen::class,
            'event_date' => 'date',
            'event_date_end' => 'date',
            'deadline' => 'date',
            'weekday' => 'integer',
            'links' => 'array',
            'primary_link' => 'boolean',
            'published_at' => 'datetime',
            'visible_until' => 'date',
            'is_published' => 'boolean',
        ];
    }

    /**
     * Поля дат другого типа «когда» обнуляются, чтобы после смены типа в базе не оставались старые даты.
     */
    protected static function booted(): void
    {
        static::saving(function (Announcement $announcement) {
            $type = $announcement->when_type ?? AnnouncementWhen::None;
            $announcement->published_at ??= now();

            if ($type !== AnnouncementWhen::Date) {
                $announcement->event_date = null;
                $announcement->event_date_end = null;
            }

            if ($type !== AnnouncementWhen::Until) {
                $announcement->deadline = null;
            }

            if ($type !== AnnouncementWhen::Weekly) {
                $announcement->weekday = null;
                $announcement->weekly_time = null;
            }

            if ($announcement->event_date_end && $announcement->event_date && $announcement->event_date_end->lte($announcement->event_date)) {
                $announcement->event_date_end = null;
            }
        });
    }

    /**
     * Событие из расписания, к которому относится объявление.
     *
     * @return BelongsTo<Event, $this>
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Опубликованные объявления, срок показа которых не истёк (последний день включительно).
     * Без «Показывать до» объявление снимается само после своей даты: последнего дня события,
     * срока «до» или дня связанного события. Регулярные и без даты висят, пока их не снимут.
     *
     * @param  Builder<Announcement>  $query
     */
    public function scopeVisible(Builder $query): void
    {
        $today = today();

        $query->where('is_published', true)
            ->where('published_at', '<=', now())
            ->where(fn (Builder $query) => $query
                ->whereDate('visible_until', '>=', $today)
                ->orWhere(fn (Builder $query) => $query
                    ->whereNull('visible_until')
                    ->where(fn (Builder $query) => $query
                        ->where(fn (Builder $query) => $query->where('when_type', AnnouncementWhen::Date)
                            ->whereRaw('coalesce(event_date_end, event_date) >= ?', [$today->toDateString()]))
                        ->orWhere(fn (Builder $query) => $query->where('when_type', AnnouncementWhen::Until)
                            ->whereDate('deadline', '>=', $today))
                        ->orWhere('when_type', AnnouncementWhen::Weekly)
                        ->orWhere(fn (Builder $query) => $query->where('when_type', AnnouncementWhen::None)
                            ->where(fn (Builder $query) => $query->whereNull('event_id')
                                ->orWhereHas('event', fn (Builder $query) => $query->whereRaw('coalesce(ends_at, starts_at) >= ?', [$today])))))));
    }

    /**
     * Связанное событие для сайта: опубликованное и ещё не закончившееся. Прошедшее занятие
     * у регулярного объявления не показывается — плитка снова становится «каждую неделю».
     */
    public function upcomingEvent(): ?Event
    {
        $event = $this->event;

        return $event?->is_published && $event->endsAtOrDefault()->gte(today()) ? $event : null;
    }

    /**
     * Ссылки в админке — по одной на строку: «Текст | https://…». В базе — [{text, url}].
     */
    protected function linksText(): Attribute
    {
        return Attribute::make(
            get: fn () => collect($this->links ?? [])->map(fn (array $link) => $link['text'].' | '.$link['url'])->implode("\n"),
            set: fn (?string $value) => ['links' => json_encode(self::parseLinks($value ?? ''), JSON_UNESCAPED_UNICODE)],
        );
    }

    /**
     * Разбирает строки «Текст | ссылка» (пустые пропускает). Ссылка — после последней «|».
     *
     * @return list<array{text: string, url: string}>
     */
    public static function parseLinks(string $value): array
    {
        $links = [];

        foreach (preg_split('/\R/u', $value) as $line) {
            $separator = mb_strrpos($line, '|');

            if (trim($line) === '' || $separator === false) {
                continue;
            }

            $links[] = ['text' => trim(mb_substr($line, 0, $separator)), 'url' => trim(mb_substr($line, $separator + 1))];
        }

        return $links;
    }

    /**
     * «tel:+79210001234» для кнопки «Позвонить»: только цифры, российская 8 в начале — как +7.
     */
    public function contactTel(): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $this->contact_phone);

        if ($digits === '') {
            return null;
        }

        return 'tel:+'.preg_replace('/^8(\d{10})$/', '7$1', $digits);
    }

    /**
     * Срок «Когда» одной строкой для списка в админке: «15.11–21.11», «до 04.11», «каждую пт, 19:00».
     */
    protected function whenSummary(): Attribute
    {
        return Attribute::get(fn () => match ($this->when_type ?? AnnouncementWhen::None) {
            AnnouncementWhen::Date => $this->event_date?->format('d.m').($this->event_date_end ? '–'.$this->event_date_end->format('d.m') : ''),
            AnnouncementWhen::Until => 'до '.$this->deadline?->format('d.m'),
            AnnouncementWhen::Weekly => 'каждую неделю, '.mb_strtolower(RuDate::WEEKDAYS_SHORT[$this->weekday] ?? '').' '.$this->weekly_time,
            AnnouncementWhen::None => $this->event_id ? 'по событию' : '—',
        });
    }
}
