import React from 'react';
import { ShieldCheck, Activity, ArrowRight, Gauge, Cpu, CheckCircle2, Shield, Lock, Sliders, Layers } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

export default function HomeView({ onStartPrediction, onOpenSecurity }) {
  const [heroRef, heroVisible] = useScrollReveal();
  const [eduRef, eduVisible] = useScrollReveal();
  const [catRef, catVisible] = useScrollReveal();
  const [workflowRef, workflowVisible] = useScrollReveal();
  const [secRef, secVisible] = useScrollReveal();

  const aqiCategories = [
    { range: '0 - 50', label: 'Good', color: '#10b981', desc: 'Minimal impact on health. Ideal for outdoor recreation.' },
    { range: '51 - 100', label: 'Satisfactory', color: '#84cc16', desc: 'Minor discomfort to hypersensitive individuals.' },
    { range: '101 - 200', label: 'Moderate', color: '#f59e0b', desc: 'Breathing discomfort to people with asthma or cardiac ailments.' },
    { range: '201 - 300', label: 'Poor', color: '#f97316', desc: 'Breathing discomfort to most people on sustained exposure.' },
    { range: '301 - 400', label: 'Very Poor', color: '#ef4444', desc: 'Respiratory illness on prolonged exposure.' },
    { range: '401+', label: 'Severe', color: '#881337', desc: 'Health emergency. Critically impacts healthy individuals.' },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className={`relative overflow-hidden glass-card p-8 md:p-14 border border-cyan-500/20 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-cyan-950/20 transition-all duration-700 ${
          heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wide">
            <Cpu size={14} className="text-cyan-400" />
            <span>End-to-End Supervised ML Pipeline</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Predict Real-World Air Quality with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
              Machine Intelligence
            </span>
          </h1>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed font-normal">
            Trained on authentic Central Pollution Control Board (CPCB) criteria pollutant records.
            Provides instant, calibrated Air Quality Index (AQI) values along with standard health risk categorization and actionable precautions.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              id="hero-start-btn"
              onClick={onStartPrediction}
              className="glass-btn text-sm md:text-base px-7 py-3.5 rounded-xl font-bold shadow-lg shadow-cyan-400/25"
            >
              Start AQI Prediction <ArrowRight size={18} />
            </button>
            <button
              onClick={onOpenSecurity}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold transition"
            >
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Security Controls</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>Non-heuristic regression model (Gradient Boosting $R^2 = 0.8710$)</span>
          </div>
        </div>
      </section>

      {/* Understanding AQI & Importance */}
      <section
        ref={eduRef}
        className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-all duration-700 ${
          eduVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="glass-card p-8 space-y-4 border-white/10 hover:border-cyan-400/30">
          <div className="flex items-center gap-3 text-cyan-400">
            <div className="p-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
              <Gauge size={22} />
            </div>
            <h2 className="text-xl font-bold text-white">What is the Air Quality Index (AQI)?</h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            The Air Quality Index (AQI) translates complex atmospheric readings of multiple harmful gases and micro-particulates into a single, intuitive number and color-coded risk category established by environmental authorities (such as CPCB and EPA).
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Key criteria pollutants measured in this system include <strong className="text-slate-200">PM2.5</strong> (particles ≤ 2.5 µm), <strong className="text-slate-200">PM10</strong>, <strong className="text-slate-200">NO2</strong>, <strong className="text-slate-200">CO</strong>, <strong className="text-slate-200">SO2</strong>, and <strong className="text-slate-200">O3</strong>.
          </p>
        </div>

        <div className="glass-card p-8 space-y-4 border-white/10 hover:border-emerald-400/30">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="p-2.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20">
              <Activity size={22} />
            </div>
            <h2 className="text-xl font-bold text-white">Why Air Quality Prediction Matters</h2>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Preventive Healthcare:</strong> Alerts vulnerable populations (asthma, cardiovascular patients, children, elderly) ahead of dangerous particulate spikes.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Urban Decision Support:</strong> Enables city administrators and traffic regulators to enforce emissions curbs and school schedule adjustments.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Industrial Regulation:</strong> Assesses real-time atmospheric carrying capacity to govern thermal emissions dynamically.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* AQI Categories Standard Grid */}
      <section
        ref={catRef}
        className={`space-y-6 transition-all duration-700 ${
          catVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>National AQI Standard Scale & Risk Grades</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">CPCB Guidelines</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {aqiCategories.map((cat, idx) => (
            <div
              key={idx}
              className="glass-card p-5 border-l-4 transition-all duration-300 hover:-translate-y-1.5"
              style={{ borderLeftColor: cat.color }}
            >
              <div className="text-xs font-mono font-bold text-slate-400">{cat.range}</div>
              <div className="text-lg font-black mt-1 tracking-tight" style={{ color: cat.color }}>
                {cat.label}
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How the System Works */}
      <section
        ref={workflowRef}
        className={`glass-card p-8 md:p-10 space-y-8 border-white/10 transition-all duration-700 ${
          workflowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-400/10 text-cyan-400">
            <Cpu size={22} />
          </div>
          <span>How the System Works End-to-End</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3 hover:border-cyan-400/20 transition">
            <div className="w-9 h-9 rounded-xl bg-cyan-400/10 text-cyan-300 font-extrabold flex items-center justify-center text-sm border border-cyan-400/20">
              01
            </div>
            <h3 className="font-bold text-white text-base">Pollutant Inputs</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accepts verified criteria pollutant measurements: PM2.5, PM10, NO2, CO, SO2, and O3 with Pydantic type safety and finite real-number sanitization.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3 hover:border-blue-400/20 transition">
            <div className="w-9 h-9 rounded-xl bg-blue-400/10 text-blue-300 font-extrabold flex items-center justify-center text-sm border border-blue-400/20">
              02
            </div>
            <h3 className="font-bold text-white text-base">ML Inference Pipeline</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scaled through median imputation and StandardScaler, then predicted via our holdout-winning Gradient Boosting Regressor pipeline.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 space-y-3 hover:border-emerald-400/20 transition">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/10 text-emerald-300 font-extrabold flex items-center justify-center text-sm border border-emerald-400/20">
              03
            </div>
            <h3 className="font-bold text-white text-base">Advisory & MongoDB Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maps AQI to official NAQI risk categories, delivers medical precautions, and stores the session into MongoDB for chronological telemetry.
            </p>
          </div>
        </div>
      </section>

      {/* Production Security Card */}
      <section
        ref={secRef}
        className={`glass-card p-8 md:p-10 space-y-6 border-emerald-500/20 bg-gradient-to-br from-slate-900/80 via-slate-900/50 to-emerald-950/20 transition-all duration-700 ${
          secVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck size={14} /> Built with Enterprise Security
            </div>
            <h2 className="text-2xl font-bold text-white">Full-Stack Security & Defense in Depth</h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Equipped with IP-based sliding window rate limiting (Anti-DoS), OWASP security headers (CSP, HSTS, X-Frame-Options), strict Pydantic input scrubbing, and buffer overflow payload guards.
            </p>
          </div>
          <button
            onClick={onOpenSecurity}
            className="px-5 py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-2 shrink-0"
          >
            <Lock size={15} />
            <span>Open Security Audit</span>
          </button>
        </div>
      </section>
    </div>
  );
}
