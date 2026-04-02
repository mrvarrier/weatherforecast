import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UnitsProvider } from './contexts/UnitsContext';
import HomePage from './pages/HomePage';

function App() {
  return (
    <ThemeProvider>
      <UnitsProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background-light dark:bg-background-dark">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/peak/:id" element={<div className="p-8 text-center">Peak Detail (Coming Soon)</div>} />
              <Route path="/saved" element={<div className="p-8 text-center">Saved Locations (Coming Soon)</div>} />
              <Route path="/settings" element={<div className="p-8 text-center">Settings (Coming Soon)</div>} />
            </Routes>
          </div>
        </BrowserRouter>
      </UnitsProvider>
    </ThemeProvider>
  );
}

export default App;
