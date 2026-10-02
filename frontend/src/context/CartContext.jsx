import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import AuthPromptModal from '../components/AuthPromptModal';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { showToast } = useNotification();
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || null;
  const prevUserIdRef = useRef(currentUserId);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const getCartStorageKey = (uid) => (uid ? `pho_hang_ma_cart_user_${uid}` : null);

  const [cartItems, setCartItems] = useState(() => {
    try {
      if (!currentUserId) return [];
      const userKey = getCartStorageKey(currentUserId);
      const saved = localStorage.getItem(userKey);
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  // Lắng nghe sự kiện auth:logout để reset sạch giỏ hàng trong bộ nhớ tức thì
  useEffect(() => {
    const handleLogout = () => {
      setCartItems([]);
      setAuthModalOpen(false);
      localStorage.removeItem('pho_hang_ma_cart');
      localStorage.removeItem('pho_hang_ma_cart_guest');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // Đồng bộ giỏ hàng khi người dùng Đăng Nhập / Đăng Xuất / Đổi tài khoản
  useEffect(() => {
    const prevId = prevUserIdRef.current;
    prevUserIdRef.current = currentUserId;

    if (!currentUserId) {
      // Người dùng ĐĂNG XUẤT hoặc là Khách:
      // Xóa sạch giỏ hàng trong bộ nhớ, không lưu giữ dữ liệu
      setCartItems([]);
      localStorage.removeItem('pho_hang_ma_cart');
      localStorage.removeItem('pho_hang_ma_cart_guest');
    } else if (currentUserId !== prevId) {
      // Người dùng ĐĂNG NHẬP hoặc CHUYỂN TÀI KHOẢN:
      // Đọc duy nhất giỏ hàng của chính tài khoản đó từ pho_hang_ma_cart_user_${uid}
      try {
        const userKey = getCartStorageKey(currentUserId);
        const userSaved = localStorage.getItem(userKey);
        setCartItems(userSaved ? JSON.parse(userSaved) : []);
      } catch {
        setCartItems([]);
      }
      // Dọn dẹp key guest/global nếu có từ phiên trước
      localStorage.removeItem('pho_hang_ma_cart_guest');
      localStorage.removeItem('pho_hang_ma_cart');
    }
  }, [currentUserId]);

  // Lưu thay đổi giỏ hàng vào storage của ĐÚNG tài khoản đang đăng nhập
  useEffect(() => {
    if (!currentUserId) {
      // Khách không được lưu giỏ hàng
      localStorage.removeItem('pho_hang_ma_cart');
      localStorage.removeItem('pho_hang_ma_cart_guest');
      return;
    }

    const key = getCartStorageKey(currentUserId);
    if (cartItems.length > 0) {
      localStorage.setItem(key, JSON.stringify(cartItems));
    } else {
      localStorage.removeItem(key);
    }
    // Tuyệt đối không lưu đè vào key chung để tránh rò rỉ dữ liệu giữa các tài khoản
    localStorage.removeItem('pho_hang_ma_cart');
    localStorage.removeItem('pho_hang_ma_cart_guest');
  }, [cartItems, currentUserId]);

  const addToCart = (product, quantity = 1, note = '') => {
    // 1. Kiểm tra xác thực: Bắt buộc đăng nhập trước khi thêm vào giỏ
    if (!user || !currentUserId) {
      setAuthModalOpen(true);
      if (showToast) {
        showToast({
          type: 'warning',
          title: 'Cần đăng nhập',
          message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.',
          duration: 3500,
        });
      }
      return false;
    }

    const safeQty = Math.max(1, Number(quantity) || 1);

    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: existing.quantity + safeQty, note: note || item.note }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          thumbnail: product.thumbnail || product.images?.[0] || '',
          unit: product.unit || 'bộ',
          sku: product.sku || '',
          quantity: safeQty,
          stockQuantity: product.stockQuantity,
          note,
        },
      ];
    });

    if (showToast) {
      showToast({
        type: 'success',
        title: 'Đã thêm vào giỏ hàng',
        message: `${product.name} (SL: ${safeQty}) đã có trong mâm lễ`,
        duration: 3000,
      });
    }
    return true;
  };

  const updateQuantity = (productId, newQuantity) => {
    if (!user || !currentUserId) return;
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, quantity: Math.max(1, newQuantity) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    if (!user || !currentUserId) return;
    const itemToRemove = cartItems.find((i) => i.productId === productId);
    setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    if (showToast && itemToRemove) {
      showToast({
        type: 'info',
        title: 'Đã xóa sản phẩm',
        message: `Đã bỏ ${itemToRemove.name} khỏi giỏ`,
        duration: 2500,
      });
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (currentUserId) {
      const key = getCartStorageKey(currentUserId);
      localStorage.removeItem(key);
    }
    localStorage.removeItem('pho_hang_ma_cart');
    localStorage.removeItem('pho_hang_ma_cart_guest');
  };

  // Chỉ tính số lượng khi đã đăng nhập
  const effectiveItems = user && currentUserId ? cartItems : [];
  const totalCount = effectiveItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = effectiveItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems: effectiveItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalPrice,
        openAuthModal: () => setAuthModalOpen(true),
      }}
    >
      {children}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
