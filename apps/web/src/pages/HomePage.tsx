import { FEATURED_PEAKS } from '../../../../packages/core/src/index';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-xl">⛰️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">SummitScope</h1>
                <p className="text-xs text-slate-500">Mountain Weather Intelligence</p>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <button className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Saved
              </button>
              <button className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
                Settings
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Plan Your Next Summit
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Real-time weather forecasts for the Pacific Northwest's most iconic peaks
          </p>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for a mountain or location..."
              className="input w-full pl-12 pr-4 py-4 text-base shadow-lg"
            />
          </div>
        </div>

        {/* Featured Peaks */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-900">Featured Peaks</h3>
            <span className="text-sm text-slate-500">{FEATURED_PEAKS.length} mountains</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURED_PEAKS.map((peak) => (
              <div
                key={peak.id}
                className="card group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
              >
                {/* Peak Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-lg mb-1 truncate group-hover:text-primary-700 transition-colors">
                      {peak.name}
                    </h4>
                    <p className="text-sm text-slate-500 truncate">{peak.country}</p>
                  </div>
                </div>

                {/* Elevation Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 rounded-lg mb-3">
                  <svg
                    className="w-4 h-4 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                  <span className="font-semibold text-primary-700">
                    {peak.elevation.toLocaleString()} m
                  </span>
                </div>

                {/* Range Info */}
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <svg
                    className="w-3.5 h-3.5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="truncate">{peak.range}</span>
                </div>

                {/* View Forecast Link */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-600 font-medium group-hover:text-primary-700">
                      View Forecast
                    </span>
                    <svg
                      className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-slate-200 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-slate-600">
              <span>Weather data from{' '}
                <a
                  href="https://open-meteo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Open-Meteo
                </a>
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>Built with React & TypeScript</span>
            </div>
            <p className="text-xs text-slate-400">
              © 2024 SummitScope. Mountain weather intelligence for climbers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
