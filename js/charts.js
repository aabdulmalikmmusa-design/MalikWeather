/**
 * SkyPulse - 24-Hour Hourly Forecast Chart Manager
 * Powered by Chart.js with responsive gradient canvas
 */

const WeatherChart = (() => {
  let chartInstance = null;

  function formatHour(isoString) {
    const d = new Date(isoString);
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours} ${ampm}`;
  }

  return {
    render(canvasId, hourlyData, isFahrenheit = false) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isLight = document.body.classList.contains('light-mode');
      const tempColor = isLight ? '#0284c7' : '#00f2fe';
      const rainColor = isLight ? 'rgba(37, 99, 235, 0.45)' : 'rgba(96, 165, 250, 0.35)';
      const rainHover = isLight ? 'rgba(37, 99, 235, 0.8)' : 'rgba(96, 165, 250, 0.7)';
      const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.05)';
      const xGridColor = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
      const tickColor = isLight ? '#475569' : '#94a3b8';
      const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(15, 23, 42, 0.95)';
      const tooltipTitle = isLight ? '#0f172a' : '#f8fafc';
      const tooltipBody = isLight ? '#475569' : '#94a3b8';
      const tooltipBorder = isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.12)';

      // Extract next 24 data points starting from now
      const now = new Date();
      let startIndex = 0;

      if (hourlyData.time && hourlyData.time.length > 0) {
        for (let i = 0; i < hourlyData.time.length; i++) {
          if (new Date(hourlyData.time[i]) >= now) {
            startIndex = i;
            break;
          }
        }
      }

      const times = hourlyData.time.slice(startIndex, startIndex + 24);
      let temps = hourlyData.temperature_2m.slice(startIndex, startIndex + 24);
      const rainProbs = hourlyData.precipitation_probability ? hourlyData.precipitation_probability.slice(startIndex, startIndex + 24) : [];

      if (isFahrenheit) {
        temps = temps.map(c => (c * 9/5) + 32);
      }

      const labels = times.map((t, idx) => (idx === 0 ? 'Now' : formatHour(t)));

      // Gradient for temperature line
      const gradient = ctx.createLinearGradient(0, 0, 0, 180);
      if (isLight) {
        gradient.addColorStop(0, 'rgba(2, 132, 199, 0.35)');
        gradient.addColorStop(1, 'rgba(2, 132, 199, 0.0)');
      } else {
        gradient.addColorStop(0, 'rgba(0, 242, 254, 0.45)');
        gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
      }

      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: isFahrenheit ? 'Temperature (°F)' : 'Temperature (°C)',
              data: temps,
              borderColor: tempColor,
              backgroundColor: gradient,
              borderWidth: 2.5,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: tempColor,
              pointHoverRadius: 6,
              pointRadius: 3,
              yAxisID: 'y'
            },
            {
              type: 'bar',
              label: 'Rain Probability (%)',
              data: rainProbs,
              backgroundColor: rainColor,
              hoverBackgroundColor: rainHover,
              borderRadius: 4,
              barThickness: 8,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: tooltipBg,
              titleColor: tooltipTitle,
              bodyColor: tooltipBody,
              borderColor: tooltipBorder,
              borderWidth: 1,
              padding: 10,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    if (context.datasetIndex === 0) {
                      label += Math.round(context.parsed.y) + (isFahrenheit ? '°F' : '°C');
                    } else {
                      label += Math.round(context.parsed.y) + '%';
                    }
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: xGridColor,
                drawBorder: false
              },
              ticks: {
                color: '#64748b',
                font: { family: 'Inter', size: 11 },
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 8
              }
            },
            y: {
              position: 'left',
              grid: {
                color: gridColor,
                drawBorder: false
              },
              ticks: {
                color: tickColor,
                font: { family: 'Inter', size: 11 },
                callback: function(val) {
                  return Math.round(val) + '°';
                }
              }
            },
            y1: {
              position: 'right',
              min: 0,
              max: 100,
              grid: {
                display: false
              },
              ticks: {
                color: '#60a5fa',
                font: { family: 'Inter', size: 10 },
                callback: function(val) {
                  return val + '%';
                }
              }
            }
          }
        }
      });
    },

    destroy() {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    }
  };
})();
