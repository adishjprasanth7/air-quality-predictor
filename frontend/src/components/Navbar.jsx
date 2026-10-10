import React from 'react';
import { Wind, Activity, BarChart3, Cpu, GitBranch, ShieldCheck, MapPin } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiStatus, onOpenSecurity }) {
  const navItems = [
    { id: 'home', label: 'Home & AQI Guide', icon: Wind },
    { id: 'map', label: 'Pollution Map & Cities', icon: MapPin },
    { id: 'predict', label: 'Predict AQI', icon: Activity },
    { id: 'dashboard', label: 'Dashboard & History', icon: BarChart3 },
    { id: 'model', label: 'ML Model & Evaluation', icon: Cpu },
    { id: 'flow', label: 'Project Architecture', icon: GitBranch },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/75 border-b border-white/10 px-6 py-3.5 shadow-2xl transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-linear-to-tr from-cyan-400 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 animate-float">
            <Wind size={22} className="text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              AeroVision
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                ML System
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">AI-Based Air Quality Index Predictor</p>
          </div>
        </div>

        {/* Navigation Tabs with Glass Pill */}
        <nav className="flex items-center gap-1.5 p-1.5 bg-slate-900/70 rounded-2xl border border-white/10 backdrop-blur-md overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-linear-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Widgets */}
        <div className="flex items-center gap-2.5">
          {/* Security Status Badge & Button */}
          <button
            onClick={onOpenSecurity}
            title="View Live OWASP Security Defense Report"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-400 text-xs font-semibold transition duration-200 hover:shadow-lg hover:shadow-emerald-500/10"
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">OWASP Hardened</span>
          </button>

          {/* API Health */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs">
            <span className={`w-2 h-2 rounded-full ${apiStatus === 'online' ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium font-mono text-[11px]">
              {apiStatus === 'online' ? 'API Online' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
