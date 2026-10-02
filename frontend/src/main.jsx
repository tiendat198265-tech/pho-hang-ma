import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Dynamic API Base URL resolution for Production & Development
const rawApiUrl = import.meta.env.VITE_API_URL;
if (rawApiUrl && typeof rawApiUrl === 'string' && rawApiUrl.trim()) {
  let normalizedBase = rawApiUrl.trim().replace(/\/+$/, '');
  if (!normalizedBase.endsWith('/api')) {
    normalizedBase += '/api';
  }
  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string') {
      if (resource.startsWith('/api/')) {
        return originalFetch(normalizedBase + resource.slice(4), init);
      } else if (resource === '/api') {
        return originalFetch(normalizedBase, init);
      }
    }
    return originalFetch(resource, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
