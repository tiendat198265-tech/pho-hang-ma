import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Dynamic API Base URL resolution for Production & Development
const rawApiUrl = import.meta.env.VITE_API_URL;
if (rawApiUrl) {
  const normalizedBase = rawApiUrl.replace(/\/+$/, '');
  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string' && resource.startsWith('/api')) {
      const target = resource.replace('/api', normalizedBase);
      return originalFetch(target, init);
    }
    return originalFetch(resource, init);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
