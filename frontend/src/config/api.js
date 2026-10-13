/**
 * Dynamic API Base URL configuration.
 * - In local development: defaults to http://127.0.0.1:8000
 * - In production on Render: the frontend and API share an origin
 */
const isProductionBuild = import.meta.env.PROD;
const isLocalhost = typeof window !== 'undefined'
  && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_BASE_URL = isProductionBuild
  ? ''
  : import.meta.env.VITE_API_URL || (isLocalhost ? `http://${window.location.hostname}:8000` : '');

export default API_BASE_URL;
