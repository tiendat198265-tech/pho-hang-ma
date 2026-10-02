import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import QuickConsultModal from './components/QuickConsultModal';
import ZaloFloatingButton from './components/ZaloFloatingButton';
import ToastContainer from './components/ToastContainer';

// Home page loaded directly for fast first contentful paint
import HomePage from './pages/HomePage';

// Lazy loaded pages
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const TemplateDetailPage = lazy(() => import('./pages/TemplateDetailPage'));
const TemplateCustomizerPage = lazy(() => import('./pages/TemplateCustomizerPage'));
const CustomOrderQuotePage = lazy(() => import('./pages/CustomOrderQuotePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));

function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#8C1D18] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs tracking-wider uppercase text-neutral-500 font-medium">Đang tải trang...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <NotificationProvider>
          <Router>
            <CartProvider>
              <div className="flex flex-col min-h-screen bg-[#FAF7F2]">
                <Navbar />
                <main className="flex-1">
                  <Suspense fallback={<RouteLoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/bo-mau" element={<TemplatesPage />} />
                      <Route path="/bo-mau/:slug" element={<TemplateDetailPage />} />
                      <Route path="/tuy-chinh-mau" element={<TemplateCustomizerPage />} />
                      <Route path="/tuy-chinh-mau/:slug" element={<TemplateCustomizerPage />} />
                      <Route path="/xac-nhan-bao-gia/:code" element={<CustomOrderQuotePage />} />
                      <Route path="/tra-cuu-bao-gia" element={<CustomOrderQuotePage />} />
                      <Route path="/tra-cuu-bao-gia/:code" element={<CustomOrderQuotePage />} />
                      <Route path="/san-pham" element={<ProductsPage />} />
                      <Route path="/san-pham/:slug" element={<ProductDetailPage />} />
                      <Route path="/gio-hang" element={<CartPage />} />
                      <Route path="/thanh-toan" element={<CheckoutPage />} />
                      <Route path="/don-hang/:code" element={<OrderDetailPage />} />
                      <Route path="/dang-nhap" element={<LoginPage />} />
                      <Route path="/dang-ky" element={<RegisterPage />} />
                      <Route path="/tai-khoan" element={<AccountPage />} />
                      <Route path="/lich-su-don" element={<OrderHistoryPage />} />
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      <Route path="*" element={<HomePage />} />
                    </Routes>
                  </Suspense>
                </main>
                <Footer />
                <QuickConsultModal />
                <ZaloFloatingButton />
                <ToastContainer />
              </div>
            </CartProvider>
          </Router>
        </NotificationProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
