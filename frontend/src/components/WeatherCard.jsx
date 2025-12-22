import { WiDaySunny, WiCloud, WiStrongWind, WiHumidity, WiSunrise, WiSunset, WiTime3 } from 'react-icons/wi';
import { FaSmog } from 'react-icons/fa';

const gold = '#ffd700';

export default function WeatherCard({ data, compact }) {
  function formatIST(unix) {
    if (!unix) return 'N/A';
    const date = new Date(unix * 1000);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
  }

  const sunrise = formatIST(data.sunrise);
  const sunset = formatIST(data.sunset);
  const localTime = data.local_dt ? new Date(data.local_dt * 1000).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }) : 'N/A';

  // Icon for weather condition
  const conditionIcon = data.condition?.toLowerCase().includes('cloud') ? <WiCloud className="inline text-2xl align-middle" /> :
    data.condition?.toLowerCase().includes('wind') ? <WiStrongWind className="inline text-2xl align-middle" /> :
    data.condition?.toLowerCase().includes('sun') ? <WiDaySunny className="inline text-2xl align-middle" /> :
    <WiDaySunny className="inline text-2xl align-middle" />;

  return (
    <div
      className={`fade-in w-full h-full ${compact ? 'px-0 py-0 bg-transparent border-none rounded-none shadow-none' : 'max-w-2xl rounded-2xl shadow-lg border bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-gray-700 px-7 py-8'}`}
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-2 text-left flex items-center gap-2 font-serif tracking-tight text-slate-100 dark:text-slate-100"
        style={{ letterSpacing: '-0.03em' }}
      >
        <WiDaySunny className="text-slate-400 dark:text-slate-400 text-2xl" />
        <span>Current Weather</span>
      </h2>
      <div className="flex flex-col md:flex-row md:space-x-10">
        {/* Weather Section */}
        <div className="flex-1 pb-4 md:pb-0 md:pr-10">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 font-serif text-slate-700 dark:text-yellow-200 uppercase tracking-wider">
            <WiDaySunny className="text-yellow-400 dark:text-yellow-200" /> Weather
          </h3>
          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-right font-medium text-slate-500 dark:text-slate-300 pr-2 text-sm">Temperature:</div>
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-2xl md:text-3xl font-extrabold">
              {Number(data.temp).toFixed(1)}°C
            </div>
            <div className="text-right font-medium text-slate-500 dark:text-slate-300 pr-2 text-sm">Condition:</div>
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-base font-semibold">
              {data.condition}
              <span className="ml-1 align-middle">{conditionIcon}</span>
            </div>
            <div className="text-right font-medium text-slate-500 dark:text-slate-300 pr-2 text-sm">Humidity:</div>
            <div className="text-right font-medium text-slate-400 dark:text-slate-400 pr-2 text-xs">Humidity</div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm"><WiHumidity /> {data.humidity}%</div>
            <div className="text-right font-medium text-slate-400 dark:text-slate-400 pr-2 text-xs">Wind</div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm"><WiStrongWind /> {Math.round(Number(data.wind) * 3.6 * 100) / 100} km/h</div>
            <div className="text-right font-medium text-slate-400 dark:text-slate-400 pr-2 text-xs">Sunrise</div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm"><WiSunrise /> {sunrise}</div>
            <div className="text-right font-medium text-slate-400 dark:text-slate-400 pr-2 text-xs">Sunset</div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm"><WiSunset /> {sunset}</div>
            <div className="text-right font-medium text-slate-400 dark:text-slate-400 pr-2 text-xs">Local Time (IST)</div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm"><WiTime3 /> {localTime}</div>
          </div>
        </div>
        {/* Air Quality Section */}
        <div className="flex-1 pt-4 md:pt-0 md:pl-8">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 font-serif text-slate-700 dark:text-yellow-200">
            <FaSmog className="text-yellow-400 dark:text-yellow-200" /> Air Quality
          </h3>
          <div className="grid grid-cols-2 gap-y-2">
            <div className="text-right font-medium text-slate-600 dark:text-slate-200 pr-2">AQI (US/EPA):</div>
            <div>
              {data.us_aqi != null ? (
                <span
                  className="badge text-xs font-bold"
                  style={{
                    background: data.us_aqi <= 50 ? 'linear-gradient(90deg,#b4ec51,#429321)' :
                      data.us_aqi <= 100 ? 'linear-gradient(90deg,#f9d423,#ff4e50)' :
                      data.us_aqi <= 150 ? 'linear-gradient(90deg,#f7971e,#ffd200)' :
                      data.us_aqi <= 200 ? 'linear-gradient(90deg,#f953c6,#b91d73)' :
                      data.us_aqi <= 300 ? 'linear-gradient(90deg,#fdc830,#f37335)' :
                      'linear-gradient(90deg,#e96443,#904e95)',
                    color: data.us_aqi <= 100 ? '#1e293b' : '#fff',
                    border: '1px solid #e5e7eb',
                    textShadow: data.us_aqi > 100 ? '0 1px 2px #0008' : 'none',
                  }}
                >
                  {data.us_aqi}
                </span>
              ) : 'N/A'}
            </div>
            <div className="text-right font-medium text-slate-600 dark:text-slate-200 pr-2">AQI (EU):</div>
            <div className="text-slate-800 dark:text-slate-100">{data.aqi != null ? data.aqi : 'N/A'}</div>
            <div className="text-right font-medium text-slate-600 dark:text-slate-200 pr-2">PM2.5 (µg/m³):</div>
            <div className="text-slate-800 dark:text-slate-100">{data.pm2_5 != null ? data.pm2_5 : 'N/A'}</div>
            <div className="text-right font-medium text-slate-600 dark:text-slate-200 pr-2">PM10 (µg/m³):</div>
            <div className="text-slate-800 dark:text-slate-100">{data.pm10 != null ? data.pm10 : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
