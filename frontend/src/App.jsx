import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PollutionMapView from './components/PollutionMapView';
import PredictView from './components/PredictView';
import LoginView from './components/LoginView';
import { API_BASE_URL } from './config/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCityForPredict, setSelectedCityForPredict] = useState(null);
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Authentication check failed (${response.status}).`);
        return response.json();
      })
      .then((data) => {
        if (isMounted) setSession(data.user ? { user: data.user } : null);
      })
      .catch((error) => {
        console.error('Could not restore the authentication session:', error);
        if (isMounted) setAuthError('Could not check your sign-in status. Please refresh and try again.');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = async () => {
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Sign out failed (${response.status}).`);
      setSession(null);
    } catch (error) {
      console.error('Could not sign out:', error);
      setAuthError('Could not sign out. Please try again.');
    }
  };

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
        session={session}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {authError && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert">
            <span>{authError}</span>
            <button type="button" className="underline underline-offset-4" onClick={() => setAuthError('')}>Dismiss</button>
          </div>
        )}
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
        {activeTab === 'login' && (
          <LoginView
            session={session}
            onAuthenticated={setSession}
            onBack={() => setActiveTab('home')}
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
