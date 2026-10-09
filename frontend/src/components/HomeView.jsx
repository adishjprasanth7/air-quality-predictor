import React from 'react';
import { ShieldCheck, AlertTriangle, Activity, ArrowRight, Gauge, Cpu, Database, CheckCircle2 } from 'lucide-react';

export default function HomeView({ onStartPrediction }) {
  const aqiCategories = [
    { range: '0 - 50', label: 'Good', color: '#10b981', desc: 'Minimal impact on health. Ideal for outdoor recreation.' },
    { range: '51 - 100', label: 'Satisfactory', color: '#84cc16', desc: 'Minor discomfort to hypersensitive people.' },
    { range: '101 - 200', label: 'Moderate', color: '#f59e0b', desc: 'Breathing discomfort to people with asthma and heart ailments.' },
    { range: '201 - 300', label: 'Poor', color: '#f97316', desc: 'Breathing discomfort to most people on sustained exposure.' },
    { range: '301 - 400', label: 'Very Poor', color: '#ef4444', desc: 'Respiratory illness on prolonged exposure.' },
    { range: '401+', label: 'Severe', color: '#881337', desc: 'Health emergency. Affects healthy people and critically impairs sensitive groups.' },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl glass-panel p-8 md:p-12 border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/30">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Cpu size={14} /> End-to-End Machine Learning System
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Predict Real-World Air Quality with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Machine Intelligence</span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg leading-relaxed">
            Trained on authentic Central Pollution Control Board (CPCB) criteria pollutant records.
            Provides instant, calibrated Air Quality Index (AQI) values along with standard health risk categorization and advisories.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              id="hero-start-btn"
              onClick={onStartPrediction}
              className="glow-btn text-base px-6 py-3 rounded-xl font-semibold"
            >
              Start AQI Prediction <ArrowRight size={18} />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Real Scikit-learn Pipeline (No Hardcoded Values)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding AQI & Importance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-3 text-cyan-400">
            <Gauge size={24} />
            <h2 className="text-xl font-bold text-white">What is the Air Quality Index (AQI)?</h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            The Air Quality Index (AQI) is a standard scale developed by environmental authorities (such as the EPA and CPCB) to quantify how clean or polluted the ambient air is. It synthesizes complex concentrations of multiple harmful gases and particulates into a single intuitive number and color-coded risk grade.
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Key criteria pollutants measured include <strong className="text-slate-200">PM2.5</strong> (fine particles smaller than 2.5 micrometers), <strong className="text-slate-200">PM10</strong>, <strong className="text-slate-200">NO2</strong>, <strong className="text-slate-200">SO2</strong>, <strong className="text-slate-200">CO</strong>, and <strong className="text-slate-200">O3</strong>.
          </p>
        </div>

        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <Activity size={24} />
            <h2 className="text-xl font-bold text-white">Why Air Quality Prediction is Critical</h2>
          </div>
          <ul className="space-y-2.5 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Preventive Healthcare:</strong> Alerts vulnerable populations (asthma, cardiovascular patients, children, elderly) ahead of dangerous spikes.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Urban Decision Support:</strong> Enables city planners and traffic regulators to enforce temporary emissions curbs and school schedule adjustments.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Industrial Compliance:</strong> Assesses atmospheric load to regulate thermal and industrial plant emissions in real time.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* AQI Categories Standard Grid */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>National AQI Standard Scale & Categories</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {aqiCategories.map((cat, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-xl border-l-4 transition-transform hover:-translate-y-1"
              style={{ borderLeftColor: cat.color }}
            >
              <div className="text-xs font-mono font-semibold text-slate-400">{cat.range}</div>
              <div className="text-lg font-bold mt-1" style={{ color: cat.color }}>{cat.label}</div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How the System Works */}
      <section className="glass-panel p-6 md:p-8 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="text-cyan-400" size={22} />
          <span>How the System Works End-to-End</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">1</div>
            <h3 className="font-semibold text-white text-base">Pollutant Inputs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accepts verified criteria pollutant measurements: PM2.5, PM10, NO2, CO, SO2, and O3 with Pydantic type safety and boundary checking.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">2</div>
            <h3 className="font-semibold text-white text-base">ML Model Inference</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Features are scaled and fed into the trained Scikit-learn Pipeline (Random Forest / Gradient Boosting) to compute continuous AQI predictions.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">3</div>
            <h3 className="font-semibold text-white text-base">Advisory & MongoDB History</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maps AQI into official risk bands, delivers targeted precautions, and persists prediction sessions to MongoDB for historical trend analytics.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
