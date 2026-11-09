@if ($crud->hasAccess('create'))
    <form method="POST" action="{{ route('event.copy', $entry) }}" class="d-inline">
        @csrf
        <button type="submit" class="btn btn-sm btn-link">
            <i class="la la-copy"></i> <span>Копировать</span>
        </button>
    </form>
@endif
