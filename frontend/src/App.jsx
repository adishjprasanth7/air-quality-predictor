import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PredictView from './components/PredictView';
import DashboardView from './components/DashboardView';
import ModelInfoView from './components/ModelInfoView';
import ProjectFlowView from './components/ProjectFlowView';
import SecurityModal from './components/SecurityModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [apiStatus, setApiStatus] = useState('offline');
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);

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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-400 selection:text-slate-950">
      {/* Navigation with Glass Theme and Security Trigger */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiStatus={apiStatus}
        onOpenSecurity={() => setIsSecurityOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HomeView
            onStartPrediction={() => setActiveTab('predict')}
            onOpenSecurity={() => setIsSecurityOpen(true)}
          />
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
