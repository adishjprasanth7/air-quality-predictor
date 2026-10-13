import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PollutionMapView from './components/PollutionMapView';
import PredictView from './components/PredictView';
import DashboardView from './components/DashboardView';
import ModelInfoView from './components/ModelInfoView';
import ProjectFlowView from './components/ProjectFlowView';
import SecurityModal from './components/SecurityModal';
import LoginView from './components/LoginView';
import { API_BASE_URL } from './config/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [apiStatus, setApiStatus] = useState('offline');
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [selectedCityForPredict, setSelectedCityForPredict] = useState(null);
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState('');

  const checkApiHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (res.ok) {
        setApiStatus('online');
      } else {
        setApiStatus('offline');
      }
    } catch {
      setApiStatus('offline');
    }
  };

  useEffect(() => {
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 10000);
    return () => clearInterval(interval);
  }, []);

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
      {/* Navigation with Glass Theme and Security Trigger */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiStatus={apiStatus}
        session={session}
        onSignOut={handleSignOut}
        onOpenSecurity={() => setIsSecurityOpen(true)}
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
            onOpenSecurity={() => setIsSecurityOpen(true)}
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
        {activeTab === 'dashboard' && (
          <DashboardView onGoToPredict={() => setActiveTab('predict')} />
        )}
        {activeTab === 'model' && (
          <ModelInfoView />
        )}
        {activeTab === 'flow' && (
          <ProjectFlowView />
        )}
        {activeTab === 'login' && (
          <LoginView
            session={session}
            onAuthenticated={setSession}
            onBack={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Security Audit Modal */}
      <SecurityModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md px-6 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AeroVision • AI-Based Air Quality Predictor • Powered by Scikit-Learn & FastAPI</p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsSecurityOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline transition"
            >
              Security Defense Audit
            </button>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="font-mono text-slate-500">v1.1.0 (OWASP Hardened)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
