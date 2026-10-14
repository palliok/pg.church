{{-- Фильтры над таблицей списка (App\Http\Controllers\Admin\Concerns\HasListFilters) --}}
@php
    $active = collect($widget['filters'])->keys()->filter(fn ($name) => filled(request()->query($name)));
@endphp

<form method="GET" class="d-flex flex-wrap align-items-end gap-2 mb-3" data-list-filters>
    @foreach ($widget['filters'] as $name => $filter)
        <label class="d-flex flex-column gap-1 small text-secondary mb-0">
            {{ $filter['label'] }}
            <select name="{{ $name }}" class="form-select form-select-sm" style="min-width: 11rem">
                <option value="">Все</option>
                @foreach ($filter['options'] as $value => $text)
                    <option value="{{ $value }}" @selected(request()->query($name) === (string) $value)>{{ $text }}</option>
                @endforeach
            </select>
        </label>
    @endforeach

    @if ($active->isNotEmpty())
        <a href="{{ url()->current() }}" class="btn btn-sm btn-link">Сбросить фильтры</a>
    @endif
</form>

<script>
    // Фильтр применяется сразу при выборе; пустые значения в адрес не попадают.
    document.querySelectorAll('form[data-list-filters] select').forEach(function (select) {
        select.addEventListener('change', function () {
            var params = new URLSearchParams(window.location.search);
            params.delete('persistent-table');

            select.form.querySelectorAll('select').forEach(function (field) {
                field.value ? params.set(field.name, field.value) : params.delete(field.name);
            });

            window.location.search = params.toString();
        });
    });
</script>
