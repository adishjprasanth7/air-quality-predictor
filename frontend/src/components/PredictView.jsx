import React, { useState } from 'react';
import { Activity, AlertCircle, RefreshCw, Sparkles, CheckCircle, ShieldAlert, Heart, Info, ArrowUpRight } from 'lucide-react';

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
      description: 'Colorless, toxic gas from incomplete engine combustion.'
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
    setFormData((prev) => ({
      ...prev,
      [key]: parseFloat(value) || 0
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

    const payload = {
      'PM2.5': Number(formData['PM2.5']),
      'PM10': Number(formData['PM10']),
      'NO2': Number(formData['NO2']),
      'CO': Number(formData['CO']),
      'SO2': Number(formData['SO2']),
      'O3': Number(formData['O3'])
    };

    try {
      const response = await fetch('http://localhost:8000/predict', {
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
    <div className="space-y-8 animate-fade-in">
      {/* Header and Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-cyan-400" />
            <span>Air Quality Prediction Engine</span>
          </h2>
          <p className="text-sm text-slate-400">
            Enter real ambient pollutant readings or select an authentic environmental preset scenario.
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
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5"
            >
              <span>{p.name}</span>
              <span className="text-[10px] text-cyan-400 font-mono">({p.tag})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Parameters Form */}
        <form onSubmit={handlePredict} className="lg:col-span-7 glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-semibold text-white">Atmospheric Pollutant Inputs</h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
              Features: 6 Criteria Pollutants
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {featureConfigs.map((feat) => {
              const val = formData[feat.key];
              return (
                <div key={feat.key} className="space-y-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`input-${feat.key}`} className="text-xs font-semibold text-slate-200">
                      {feat.name}
                    </label>
                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {val} <span className="text-slate-400 text-[10px] font-normal">{feat.unit}</span>
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

                  {/* Direct Number Input */}
                  <div className="flex items-center justify-between gap-2">
                    <input
                      id={`input-${feat.key}`}
                      type="number"
                      min={feat.min}
                      max={feat.max}
                      step={feat.step}
                      value={val}
                      onChange={(e) => handleInputChange(feat.key, e.target.value)}
                      className="glass-input text-xs py-1.5 px-2.5 font-mono"
                      required
                    />
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">{feat.unit}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight pt-1">{feat.description}</p>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-semibold">Prediction Error</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <button
            id="predict-aqi-btn"
            type="submit"
            disabled={loading}
            className="glow-btn w-full py-3.5 text-base rounded-xl font-bold"
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Running ML Inference...</span>
              </>
            ) : (
              <>
                <Activity size={18} />
                <span>Predict AQI with Trained ML Model</span>
              </>
            )}
          </button>
        </form>

        {/* Prediction Results Display */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="glass-panel p-6 space-y-6 border-t-4 transition-all" style={{ borderTopColor: result.color }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Inference Output</span>
                <span className="text-xs font-mono text-slate-400">{result.timestamp}</span>
              </div>

              {/* AQI Score Indicator */}
              <div className="text-center py-4 space-y-2 relative overflow-hidden rounded-2xl bg-slate-900/60 p-6 border border-slate-800">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">Predicted AQI</div>
                <div
                  className="text-6xl md:text-7xl font-black tracking-tight"
                  style={{ color: result.color, textShadow: `0 0 35px ${result.color}40` }}
                >
                  {result.predicted_aqi}
                </div>
                <div
                  className="inline-block px-4 py-1 rounded-full text-sm font-bold tracking-wide mt-2"
                  style={{ backgroundColor: `${result.color}20`, color: result.color, border: `1px solid ${result.color}50` }}
                >
                  {result.category} • {result.risk_level}
                </div>
              </div>

              {/* Health Advisory */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <ShieldAlert size={16} style={{ color: result.color }} />
                  <span>Health Advisory</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  {result.health_advisory}
                </p>
              </div>

              {/* Recommended Precautions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Heart size={16} className="text-rose-400" />
                  <span>Actionable Precautions</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  {result.precautions}
                </p>
              </div>

              {/* Stored Confirmation */}
              <div className="flex items-center gap-2 pt-2 text-xs text-emerald-400">
                <CheckCircle size={15} />
                <span>Prediction logged to historical storage</span>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-8 text-center space-y-4 border-dashed border-2 border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-cyan-400 flex items-center justify-center mx-auto">
                <Activity size={32} />
              </div>
              <h3 className="text-lg font-bold text-white">Ready for Prediction</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Adjust pollutant concentrations on the left or select an environmental preset, then click <strong>"Predict AQI"</strong> to run inference on the trained Scikit-learn model.
              </p>
            </div>
          )}

          {/* Model Note */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/90 text-xs text-slate-400 flex items-start gap-3">
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
