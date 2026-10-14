{{-- Кнопка «Синхронизировать» в строке календаря (CalendarSourceCrudController) --}}
<form method="POST" action="{{ url($crud->route.'/'.$entry->getKey().'/sync') }}" class="d-inline">
    @csrf
    <button type="submit" class="btn btn-sm btn-link">
        <i class="la la-sync"></i> <span>Синхронизировать</span>
    </button>
</form>
