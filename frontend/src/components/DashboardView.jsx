import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, Cell
} from 'recharts';
import { BarChart3, Clock, TrendingUp, AlertCircle, RefreshCw, Sparkles, Filter } from 'lucide-react';

export default function DashboardView({ onGoToPredict }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/predictions?limit=30');
      if (!res.ok) {
        throw new Error(`Failed to fetch history (Status: ${res.status})`);
      }
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching prediction history:', err);
      setError(err.message || 'Unable to connect to backend history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Format data for charts (reversing chronological order so left is oldest, right is newest)
  const chartData = [...history].reverse().map((item, idx) => ({
    index: idx + 1,
    time: item.timestamp ? item.timestamp.split(' ')[1] : `#${idx + 1}`,
    AQI: item.predicted_aqi,
    category: item.category,
    color: item.color,
    PM25: item.inputs ? item.inputs['PM2.5'] : 0,
    PM10: item.inputs ? item.inputs['PM10'] : 0,
    NO2: item.inputs ? item.inputs['NO2'] : 0,
    CO: item.inputs ? item.inputs['CO'] : 0,
    SO2: item.inputs ? item.inputs['SO2'] : 0,
    O3: item.inputs ? item.inputs['O3'] : 0,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-cyan-400" />
            <span>Prediction Analytics & History</span>
          </h2>
          <p className="text-sm text-slate-400">
            Real-time telemetry and database audit logs from ML inference sessions.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
          <span>Refresh Data</span>
        </button>
      </div>

      {loading && history.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 space-y-3">
          <RefreshCw size={28} className="animate-spin text-cyan-400 mx-auto" />
          <p className="text-sm">Fetching recorded inferences from database...</p>
        </div>
      ) : error && history.length === 0 ? (
        <div className="glass-panel p-8 text-center text-rose-300 space-y-2 border-rose-500/20">
          <AlertCircle size={32} className="mx-auto text-rose-400" />
          <h3 className="font-semibold">Failed to Load Prediction History</h3>
          <p className="text-xs text-rose-400/80">{error}</p>
        </div>
      ) : history.length === 0 ? (
        /* Empty state as mandated by requirement 10 */
        <div className="glass-panel p-12 text-center space-y-4 border-dashed border-2 border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
            <Clock size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">No Predictions Recorded Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            The historical database is currently clear. Run an inference in the <strong>Predict AQI</strong> tab to populate real-time trend analytics.
          </p>
          <button
            onClick={onGoToPredict}
            className="glow-btn text-xs px-5 py-2.5 rounded-xl font-semibold"
          >
            Create Your First Prediction
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Total Inferences Logged</span>
              <div className="text-3xl font-extrabold text-white">{history.length}</div>
            </div>
            <div className="glass-panel p-5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Latest Predicted AQI</span>
              <div className="text-3xl font-extrabold" style={{ color: history[0]?.color || '#06b6d4' }}>
                {history[0]?.predicted_aqi || 'N/A'}
              </div>
            </div>
            <div className="glass-panel p-5 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Latest Classification</span>
              <div className="text-xl font-bold text-slate-200 mt-1">
                {history[0]?.category || 'N/A'}
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AQI Trend Chart */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-cyan-400" />
                  <span>AQI Prediction Timeline</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Sequential Log</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="AQI"
                      stroke="#06b6d4"
                      strokeWidth={3}
                      dot={{ fill: '#06b6d4', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pollutants Comparison Chart */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-blue-400" />
                  <span>Particulate Load (PM2.5 vs PM10)</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">µg/m³</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="PM25" name="PM2.5" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="PM10" name="PM10" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Historical Log Table */}
          <div className="glass-panel overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Audit Trail & Inference Records</h3>
              <span className="text-xs text-slate-400 font-mono">Showing last {history.length} runs</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Predicted AQI</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">PM2.5</th>
                    <th className="py-3 px-4">PM10</th>
                    <th className="py-3 px-4">NO2</th>
                    <th className="py-3 px-4">CO</th>
                    <th className="py-3 px-4">SO2</th>
                    <th className="py-3 px-4">O3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {history.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{row.timestamp}</td>
                      <td className="py-3 px-4 font-bold" style={{ color: row.color }}>{row.predicted_aqi}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-sans font-bold"
                          style={{ backgroundColor: `${row.color}20`, color: row.color }}
                        >
                          {row.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">{row.inputs?.['PM2.5'] ?? '-'}</td>
                      <td className="py-3 px-4">{row.inputs?.['PM10'] ?? '-'}</td>
                      <td className="py-3 px-4">{row.inputs?.['NO2'] ?? '-'}</td>
                      <td className="py-3 px-4">{row.inputs?.['CO'] ?? '-'}</td>
                      <td className="py-3 px-4">{row.inputs?.['SO2'] ?? '-'}</td>
                      <td className="py-3 px-4">{row.inputs?.['O3'] ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
