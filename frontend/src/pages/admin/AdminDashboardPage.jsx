import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';
import DashboardTab from './components/DashboardTab';
import ReportsTab from './components/ReportsTab';
import OrdersTab from './components/OrdersTab';
import CustomOrdersTab from './components/CustomOrdersTab';
import ConsultationsTab from './components/ConsultationsTab';
import ProductsTab from './components/ProductsTab';
import CategoriesTab from './components/CategoriesTab';
import TemplatesTab from './components/TemplatesTab';
import InventoryTab from './components/InventoryTab';
import CouponsTab from './components/CouponsTab';
import ReviewsTab from './components/ReviewsTab';
import CustomersTab from './components/CustomersTab';
import StaffTab from './components/StaffTab';
import BannersTab from './components/BannersTab';
import SettingsTab from './components/SettingsTab';
import AuditLogsTab from './components/AuditLogsTab';
import { ShieldAlert } from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, token, isStaff, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  // Active tab state
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authorization check: CUSTOMER cannot access admin area
  useEffect(() => {
    if (!token) {
      navigate('/dang-nhap');
      return;
    }
    if (user?.role === 'CUSTOMER') {
      navigate('/');
    }
  }, [token, user, navigate]);

  if (!token || user?.role === 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-red-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Truy Cập Bị Từ Chối</h2>
          <p className="text-xs text-gray-600 mb-6">
            Khu vực Quản Trị Phố Hàng Mã chỉ dành cho Nhân Viên Xưởng và Quản Trị Viên hệ thống.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-amber-400 text-black text-xs font-bold rounded-lg hover:bg-amber-500 transition-colors"
          >
            Quay Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  // Tab Title mapping for Topbar Breadcrumb
  const getTabTitle = () => {
    switch (activeTab) {
      case 'DASHBOARD':
        return 'Tổng Quan';
      case 'REPORTS':
        return 'Báo Cáo Doanh Thu';
      case 'ORDERS':
        return 'Đơn Hàng';
      case 'TEMPLATES':
        return 'Đàn Phủ';
      case 'PRODUCTS':
        return 'Lễ Phẩm';
      case 'CUSTOM_ORDERS':
        return 'Đặt Theo Yêu Cầu';
      case 'CATEGORIES':
        return 'Danh Mục Lễ Phẩm';
      case 'CONSULTATIONS':
        return 'Yêu Cầu Tư Vấn';
      case 'INVENTORY':
        return 'Kho Hàng';
      case 'COUPONS':
        return 'Mã Giảm Giá';
      case 'REVIEWS':
        return 'Đánh Giá';
      case 'CUSTOMERS':
        return 'Khách Hàng';
      case 'STAFF':
        return 'Nhân Viên & Quyền';
      case 'BANNERS':
        return 'Banner';
      case 'SETTINGS':
        return 'Cài Đặt Cửa Hàng';
      case 'AUDIT_LOGS':
        return 'Nhật Ký Hoạt Động';
      default:
        return 'Quản Trị';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/dang-nhap');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation with RBAC */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Topbar with breadcrumb & profile */}
        <AdminTopbar
          setSidebarOpen={setSidebarOpen}
          activeTabTitle={getTabTitle()}
          user={user}
          onLogout={handleLogout}
        />

        {/* Dynamic Tab Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'DASHBOARD' && (
            <DashboardTab token={token} onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'REPORTS' && <ReportsTab token={token} />}

          {activeTab === 'ORDERS' && <OrdersTab token={token} />}

          {activeTab === 'CUSTOM_ORDERS' && (
            <CustomOrdersTab
              token={token}
              onNavigateOrders={() => setActiveTab('ORDERS')}
            />
          )}

          {activeTab === 'CONSULTATIONS' && <ConsultationsTab token={token} />}

          {activeTab === 'PRODUCTS' && <ProductsTab token={token} />}

          {activeTab === 'CATEGORIES' && <CategoriesTab token={token} />}

          {activeTab === 'TEMPLATES' && <TemplatesTab token={token} />}

          {activeTab === 'INVENTORY' && <InventoryTab token={token} />}

          {activeTab === 'COUPONS' && <CouponsTab token={token} />}

          {activeTab === 'REVIEWS' && <ReviewsTab token={token} />}

          {activeTab === 'CUSTOMERS' && <CustomersTab token={token} />}

          {activeTab === 'STAFF' && <StaffTab token={token} currentUser={user} />}

          {activeTab === 'BANNERS' && <BannersTab token={token} />}

          {activeTab === 'SETTINGS' && <SettingsTab token={token} />}

          {activeTab === 'AUDIT_LOGS' && <AuditLogsTab token={token} />}
        </main>
      </div>
    </div>
  );
}
