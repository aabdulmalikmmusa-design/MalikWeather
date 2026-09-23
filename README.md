# World Weather Detect (WWD) 🌍🌦️

**World Weather Detect (WWD)** is a modern, responsive global weather forecast dashboard engineered with vanilla HTML5, CSS3, and ES6+ JavaScript. It features real-time meteorological metrics, dual light and dark glassmorphism themes, interactive 24-hour hourly trend charts, and dual execution support (via XAMPP Apache PHP or standalone Node.js).

---

## ✨ Features

- **🌐 Global City Search & Autocomplete**: Real-time debounced geocoding search for worldwide cities with country tags and administrative regions.
- **📍 GPS Geolocation**: Instant "Locate Me" button to retrieve immediate local forecasts based on device coordinates.
- **🌓 Dual Theme Engine (Light & Dark)**: 
  - **Dark Mode**: Obsidian glass cards with cyan/amber glowing accents.
  - **Light Mode**: Crisp, airy frosted-glass cards with slate typography and sky-blue gradients.
  - Automatically saves theme preferences in `localStorage`.
- **📊 24-Hour Interactive Forecast**: Chart.js temperature curve and precipitation bar graphs with custom tooltips and hourly quick-scroll deck.
- **📅 7-Day Extended Forecast**: Daily forecast cards with scaled temperature range bars and high/low tracking.
- **🧭 Atmospheric Metrics Suite**:
  - **Wind & Dynamic Compass**: Wind speed in km/h or mph with a 360° rotating compass needle.
  - **UV Index Gauge**: Live safety rating bar (Low, Moderate, High, Extreme).
  - **Air Quality Index (AQI)**: Real-time European AQI with PM2.5, PM10, and Ozone indicators.
  - **Celestial Solar Arc**: Real-time visual curve tracking the sun's position from sunrise to sunset.
  - **Humidity & Dew Point**: Relative atmospheric moisture and calculated condensation threshold.
  - **Pressure & Cloud Cover**: Surface/MSL barometric pressure and cloud coverage metrics.
- **⭐ Saved Locations**: Bookmarks drawer with badge counter and local persistence.

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, Modern CSS3 (CSS Variables, Flexbox, Grid, Glassmorphism, Micro-animations), Vanilla JavaScript (ES6+ Modules/Classes).
- **Charting**: [Chart.js](https://www.chartjs.org/) for trend graphs.
- **Weather Data**: Powered by the free, open-source [Open-Meteo API](https://open-meteo.com/).
- **Backend Options**:
  - **PHP 8.2+**: Built-in caching proxy (`api/weather.php`) for XAMPP / Apache environments.
  - **Node.js**: Standalone zero-dependency preview server and proxy (`server.js`).

---

## 📁 Project Structure

```
MalikWeather/
├── index.html              # Main application markup
├── server.js               # Standalone Node.js server & proxy
├── package.json            # Node configuration & scripts
├── .gitignore              # Ignored files (cache, logs, dependencies)
├── README.md               # Project documentation
├── api/
│   └── weather.php         # PHP backend proxy with 15-minute file caching
├── css/
│   └── style.css           # Glassmorphism design system & responsive styling
└── js/
    ├── api.js              # Open-Meteo weather & geocoding API client
    ├── app.js              # State controller & DOM event handling
    ├── charts.js           # 24-hour hourly trend charts
    └── map.js              # Map utilities
```

---

## 🚀 Getting Started

### Option 1: Running with Node.js (Quickest)

1. Make sure [Node.js](https://nodejs.org/) is installed.
2. In the project directory, run:
   ```bash
   npm start
   ```
   *or:*
   ```bash
   node server.js
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Option 2: Running with XAMPP Apache

1. Place the project inside your XAMPP web root directory:
   ```
   C:\xampp\htdocs\MalikWeather\
   ```
2. Start the **Apache** module from the XAMPP Control Panel.
3. Open your browser and navigate to:
   ```
   http://localhost/MalikWeather/
   ```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
