{{-- select_multiple_search: select_multiple (связь «многие ко многим») со строкой поиска и метками --}}
@php
    $field['wrapper'] = $field['wrapper'] ?? $field['wrapperAttributes'] ?? [];
    $field['wrapper']['data-init-function'] = 'bpFieldInitSearchableSelect';
@endphp

@include('crud::fields.select_multiple')
@include('crud::fields.inc.searchable_select_assets')
