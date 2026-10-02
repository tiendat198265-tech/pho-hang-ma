import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pho_hang_ma_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('pho_hang_ma_token');
          setToken('');
          setUser(null);
        }
      } catch (err) {
        console.error('Lỗi kiểm tra phiên đăng nhập:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('pho_hang_ma_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('pho_hang_ma_token');
    localStorage.removeItem('pho_hang_ma_cart');
    localStorage.removeItem('pho_hang_ma_cart_guest');
    localStorage.removeItem('pho_hang_ma_read_notifications');
    try {
      sessionStorage.clear();
    } catch (e) {}

    setToken('');
    setUser(null);

    try {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (e) {}
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
  const isStaff = user?.role === 'STAFF' || isAdmin;
  const isCustomer = user?.role === 'CUSTOMER';

  const updateUser = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : updatedData));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAdmin,
        isStaff,
        isCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
