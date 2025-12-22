// Deterministic advisory heuristics based on OpenWeather data
// Returns an array of short advisory strings (can be empty)

export function computeAdvisories({ current, forecast = [] }) {
  const advisories = [];

  if (!current) {
    advisories.push('Current weather missing');
    return advisories;
  }

  const temp = Number(current.temp);
  const humidity = Number(current.humidity);
  const wind = Number(current.wind); // m/s

  // Heat advisory
  if (!Number.isNaN(temp)) {
    if (temp >= 35) advisories.push('Extreme heat — avoid prolonged sun exposure');
    else if (temp >= 30) advisories.push('High temperature — stay hydrated and prefer morning/evening activities');
  }

  // Humidity advisory (high discomfort)
  if (!Number.isNaN(humidity)) {
    if (humidity >= 85 && temp >= 25) advisories.push('High humidity with warm temperature — strenuous outdoor activities may be uncomfortable');
  }

  // Wind advisory (m/s thresholds)
  if (!Number.isNaN(wind)) {
    if (wind >= 17) advisories.push('High winds — secure loose items and exercise caution outdoors'); // ~61 km/h
    else if (wind >= 10) advisories.push('Strong winds — consider sheltered activities if sensitive to wind'); // ~36 km/h
  }

  // Forecast-based advisories
  const forecastConditions = forecast.map((f) => (f.condition || '').toLowerCase());
  if (forecastConditions.some((c) => c.includes('rain') || c.includes('thunderstorm') || c.includes('drizzle'))) {
    advisories.push('Rain expected — bring rain gear for outdoor plans');
  }
  if (forecastConditions.filter((c) => c.includes('cloud')).length >= Math.max(1, Math.floor(forecast.length / 2))) {
    advisories.push('Cloudy forecast — photography conditions may be diffused');
  }

  // Unique
  return Array.from(new Set(advisories));
}
