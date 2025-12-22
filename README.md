ClimateLens
ClimateLens is a modern, fast, and intuitive weather forecasting application built with React, Tailwind CSS, and serverless backend functions.
It delivers real-time weather updates, a 5-day forecast, and a clean user experience — powered by the OpenWeatherMap API.

Features:
1) Live Weather Data → temperature, humidity, conditions, wind
2) 5-Day Forecast → simplified and easy to read
3) Serverless Backend → secure, scalable API layer
4) Modern UI → responsive, fast, Tailwind-powered
5) Optimized Requests → caching to reduce API load
6) Environment-Safe → API keys protected via environment variables

Tech Stack:
Frontend
1) React (Vite)
2) Tailwind CSS
3) Axios
Backend
1) Serverless Functions (Netlify / Vercel)
2) Node.js
3) OpenWeatherMap API
Deployment
1) Netlify / Vercel (free)

Project Structure: 
ClimateLens/
├── frontend/              # React + Tailwind app
├── functions/             # Serverless API endpoints
│   ├── getCurrentWeather.js
│   └── getForecast.js
├── docs/                  # Architecture diagrams, notes
├── README.md
├── LICENSE
└── .gitignore

Setup Instructions:
1. Clone the repository
git clone https://github.com/your-username/ClimateLens.git
cd ClimateLens

2. Backend (Serverless Functions)
Create a file:
functions/.env
And add:
OWM_KEY=your_openweathermap_api_key

AI travel insights (optional)
This project includes a serverless endpoint that uses an LLM to generate travel-friendly insights from the existing OpenWeather data.

- File: `functions/generateInsights.js`
- Env vars to set: `LLM_API_KEY` (and optionally `LLM_API_URL` if using an alternate provider)
- Optional provider switch: `LLM_PROVIDER` can be set to `openai` (default) or `google` to use Google Generative/Gemini endpoints. When using `google` set `LLM_MODEL` to a compatible model (e.g., `gemini-2.0-flash`) and ensure `LLM_API_KEY` has the right permissions.
- If using Google/Gemini, set `LLM_PROVIDER=google` (or set `LLM_API_URL` to your provider's endpoint). The client will adapt request/response shapes for Google generative APIs when `LLM_PROVIDER=google` or when your API key looks like a Google key.
- Important: **Do NOT commit** API keys. If a key is exposed, revoke/rotate it immediately and store secrets in env files or platform environment variables (functions/.env is ignored by default).

Example request (POST JSON):

{
  "city": "London",
  "current": {"temp": 10.5, "humidity": 80, "wind": 4.1, "condition": "Clouds"},
  "forecast": [{"day":"Tue","temp":11.2,"condition":"Clouds"}, ...]
}

Response:

{
  "insights": {
    "summary": "Good day for sightseeing.",
    "best_time_of_day": "morning",
    "recommendations": ["outdoor sightseeing","photography"],
    "advisories": ["High winds — secure loose items"]
  }
}

Notes:
- The LLM is only allowed to use the provided data. The prompt explicitly instructs it not to invent additional weather or predictions.
- Deterministic advisories (heat, wind, rain, humidity) are computed server-side and merged with the LLM's output. This ensures evidence-based safety guidance is always present.
- For local development you can run without `LLM_API_KEY` — the function will return a mock response. Do not commit your keys to the repo.

Enable real LLM outputs locally (example)
1) Create or edit `functions/.env` and add your LLM key (and optional model override):

```
OWM_KEY=your_openweathermap_api_key
LLM_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LLM_PROVIDER=openai # or 'google' for Google Generative/Gemini
LLM_MODEL=gpt-4o-mini # optional, or 'gemini-2.0-flash' for Google
LLM_API_URL= # optional, if using a provider other than OpenAI (or to override Google endpoint)
```

2) Restart Netlify Dev (from repo root):

```powershell
netlify dev
```

3) Verify by calling the insights endpoint (or use the UI):

```powershell
# Using the direct handler test (no Netlify required):
node scripts/e2e-direct.js

# Or, with Netlify Dev running, call the proxied endpoint:
curl.exe -v "http://localhost:8888/api/weather?city=London"
curl.exe -v "http://localhost:8888/api/generateInsights" -X POST -H "Content-Type: application/json" -d "{\"city\":\"London\",\"current\":{\"temp\":10.5,\"humidity\":80,\"wind\":4.1,\"condition\":\"Clouds\"},\"forecast\":[{\"day\":\"Tue\",\"temp\":11.2,\"condition\":\"Clouds\"}] }"
```

You should see different `summary`/`recommendations` for different cities when `LLM_API_KEY` is set and the LLM provider returns JSON in the expected format.


Local dev (recommended)
If you're running locally with Vite + Netlify Dev, use the project root `netlify dev` command which will automatically run the frontend dev server via Vite. Example:

```powershell
# from project root
netlify dev
```

If you prefer running Vite directly, start it in the `frontend` folder and then run Netlify Dev with the `targetPort` set to match Vite (the repo already configures this):

```powershell
# from project root (also used by CI)
npm ci
npm run build
```

CI & Deployment (GitHub + Netlify) ✅

This repo includes a GitHub Actions workflow that:
- runs the test suite on push and pull requests to `main` (quick checks), and
- when changes are pushed to `main`, builds the frontend and deploys to Netlify.

Setup steps for automated deploy:
1) Create a new GitHub repository and push your code to it.
2) In your Netlify dashboard, create a site (or get the `Site ID` from an existing site) and generate a **Personal access token** (`NETLIFY_AUTH_TOKEN`).
3) In your GitHub repo settings, add two **Secrets**:
   - `NETLIFY_AUTH_TOKEN` (from Netlify)
   - `NETLIFY_SITE_ID` (the site's ID)
4) Optionally add `OWM_KEY` and `LLM_API_KEY` to Netlify environment variables via the Netlify UI for production requests.

Once configured, pushing to `main` will run tests and deploy automatically. You can also use the local `deploy:netlify` npm script after building to push manual deploys.

Resume / Recruiter blurb (example)

Add this to your resume/portfolio to highlight the project:

"Built ClimateLens — a serverless weather insights web app using React, Tailwind CSS, and Netlify functions. It fetches OpenWeatherMap data and generates travel-focused insights with a guarded LLM integration. Implemented robust validation, caching, CI, and automated deployment to Netlify. Live demo: <YOUR_DEPLOY_URL>"

Replace `<YOUR_DEPLOY_URL>` with your live site link after deployment.

```
# Option A (Vite only)
cd frontend
npm run dev

# Option B (Netlify Dev proxies to Vite)
# from project root
netlify dev
```
3. Frontend Setup
cd frontend
npm install
cp .env.example .env
npm run dev

Inside .env:
VITE_API_BASE=/api

Deployment:
ClimateLens is designed to run 100% free on:
- Netlify
1) Connect GitHub repo
2) Add env variable OWM_KEY
3) Netlify automatically deploys frontend + backend functions
- Vercel
1) Import repo
2) Add env variable OWM_KEY
3) Auto-build and deploy

License:
MIT License

Author:
Rakshit Chauhan
Built for learning, portfolio enhancement, and real-world software development practice.
