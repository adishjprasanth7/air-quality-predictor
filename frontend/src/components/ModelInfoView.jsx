import React, { useState, useEffect } from 'react';
import { Cpu, Award, BarChart2, CheckCircle2, AlertTriangle, Layers, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { useScrollReveal } from '../hooks/useScrollAnimation';

export default function ModelInfoView() {
  const [containerRef, containerVisible] = useScrollReveal({ threshold: 0.05 });
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModelInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/model-info');
      if (!res.ok) {
        throw new Error(`Model metadata unavailable (Status: ${res.status}). Ensure backend/training/train.py has been executed.`);
      }
      const data = await res.json();
      setModelInfo(data);
    } catch (err) {
      console.error('Failed to fetch model info:', err);
      setError(err.message || 'Unable to retrieve ML model evaluation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const featureData = modelInfo?.feature_importance
    ? Object.entries(modelInfo.feature_importance).map(([feature, weight]) => ({
        feature,
        importance: Math.round(weight * 1000) / 10,
      }))
    : [];

  return (
    <div
      ref={containerRef}
      className={`space-y-8 transition-all duration-700 ${
        containerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
              <Cpu size={24} />
            </div>
            <span>Machine Learning Model & Evaluation</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Academic performance audit verified by holdout testing evaluation.
          </p>
        </div>
        <button
          onClick={fetchModelInfo}
          disabled={loading}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-bold text-slate-200 transition flex items-center gap-2 shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          <span>Reload Metadata</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400 space-y-3">
          <RefreshCw size={28} className="animate-spin text-cyan-400 mx-auto" />
          <p className="text-sm">Loading verified model evaluation records...</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center text-amber-300 space-y-3 border-amber-500/20">
          <AlertTriangle size={32} className="mx-auto text-amber-400" />
          <h3 className="font-bold text-white">Model Metrics Inactive</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">{error}</p>
        </div>
      ) : modelInfo ? (
        <div className="space-y-8">
          {/* Champion Model Banner */}
          <div className="glass-card p-8 border-l-4 border-l-cyan-400 bg-gradient-to-r from-cyan-950/40 to-transparent">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <Award size={15} /> Selected Production Regressor
                </div>
                <h3 className="text-3xl font-black text-white">{modelInfo.model_name}</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Trained & Evaluated on {modelInfo.trained_date} via Scikit-learn Pipeline
                </p>
              </div>

              {/* Best Metrics Badges */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center shadow-lg">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">R² Score</span>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {modelInfo.best_metrics.R2_Score}
                  </span>
                </div>
                <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center shadow-lg">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">RMSE</span>
                  <span className="text-2xl font-mono font-black text-cyan-300">
                    {modelInfo.best_metrics.RMSE}
                  </span>
                </div>
                <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-center shadow-lg">
                  <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">MAE</span>
                  <span className="text-2xl font-mono font-black text-blue-400">
                    {modelInfo.best_metrics.MAE}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dataset Specifications & Split Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 space-y-1 border-white/10">
              <span className="text-xs text-slate-400 font-medium">Dataset Source</span>
              <p className="text-sm font-bold text-white">Central Pollution Control Board (CPCB)</p>
            </div>
            <div className="glass-card p-5 space-y-1 border-white/10">
              <span className="text-xs text-slate-400 font-medium">Cleaned Training Records</span>
              <p className="text-sm font-bold text-white font-mono">
                {modelInfo.dataset_info?.total_records_used?.toLocaleString() || 'N/A'} Samples
              </p>
            </div>
            <div className="glass-card p-5 space-y-1 border-white/10">
              <span className="text-xs text-slate-400 font-medium">Holdout Split Ratio</span>
              <p className="text-sm font-bold text-white font-mono">
                {modelInfo.dataset_info?.split_ratio || '80/20'} (Train/Test)
              </p>
            </div>
            <div className="glass-card p-5 space-y-1 border-white/10">
              <span className="text-xs text-slate-400 font-medium">Random State Seed</span>
              <p className="text-sm font-bold text-white font-mono">
                {modelInfo.dataset_info?.random_state ?? 42} (Deterministic)
              </p>
            </div>
          </div>

          {/* Model Comparison Table */}
          <div className="glass-card overflow-hidden border-white/10">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-cyan-400" />
                  <span>Candidate Models Benchmark Comparison</span>
                </h3>
                <p className="text-xs text-slate-400">Evaluated on identical 20% holdout test partition (4,961 records)</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Holdout Evaluation</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-4 px-6">Algorithm</th>
                    <th className="py-4 px-6">R² Score (Variance Explained)</th>
                    <th className="py-4 px-6">RMSE (Root Mean Squared Error)</th>
                    <th className="py-4 px-6">MAE (Mean Absolute Error)</th>
                    <th className="py-4 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {Object.entries(modelInfo.all_model_evaluations || {}).map(([name, metrics], idx) => {
                    const isWinner = name === modelInfo.model_name;
                    return (
                      <tr key={idx} className={isWinner ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-white/5'}>
                        <td className="py-4 px-6 font-sans font-bold text-white flex items-center gap-2">
                          {isWinner && <CheckCircle2 size={16} className="text-cyan-400" />}
                          <span>{name}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-emerald-400">{metrics.R2_Score}</td>
                        <td className="py-4 px-6 text-cyan-300">{metrics.RMSE}</td>
                        <td className="py-4 px-6 text-slate-300">{metrics.MAE}</td>
                        <td className="py-4 px-6 font-sans">
                          {isWinner ? (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Selected Model
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium">Evaluated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Feature Importance Bar Chart */}
          <div className="glass-card p-6 md:p-8 space-y-4 border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 size={18} className="text-cyan-400" />
                <span>Feature Importance Contribution (%)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Derived from Model Weights</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reveals which atmospheric pollutants drive the highest weight in determining the final Air Quality Index score.
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                  <YAxis type="category" dataKey="feature" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1329',
                      borderColor: 'rgba(255,255,255,0.15)',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${val}%`, 'Relative Importance']}
                  />
                  <Bar dataKey="importance" fill="#00e5ff" radius={[0, 6, 6, 0]}>
                    {featureData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? '#00e5ff' : index === 1 ? '#38bdf8' : index === 2 ? '#6366f1' : '#8b5cf6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
