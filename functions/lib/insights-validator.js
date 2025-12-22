// Lightweight insights validator to avoid adding external deps like Zod for now.
// Ensures the LLM-produced object matches expected shape.

export function validateInsights(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') {
    errors.push('insights must be an object');
    return { ok: false, errors };
  }


  const { summary, best_time_of_day, activity_suitability, advisories } = obj;

  if (typeof summary !== 'string' || summary.trim().length === 0) {
    errors.push('summary must be a non-empty string');
  }

  // Accept best_time_of_day as an object with period and reason
  if (
    !best_time_of_day ||
    typeof best_time_of_day !== 'object' ||
    typeof best_time_of_day.period !== 'string' ||
    typeof best_time_of_day.reason !== 'string'
  ) {
    errors.push('best_time_of_day must be an object with period and reason');
  }

  // Accept activity_suitability as the recommendations array
  if (!Array.isArray(activity_suitability)) {
    errors.push('activity_suitability must be an array');
  } else {
    for (const r of activity_suitability) {
      if (!r || typeof r !== 'object' || typeof r.activity !== 'string' || typeof r.suitability !== 'string' || typeof r.reason !== 'string') {
        errors.push('each activity_suitability item must be an object { activity, suitability, reason }');
        break;
      }
    }
  }

  if (!Array.isArray(advisories) || advisories.some((a) => typeof a !== 'string')) {
    errors.push('advisories must be an array of strings');
  }

  const ok = errors.length === 0;
  return { ok, errors };
}
