/**
 * SkyPulse - Main Application Controller
 * Coordinates API data, UI updates, events, and persistent state
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    theme: localStorage.getItem('wwd_theme') || 'dark',
    unit: localStorage.getItem('skypulse_unit') || 'C',
    favorites: JSON.parse(localStorage.getItem('skypulse_favorites') || '[]'),
    currentLocation: {
      name: 'London',
      country: 'United Kingdom',
      country_code: 'GB',
      latitude: 51.5074,
      longitude: -0.1278,
      timezone: 'Europe/London'
    },
    weather: null,
    aqi: null,
    localClockTimer: null
  };

  // Weather SVG Icons Generator
  function getWeatherIconSvg(iconName) {
    const svgs = {
      'clear-day': `
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="14" fill="url(#sunGrad)"/>
          <g stroke="#f59e0b" stroke-width="3" stroke-linecap="round">
            <line x1="32" y1="6" x2="32" y2="12"/>
            <line x1="32" y1="52" x2="32" y2="58"/>
            <line x1="6" y1="32" x2="12" y2="32"/>
            <line x1="52" y1="32" x2="58" y2="32"/>
            <line x1="13.6" y1="13.6" x2="17.8" y2="17.8"/>
            <line x1="46.2" y1="46.2" x2="50.4" y2="50.4"/>
            <line x1="13.6" y1="50.4" x2="17.8" y2="46.2"/>
            <line x1="46.2" y1="17.8" x2="50.4" y2="13.6"/>
          </g>
          <defs>
            <linearGradient id="sunGrad" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stop-color="#fbbf24"/>
              <stop offset="1" stop-color="#f59e0b"/>
            </linearGradient>
          </defs>
        </svg>
      `,
      'clear-night': `
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M42 46C29.85 46 20 36.15 20 24C20 18.5 22.02 13.48 25.38 9.61C16.89 12.19 11 19.98 11 29.5C11 41.37 20.63 51 32.5 51C42.02 51 49.81 45.11 52.39 36.62C48.52 39.98 43.5 42 42 46Z" fill="url(#moonGrad)"/>
          <circle cx="48" cy="18" r="2" fill="#fff" opacity="0.8"/>
          <circle cx="54" cy="28" r="1.5" fill="#fff" opacity="0.6"/>
          <circle cx="42" cy="10" r="1" fill="#fff" opacity="0.7"/>
          <defs>
            <linearGradient id="moonGrad" x1="11" y1="9" x2="52" y2="51" gradientUnits="userSpaceOnUse">
              <stop stop-color="#e2e8f0"/>
              <stop offset="1" stop-color="#94a3b8"/>
            </linearGradient>
          </defs>
        </svg>
      `,
      'mostly-clear-day': `
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="26" cy="24" r="10" fill="#f59e0b"/>
          <path d="M22 48H44C47.87 48 51 44.87 51 41C51 37.38 48.24 34.41 44.71 34.05C44.25 28.98 39.98 25 34.8 25C31.25 25 28.14 26.88 26.4 29.7C25.4 29.26 24.28 29 23.1 29C19.73 29 17 31.73 17 35.1C17 35.6 17.06 36.08 17.18 36.54C14.78 37.49 13 39.84 13 42.6C13 45.58 15.42 48 18.4 48H22Z" fill="url(#cloudGrad)"/>
          <defs>
            <linearGradient id="cloudGrad" x1="13" y1="25" x2="51" y2="48" gradientUnits="userSpaceOnUse">
              <stop stop-color="#cbd5e1"/>
              <stop offset="1" stop-color="#64748b"/>
            </linearGradient>
          </defs>
        </svg>
      `,
      'partly-cloudy-day': `
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="24" cy="22" r="11" fill="#fbbf24"/>
          <path d="M22 50H46C50.42 50 54 46.42 54 42C54 37.86 50.85 34.47 46.81 34.06C46.29 28.26 41.41 23.71 35.5 23.71C31.45 23.71 27.9 25.86 25.91 29.08C24.77 28.58 23.49 28.29 22.14 28.29C18.29 28.29 15.17 31.41 15.17 35.26C15.17 35.83 15.24 36.38 15.38 36.9C12.63 37.99 10.6 40.67 10.6 43.83C10.6 47.24 13.36 50 16.77 50H22Z" fill="#94a3b8"/>
        </svg>
      `,
      'cloudy': `
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M20 48H46C50.42 48 54 44.42 54 40C54 35.86 50.85 32.47 46.81 32.06C46.29 26.26 41.41 21.71 35.5 21.71C31.45 21.71 27.9 23.86 25.91 27.08C24.77 26.58 23.49 26.29 22.14 26.29C18.29 26.29 15.17 29.41 15.17 33.26C15.17 33.83 15.24 34.38 15.38 34.9C12.63 35.99 10.6 38.67 10.6 41.83C10.6 45.24 13.36 48 16.77 48H20Z" fill="url(#overcastGrad)"/>
          <defs>
            <linearGradient id="overcastGrad" x1="10" y1="21" x2="54" y2="48" gradientUnits="userSpaceOnUse">
              <stop stop-color="#94a3b8"/>
              <stop offset="1" stop-color="#475569"/>
            </linearGradient>
          </defs>
        </svg>
      `,
      'rain': `
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M19 40H45C48.87 40 52 36.87 52 33C52 29.38 49.24 26.41 45.71 26.05C45.25 20.98 40.98 17 35.8 17C32.25 17 29.14 18.88 27.4 21.7C26.4 21.26 25.28 21 24.1 21C20.73 21 18 23.73 18 27.1C18 27.6 18.06 28.08 18.18 28.54C15.78 29.49 14 31.84 14 34.6C14 37.58 16.42 40 19.4 40H19Z" fill="#64748b"/>
          <g stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round">
            <line x1="22" y1="46" x2="19" y2="54"/>
            <line x1="32" y1="46" x2="29" y2="54"/>
            <line x1="42" y1="46" x2="39" y2="54"/>
          </g>
        </svg>
      `,
      'rain-heavy': `
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M19 38H45C48.87 38 52 34.87 52 31C52 27.38 49.24 24.41 45.71 24.05C45.25 18.98 40.98 15 35.8 15C32.25 15 29.14 16.88 27.4 19.7C26.4 19.26 25.28 19 24.1 19C20.73 19 18 21.73 18 25.1C18 25.6 18.06 26.08 18.18 26.54C15.78 27.49 14 29.84 14 32.6C14 35.58 16.42 38 19.4 38H19Z" fill="#475569"/>
          <g stroke="#00f2fe" stroke-width="3" stroke-linecap="round">
            <line x1="20" y1="44" x2="16" y2="56"/>
            <line x1="28" y1="44" x2="24" y2="56"/>
            <line x1="36" y1="44" x2="32" y2="56"/>
            <line x1="44" y1="44" x2="40" y2="56"/>
          </g>
        </svg>
      `,
      'thunderstorm': `
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M18 36H44C47.87 36 51 32.87 51 29C51 25.38 48.24 22.41 44.71 22.05C44.25 16.98 39.98 13 34.8 13C31.25 13 28.14 14.88 26.4 17.7C25.4 17.26 24.28 17 23.1 17C19.73 17 17 19.73 17 23.1C17 23.6 17.06 24.08 17.18 24.54C14.78 25.49 13 27.84 13 30.6C13 33.58 15.42 36 18.4 36H18Z" fill="#334155"/>
          <polygon points="32,36 24,47 31,47 27,57 39,44 32,44" fill="#fbbf24"/>
        </svg>
      `,
      'snow': `
        <svg viewBox="0 0 64 64" fill="none">
          <path d="M19 38H45C48.87 38 52 34.87 52 31C52 27.38 49.24 24.41 45.71 24.05C45.25 18.98 40.98 15 35.8 15C32.25 15 29.14 16.88 27.4 19.7C26.4 19.26 25.28 19 24.1 19C20.73 19 18 21.73 18 25.1C18 25.6 18.06 26.08 18.18 26.54C14.78 27.49 14 29.84 14 32.6C14 35.58 16.42 38 19.4 38H19Z" fill="#64748b"/>
          <g stroke="#bae6fd" stroke-width="2" stroke-linecap="round">
            <line x1="22" y1="46" x2="22" y2="52"/>
            <line x1="19" y1="49" x2="25" y2="49"/>
            <line x1="33" y1="46" x2="33" y2="52"/>
            <line x1="30" y1="49" x2="36" y2="49"/>
            <line x1="44" y1="46" x2="44" y2="52"/>
            <line x1="41" y1="49" x2="47" y2="49"/>
          </g>
        </svg>
      `,
      'fog': `
        <svg viewBox="0 0 64 64" fill="none">
          <g stroke="#94a3b8" stroke-width="3" stroke-linecap="round">
            <line x1="16" y1="26" x2="48" y2="26"/>
            <line x1="12" y1="34" x2="52" y2="34"/>
            <line x1="18" y1="42" x2="46" y2="42"/>
            <line x1="22" y1="50" x2="42" y2="50"/>
          </g>
        </svg>
      `
    };
    return svgs[iconName] || svgs['partly-cloudy-day'];
  }

  // Toast Notification
  function showToast(msg, isError = false) {
    let toast = document.querySelector('.toast-message');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast-message';
      document.body.appendChild(toast);
    }
    toast.className = `toast-message ${isError ? 'error' : ''} show`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>${msg}</span>
    `;
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  // Unit conversion helpers
  function formatTemp(celsius) {
    if (celsius === undefined || celsius === null) return '--';
    if (state.unit === 'F') {
      return Math.round((celsius * 9/5) + 32) + '°';
    }
    return Math.round(celsius) + '°';
  }

  function formatSpeed(kmh) {
    if (state.unit === 'F') {
      return (kmh * 0.621371).toFixed(1) + ' mph';
    }
    return Math.round(kmh) + ' km/h';
  }

  // City Local Clock
  function updateLocalClock(timezone) {
    if (state.localClockTimer) clearInterval(state.localClockTimer);

    function tick() {
      const el = document.getElementById('cityLocalTime');
      if (!el) return;
      try {
        const timeStr = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone || 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(new Date());

        const dayStr = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone || 'UTC',
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }).format(new Date());

        el.textContent = `${dayStr} • ${timeStr}`;
      } catch (e) {
        el.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }

    tick();
    state.localClockTimer = setInterval(tick, 30000);
  }

  // UV Level Details
  function getUvInfo(uv) {
    if (uv <= 2) return { text: 'Low', color: '#10b981', pct: 20 };
    if (uv <= 5) return { text: 'Moderate', color: '#f59e0b', pct: 48 };
    if (uv <= 7) return { text: 'High', color: '#f97316', pct: 70 };
    if (uv <= 10) return { text: 'Very High', color: '#ef4444', pct: 90 };
    return { text: 'Extreme', color: '#a855f7', pct: 100 };
  }

  // AQI Level Details
  function getAqiInfo(aqi) {
    if (!aqi || aqi <= 20) return { text: 'Good', cls: 'aqi-good' };
    if (aqi <= 40) return { text: 'Fair', cls: 'aqi-good' };
    if (aqi <= 60) return { text: 'Moderate', cls: 'aqi-moderate' };
    if (aqi <= 80) return { text: 'Poor', cls: 'aqi-poor' };
    return { text: 'Very Poor', cls: 'aqi-poor' };
  }

  // Render Full Dashboard UI
  function renderDashboard() {
    if (!state.weather || !state.weather.current) return;

    const current = state.weather.current;
    const daily = state.weather.daily;
    const condition = ApiService.getConditionInfo(current.weather_code, current.is_day);

    // Dynamic Theme Class on Body
    document.body.className = (state.theme === 'light' ? 'light-mode ' : '') + condition.theme;

    // 1. Hero Card
    document.getElementById('cityName').textContent = state.currentLocation.name;
    document.getElementById('cityCountry').textContent = state.currentLocation.country || '';
    document.getElementById('currentTemp').textContent = formatTemp(current.temperature_2m);
    document.getElementById('feelsLikeTemp').textContent = `Feels like ${formatTemp(current.apparent_temperature)}`;
    document.getElementById('conditionLabel').textContent = condition.label;

    if (daily && daily.temperature_2m_max && daily.temperature_2m_min) {
      document.getElementById('todayHigh').textContent = formatTemp(daily.temperature_2m_max[0]);
      document.getElementById('todayLow').textContent = formatTemp(daily.temperature_2m_min[0]);
    }

    // Weather Art
    const heroArtBox = document.getElementById('heroWeatherArt');
    if (heroArtBox) {
      heroArtBox.innerHTML = getWeatherIconSvg(condition.icon);
    }

    // Condition Summary
    const summaryEl = document.getElementById('weatherSummaryText');
    if (summaryEl) {
      summaryEl.textContent = `Current conditions report ${condition.label.toLowerCase()} with wind speeds of ${formatSpeed(current.wind_speed_10m)} and ${current.relative_humidity_2m}% humidity.`;
    }

    // Favorite Button Status
    updateFavoriteBtnState();

    // 2. Metrics Grid
    // Wind & Compass
    document.getElementById('windSpeedVal').textContent = formatSpeed(current.wind_speed_10m);
    document.getElementById('windGustsVal').textContent = current.wind_gusts_10m ? `Gusts: ${formatSpeed(current.wind_gusts_10m)}` : 'Gusts: Low';
    const compassArrow = document.getElementById('compassArrow');
    if (compassArrow) {
      compassArrow.style.transform = `rotate(${current.wind_direction_10m}deg)`;
    }

    // UV Index
    const uv = current.uv_index || 0;
    const uvInfo = getUvInfo(uv);
    document.getElementById('uvIndexVal').textContent = uv.toFixed(1);
    document.getElementById('uvLevelText').textContent = uvInfo.text;
    const uvBar = document.getElementById('uvBarFill');
    if (uvBar) {
      uvBar.style.width = uvInfo.pct + '%';
    }

    // Air Quality
    const aqiVal = state.aqi && state.aqi.current ? state.aqi.current.european_aqi : 25;
    const aqiInfo = getAqiInfo(aqiVal);
    const aqiPill = document.getElementById('aqiBadge');
    if (aqiPill) {
      aqiPill.className = `aqi-pill ${aqiInfo.cls}`;
      aqiPill.textContent = aqiInfo.text;
    }
    const pm25 = state.aqi && state.aqi.current ? state.aqi.current.pm2_5 : 10;
    document.getElementById('aqiDetails').textContent = `PM2.5: ${pm25} µg/m³`;

    // Sun Arc (Sunrise & Sunset)
    if (daily && daily.sunrise && daily.sunset) {
      const sunriseIso = daily.sunrise[0];
      const sunsetIso = daily.sunset[0];
      const formatTime = (iso) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };
      document.getElementById('sunriseTime').textContent = formatTime(sunriseIso);
      document.getElementById('sunsetTime').textContent = formatTime(sunsetIso);

      // Sun position calculation
      const nowTs = Date.now();
      const riseTs = new Date(sunriseIso).getTime();
      const setTs = new Date(sunsetIso).getTime();
      let sunPercent = 0.5;
      if (nowTs <= riseTs) sunPercent = 0.05;
      else if (nowTs >= setTs) sunPercent = 0.95;
      else sunPercent = (nowTs - riseTs) / (setTs - riseTs);

      const sunDot = document.getElementById('sunArcDot');
      if (sunDot) {
        // Curve equation approximation along SVG arc
        const x = 20 + (sunPercent * 160);
        const y = 50 - (Math.sin(sunPercent * Math.PI) * 35);
        sunDot.setAttribute('cx', x);
        sunDot.setAttribute('cy', y);
      }
    }

    // Humidity & Dew Point
    document.getElementById('humidityVal').textContent = current.relative_humidity_2m + '%';
    // Magnus-Tetens approximation for dew point
    const t = current.temperature_2m;
    const rh = current.relative_humidity_2m;
    const dp = t - ((100 - rh) / 5);
    document.getElementById('dewPointVal').textContent = `Dew point: ${formatTemp(dp)}`;

    // Pressure & Visibility
    document.getElementById('pressureVal').textContent = Math.round(current.pressure_msl || 1013) + ' hPa';
    document.getElementById('cloudCoverVal').textContent = `Cloud cover: ${current.cloud_cover || 0}%`;

    // 3. Hourly Forecast Scroller & Chart.js
    renderHourlySection();

    // 4. 7-Day Forecast Cards
    renderDailySection();

    // 5. Update Interactive Map
    WeatherMap.updateLocation(
      state.currentLocation.latitude,
      state.currentLocation.longitude,
      state.currentLocation.name
    );
  }

  function renderHourlySection() {
    const scroller = document.getElementById('hourlyScroller');
    if (!scroller || !state.weather.hourly) return;

    scroller.innerHTML = '';
    const hourly = state.weather.hourly;
    const now = new Date();
    let startIdx = 0;

    for (let i = 0; i < hourly.time.length; i++) {
      if (new Date(hourly.time[i]) >= now) {
        startIdx = i;
        break;
      }
    }

    for (let i = startIdx; i < startIdx + 24; i++) {
      if (!hourly.time[i]) break;

      const time = new Date(hourly.time[i]);
      const hourLabel = i === startIdx ? 'Now' : time.toLocaleTimeString([], { hour: 'numeric' });
      const code = hourly.weather_code[i];
      const cond = ApiService.getConditionInfo(code, 1);
      const temp = formatTemp(hourly.temperature_2m[i]);
      const pop = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0;

      const card = document.createElement('div');
      card.className = `hourly-item ${i === startIdx ? 'active' : ''}`;
      card.innerHTML = `
        <span class="hourly-time">${hourLabel}</span>
        <div class="hourly-icon">${getWeatherIconSvg(cond.icon)}</div>
        <span class="hourly-temp">${temp}</span>
        <span class="hourly-pop">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
          </svg>
          ${pop}%
        </span>
      `;
      scroller.appendChild(card);
    }

    // Chart.js render
    WeatherChart.render('hourlyChartCanvas', state.weather.hourly, state.unit === 'F');
  }

  function renderDailySection() {
    const list = document.getElementById('dailyForecastList');
    if (!list || !state.weather.daily) return;

    list.innerHTML = '';
    const daily = state.weather.daily;
    const days = daily.time.length;

    // Find min and max for the 7 days to scale progress bars
    const allMins = daily.temperature_2m_min.slice(0, 7);
    const allMaxs = daily.temperature_2m_max.slice(0, 7);
    const globalMin = Math.min(...allMins);
    const globalMax = Math.max(...allMaxs);
    const totalRange = (globalMax - globalMin) || 1;

    for (let i = 0; i < Math.min(days, 7); i++) {
      const d = new Date(daily.time[i]);
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const cond = ApiService.getConditionInfo(daily.weather_code[i], 1);

      const minVal = daily.temperature_2m_min[i];
      const maxVal = daily.temperature_2m_max[i];

      // Calculate bar offsets in percentage
      const leftOffset = Math.max(0, ((minVal - globalMin) / totalRange) * 100);
      const widthPct = Math.max(10, (((maxVal - minVal) / totalRange) * 100));

      const row = document.createElement('div');
      row.className = 'daily-item';
      row.innerHTML = `
        <span class="daily-name">${dayName}</span>
        <div class="daily-icon">${getWeatherIconSvg(cond.icon)}</div>
        <div class="temp-bar-container">
          <div class="temp-bar-track">
            <div class="temp-bar-range" style="left: ${leftOffset}%; width: ${widthPct}%;"></div>
          </div>
        </div>
        <div class="temp-numbers">
          <span class="temp-min">${formatTemp(minVal)}</span>
          <span class="temp-max">${formatTemp(maxVal)}</span>
        </div>
      `;
      list.appendChild(row);
    }
  }

  // Load weather for target location
  async function loadLocationWeather(loc) {
    try {
      state.currentLocation = loc;
      updateLocalClock(loc.timezone);

      // Parallel fetch weather and air quality
      const [weather, aqi] = await Promise.all([
        ApiService.getWeatherData(loc.latitude, loc.longitude),
        ApiService.getAirQualityData(loc.latitude, loc.longitude).catch(() => null)
      ]);

      state.weather = weather;
      state.aqi = aqi;

      renderDashboard();
    } catch (err) {
      console.error('Failed to load weather:', err);
      showToast('Failed to load weather for this location', true);
    }
  }

  // Favorites System
  function updateFavoriteBtnState() {
    const btn = document.getElementById('favToggleBtn');
    if (!btn) return;
    const isFav = state.favorites.some(f => f.name.toLowerCase() === state.currentLocation.name.toLowerCase());
    if (isFav) {
      btn.classList.add('is-favorite');
      btn.querySelector('svg').setAttribute('fill', 'currentColor');
    } else {
      btn.classList.remove('is-favorite');
      btn.querySelector('svg').setAttribute('fill', 'none');
    }
    updateFavoritesBadge();
  }

  function updateFavoritesBadge() {
    const badge = document.getElementById('favBadgeCount');
    if (badge) {
      badge.textContent = state.favorites.length;
      badge.style.display = state.favorites.length > 0 ? 'flex' : 'none';
    }
  }

  function toggleCurrentFavorite() {
    const idx = state.favorites.findIndex(f => f.name.toLowerCase() === state.currentLocation.name.toLowerCase());
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
      showToast(`Removed ${state.currentLocation.name} from favorites`);
    } else {
      state.favorites.push({ ...state.currentLocation });
      showToast(`Saved ${state.currentLocation.name} to favorites`);
    }
    localStorage.setItem('skypulse_favorites', JSON.stringify(state.favorites));
    updateFavoriteBtnState();
    renderFavoritesModal();
  }

  function renderFavoritesModal() {
    const list = document.getElementById('favoritesList');
    if (!list) return;

    if (state.favorites.length === 0) {
      list.innerHTML = `<p style="text-align: center; color: var(--text-muted); padding: 2rem 0;">No bookmarked locations yet. Search for a city and click the heart icon to save it!</p>`;
      return;
    }

    list.innerHTML = '';
    state.favorites.forEach((fav, i) => {
      const item = document.createElement('div');
      item.className = 'fav-card-item';
      item.innerHTML = `
        <div class="fav-card-left">
          <span class="fav-city-title">${fav.name}</span>
          <span class="fav-city-sub">${fav.country || ''}</span>
        </div>
        <div class="fav-card-actions">
          <button class="fav-delete-btn" data-index="${i}" title="Remove">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.closest('.fav-delete-btn')) {
          state.favorites.splice(i, 1);
          localStorage.setItem('skypulse_favorites', JSON.stringify(state.favorites));
          updateFavoriteBtnState();
          renderFavoritesModal();
          return;
        }
        loadLocationWeather(fav);
        document.getElementById('favoritesModal').classList.remove('open');
      });
      list.appendChild(item);
    });
  }

  // Search Input & Autocomplete
  const searchInput = document.getElementById('citySearchInput');
  const searchDropdown = document.getElementById('searchResultsDropdown');
  let searchDebounceTimer = null;

  if (searchInput && searchDropdown) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim();
      clearTimeout(searchDebounceTimer);

      if (q.length < 2) {
        searchDropdown.classList.remove('active');
        return;
      }

      searchDebounceTimer = setTimeout(async () => {
        try {
          const results = await ApiService.searchCities(q);
          if (results && results.length > 0) {
            searchDropdown.innerHTML = '';
            results.forEach(res => {
              const item = document.createElement('div');
              item.className = 'result-item';
              item.innerHTML = `
                <div class="result-main">
                  <span class="result-city">${res.name}</span>
                  <span class="result-admin">${res.admin1 ? res.admin1 + ', ' : ''}${res.country || ''}</span>
                </div>
                <span class="result-country">${res.country_code || ''}</span>
              `;
              item.addEventListener('click', () => {
                searchDropdown.classList.remove('active');
                searchInput.value = '';
                loadLocationWeather({
                  name: res.name,
                  country: res.country,
                  country_code: res.country_code,
                  latitude: res.latitude,
                  longitude: res.longitude,
                  timezone: res.timezone
                });
              });
              searchDropdown.appendChild(item);
            });
            searchDropdown.classList.add('active');
          } else {
            searchDropdown.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No cities found for "${q}"</div>`;
            searchDropdown.classList.add('active');
          }
        } catch (err) {
          console.warn('Geocoding search failed:', err);
        }
      }, 250);
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        searchDropdown.classList.remove('active');
      }
    });

    // Enter key triggers first suggestion
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const first = searchDropdown.querySelector('.result-item');
        if (first) first.click();
      }
    });
  }

  // Geolocation Button ("Locate Me")
  const locateBtn = document.getElementById('locateBtn');
  if (locateBtn) {
    locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported by your browser', true);
        return;
      }
      locateBtn.innerHTML = `<span>Locating...</span>`;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          locateBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Locate</span>
          `;
          loadLocationWeather({
            name: 'My Location',
            country: '',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
          showToast('Updated to your current GPS position');
        },
        (err) => {
          locateBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Locate</span>
          `;
          showToast('Unable to retrieve location: ' + err.message, true);
        }
      );
    });
  }

  // Theme UI & Toggle (Light / Dark)
  function updateThemeUI() {
    const sun = document.getElementById('themeSunIcon');
    const moon = document.getElementById('themeMoonIcon');
    const btn = document.getElementById('themeToggleBtn');

    if (state.theme === 'light') {
      document.body.classList.add('light-mode');
      if (sun) sun.style.display = 'none';
      if (moon) moon.style.display = 'block';
      if (btn) btn.title = 'Switch to Dark mode';
    } else {
      document.body.classList.remove('light-mode');
      if (sun) sun.style.display = 'block';
      if (moon) moon.style.display = 'none';
      if (btn) btn.title = 'Switch to Light mode';
    }
  }

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('wwd_theme', state.theme);
      updateThemeUI();
      WeatherMap.setTheme(state.theme);
      if (state.weather) {
        renderDashboard();
      }
      showToast(`Switched to ${state.theme === 'light' ? 'Light' : 'Dark'} theme`);
    });
  }

  // Unit Toggle (°C / °F)
  const unitBtns = document.querySelectorAll('.unit-btn');
  unitBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const newUnit = btn.dataset.unit;
      if (newUnit === state.unit) return;

      state.unit = newUnit;
      localStorage.setItem('skypulse_unit', newUnit);

      unitBtns.forEach(b => b.classList.toggle('active', b.dataset.unit === newUnit));
      renderDashboard();
    });
  });

  // Favorite Button in Hero Card
  const favBtn = document.getElementById('favToggleBtn');
  if (favBtn) {
    favBtn.addEventListener('click', toggleCurrentFavorite);
  }

  // Favorites Modal Dialog Controls
  const favModal = document.getElementById('favoritesModal');
  const favDrawerBtn = document.getElementById('favDrawerBtn');
  const closeFavModal = document.getElementById('closeFavModal');

  if (favDrawerBtn && favModal) {
    favDrawerBtn.addEventListener('click', () => {
      renderFavoritesModal();
      favModal.classList.add('open');
    });
  }

  if (closeFavModal && favModal) {
    closeFavModal.addEventListener('click', () => favModal.classList.remove('open'));
    favModal.addEventListener('click', (e) => {
      if (e.target === favModal) favModal.classList.remove('open');
    });
  }

  // Map Layer Buttons
  document.querySelectorAll('.map-layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      WeatherMap.switchLayer(btn.dataset.layer);
    });
  });

  // Initial Boot
  (async function boot() {
    // Apply initial theme UI
    updateThemeUI();

    // Set initial unit toggle visual state
    unitBtns.forEach(b => b.classList.toggle('active', b.dataset.unit === state.unit));
    updateFavoritesBadge();

    // Init Leaflet Map with initial theme
    await WeatherMap.init('weatherMap', state.currentLocation.latitude, state.currentLocation.longitude, state.theme);

    // Load initial weather
    await loadLocationWeather(state.currentLocation);
  })();
});
