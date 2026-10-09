import React from 'react';
import { Wind, Activity, BarChart3, Cpu, GitBranch } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiStatus }) {
  const navItems = [
    { id: 'home', label: 'Home & AQI Guide', icon: Wind },
    { id: 'predict', label: 'Predict AQI', icon: Activity },
    { id: 'dashboard', label: 'Dashboard & History', icon: BarChart3 },
    { id: 'model', label: 'ML Model & Evaluation', icon: Cpu },
    { id: 'flow', label: 'Project Architecture', icon: GitBranch },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
            <Wind size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AeroVision <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">ML Powered</span>
            </h1>
            <p className="text-xs text-slate-400">AI-Based Air Quality Index Predictor</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-800/60 rounded-xl border border-slate-700/60 overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
          <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-slate-300">
            {apiStatus === 'online' ? 'FastAPI Online' : 'Connecting to API...'}
          </span>
        </div>
      </div>
    </header>
  );
}
