<?php

declare(strict_types=1);

namespace App\Steam;

/** Steam could not be asked, and there is no earlier answer to fall back on. */
final class SteamUnavailable extends \RuntimeException
{
}
