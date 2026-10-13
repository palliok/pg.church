<?php

namespace App\Support;

use BaconQrCode\Common\ErrorCorrectionLevel;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class QrCode
{
    /**
     * QR-код в виде SVG-картинки.
     *
     * Текст кладётся в код как байты UTF-8 без служебного ECI-заголовка: именно
     * так устроены платёжные QR-коды банков, где кодировку задаёт сам текст
     * (префикс ST00012). Библиотека добавляет ECI для любой кодировки, кроме
     * ISO-8859-1, поэтому байты UTF-8 передаются ей под видом ISO-8859-1.
     */
    public static function svg(string $text, int $size = 1068): string
    {
        $renderer = new ImageRenderer(new RendererStyle($size, 2), new SvgImageBackEnd);
        $bytes = mb_convert_encoding($text, 'UTF-8', 'ISO-8859-1');

        return (new Writer($renderer))->writeString($bytes, 'ISO-8859-1', ErrorCorrectionLevel::M());
    }
}
