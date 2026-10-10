import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  MapPin, Activity, Wind, Search, Filter, TrendingUp,
  AlertTriangle, CheckCircle2, Compass, Eye, ArrowRight, RotateCcw,
  Layers, ShieldAlert, BarChart3, SlidersHorizontal, Info
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollAnimation';
import { API_BASE_URL } from '../config/api';
import { CITIES_POLLUTION_DATA } from '../data/citiesData';

// Metric thresholds & color mapping
const METRIC_CONFIGS = {
  aqi: {
    key: 'aqi',
    name: 'Air Quality Index (AQI)',
    unit: 'Index',
    description: 'Composite statutory index computed across all criteria pollutants.',
    legend: [
      { label: 'Good (0-50)', color: '#10b981', min: 0, max: 50 },
      { label: 'Satisfactory (51-100)', color: '#84cc16', min: 51, max: 100 },
      { label: 'Moderate (101-200)', color: '#f59e0b', min: 101, max: 200 },
      { label: 'Poor (201-300)', color: '#f97316', min: 201, max: 300 },
      { label: 'Very Poor (301-400)', color: '#ef4444', min: 301, max: 400 },
      { label: 'Severe (401+)', color: '#881337', min: 401, max: 9999 }
    ],
    getValue: (city) => city.aqi,
    getColor: (val) => {
      if (val <= 50) return '#10b981';
      if (val <= 100) return '#84cc16';
      if (val <= 200) return '#f59e0b';
      if (val <= 300) return '#f97316';
      if (val <= 400) return '#ef4444';
      return '#881337';
    }
  },
  'PM2.5': {
    key: 'PM2.5',
    name: 'PM2.5 (Fine Particles)',
    unit: 'µg/m³',
    standard: 60,
    description: 'Microscopic particles that penetrate alveolar blood barriers.',
    legend: [
      { label: 'Safe (0-30)', color: '#10b981', min: 0, max: 30 },
      { label: 'Moderate (31-60)', color: '#84cc16', min: 31, max: 60 },
      { label: 'Elevated (61-90)', color: '#f59e0b', min: 61, max: 90 },
      { label: 'High (91-120)', color: '#f97316', min: 91, max: 120 },
      { label: 'Critical (121+)', color: '#ef4444', min: 121, max: 9999 }
    ],
    getValue: (city) => city.pollutants?.['PM2.5']?.value ?? 0,
    getColor: (val) => {
      if (val <= 30) return '#10b981';
      if (val <= 60) return '#84cc16';
      if (val <= 90) return '#f59e0b';
      if (val <= 120) return '#f97316';
      return '#ef4444';
    }
  },
  'PM10': {
    key: 'PM10',
    name: 'PM10 (Coarse Inhalable)',
    unit: 'µg/m³',
    standard: 100,
    description: 'Road dust, industrial particles and suspended matter ≤ 10 µm.',
    legend: [
      { label: 'Safe (0-50)', color: '#10b981', min: 0, max: 50 },
      { label: 'Moderate (51-100)', color: '#84cc16', min: 51, max: 100 },
      { label: 'Elevated (101-150)', color: '#f59e0b', min: 101, max: 150 },
      { label: 'High (151-200)', color: '#f97316', min: 151, max: 200 },
      { label: 'Critical (201+)', color: '#ef4444', min: 201, max: 9999 }
    ],
    getValue: (city) => city.pollutants?.['PM10']?.value ?? 0,
    getColor: (val) => {
      if (val <= 50) return '#10b981';
      if (val <= 100) return '#84cc16';
      if (val <= 150) return '#f59e0b';
      if (val <= 200) return '#f97316';
      return '#ef4444';
    }
  },
  'NO2': {
    key: 'NO2',
    name: 'NO2 (Nitrogen Dioxide)',
    unit: 'µg/m³',
    standard: 80,
    description: 'Vehicle emissions and fossil thermal power combustion.',
    legend: [
      { label: 'Safe (0-40)', color: '#10b981', min: 0, max: 40 },
      { label: 'Moderate (41-80)', color: '#84cc16', min: 41, max: 80 },
      { label: 'High (81-120)', color: '#f97316', min: 81, max: 120 },
      { label: 'Severe (121+)', color: '#ef4444', min: 121, max: 9999 }
    ],
    getValue: (city) => city.pollutants?.['NO2']?.value ?? 0,
    getColor: (val) => {
      if (val <= 40) return '#10b981';
      if (val <= 80) return '#84cc16';
      if (val <= 120) return '#f97316';
      return '#ef4444';
    }
  },
  'CO': {
    key: 'CO',
    name: 'CO (Carbon Monoxide)',
    unit: 'mg/m³',
    standard: 2.0,
    description: 'Incomplete vehicular combustion gas reducing oxygen delivery.',
    legend: [
      { label: 'Safe (0-1.0)', color: '#10b981', min: 0, max: 1.0 },
      { label: 'Standard (1.1-2.0)', color: '#84cc16', min: 1.1, max: 2.0 },
      { label: 'Elevated (2.1-4.0)', color: '#f97316', min: 2.1, max: 4.0 },
      { label: 'Hazardous (4.1+)', color: '#ef4444', min: 4.1, max: 9999 }
    ],
    getValue: (city) => city.pollutants?.['CO']?.value ?? 0,
    getColor: (val) => {
      if (val <= 1.0) return '#10b981';
      if (val <= 2.0) return '#84cc16';
      if (val <= 4.0) return '#f97316';
      return '#ef4444';
    }
  },
  'SO2': {
    key: 'SO2',
    name: 'SO2 (Sulfur Dioxide)',
    unit: 'µg/m³',
    standard: 80,
    description: 'Coal burning, industrial boilers and refinery sulfur discharge.',
    legend: [
      { label: 'Safe (0-40)', color: '#10b981', min: 0, max: 40 },
      { label: 'Acceptable (41-80)', color: '#84cc16', min: 41, max: 80 },
      { label: 'Elevated (81+)', color: '#ef4444', min: 81, max: 9999 }
    ],
    getValue: (city) => city.pollutants?.['SO2']?.value ?? 0,
    getColor: (val) => {
      if (val <= 40) return '#10b981';
      if (val <= 80) return '#84cc16';
      return '#ef4444';
    }
  },
  'O3': {
    key: 'O3',
    name: 'O3 (Ground Ozone)',
    unit: 'µg/m³',
    standard: 100,
    description: 'Photochemical smog gas created when sunlight reacts with NOx.',
    legend: [
      { label: 'Safe (0-50)', color: '#10b981', min: 0, max: 50 },
      { label: 'Moderate (51-100)', color: '#84cc16', min: 51, max: 100 },
      { label: 'Elevated (101+)', color: '#ef4444', min: 101, max: 9999 }
    ],
    getValue: (city) => city.pollutants?.['O3']?.value ?? 0,
    getColor: (val) => {
      if (val <= 50) return '#10b981';
      if (val <= 100) return '#84cc16';
      return '#ef4444';
    }
  }
};

