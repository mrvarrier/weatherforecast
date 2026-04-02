import { useTheme } from '../contexts/ThemeContext';
import { FEATURED_PEAKS } from '@summitscope/core';

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-primary-light dark:text-primary-dark">
            SummitScope
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Mountain & Alpine Weather Forecasting
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="btn-secondary"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>

      {/* Search Bar */}
      <div className="mb-12">
        <div className="card max-w-2xl mx-auto">
          <input
            type="text"
            placeholder="Search for a mountain or location..."
            className="input w-full text-lg"
          />
        </div>
      </div>

      {/* Featured Peaks */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          Featured Peaks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURED_PEAKS.slice(0, 20).map((peak) => (
            <div key={peak.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                {peak.name}
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>{peak.country}</p>
                <p className="font-medium">{peak.elevation.toLocaleString()} m</p>
                <p className="text-xs">{peak.range}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-500">
        <p>
          Built with React, TypeScript, and Tailwind CSS • Weather data from{' '}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-light dark:text-primary-dark hover:underline"
          >
            Open-Meteo
          </a>
        </p>
      </footer>
    </div>
  );
}
