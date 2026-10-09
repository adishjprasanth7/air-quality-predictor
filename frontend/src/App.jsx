import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PredictView from './components/PredictView';
import DashboardView from './components/DashboardView';
import ModelInfoView from './components/ModelInfoView';
import ProjectFlowView from './components/ProjectFlowView';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [apiStatus, setApiStatus] = useState('offline');

  const checkApiHealth = async () => {
    try {
      const res = await fetch('http://localhost:8000/health');
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} apiStatus={apiStatus} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HomeView onStartPrediction={() => setActiveTab('predict')} />
        )}
        {activeTab === 'predict' && (
          <PredictView onPredictionSuccess={() => {}} />
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 AI-Based Air Quality Predictor • Powered by Scikit-Learn & FastAPI</p>
          <p className="flex items-center gap-2">
            <span>Production Machine Learning Architecture</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-slate-400 font-mono">v1.0.0</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
