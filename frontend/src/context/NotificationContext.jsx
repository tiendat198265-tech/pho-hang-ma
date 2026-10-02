import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const STORAGE_GUEST_READ_KEY = 'pho_hang_ma_read_notifications';

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // --- 1. TOAST NOTIFICATIONS (POP-UP ALERTS) ---
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'info', title = '', message = '', duration = 4000 }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
      const newToast = { id, type, title, message, duration };
      
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  // --- 2. NOTIFICATION CENTER (BELL & DROPDOWN) ---
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/notifications', { headers });
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        let items = data.data;

        // For guests, check locally read ids
        if (!user) {
          try {
            const guestReadIds = JSON.parse(localStorage.getItem(STORAGE_GUEST_READ_KEY) || '[]');
            items = items.map((item) => ({
              ...item,
              isRead: item.isRead || guestReadIds.includes(item._id),
            }));
          } catch (e) {
            // fallback
          }
        }

        setNotifications(items);
        const unread = user ? items.filter((n) => !n.isRead).length : 0;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.warn('Lỗi tải danh sách thông báo:', err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Lắng nghe sự kiện auth:logout để xóa sạch trạng thái thông báo của tài khoản cũ
  useEffect(() => {
    const handleLogout = () => {
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
    }
  }, [token]);

  // Mark single as read
  const markAsRead = async (id) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (!user) {
      try {
        const guestReadIds = JSON.parse(localStorage.getItem(STORAGE_GUEST_READ_KEY) || '[]');
        if (!guestReadIds.includes(id)) {
          guestReadIds.push(id);
          localStorage.setItem(STORAGE_GUEST_READ_KEY, JSON.stringify(guestReadIds));
        }
      } catch (e) {}
    }

    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers,
      });
    } catch (err) {
      console.warn('Lỗi đánh dấu thông báo đã đọc:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    if (!user) {
      try {
        const allIds = notifications.map((n) => n._id);
        localStorage.setItem(STORAGE_GUEST_READ_KEY, JSON.stringify(allIds));
      } catch (e) {}
    }

    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers,
      });
      showToast({
        type: 'info',
        title: 'Thông báo',
        message: 'Đã đánh dấu đọc tất cả thông báo',
        duration: 2500,
      });
    } catch (err) {
      console.warn('Lỗi đánh dấu tất cả đã đọc:', err);
    }
  };

  // Add custom client-side notification
  const addNotification = (notif) => {
    const newNotif = {
      _id: Date.now().toString(),
      title: notif.title || 'Thông báo mới',
      message: notif.message || '',
      type: notif.type || 'info',
      link: notif.link || '',
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notif,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        showToast,
        removeToast,
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
