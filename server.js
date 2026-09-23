const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;
const CACHE = new Map();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'WorldWeatherDetect-Node/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Handle Mock/Proxy API requests if hitting /api/weather
  if (pathname.startsWith('/api/weather')) {
    const action = parsedUrl.searchParams.get('action') || 'weather';

    let targetUrl = '';
    let cacheKey = '';
    let ttl = 15 * 60 * 1000; // 15 mins

    if (action === 'search') {
      const q = parsedUrl.searchParams.get('q') || '';
      targetUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
      cacheKey = `search_${q.toLowerCase()}`;
      ttl = 60 * 60 * 1000;
    } else if (action === 'weather') {
      const lat = parsedUrl.searchParams.get('lat');
      const lon = parsedUrl.searchParams.get('lon');
      targetUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,pressure_msl,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=auto`;
      cacheKey = `weather_${lat}_${lon}`;
    } else if (action === 'air_quality') {
      const lat = parsedUrl.searchParams.get('lat');
      const lon = parsedUrl.searchParams.get('lon');
      targetUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide&timezone=auto`;
      cacheKey = `aqi_${lat}_${lon}`;
      ttl = 30 * 60 * 1000;
    }

    if (cacheKey && CACHE.has(cacheKey)) {
      const cached = CACHE.get(cacheKey);
      if (Date.now() - cached.time < ttl) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(cached.data));
      }
    }

    if (targetUrl) {
      try {
        const response = await fetchJson(targetUrl);
        if (response.status === 200) {
          CACHE.set(cacheKey, { time: Date.now(), data: response.body });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify(response.body));
        } else {
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: true, message: 'Upstream API error' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: true, message: err.message }));
      }
    }
  }

  // Static file serving
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`World Weather Detect (WWD) dev server running at http://localhost:${PORT}`);
});
