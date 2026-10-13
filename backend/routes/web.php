<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/', config('backpack.base.route_prefix', 'admin'));
