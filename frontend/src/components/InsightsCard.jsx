import { FaLightbulb, FaExclamationTriangle, FaRegClock, FaWalking, FaCamera, FaMapMarkedAlt } from 'react-icons/fa';

const gold = '#ffd700';

export default function InsightsCard({ insights, loading, error, compact }) {
  if (loading) {
    return (
      <div className="glass-card fade-in">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><FaLightbulb /> Travel Insights</h2>
        <p className="text-gray-300">Loading insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card fade-in">
        <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><FaLightbulb /> Travel Insights</h2>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className={`fade-in w-full h-full ${compact ? 'px-0 py-0 bg-transparent border-none rounded-none shadow-none' : 'glass-card'}`}> 
      <h2
        className="text-xl md:text-2xl font-bold mb-2 flex items-center gap-2 font-serif tracking-tight text-left text-slate-100 dark:text-yellow-100"
        style={{ letterSpacing: '-0.02em' }}
      >
        <FaLightbulb className="text-yellow-400 dark:text-yellow-300 text-2xl" />
        <span>Step Out Smart</span>
      </h2>
      <div className="flex flex-col md:flex-row gap-2 md:gap-4">
        {/* Left: summary and best time */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <span className="block mb-1 text-base md:text-lg font-medium text-slate-100 dark:text-yellow-100 max-w-[95%] leading-snug break-words">
            {insights.summary || 'Here’s what matters for your plans today.'}
          </span>
          {insights.best_time_of_day && (
            <span className="inline-flex items-center gap-1 text-sm md:text-base font-medium text-slate-100 dark:text-yellow-100 max-w-full leading-tight">
              <FaRegClock className="align-middle mr-1" />
              Go out: <strong className="ml-1 text-base font-bold">{insights.best_time_of_day.period}</strong>
              <span className="ml-2 text-xs md:text-sm">{insights.best_time_of_day.reason}</span>
            </span>
          )}
        </div>
        {/* Right: activities, no card nesting */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {Array.isArray(insights.activity_suitability) && insights.activity_suitability.map((r, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="font-semibold flex items-center gap-1 min-h-[1.7rem] text-sm md:text-base">
                <FaWalking className="text-pink-400 dark:text-yellow-200 text-base align-middle" />
                <span className="flex items-center text-slate-100 dark:text-yellow-100">{r.activity}</span>
                <span
                  className="badge text-[10px] px-1 py-0.5 ml-1 font-normal bg-slate-50 dark:bg-gray-900 text-slate-400 dark:text-gray-500 rounded"
                  style={{
                    fontWeight: 400,
                    minWidth: '1.3rem',
                    textAlign: 'center',
                    alignSelf: 'center',
                    opacity: 0.7,
                  }}
                >
                  {r.suitability}
                </span>
              </div>
              <span className="block mt-0.5 text-xs font-normal text-slate-400 dark:text-gray-400 max-w-full leading-tight break-words">{r.reason}</span>
            </div>
          ))}
        </div>
      </div>
      {insights.advisories && insights.advisories.length > 0 && (
        <div className="text-xs md:text-xs mt-2" style={{color: 'var(--accent)'}}>
          <div
            className="flex items-center gap-1 font-semibold mb-1"
            style={{ color: 'var(--accent-strong)' }}
          >
            <FaExclamationTriangle className="text-yellow-400 dark:text-yellow-300" />
            <span className="text-slate-100 dark:text-yellow-100">Advisories:</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {insights.advisories.map((a, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-yellow-900/80 dark:bg-yellow-900/40 text-yellow-100 dark:text-yellow-200 font-medium text-xs shadow-sm transition-all duration-200 hover:bg-pink-200 dark:hover:bg-yellow-700/60 hover:text-pink-900 dark:hover:text-yellow-100"
                style={{lineHeight: '1.5'}}>
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
