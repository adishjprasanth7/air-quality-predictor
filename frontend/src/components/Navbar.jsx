import React from 'react';
import { Wind, Activity, MapPin, LogIn, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, session, onSignOut }) {
  const navItems = [
    { id: 'home', label: 'Home & AQI Guide', icon: Wind },
    { id: 'map', label: 'Pollution Map & Cities', icon: MapPin },
    { id: 'predict', label: 'Predict AQI', icon: Activity },
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
          {session ? (
            <button
              onClick={onSignOut}
              title={`Sign out ${session.user.email || 'of AeroVision'}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/10 transition text-xs font-semibold whitespace-nowrap"
            >
              <LogOut size={15} />
              <span>Sign out</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('login')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-cyan-400/30 text-cyan-200 hover:bg-cyan-400/10 transition text-xs font-semibold whitespace-nowrap"
            >
              <LogIn size={15} />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
