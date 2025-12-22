
import { WiDaySunny, WiCloud, WiRain, WiThunderstorm, WiSnow } from 'react-icons/wi';
const gold = '#ffd700';
function getIcon(condition) {
  const c = condition?.toLowerCase() || '';
  if (c.includes('cloud')) return <WiCloud className="text-yellow-200 text-3xl" />;
  if (c.includes('rain')) return <WiRain className="text-blue-400 text-3xl" />;
  if (c.includes('thunder')) return <WiThunderstorm className="text-yellow-400 text-3xl" />;
  if (c.includes('snow')) return <WiSnow className="text-white text-3xl" />;
  return <WiDaySunny className="text-yellow-300 text-3xl" />;
}

export default function ForecastCard({ data, highlight, onClick }) {
  return (
    <button
      type="button"
      className={`fade-in flex flex-col items-center px-2 py-2 md:px-1 md:py-2 focus:outline-none transition-all duration-200
        border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-900
        ${highlight ? 'border-2 border-pink-300 bg-pink-50/40 dark:bg-gray-900/80' : ''}`}
      style={{ boxShadow: 'none', cursor: 'pointer', minWidth: '0', minHeight: '0' }}
      onClick={onClick}
      tabIndex={0}
    >
      <div className="mb-1">{getIcon(data.condition)}</div>
      <h3 className="font-serif font-bold text-sm md:text-base mb-0.5 tracking-tight text-left" style={{ color: 'var(--accent)' }}>{data.day}</h3>
      <p className="text-gray-700 dark:text-gray-100 text-base md:text-lg font-extrabold">{Number(data.temp).toFixed(1)}°C</p>
      <p className="capitalize font-serif text-xs md:text-xs text-slate-500 dark:text-slate-300" style={{ color: 'var(--accent)' }}>{data.condition}</p>
    </button>
  );
}
