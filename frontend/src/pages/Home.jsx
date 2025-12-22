import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import WeatherCard from "../components/WeatherCard";
import ForecastCard from "../components/ForecastCard";
import Loader from "../components/Loader";
import InsightsCard from "../components/InsightsCard";

export default function Home() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState(null);
  // Modal state for forecast details
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  function openForecastModal(dayData) {
    setModalData(dayData);
    setModalOpen(true);
  }
  function closeForecastModal() {
    setModalOpen(false);
    setModalData(null);
  }

  // Helper for AQI chip
  const aqiColor = weather && weather.us_aqi != null
    ? weather.us_aqi <= 50
      ? '#22c55e' // green
      : weather.us_aqi <= 100
        ? '#eab308' // amber
        : weather.us_aqi <= 150
          ? '#f59e42' // orange
          : weather.us_aqi <= 200
            ? '#ef4444' // red
            : weather.us_aqi <= 300
              ? '#a21caf' // purple
              : '#7c2d12' // brown
    : '#6b7280';
  const aqiChip = weather && weather.us_aqi != null ? (
    <span
      className="ml-2 px-3 py-1 rounded-full text-xs font-bold border border-gray-300 dark:border-gray-600"
      style={{
        background: '#fff',
        color: aqiColor,
        borderColor: aqiColor,
        boxShadow: '0 1px 4px #0001',
      }}
    >
      AQI: {weather.us_aqi}
    </span>
  ) : null;

  const fetchWeather = async () => {
    if (!city.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/weather?city=${city}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setWeather(data.current);
      setForecast(data.forecast);

      // Fetch AI insights (best-effort)
      try {
        setInsightsLoading(true);
        setInsightsError(null);
        const res2 = await fetch(`/api/generateInsights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city, current: data.current, forecast: data.forecast })
        });
        if (res2.ok) {
          const j = await res2.json();
          setInsights(j.insights);
        } else {
          const err = await res2.text();
          setInsightsError('Insights unavailable');
          console.warn('Insights API error', res2.status, err);
        }
      } catch (e) {
        setInsightsError('Insights unavailable');
        console.warn('Insights fetch failed', e);
      } finally {
        setInsightsLoading(false);
      }
    } catch (err) {
      setError("Failed to fetch weather");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen px-3 md:pl-14 md:pr-24 py-8 fade-in flex flex-col gap-10">
      {/* Hero/Logo Section */}
      <div className="w-full mb-2 flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif tracking-tight text-center text-slate-900 dark:text-slate-100 leading-tight">
          ClimateLens
        </h1>
        <div className="mt-1 text-base md:text-lg font-serif text-center text-slate-600 dark:text-slate-300 max-w-2xl">
          Know before you go. Get today’s weather and air quality, plus what to do next.
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full flex justify-center mb-2">
        <div className="w-full max-w-xl">
          <SearchBar value={city} onChange={setCity} onSearch={fetchWeather} />
        </div>
      </div>

      {/* Loader/Error */}
      {loading && <Loader />}
      {error && (
        <div className="glass-card w-full max-w-2xl text-center text-red-500 font-semibold">{error}</div>
      )}

      {/* Main Content Grid (Weather + Insights) */}
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-6xl flex flex-row rounded-2xl border border-slate-300 dark:border-gray-700 bg-white dark:bg-slate-900 overflow-hidden shadow-lg" style={{height: 'min(420px,40vw)'}}>
          {/* Weather Half */}
          <div className="flex-1 flex flex-col justify-stretch p-8 md:p-10 lg:p-12 border-r border-slate-300 dark:border-gray-700">
            {weather && <WeatherCard data={weather} compact={true} />}
          </div>
          {/* Insights Half */}
          <div className="flex-1 flex flex-col justify-stretch p-8 md:p-10 lg:p-12">
            {insights && (
              <>
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-yellow-200 font-serif">
                  <span className="uppercase tracking-widest font-bold">For • {city || '...'}</span>
                  {aqiChip}
                </div>
                <InsightsCard insights={insights} loading={insightsLoading} error={insightsError} compact={true} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Section (full width below grid) */}
      {forecast.length > 0 && (
        <div className="w-full max-w-6xl mx-auto mt-6">
          <h2 className="section-title mb-4 text-left">Plan Ahead: 5-Day Outlook</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {forecast.map((item, i) => (
              <ForecastCard
                key={i}
                data={item}
                highlight={i === 0}
                onClick={() => openForecastModal(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Forecast Modal */}
      {modalOpen && modalData && (
        <div className="modal-overlay" onClick={closeForecastModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-pink-400 font-bold" onClick={closeForecastModal}>&times;</button>
            <div className="flex flex-col items-center gap-2 py-2">
              {/* Icon */}
              <div className="text-4xl mb-2">
                {(() => {
                  const c = modalData.condition?.toLowerCase() || '';
                  if (c.includes('cloud')) return <span style={{color:'#ffd700'}}>&#9729;</span>;
                  if (c.includes('rain')) return <span style={{color:'#60a5fa'}}>&#127783;</span>;
                  if (c.includes('thunder')) return <span style={{color:'#ffd700'}}>&#9889;</span>;
                  if (c.includes('snow')) return <span style={{color:'#fff'}}>&#10052;</span>;
                  return <span style={{color:'#ffd700'}}>&#9728;</span>;
                })()}
              </div>
              <h3 className="font-serif font-bold text-2xl mb-1" style={{color: 'var(--accent)'}}>{modalData.day}</h3>
              <p className="text-lg font-bold text-gray-700 dark:text-gray-100">{Number(modalData.temp).toFixed(1)}°C</p>
              <p className="capitalize font-serif text-base mb-2" style={{color: 'var(--accent)'}}>{modalData.condition}</p>
              {/* Add more details if available */}
              {modalData.humidity && <p className="text-sm text-gray-500 dark:text-gray-300">Humidity: {modalData.humidity}%</p>}
              {modalData.wind && <p className="text-sm text-gray-500 dark:text-gray-300">Wind: {modalData.wind} m/s</p>}
              {modalData.sunrise && <p className="text-sm text-gray-500 dark:text-gray-300">Sunrise: {modalData.sunrise}</p>}
              {modalData.sunset && <p className="text-sm text-gray-500 dark:text-gray-300">Sunset: {modalData.sunset}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
