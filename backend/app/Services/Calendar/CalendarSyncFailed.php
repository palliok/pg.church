<?php

namespace App\Services\Calendar;

use RuntimeException;

/**
 * Календарь не удалось загрузить или прочитать. Сообщение показывается
 * администратору, поэтому оно на русском и без технических подробностей.
 */
class CalendarSyncFailed extends RuntimeException {}
