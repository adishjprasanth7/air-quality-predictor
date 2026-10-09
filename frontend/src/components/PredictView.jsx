import React, { useState } from 'react';
import { Activity, AlertCircle, RefreshCw, Sparkles, CheckCircle, ShieldAlert, Heart, Info, ShieldCheck, Lock } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';
import { API_BASE_URL } from '../config/api';

const PRESETS = [
  {
    name: 'Clean Atmosphere',
    tag: 'Alpine / Rural',
    values: { 'PM2.5': 18.0, 'PM10': 35.0, 'NO2': 12.0, 'CO': 0.35, 'SO2': 5.5, 'O3': 22.0 }
  },
  {
    name: 'Moderate Urban',
    tag: 'Normal City Day',
    values: { 'PM2.5': 62.0, 'PM10': 115.0, 'NO2': 38.0, 'CO': 0.95, 'SO2': 14.0, 'O3': 32.0 }
  },
  {
    name: 'High Pollution',
    tag: 'Winter Smog / Traffic',
    values: { 'PM2.5': 142.0, 'PM10': 235.0, 'NO2': 68.0, 'CO': 2.3, 'SO2': 26.0, 'O3': 55.0 }
  },
  {
    name: 'Severe Smog Crisis',
    tag: 'Emergency Level',
    values: { 'PM2.5': 285.0, 'PM10': 420.0, 'NO2': 115.0, 'CO': 4.6, 'SO2': 48.0, 'O3': 78.0 }
  }
];

