#!/bin/bash
set -e

WEBROOT="/var/www/html"
STAGING="/opt/wp-website"

# Copy website files into the volume if it's empty (first run)
if [ ! -f "$WEBROOT/index.php" ]; then
    echo "[web] Populating webroot from build..."
    cp -a "$STAGING/." "$WEBROOT/"
    chown -R www-data:www-data "$WEBROOT"
fi

# Write config from environment variables
echo "[web] Writing config.php..."
cat > "$WEBROOT/class/config.php" <<PHPCFG
<?php
define('SKIN_LANGUAGE', '${WP_SKIN_LANGUAGE:-skins_en}');

define('DB_HOST', '${WP_DB_HOST:-mysql}');
define('DB_PORT', '${WP_DB_PORT:-3306}');
define('DB_NAME', '${WP_DB_NAME:-weaponpaints}');
define('DB_USER', '${WP_DB_USER:-weaponpaints}');
define('DB_PASS', '${WP_DB_PASS:-weaponpaints}');

define('WEB_STYLE_DARK', true);

define('STEAM_API_KEY', '${STEAM_API_KEY}');
define('STEAM_DOMAIN_NAME', '${WP_SITE_URL:-http://localhost:8080}');
define('STEAM_LOGOUT_PAGE', '${WP_SITE_URL:-http://localhost:8080}');
define('STEAM_LOGIN_PAGE', '${WP_SITE_URL:-http://localhost:8080}');
?>
PHPCFG

echo "[web] Config written."
exec docker-php-entrypoint "$@"