export default function PollutionMapView({ onSelectCityForPrediction }) {
  const [containerRef, containerVisible] = useScrollReveal({ threshold: 0.05 });
  const [cities, setCities] = useState(CITIES_POLLUTION_DATA);
  const [activeMetric, setActiveMetric] = useState('aqi');
  const [selectedCityId, setSelectedCityId] = useState('delhi');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'table'
  const [loading, setLoading] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Fetch live cities data from backend if available
  useEffect(() => {
    let isMounted = true;
    const fetchLiveCities = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/cities`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.cities && data.cities.length > 0) {
            setCities(data.cities);
          }
        }
      } catch {
        // Silently use pre-bundled dataset
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLiveCities();
    return () => { isMounted = false; };
  }, []);

  // Filtered cities list
  const filteredCities = useMemo(() => {
    return cities.filter((c) => {
      const matchSearch =
        c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.state.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRegion = selectedRegion === 'All' || c.region === selectedRegion;
      const matchCategory = selectedCategory === 'All' || c.category === selectedCategory;
      return matchSearch && matchRegion && matchCategory;
    });
  }, [cities, searchQuery, selectedRegion, selectedCategory]);

  // Selected city object
  const currentCity = useMemo(() => {
    return cities.find((c) => c.id === selectedCityId) || cities[0];
  }, [cities, selectedCityId]);

  // Metric metadata
  const currentMetricConfig = METRIC_CONFIGS[activeMetric];

  // Initialize and manage Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 82.0],
        zoom: 4.6,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true
      });

      // CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    // Create markers for filtered cities
    filteredCities.forEach((city) => {
      const isSelected = city.id === selectedCityId;
      const metricValue = currentMetricConfig.getValue(city);
      const markerColor = currentMetricConfig.getColor(metricValue);

      // Convert hex to rgb for glow
      const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 229;
        const b = parseInt(hex.slice(5, 7), 16) || 255;
        return `${r}, ${g}, ${b}`;
      };
      const rgbGlow = hexToRgb(markerColor);

      // Create customized HTML icon
      const iconHtml = `
        <div class="relative cursor-pointer group transform transition-all duration-300 hover:scale-125" style="--marker-pulse-rgb: ${rgbGlow}">
          <!-- Outer Pulsing Aura -->
          <div class="absolute -inset-2 rounded-full ${isSelected ? 'city-map-marker-pulse' : 'opacity-40'}" style="background-color: ${markerColor}33; border: 1.5px solid ${markerColor}66;"></div>
          
          <!-- Marker Core Pin -->
          <div class="relative flex items-center justify-center rounded-full text-slate-950 font-bold shadow-lg shadow-black/80 transition-all ${
            isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 scale-110' : ''
          }" style="width: 32px; height: 32px; background: linear-gradient(135deg, ${markerColor}, #ffffff 200%); border: 2px solid #ffffff;">
            <span class="text-[11px] font-black tracking-tight font-mono">${Math.round(metricValue)}</span>
          </div>

          <!-- City Label Floating Tag -->
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md transition-all shadow-md ${
            isSelected
              ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/40 ring-1 ring-white font-black'
              : 'bg-slate-950/85 text-slate-200 border border-white/10 group-hover:bg-slate-900 group-hover:text-white'
          }">
            ${city.city}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-aqi-city-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([city.lat, city.lng], { icon: customIcon }).addTo(map);

      // Tooltip popup
      const popupHtml = `
        <div style="font-family: inherit; min-width: 180px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <strong style="color: #ffffff; font-size: 14px;">${city.city}</strong>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background-color: ${city.color}25; color: ${city.color}; border: 1px solid ${city.color}50;">
              ${city.category}
            </span>
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 4px;">${city.state} • ${city.region} Region</div>
          <div style="display: flex; align-items: baseline; gap: 6px; margin: 8px 0; padding: 6px; border-radius: 8px; background: rgba(255,255,255,0.05);">
            <span style="font-size: 20px; font-weight: 900; color: ${markerColor};">${metricValue}</span>
            <span style="font-size: 10px; color: #cbd5e1;">${currentMetricConfig.unit} (${currentMetricConfig.name.split(' ')[0]})</span>
          </div>
          <div style="font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between;">
            <span>Dominant Pollutant:</span>
            <strong style="color: #00e5ff;">${city.dominant_pollutant}</strong>
          </div>
          <div style="margin-top: 8px; font-size: 10px; color: #38bdf8; text-align: center; font-weight: 600;">
            Click to view full telemetry →
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedCityId(city.id);
      });

      markersRef.current[city.id] = marker;
    });

    return () => {};
  }, [filteredCities, activeMetric, selectedCityId, currentMetricConfig]);

  // Center map on selected city when changed
  const handleSelectCity = (city) => {
    setSelectedCityId(city.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], 6.5, {
        duration: 1.0,
        easeLinearity: 0.25
      });
      // Open popup
      const marker = markersRef.current[city.id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleResetMapView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([21.5, 82.0], 4.6, { duration: 1.0 });
    }
  };

  const regions = ['All', 'North', 'South', 'East', 'West', 'Central', 'Northeast'];
  const categories = ['All', 'Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'];

  return (
    <div
      ref={containerRef}
      className={`space-y-8 transition-all duration-700 ${
        containerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* ----------------------------------------------------
          SECTION 1: HERO & ATMOSPHERIC TELEMETRY BANNER
          ---------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-2">
            <Compass size={14} className="text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span>Pan-India Real-Time Atmospheric Spatial Grid</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Monitored Cities & Pollution Rates</span>
            {loading && <RotateCcw size={16} className="text-cyan-400 animate-spin" />}
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Geographic atmospheric mapping of 26 statutory Indian monitoring stations. Compare criteria pollutant rates, identify hotspots, and inject live city readings directly into the ML inference engine.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 self-start lg:self-auto backdrop-blur-md">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-linear-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={14} />
            <span>Map & Telemetry</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'table'
                ? 'bg-linear-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-md shadow-cyan-400/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} />
            <span>Leaderboard ({cities.length})</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          SECTION 2: NATIONAL AIR QUALITY BENCHMARK STATS CARDS
          ---------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 sm:p-5 relative overflow-hidden group">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>National Mean AQI</span>
            <Activity size={16} className="text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white font-mono">142.8</div>
          <div className="text-[11px] text-amber-400 font-semibold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Moderate National Exposure</span>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-cyan-400 pointer-events-none">
            <Activity size={72} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 relative overflow-hidden group">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Highest Smog Hotspot</span>
            <AlertTriangle size={16} className="text-rose-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-400 font-mono">
            Ahmedabad
            <span className="text-xs font-normal text-rose-300 ml-1.5">(452.1)</span>
          </div>
          <div className="text-[11px] text-rose-400/90 font-semibold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span>Severe Industrial Burden</span>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-rose-400 pointer-events-none">
            <AlertTriangle size={72} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 relative overflow-hidden group">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Cleanest Sanctuary</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            Aizawl
            <span className="text-xs font-normal text-emerald-300 ml-1.5">(34.8)</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Pristine Himalayan Forest Air</span>
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-emerald-400 pointer-events-none">
            <CheckCircle2 size={72} />
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 relative overflow-hidden group">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Dominant Threat</span>
            <ShieldAlert size={16} className="text-amber-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-300 font-mono">PM2.5</div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            Exceeds WHO safety in 23 of 26 cities
          </div>
          <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-amber-400 pointer-events-none">
            <ShieldAlert size={72} />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          SECTION 3: METRIC SELECTOR TOOLBAR & FILTERS
          ---------------------------------------------------- */}
      <div className="glass-card p-5 space-y-4">
        {/* Metric Selector Bar */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <SlidersHorizontal size={14} />
              <span>Select Active Map Pollutant Metric:</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Visualizing: <strong className="text-white">{currentMetricConfig.name}</strong> ({currentMetricConfig.unit})
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
            {Object.entries(METRIC_CONFIGS).map(([key, config]) => {
              const isActive = activeMetric === key;
              return (
                <button
                  key={key}
                  id={`metric-${key}`}
                  onClick={() => setActiveMetric(key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-linear-to-r from-cyan-400 to-blue-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-400/25 scale-105'
                      : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-cyan-400/40 hover:text-white'
                  }`}
                >
                  <span>{key}</span>
                  {config.unit !== 'Index' && (
                    <span className={`ml-1 text-[10px] ${isActive ? 'text-slate-900 font-mono' : 'text-slate-500'}`}>
                      ({config.unit})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="pt-3 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city (Delhi, Mumbai, Bengaluru...)"
              className="glass-input pl-10 pr-4 py-2 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Region Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter size={12} />
              <span>Region:</span>
            </span>
            {regions.map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                  selectedRegion === reg
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <span>Status:</span>
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Reset Map View */}
          <button
            onClick={handleResetMapView}
            title="Reset Pan-India Zoom"
            className="self-start md:self-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset View</span>
          </button>
        </div>

        {/* Dynamic Color Legend */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span className="font-bold text-slate-300 flex items-center gap-1">
            <Info size={13} className="text-cyan-400" />
            <span>Scale:</span>
          </span>
          {currentMetricConfig.legend.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-medium text-slate-300">{item.label}</span>
            </div>
          ))}
          <span className="text-[10px] text-slate-500 ml-auto">
            Monitored: {filteredCities.length} of {cities.length} stations
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------
          SECTION 4: INTERACTIVE MAP & CITY TELEMETRY SPLIT
          ---------------------------------------------------- */}
      {viewMode === 'split' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Column (7 Cols on desktop) */}
          <div className="lg:col-span-7 glass-card p-3 relative h-130 sm:h-155 flex flex-col shadow-2xl">
            {/* Map Header Overlay */}
            <div className="absolute top-6 left-6 z-20 pointer-events-none">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Spatial Map • Interactive Stations</span>
              </div>
            </div>

            {/* Floating City Quick Jump Pills */}
            <div className="absolute top-6 right-6 z-20 hidden sm:flex items-center gap-1 bg-slate-950/85 backdrop-blur-md p-1 rounded-xl border border-white/10">
              {['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Ahmedabad'].map((cName) => (
                <button
                  key={cName}
                  onClick={() => {
                    const found = cities.find((c) => c.city === cName);
                    if (found) handleSelectCity(found);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    currentCity.city === cName
                      ? 'bg-cyan-400 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cName}
                </button>
              ))}
            </div>

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              id="leaflet-air-quality-map"
              className="flex-1 w-full rounded-2xl overflow-hidden border border-white/5"
            />
          </div>

          {/* City Telemetry Column (5 Cols on desktop) */}
          <div className="lg:col-span-5 space-y-5">
            {/* City Card Header */}
            <div className="glass-card p-6 relative overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      #{currentCity.rank} National Rank
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{currentCity.region} Region</span>
                  </div>
                  <h3 className="text-3xl font-black text-white mt-1">{currentCity.city}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{currentCity.state}, India</p>
                </div>

                {/* AQI Big Badge */}
                <div
                  className="px-4 py-2.5 rounded-2xl flex flex-col items-center justify-center border font-mono shadow-xl"
                  style={{
                    backgroundColor: `${currentCity.color}15`,
                    borderColor: `${currentCity.color}50`,
                    color: currentCity.color
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">Mean AQI</span>
                  <span className="text-2xl sm:text-3xl font-black">{currentCity.aqi}</span>
                </div>
              </div>

              {/* Status & Pollution Rate Tag */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm"
                  style={{
                    backgroundColor: `${currentCity.color}25`,
                    color: currentCity.color,
                    borderColor: `${currentCity.color}60`
                  }}
                >
                  {currentCity.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-white/10 text-slate-300">
                  {currentCity.pollution_rate_label}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-900 border border-white/10 text-slate-400">
                  Risk: <strong className="text-white">{currentCity.risk_level}</strong>
                </span>
              </div>

              {/* Dominant Pollutant Alert Banner */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <Wind size={18} />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Critical Driver:</span>
                    <span className="font-mono text-cyan-300 font-black">{currentCity.dominant_pollutant}</span>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      ({Math.round(currentCity.dominant_pollutant_ratio)}% of statutory limit)
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                    {currentCity.dominant_pollutant} is the primary criteria pollutant elevating the statutory index above healthy baseline limits.
                  </p>
                </div>
              </div>

              {/* Fast Predict Action CTA */}
              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  <span>Want to test ML inference on this city?</span>
                </div>
                <button
                  id="predict-with-city-btn"
                  onClick={() => onSelectCityForPrediction && onSelectCityForPrediction(currentCity)}
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-400/20 transition transform hover:-translate-y-0.5"
                >
                  <Activity size={14} className="stroke-[2.5]" />
                  <span>Run Prediction for {currentCity.city}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Criteria Pollutants Matrix */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 size={16} className="text-cyan-400" />
                  <span>6 Criteria Pollutants Breakdown</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">CPCB NAQI Standards</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentCity.pollutants || {}).map(([pKey, pVal]) => {
                  const percent = Math.min(100, Math.round(pVal.percentOfLimit));
                  const isOver = pVal.percentOfLimit > 100;
                  return (
                    <div
                      key={pKey}
                      className="p-3 rounded-xl bg-slate-900/70 border border-white/5 space-y-1.5 transition hover:border-white/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white font-mono">{pKey}</span>
                        <span
                          className="text-[10px] font-black px-1.5 py-0.2 rounded"
                          style={{
                            color: pVal.statusColor,
                            backgroundColor: `${pVal.statusColor}18`
                          }}
                        >
                          {pVal.percentOfLimit}% limit
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-white font-mono">{pVal.value}</span>
                        <span className="text-[10px] text-slate-500">{pVal.unit}</span>
                      </div>
                      {/* Meter bar */}
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: isOver ? '#ef4444' : pVal.statusColor
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between">
                        <span>Safe: {pVal.standard} {pVal.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seasonal 12-Month Historical Curve */}
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-400" />
                    <span>Seasonal AQI Trend Curve</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">12-Month atmospheric variation</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-rose-400">
                    Peak: {Math.max(...(currentCity.monthly_trend?.map((t) => t.aqi) || [100]))} AQI
                  </span>
                </div>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentCity.monthly_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cityTrendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={currentCity.color} stopOpacity={0.6} />
                        <stop offset="95%" stopColor={currentCity.color} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="month"
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      domain={[0, 'dataMax + 40']}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="p-2.5 rounded-xl bg-slate-950/95 border border-white/10 shadow-xl text-xs backdrop-blur-md">
                              <div className="font-bold text-white">{label}</div>
                              <div className="font-mono text-cyan-400 font-black mt-1">
                                AQI: {payload[0].value}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="aqi"
                      stroke={currentCity.color}
                      strokeWidth={2.5}
                      fill="url(#cityTrendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Health Advisory & Precaution Checklist */}
            <div className="glass-card p-6 space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-400" />
                <span>Statutory Health Advisory</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-white/5">
                {currentCity.health_advisory}
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/40">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                  <span>Mask: {currentCity.aqi > 200 ? 'N95 Respirator Required' : currentCity.aqi > 100 ? 'Cloth Mask Recommended' : 'Standard'}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/40">
                  <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
                  <span>Air Purifier: {currentCity.aqi > 150 ? 'HEPA Essential Indoors' : 'Optional'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          SECTION 5: FULL PAN-INDIA LEADERBOARD & COMPARISON TABLE
          ---------------------------------------------------- */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-cyan-400" />
              <span>Pan-India City Pollution Rate Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative benchmark ranking all 26 cities across criteria pollutants and statutory AQI index.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-white">{filteredCities.length}</strong> monitored centers
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-white/10 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">AQI Index</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dominant Pollutant</th>
                <th className="py-3 px-4">PM2.5</th>
                <th className="py-3 px-4">PM10</th>
                <th className="py-3 px-4">NO2</th>
                <th className="py-3 px-4">CO</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredCities.map((c) => {
                const isSelected = c.id === selectedCityId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => handleSelectCity(c)}
                    className={`cursor-pointer transition duration-150 ${
                      isSelected
                        ? 'bg-cyan-500/15 text-white border-l-4 border-l-cyan-400'
                        : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-400">#{c.rank}</td>
                    <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                      <MapPin size={14} className="text-cyan-400" />
                      <span>{c.city}</span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">{c.region}</td>
                    <td className="py-3 px-4 font-black text-sm" style={{ color: c.color }}>
                      {c.aqi}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          backgroundColor: `${c.color}20`,
                          color: c.color,
                          borderColor: `${c.color}50`
                        }}
                      >
                        {c.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-300 font-bold">{c.dominant_pollutant}</td>
                    <td className="py-3 px-4">{c.pollutants?.['PM2.5']?.value ?? '-'}</td>
                    <td className="py-3 px-4">{c.pollutants?.['PM10']?.value ?? '-'}</td>
                    <td className="py-3 px-4">{c.pollutants?.['NO2']?.value ?? '-'}</td>
                    <td className="py-3 px-4">{c.pollutants?.['CO']?.value ?? '-'}</td>
                    <td className="py-3 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectCity(c)}
                          title="Inspect City on Map"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition flex items-center gap-1"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => onSelectCityForPrediction && onSelectCityForPrediction(c)}
                          title="Run ML Inference with this city's data"
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-semibold transition flex items-center gap-1"
                        >
                          <Activity size={12} />
                          <span>Predict</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