export default function PredictView({ onPredictionSuccess }) {
  const [containerRef, containerVisible] = useScrollReveal({ threshold: 0.05 });
  const [formData, setFormData] = useState({
    'PM2.5': 65.0,
    'PM10': 120.0,
    'NO2': 38.0,
    'CO': 1.1,
    'SO2': 15.0,
    'O3': 32.0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const featureConfigs = [
    {
      key: 'PM2.5',
      name: 'PM2.5 (Fine Particulates)',
      unit: 'µg/m³',
      min: 0,
      max: 500,
      step: 0.1,
      description: 'Particles ≤ 2.5 µm that penetrate deep into lung airways.'
    },
    {
      key: 'PM10',
      name: 'PM10 (Coarse Particulates)',
      unit: 'µg/m³',
      min: 0,
      max: 800,
      step: 0.1,
      description: 'Inhalable particles ≤ 10 µm from dust, road travel, and construction.'
    },
    {
      key: 'NO2',
      name: 'NO2 (Nitrogen Dioxide)',
      unit: 'µg/m³',
      min: 0,
      max: 300,
      step: 0.1,
      description: 'Combustion byproduct from vehicles and thermal electricity generators.'
    },
    {
      key: 'CO',
      name: 'CO (Carbon Monoxide)',
      unit: 'mg/m³',
      min: 0,
      max: 20,
      step: 0.05,
      description: 'Toxic gas generated from incomplete engine combustion.'
    },
    {
      key: 'SO2',
      name: 'SO2 (Sulfur Dioxide)',
      unit: 'µg/m³',
      min: 0,
      max: 200,
      step: 0.1,
      description: 'Emitted from coal, petroleum combustion, and metal smelting.'
    },
    {
      key: 'O3',
      name: 'O3 (Ground-Level Ozone)',
      unit: 'µg/m³',
      min: 0,
      max: 250,
      step: 0.1,
      description: 'Secondary photochemical pollutant formed from sunlight and NOx.'
    }
  ];

  const handleInputChange = (key, value) => {
    const parsed = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [key]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const applyPreset = (presetValues) => {
    setFormData(presetValues);
    setError(null);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side Sanitization Guard
    for (const [k, v] of Object.entries(formData)) {
      if (isNaN(v) || !isFinite(v) || v < 0) {
        setError(`Security Validation Error: ${k} must be a positive finite number.`);
        setLoading(false);
        return;
      }
    }

    const payload = {
      'PM2.5': Number(formData['PM2.5']),
      'PM10': Number(formData['PM10']),
      'NO2': Number(formData['NO2']),
      'CO': Number(formData['CO']),
      'SO2': Number(formData['SO2']),
      'O3': Number(formData['O3'])
    };

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Prediction failed with status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      if (onPredictionSuccess) {
        onPredictionSuccess(data);
      }
    } catch (err) {
      console.error('Prediction API Error:', err);
      setError(err.message || 'Could not communicate with the prediction backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`space-y-8 transition-all duration-700 ${
        containerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* Header & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <Activity size={24} />
            </div>
            <span>Air Quality Prediction Engine</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Input verified criteria pollutant measurements or click an atmospheric preset below.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
            <Sparkles size={13} className="text-cyan-400" /> Presets:
          </span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p.values)}
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 hover:border-cyan-400/40 transition duration-200 flex items-center gap-1.5 shadow-sm"
            >
              <span className="font-semibold">{p.name}</span>
              <span className="text-[10px] text-cyan-400 font-mono">({p.tag})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Parameters Form (Glass UI Card) */}
        <form onSubmit={handlePredict} className="lg:col-span-7 glass-card p-6 md:p-8 space-y-6 border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Atmospheric Pollutant Inputs</h3>
              <p className="text-xs text-slate-400">Validated against physiological and meteorological bounds</p>
            </div>
            <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-lg border border-cyan-400/20">
              6 Criteria Features
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featureConfigs.map((feat) => {
              const val = formData[feat.key];
              return (
                <div
                  key={feat.key}
                  className="space-y-2.5 p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-400/30 transition duration-200"
                >
                  <div className="flex items-center justify-between">
                    <label htmlFor={`input-${feat.key}`} className="text-xs font-bold text-slate-200">
                      {feat.name}
                    </label>
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {val} <span className="text-slate-500 text-[10px] font-normal">{feat.unit}</span>
                    </span>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min={feat.min}
                    max={feat.max}
                    step={feat.step}
                    value={val}
                    onChange={(e) => handleInputChange(feat.key, e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />

                  {/* Numerical Input with Sanitization Bounds */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      id={`input-${feat.key}`}
                      type="number"
                      min={feat.min}
                      max={feat.max}
                      step={feat.step}
                      value={val}
                      onChange={(e) => handleInputChange(feat.key, e.target.value)}
                      className="glass-input text-xs py-2 px-3 font-mono font-bold"
                      required
                    />
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">{feat.unit}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{feat.description}</p>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">Validation Error</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              id="predict-aqi-btn"
              type="submit"
              disabled={loading}
              className="glass-btn w-full py-4 text-base rounded-2xl font-black shadow-xl shadow-cyan-400/25 tracking-wide"
            >
              {loading ? (
                <>
                  <RefreshCw size={20} className="animate-spin text-slate-950" />
                  <span>Computing Inference in Pipeline...</span>
                </>
              ) : (
                <>
                  <Activity size={20} className="text-slate-950 stroke-[2.5]" />
                  <span>Predict AQI with Trained ML Model</span>
                </>
              )}
            </button>
          </div>

          {/* Security & Sanitization notice */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
            <span className="flex items-center gap-1.5">
              <Lock size={12} className="text-emerald-400" />
              Input Sanitization Active
            </span>
            <span>Max 64KB Payload Shield</span>
          </div>
        </form>

        {/* Prediction Results Display (Glass Card with Glowing Borders) */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div
              className="glass-card p-6 md:p-8 space-y-6 border-t-4 transition-all duration-500"
              style={{
                borderTopColor: result.color,
                boxShadow: `0 20px 50px -15px ${result.color}35`
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Inference Output</span>
                <span className="text-xs font-mono text-slate-400">{result.timestamp}</span>
              </div>

              {/* Dynamic AQI Score Display with Radial Glow */}
              <div className="text-center py-6 space-y-3 relative overflow-hidden rounded-3xl bg-slate-900/80 p-6 border border-white/10">
                <div
                  className="absolute inset-0 opacity-20 blur-2xl pointer-events-none"
                  style={{ backgroundColor: result.color }}
                />
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest relative z-10">
                  Predicted Air Quality Index
                </div>
                <div
                  className="text-7xl md:text-8xl font-black tracking-tight relative z-10"
                  style={{ color: result.color, textShadow: `0 0 40px ${result.color}60` }}
                >
                  {result.predicted_aqi}
                </div>
                <div
                  className="inline-block px-5 py-1.5 rounded-full text-sm font-extrabold tracking-wide mt-2 relative z-10"
                  style={{ backgroundColor: `${result.color}25`, color: result.color, border: `1px solid ${result.color}60` }}
                >
                  {result.category} • {result.risk_level}
                </div>
              </div>

              {/* Health Advisory */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <ShieldAlert size={17} style={{ color: result.color }} />
                  <span>Statutory Health Advisory</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                  {result.health_advisory}
                </p>
              </div>

              {/* Recommended Precautions */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Heart size={17} className="text-rose-400" />
                  <span>Actionable Precautions</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                  {result.precautions}
                </p>
              </div>

              {/* Confirmation */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle size={14} />
                  <span>Persisted to MongoDB</span>
                </span>
                <span className="text-slate-500 font-mono text-[11px]">Audit ID: {result.timestamp.replace(/[^0-9]/g, '')}</span>
              </div>
            </div>
          ) : (
            <div className="glass-card p-10 text-center space-y-4 border-dashed border-2 border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-slate-900/80 text-cyan-400 flex items-center justify-center mx-auto border border-white/5">
                <Activity size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Ready for ML Prediction</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Adjust pollutant concentrations on the left or select an environmental preset, then click <strong>"Predict AQI"</strong> to run inference on the trained Scikit-learn model.
              </p>
            </div>
          )}

          {/* Model Note */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-white/10 text-xs text-slate-400 flex items-start gap-3">
            <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Predictions are generated by the active trained regression pipeline, passing through standard imputation, scaling, and ensemble regression.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
