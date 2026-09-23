<?php
/**
 * World Weather Detect (WWD) - Weather API Proxy & Cache
 * Caches Open-Meteo responses to local files with a 15-minute TTL.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$cacheDir = __DIR__ . '/../cache';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0777, true);
}

$action = isset($_GET['action']) ? $_GET['action'] : 'weather';

function fetchWithCache($cacheKey, $remoteUrl, $ttl = 900) {
    global $cacheDir;
    $cacheFile = $cacheDir . '/' . md5($cacheKey) . '.json';

    if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $ttl)) {
        $cachedData = file_get_contents($cacheFile);
        if ($cachedData) {
            echo $cachedData;
            exit;
        }
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $remoteUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'WorldWeatherDetect-App/1.0');
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($httpCode === 200 && $response) {
        file_put_contents($cacheFile, $response);
        echo $response;
    } else {
        http_response_code($httpCode ?: 500);
        echo json_encode([
            'error' => true,
            'message' => 'Failed to fetch weather data: ' . ($error ?: 'Remote server returned ' . $httpCode),
            'url' => $remoteUrl
        ]);
    }
    exit;
}

if ($action === 'search') {
    $query = isset($_GET['q']) ? trim($_GET['q']) : '';
    if (strlen($query) < 2) {
        echo json_encode(['results' => []]);
        exit;
    }
    $url = 'https://geocoding-api.open-meteo.com/v1/search?name=' . urlencode($query) . '&count=8&language=en&format=json';
    fetchWithCache('search_' . strtolower($query), $url, 3600); // 1 hour TTL for geocoding

} elseif ($action === 'weather') {
    $lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
    $lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;

    if ($lat === null || $lon === null) {
        http_response_code(400);
        echo json_encode(['error' => true, 'message' => 'Missing latitude or longitude']);
        exit;
    }

    $url = 'https://api.open-meteo.com/v1/forecast?' . http_build_query([
        'latitude' => $lat,
        'longitude' => $lon,
        'current' => 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
        'hourly' => 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,pressure_msl,wind_speed_10m',
        'daily' => 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max',
        'timezone' => 'auto'
    ]);

    fetchWithCache('weather_' . round($lat, 3) . '_' . round($lon, 3), $url, 900); // 15 min TTL

} elseif ($action === 'air_quality') {
    $lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
    $lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;

    if ($lat === null || $lon === null) {
        http_response_code(400);
        echo json_encode(['error' => true, 'message' => 'Missing latitude or longitude']);
        exit;
    }

    $url = 'https://air-quality-api.open-meteo.com/v1/air-quality?' . http_build_query([
        'latitude' => $lat,
        'longitude' => $lon,
        'current' => 'european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide',
        'timezone' => 'auto'
    ]);

    fetchWithCache('aqi_' . round($lat, 3) . '_' . round($lon, 3), $url, 1800); // 30 min TTL

} else {
    http_response_code(400);
    echo json_encode(['error' => true, 'message' => 'Invalid action parameter']);
}
