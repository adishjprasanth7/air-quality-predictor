import React from 'react';
import {
  Database, Sparkles, Filter, Split, Cpu, Award, HardDrive,
  Server, Monitor, Sliders, CheckCircle2, BarChart3, ArrowDown
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';

export default function ProjectFlowView() {
  const [containerRef, containerVisible] = useScrollReveal({ threshold: 0.05 });

  const steps = [
    {
      title: 'Dataset Ingestion',
      subtitle: 'Central Pollution Control Board (CPCB) records (city_day.csv)',
      icon: Database,
      tag: 'Data Engineering',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10'
    },
    {
      title: 'Data Cleaning & Validation',
      subtitle: 'Imputation of missing sensor values, removal of duplicates and invalid readings',
      icon: Filter,
      tag: 'Preprocessing',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
    },
    {
      title: 'Feature Selection',
      subtitle: 'Filtering 6 primary criteria pollutants: PM2.5, PM10, NO2, CO, SO2, O3',
      icon: Sparkles,
      tag: 'Feature Store',
      color: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10'
    },
    {
      title: 'Train/Test Split',
      subtitle: 'Holdout partitioning (80% Training, 20% Testing) with random_state=42',
      icon: Split,
      tag: 'Validation',
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10'
    },
    {
      title: 'ML Model Training',
      subtitle: 'Fitting Linear Regression, Random Forest, & Gradient Boosting Regressors',
      icon: Cpu,
      tag: 'Machine Learning',
      color: 'border-violet-500/40 text-violet-400 bg-violet-500/10'
    },
    {
      title: 'Model Evaluation',
      subtitle: 'Computing MAE, RMSE, and R² Score metrics on holdout test set',
      icon: BarChart3,
      tag: 'Evaluation',
      color: 'border-pink-500/40 text-pink-400 bg-pink-500/10'
    },
    {
      title: 'Best Model Selection',
      subtitle: 'Identifying champion pipeline with maximum explained variance (R²)',
      icon: Award,
      tag: 'Model Governance',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10'
    },
    {
      title: 'Saved Model Serialization',
      subtitle: 'Exporting fitted pipeline using Joblib (air_quality_model.pkl)',
      icon: HardDrive,
      tag: 'Artifact Storage',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
    },
    {
      title: 'FastAPI Microservice',
      subtitle: 'Serving REST endpoints (/health, /model-info, /predict, /predictions, /security-status)',
      icon: Server,
      tag: 'Backend API',
      color: 'border-teal-500/40 text-teal-400 bg-teal-500/10'
    },
    {
      title: 'React Frontend Dashboard',
      subtitle: 'Interactive UI with live data visualization, telemetry, and presets',
      icon: Monitor,
      tag: 'Frontend Client',
      color: 'border-sky-500/40 text-sky-400 bg-sky-500/10'
    },
    {
      title: 'User Input',
      subtitle: 'Environmental readings via calibrated sliders or real-time measurements',
      icon: Sliders,
      tag: 'User Interaction',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
    },
    {
      title: 'ML Pipeline Prediction',
      subtitle: 'Standardized scaling and model inference via FastAPI POST /predict',
      icon: Cpu,
      tag: 'Real-time Inference',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10'
    },
    {
      title: 'AQI Result & Health Advisory',
      subtitle: 'NAQI risk categorization with color coding and actionable precautions',
      icon: CheckCircle2,
      tag: 'Decision Output',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
    },
    {
      title: 'Database History Persistence',
      subtitle: 'Stores predictions, timestamps, and pollutant readings in PostgreSQL on Render',
      icon: Database,
      tag: 'Persistence Layer',
      color: 'border-green-500/40 text-green-400 bg-green-500/10'
    },
    {
      title: 'Analytics Dashboard',
      subtitle: 'Live visual trend charts, pollutant distributions, and audit trails',
      icon: BarChart3,
      tag: 'Presentation',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10'
    }
  ];

  return (
    <div
      ref={containerRef}
      className={`space-y-8 transition-all duration-700 ${
        containerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      <div>
        <h2 className="text-3xl font-black text-white flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
            <Cpu size={24} />
          </div>
          <span>Complete System Architecture Flow</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Visual representation of the end-to-end data processing, ML training, serving, and persistence pipeline.
        </p>
      </div>

      <div className="glass-card p-6 md:p-10 border-white/10">
        <div className="max-w-2xl mx-auto space-y-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isLast = idx === steps.length - 1;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-400/30 transition duration-200">
                  <div className={`p-3 rounded-xl border shrink-0 ${step.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{step.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                        {step.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.subtitle}</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-500 px-2">
                    #{idx + 1}
                  </div>
                </div>

                {!isLast && (
                  <div className="my-1.5 text-cyan-400/60 flex flex-col items-center">
                    <div className="h-4 w-0.5 bg-gradient-to-b from-cyan-400/40 to-transparent" />
                    <ArrowDown size={14} className="text-cyan-400 -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
