

import fs from "fs";
import path from "path";

console.log("Backend loaded.");



// Synchronously load .env at module load time for local dev, always from project root
function loadLocalEnvSync() {
  try {
    const envPath = path.resolve(process.cwd(), 'functions/.env');
    const txt = fs.readFileSync(envPath, 'utf8');
    txt.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    });
  } catch (e) {
    // ignore if no local .env
  }
}

if (!process.env.OWM_KEY) {
  loadLocalEnvSync();
}

export async function handler(event) {
  let API_KEY = process.env.OWM_KEY;
  const city = event?.queryStringParameters?.city;

  console.log("handler invoked", {
    hasApiKey: !!API_KEY,
    cityProvided: !!city,
  });

  // Development convenience: if DEV_MOCK_WEATHER is set, return a deterministic mocked response
  // so the app and demos can run without a real OpenWeather API key. Do NOT set this in production.
  if (!API_KEY) {
    if (process.env.DEV_MOCK_WEATHER === '1') {
      const current = { temp: 22.5, humidity: 55, wind: 3.5, condition: 'Clear' };
      const forecast = [
        { day: 'Wed', temp: 23, condition: 'Clear' },
        { day: 'Thu', temp: 21, condition: 'Clouds' },
        { day: 'Fri', temp: 19, condition: 'Rain' }
      ];
      return { statusCode: 200, body: JSON.stringify({ current, forecast }) };
    }

    console.error("Missing OpenWeatherMap API key (OWM_KEY)");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server misconfiguration: missing API key (set OWM_KEY in functions/.env or Netlify env vars)" }),
    };
  }

  if (!city) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "City is required" }),
    };
  }

  // Simple in-memory cache to reduce API calls during demos. TTL in seconds (default 300s)
  const CACHE_TTL = Number(process.env.WEATHER_CACHE_TTL_SECONDS || 300);
  const cacheKey = String((city || '').toLowerCase());
  if (!globalThis.__weather_cache) globalThis.__weather_cache = new Map();
  const cached = globalThis.__weather_cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('weather: returning cached response for', city);
    return { statusCode: 200, body: JSON.stringify(cached.value) };
  }

  try {
    // Fetch current weather
    const encodedCity = encodeURIComponent(city);
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodedCity}&units=metric&appid=${API_KEY}`
    );
    const currentData = await currentRes.json();

    if (!currentRes.ok) {
      // forward API's error message when possible
      return {
        statusCode: currentRes.status || 400,
        body: JSON.stringify({ error: currentData.message || "City not found" }),
      };
    }


    const current = {
      temp: currentData.main.temp,
      humidity: currentData.main.humidity,
      wind: currentData.wind.speed,
      condition: currentData.weather[0].main,
      // Add sunrise/sunset and a local time snapshot so prompts can reason about daylight
      sunrise: currentData.sys?.sunrise,
      sunset: currentData.sys?.sunset,
      timezone: currentData.timezone, // seconds offset from UTC
      local_dt: currentData.dt,
      // Air quality fields will be added below
    };

    // Fetch air quality from Open-Meteo using lat/lon from currentData.coord
    // Also compute US/EPA AQI from PM2.5 and PM10
    function computeUSAQI(pm25, pm10) {
      // US EPA breakpoints for PM2.5 (24hr)
      const pm25Breakpoints = [
        { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50 },
        { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
        { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
        { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200 },
        { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300 },
        { cLow: 250.5, cHigh: 350.4, iLow: 301, iHigh: 400 },
        { cLow: 350.5, cHigh: 500.4, iLow: 401, iHigh: 500 },
      ];
      // US EPA breakpoints for PM10 (24hr)
      const pm10Breakpoints = [
        { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
        { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
        { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
        { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
        { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
        { cLow: 425, cHigh: 504, iLow: 301, iHigh: 400 },
        { cLow: 505, cHigh: 604, iLow: 401, iHigh: 500 },
      ];
      function calcAQI(conc, bps) {
        for (const bp of bps) {
          if (conc >= bp.cLow && conc <= bp.cHigh) {
            return Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (conc - bp.cLow) + bp.iLow);
          }
        }
        return null;
      }
      const aqi25 = pm25 != null ? calcAQI(pm25, pm25Breakpoints) : null;
      const aqi10 = pm10 != null ? calcAQI(pm10, pm10Breakpoints) : null;
      // Return the highest (worst) AQI
      if (aqi25 != null && aqi10 != null) return Math.max(aqi25, aqi10);
      if (aqi25 != null) return aqi25;
      if (aqi10 != null) return aqi10;
      return null;
    }
    try {
      const { lat, lon } = currentData.coord || {};
      if (lat != null && lon != null) {
        const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,pm10,european_aqi`;
        const aqRes = await fetch(aqUrl);
        if (aqRes.ok) {
          const aqData = await aqRes.json();
          const h = aqData.hourly || {};
          current.aqi = Array.isArray(h.european_aqi) ? h.european_aqi[0] ?? null : null;
          current.pm2_5 = Array.isArray(h.pm2_5) ? h.pm2_5[0] ?? null : null;
          current.pm10 = Array.isArray(h.pm10) ? h.pm10[0] ?? null : null;
          current.us_aqi = computeUSAQI(current.pm2_5, current.pm10);
        } else {
          console.error('Open-Meteo AQI fetch failed', aqRes.status, await aqRes.text());
        }
      }
    } catch (err) {
      console.error('Open-Meteo AQI fetch failed', err && (err.stack || err.message || err));
    }

    // Fetch forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodedCity}&units=metric&appid=${API_KEY}`
    );
    const forecastData = await forecastRes.json();

    if (!forecastRes.ok) {
      return {
        statusCode: forecastRes.status || 400,
        body: JSON.stringify({ error: forecastData.message || "Forecast not available" }),
      };
    }

    // Aggregate 3-hour forecast entries into up to 5 daily summaries
    const byDate = {};
    if (Array.isArray(forecastData.list)) {
      forecastData.list.forEach((d) => {
        const date = new Date(d.dt * 1000).toISOString().split("T")[0]; // YYYY-MM-DD
        byDate[date] = byDate[date] || { temps: [], conditions: [] };
        byDate[date].temps.push(d.main.temp);
        byDate[date].conditions.push(d.weather[0].main);
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const days = Object.keys(byDate)
      .sort()
      .filter((d) => d !== today) // skip current day to show upcoming days
      .slice(0, 5)
      .map((dateStr) => {
        const entry = byDate[dateStr];
        const avgTemp = entry.temps.reduce((s, v) => s + v, 0) / entry.temps.length;
        // pick most frequent condition
        const condCounts = entry.conditions.reduce((acc, c) => {
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {});
        const condition = Object.keys(condCounts).reduce((a, b) => (condCounts[a] > condCounts[b] ? a : b));

        return {
          day: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }),
          temp: Math.round(avgTemp * 100) / 100,
          condition,
        };
      });

    const forecast = days;

    // Store in cache for subsequent requests
    try {
      const CACHE_TTL = Number(process.env.WEATHER_CACHE_TTL_SECONDS || 300);
      if (!globalThis.__weather_cache) globalThis.__weather_cache = new Map();
      globalThis.__weather_cache.set(cacheKey, {
        value: { current, forecast },
        expiresAt: Date.now() + CACHE_TTL * 1000,
      });
    } catch (e) {
      console.warn('Failed to write weather cache', e && (e.message || e));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ current, forecast }),
    };
  } catch (error) {
    console.error("SERVER ERROR:", error && (error.stack || error.message || error));
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
}
