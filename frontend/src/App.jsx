import Home from "./pages/Home";
import './App.css';
import { useState, useEffect } from 'react';

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen" style={{background: 'var(--bg-gradient)', color: 'var(--text-main)'}}>
      <div className="fixed top-4 right-4 z-50">
        <button
          className="rounded-full px-4 py-2 font-semibold shadow bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-yellow-200 transition-all"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
      <Home />
    </div>
  );
}
