import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext({
  settings: {},
  logoType: 'TEXT',
  logoText: 'TUYẾT MÃ',
  logoHighlight: '',
  logoTagline: 'LÀNG NGHỀ THƯỜNG TÍN',
  logoUrl: '/logo.png',
  loading: true,
  refreshSettings: async () => {},
  setLogoOptimistic: () => {},
  setSettingsOptimistic: () => {},
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    logo_type: 'TEXT',
    logo_text: 'TUYẾT MÃ',
    logo_highlight: '',
    logo_tagline: 'LÀNG NGHỀ THƯỜNG TÍN',
    logo_url: '/logo.png',
    store_name: 'Tuyết Mã - Di Sản Thủ Công Thường Tín',
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setSettings((prev) => ({
          ...prev,
          ...data.data,
          logo_type: data.data.logo_type || 'TEXT',
          logo_text: data.data.logo_text || 'TUYẾT MÃ',
          logo_highlight: data.data.logo_highlight || '',
          logo_tagline: data.data.logo_tagline || 'LÀNG NGHỀ THƯỜNG TÍN',
          logo_url: data.data.logo_url || '/logo.png',
        }));
      }
    } catch (err) {
      console.error('Lỗi khi tải cài đặt website:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const setLogoOptimistic = (newUrl) => {
    setSettings((prev) => ({ ...prev, logo_url: newUrl }));
  };

  const setSettingsOptimistic = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const logoType = settings.logo_type || 'TEXT';
  const logoText = settings.logo_text || 'TUYẾT MÃ';
  const logoHighlight = settings.logo_highlight || '';
  const logoTagline = settings.logo_tagline || 'LÀNG NGHỀ THƯỜNG TÍN';
  const logoUrl = settings.logo_url || '/logo.png';

  return (
    <SettingsContext.Provider
      value={{
        settings,
        logoType,
        logoText,
        logoHighlight,
        logoTagline,
        logoUrl,
        loading,
        refreshSettings: fetchSettings,
        setLogoOptimistic,
        setSettingsOptimistic,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
