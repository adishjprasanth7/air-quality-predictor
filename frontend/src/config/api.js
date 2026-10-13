/**
 * Dynamic API Base URL configuration.
 * - In local development: defaults to http://127.0.0.1:8000
 * - In production on Render: the frontend and API share an origin
 */
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? `http://${window.location.hostname}:8000`
    : '');

export default API_BASE_URL;
