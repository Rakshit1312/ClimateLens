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
