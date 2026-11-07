import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PollutionMapView from './components/PollutionMapView';
import PredictView from './components/PredictView';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCityForPredict, setSelectedCityForPredict] = useState(null);

  const handleSelectCityForPrediction = (city) => {
    setSelectedCityForPredict(city);
    setActiveTab('predict');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-400 selection:text-slate-950">
      {/* Main navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HomeView
            onStartPrediction={() => setActiveTab('predict')}
            onExploreMap={() => setActiveTab('map')}
          />
        )}
        {activeTab === 'map' && (
          <PollutionMapView
            onSelectCityForPrediction={handleSelectCityForPrediction}
          />
        )}
        {activeTab === 'predict' && (
          <PredictView
            initialCityData={selectedCityForPredict}
            onNavigateToMap={() => setActiveTab('map')}
            onPredictionSuccess={() => {}}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AeroVision • AI-Based Air Quality Predictor • Powered by Scikit-Learn & FastAPI</p>
          <span className="font-mono text-slate-500">v1.1.0</span>
        </div>
      </footer>
    </div>
  );
}
