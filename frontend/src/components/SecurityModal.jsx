import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Lock, Activity, AlertCircle, X, CheckCircle, RefreshCw, Key, FileCheck, Layers } from 'lucide-react';

export default function SecurityModal({ isOpen, onClose }) {
  const [securityData, setSecurityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSecurityAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/security-status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSecurityData(data);
    } catch (err) {
      setError(err.message || 'Unable to fetch security audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSecurityAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl glass-card p-6 md:p-8 space-y-6 border border-cyan-500/30 shadow-2xl shadow-cyan-950/50">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Production Security Architecture
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  OWASP Hardened
                </span>
              </h3>
              <p className="text-xs text-slate-400">Live Backend Protection & Defense Audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <RefreshCw size={28} className="animate-spin text-cyan-400 mx-auto" />
            <p className="text-sm">Auditing active defense middleware...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <AlertCircle size={20} className="mb-1 text-rose-400" />
            <p className="font-semibold">Security Audit Offline</p>
            <p className="text-xs text-rose-300/80">{error}</p>
          </div>
        ) : securityData ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Rate Limiting Shield */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity size={16} className="text-cyan-400" />
                  <span>Sliding Window Rate Limiter (Anti-DoS)</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Prevents API abuse and distributed denial-of-service floods by enforcing a strict cap of{' '}
                <strong className="text-white font-mono">{securityData.protections.rate_limiter.limit_per_minute} requests/min</strong>{' '}
                per IP with automatic <code className="text-cyan-300 font-mono">HTTP 429 Retry-After</code> throttling.
              </p>
            </div>

            {/* OWASP Security Headers */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock size={16} className="text-indigo-400" />
                  <span>Hardened HTTP Security Headers</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  ENFORCED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-400">
                {securityData.protections.security_headers.headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 p-1.5 rounded bg-slate-950/60 border border-slate-800">
                    <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Input Validation & Sanitization */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck size={16} className="text-blue-400" />
                  <span>Strict Parameter Sanitization & Pydantic Bounds</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rejects non-finite values (<code className="text-amber-300">NaN</code>, <code className="text-amber-300">Infinity</code>), negative numbers, and out-of-range sensor injections. Pre-inference input scrubbing prevents payload corruption.
              </p>
            </div>

            {/* Payload Guard */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield size={16} className="text-cyan-400" />
                  <span>Request Payload Guard (Buffer Overflow Shield)</span>
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  64 KB CAP
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Requests with bodies exceeding 64KB are rejected before reaching application memory (<code className="text-cyan-300 font-mono">HTTP 413 Payload Too Large</code>).
              </p>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Audit Timestamp: {securityData?.timestamp || 'Live'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
