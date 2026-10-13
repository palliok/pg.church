{{-- This file is used for menu items by any Backpack v7 theme --}}
<li class="nav-item"><a class="nav-link" href="{{ backpack_url('dashboard') }}"><i class="la la-home nav-icon"></i> {{ trans('backpack::base.dashboard') }}</a></li>

<x-backpack::menu-dropdown title="Расписание" icon="la la-calendar">
    <x-backpack::menu-dropdown-item title="События" icon="la la-calendar-day" :link="backpack_url('event')" />
    <x-backpack::menu-dropdown-item title="Проповеди" icon="la la-bible" :link="backpack_url('sermon')" />
</x-backpack::menu-dropdown>

<x-backpack::menu-dropdown title="Сборник песен" icon="la la-music">
    <x-backpack::menu-dropdown-item title="Песни" icon="la la-file-audio" :link="backpack_url('song')" />
    <x-backpack::menu-dropdown-item title="Разделы" icon="la la-folder" :link="backpack_url('song-category')" />
</x-backpack::menu-dropdown>

<x-backpack::menu-dropdown title="Медиа" icon="la la-newspaper">
    <x-backpack::menu-dropdown-item title="Новости и блог" icon="la la-pen" :link="backpack_url('post')" />
    <x-backpack::menu-dropdown-item title="Теги" icon="la la-tags" :link="backpack_url('tag')" />
</x-backpack::menu-dropdown>

<x-backpack::menu-dropdown title="Истории" icon="la la-book-open">
    <x-backpack::menu-dropdown-item title="Истории" icon="la la-book" :link="backpack_url('story')" />
    <x-backpack::menu-dropdown-item title="Кадры" icon="la la-images" :link="backpack_url('story-panel')" />
</x-backpack::menu-dropdown>

<x-backpack::menu-dropdown title="Служители" icon="la la-user-friends">
    <x-backpack::menu-dropdown-item title="Служители" icon="la la-user-tie" :link="backpack_url('minister')" />
    <x-backpack::menu-dropdown-item title="Дежурства" icon="la la-clock" :link="backpack_url('duty-shift')" />
</x-backpack::menu-dropdown>

<x-backpack::menu-dropdown title="Пожертвования" icon="la la-hand-holding-heart">
    <x-backpack::menu-dropdown-item title="Реквизиты и QR-коды" icon="la la-university" :link="backpack_url('donation-account')" />
    <x-backpack::menu-dropdown-item title="Цели пожертвований" icon="la la-bullseye" :link="backpack_url('donation-target')" />
</x-backpack::menu-dropdown>

<x-backpack::menu-item title="Настройки сайта" icon="la la-cog" :link="backpack_url('setting')" />
<x-backpack::menu-item title="Администраторы" icon="la la-user-shield" :link="backpack_url('user')" />
