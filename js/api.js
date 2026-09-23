/**
 * World Weather Detect (WWD) - Weather API Service
 * High-performance direct Open-Meteo client with local proxy fallback & LocalStorage caching
 */

const ApiService = (() => {
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 mins

  // WMO Weather Interpretation Code Dictionary
  const WMO_CODES = {
    0: { label: 'Clear Sky', icon: 'clear-day', theme: 'theme-clear-day' },
    1: { label: 'Mainly Clear', icon: 'mostly-clear-day', theme: 'theme-clear-day' },
    2: { label: 'Partly Cloudy', icon: 'partly-cloudy-day', theme: 'theme-cloudy' },
    3: { label: 'Overcast', icon: 'cloudy', theme: 'theme-cloudy' },
    45: { label: 'Foggy', icon: 'fog', theme: 'theme-cloudy' },
    48: { label: 'Depositing Rime Fog', icon: 'fog', theme: 'theme-cloudy' },
    51: { label: 'Light Drizzle', icon: 'drizzle', theme: 'theme-rain' },
    53: { label: 'Moderate Drizzle', icon: 'drizzle', theme: 'theme-rain' },
    55: { label: 'Dense Drizzle', icon: 'drizzle', theme: 'theme-rain' },
    61: { label: 'Slight Rain', icon: 'rain', theme: 'theme-rain' },
    63: { label: 'Moderate Rain', icon: 'rain', theme: 'theme-rain' },
    65: { label: 'Heavy Rain', icon: 'rain-heavy', theme: 'theme-rain' },
    66: { label: 'Light Freezing Rain', icon: 'sleet', theme: 'theme-snow' },
    67: { label: 'Heavy Freezing Rain', icon: 'sleet', theme: 'theme-snow' },
    71: { label: 'Slight Snow Fall', icon: 'snow', theme: 'theme-snow' },
    73: { label: 'Moderate Snow Fall', icon: 'snow', theme: 'theme-snow' },
    75: { label: 'Heavy Snow Fall', icon: 'snow-heavy', theme: 'theme-snow' },
    77: { label: 'Snow Grains', icon: 'snow', theme: 'theme-snow' },
    80: { label: 'Slight Rain Showers', icon: 'showers', theme: 'theme-rain' },
    81: { label: 'Moderate Rain Showers', icon: 'showers', theme: 'theme-rain' },
    82: { label: 'Violent Rain Showers', icon: 'showers-heavy', theme: 'theme-rain' },
    85: { label: 'Slight Snow Showers', icon: 'snow', theme: 'theme-snow' },
    86: { label: 'Heavy Snow Showers', icon: 'snow-heavy', theme: 'theme-snow' },
    95: { label: 'Thunderstorm', icon: 'thunderstorm', theme: 'theme-thunderstorm' },
    96: { label: 'Thunderstorm with Hail', icon: 'thunderstorm', theme: 'theme-thunderstorm' },
    99: { label: 'Severe Thunderstorm with Hail', icon: 'thunderstorm', theme: 'theme-thunderstorm' }
  };

  function getCache(key) {
    try {
      const item = localStorage.getItem('wwd_' + key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return parsed.data;
      }
      localStorage.removeItem('wwd_' + key);
    } catch (e) {
      console.warn('LocalStorage access issue:', e);
    }
    return null;
  }

  function setCache(key, data) {
    try {
      localStorage.setItem('wwd_' + key, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
    } catch (e) {
      console.warn('LocalStorage write failed:', e);
    }
  }

  async function request(directUrl, proxyUrl, cacheKey) {
    if (cacheKey) {
      const cached = getCache(cacheKey);
      if (cached) return cached;
    }

    let result = null;

    // 1. Primary: Direct Open-Meteo API (works globally on GitHub Pages, mobile, desktop with CORS)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(directUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        result = await res.json();
      }
    } catch (err) {
      console.warn('Direct Open-Meteo call error, attempting proxy fallback:', err);
    }

    // 2. Secondary fallback: Local PHP/Node backend proxy (only if not on a static host like GitHub Pages)
    const isStaticHost = window.location.hostname.includes('github.io') || window.location.hostname.includes('netlify');
    if (!result && proxyUrl && !isStaticHost) {
      try {
        const res = await fetch(proxyUrl, { cache: 'no-cache' });
        if (res.ok) {
          result = await res.json();
        }
      } catch (proxyErr) {
        console.warn('Proxy fallback also unavailable:', proxyErr);
      }
    }

    if (result && cacheKey) {
      setCache(cacheKey, result);
    }

    return result;
  }

  return {
    getConditionInfo(code, isDay = 1) {
      const info = WMO_CODES[code] || { label: 'Partly Cloudy', icon: 'partly-cloudy-day', theme: 'theme-cloudy' };
      if (!isDay) {
        if (code === 0) return { label: 'Clear Sky', icon: 'clear-night', theme: 'theme-clear-night' };
        if (code === 1 || code === 2) return { label: 'Partly Cloudy', icon: 'partly-cloudy-night', theme: 'theme-clear-night' };
      }
      return info;
    },

    async searchCities(query) {
      if (!query || typeof query !== 'string' || query.trim().length < 1) return [];
      const clean = query.trim();
      const directUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=10&language=en&format=json`;
      const proxyUrl = `api/weather.php?action=search&q=${encodeURIComponent(clean.toLowerCase())}`;
      
      const res = await request(directUrl, proxyUrl, 'geo_' + clean.toLowerCase());
      if (res && Array.isArray(res.results)) {
        return res.results;
      }
      return [];
    },

    async getWeatherData(lat, lon) {
      const roundedLat = parseFloat(lat).toFixed(3);
      const roundedLon = parseFloat(lon).toFixed(3);

      const params = new URLSearchParams({
        latitude: roundedLat,
        longitude: roundedLon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
        hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,pressure_msl,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max',
        timezone: 'auto'
      });

      const directUrl = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
      const proxyUrl = `api/weather.php?action=weather&lat=${roundedLat}&lon=${roundedLon}`;

      const res = await request(directUrl, proxyUrl, `weather_${roundedLat}_${roundedLon}`);
      if (!res) throw new Error('Failed to retrieve weather data from Open-Meteo service');
      return res;
    },

    async getAirQualityData(lat, lon) {
      const roundedLat = parseFloat(lat).toFixed(3);
      const roundedLon = parseFloat(lon).toFixed(3);

      const params = new URLSearchParams({
        latitude: roundedLat,
        longitude: roundedLon,
        current: 'european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide',
        timezone: 'auto'
      });

      const directUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`;
      const proxyUrl = `api/weather.php?action=air_quality&lat=${roundedLat}&lon=${roundedLon}`;

      return await request(directUrl, proxyUrl, `aqi_${roundedLat}_${roundedLon}`);
    }
  };
})();
