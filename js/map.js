/**
 * SkyPulse - Leaflet Interactive Global Weather Map
 * Includes CartoDB Dark theme, RainViewer live radar layers, and animated city markers
 */

const WeatherMap = (() => {
  let map = null;
  let marker = null;
  let baseTileLayer = null;
  let radarLayer = null;
  let cloudsLayer = null;
  let currentLayerType = 'radar';
  let radarTimestamp = null;
  let currentTheme = 'dark';

  async function fetchLatestRadarTimestamp() {
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (res.ok) {
        const data = await res.json();
        if (data.radar && data.radar.past && data.radar.past.length > 0) {
          const latest = data.radar.past[data.radar.past.length - 1];
          radarTimestamp = latest.path;
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch RainViewer timestamps:', e);
    }
  }

  function createMarkerIcon() {
    const isLight = document.body.classList.contains('light-mode');
    const color = isLight ? '#0284c7' : '#00f2fe';
    return L.divIcon({
      className: 'custom-pulse-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; inset: 0; background: ${color}; border-radius: 50%; opacity: 0.3; animation: mapPulse 2s infinite ease-out;"></div>
          <div style="position: absolute; inset: 4px; background: ${color}; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 0 12px ${color};"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  }

  return {
    async init(containerId = 'weatherMap', defaultLat = 51.5074, defaultLon = -0.1278, initialTheme = 'dark') {
      if (map) return;

      const container = document.getElementById(containerId);
      if (!container) return;

      currentTheme = initialTheme;

      map = L.map(containerId, {
        zoomControl: false,
        attributionControl: false
      }).setView([defaultLat, defaultLon], 7);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Apply initial theme basemap (Positron for light, DarkMatter for dark)
      this.setTheme(currentTheme);

      // Fetch Radar timestamp and load radar
      await fetchLatestRadarTimestamp();
      this.switchLayer('radar');

      // Place Marker
      marker = L.marker([defaultLat, defaultLon], { icon: createMarkerIcon() }).addTo(map);
    },

    setTheme(theme) {
      currentTheme = theme;
      if (!map) return;

      if (baseTileLayer) {
        map.removeLayer(baseTileLayer);
      }

      const tileUrl = theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      baseTileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; CartoDB &copy; OpenStreetMap'
      }).addTo(map);

      if (baseTileLayer.bringToBack) {
        baseTileLayer.bringToBack();
      }

      if (marker) {
        marker.setIcon(createMarkerIcon());
      }
    },

    updateLocation(lat, lon, cityName = '') {
      if (!map) return;

      map.flyTo([lat, lon], 8, {
        animate: true,
        duration: 1.2
      });

      if (marker) {
        marker.setLatLng([lat, lon]);
      } else {
        marker = L.marker([lat, lon], { icon: createMarkerIcon() }).addTo(map);
      }

      if (cityName) {
        marker.bindPopup(`<b>${cityName}</b><br>Radar & Live Satellite`, { offset: [0, -10] });
      }
    },

    switchLayer(layerType) {
      if (!map) return;
      currentLayerType = layerType;

      if (radarLayer) {
        map.removeLayer(radarLayer);
        radarLayer = null;
      }
      if (cloudsLayer) {
        map.removeLayer(cloudsLayer);
        cloudsLayer = null;
      }

      if (layerType === 'radar') {
        if (radarTimestamp) {
          radarLayer = L.tileLayer(`https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`, {
            opacity: 0.75,
            zIndex: 10
          }).addTo(map);
        } else {
          // Open-Meteo or OpenWeather fallback radar simulation
          radarLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            opacity: 0.2,
            zIndex: 10
          }).addTo(map);
        }
      } else if (layerType === 'clouds') {
        // Satellite cloud layer
        if (radarTimestamp) {
          cloudsLayer = L.tileLayer(`https://tilecache.rainviewer.com/v2/satellite/${radarTimestamp}/256/{z}/{x}/{y}/0/0_0.png`, {
            opacity: 0.65,
            zIndex: 10
          }).addTo(map);
        }
      }

      // Update button visual states
      document.querySelectorAll('.map-layer-btn').forEach(btn => {
        if (btn.dataset.layer === layerType) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    },

    invalidateSize() {
      if (map) {
        setTimeout(() => map.invalidateSize(), 200);
      }
    }
  };
})();

// CSS Animation for mapPulse
const style = document.createElement('style');
style.innerHTML = `
  @keyframes mapPulse {
    0% { transform: scale(0.6); opacity: 0.8; }
    100% { transform: scale(2.4); opacity: 0; }
  }
`;
document.head.appendChild(style);
