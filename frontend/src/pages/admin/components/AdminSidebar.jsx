import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  Layers,
  ShoppingBag,
  FileCheck,
  PhoneCall,
  Boxes,
  Ticket,
  Star,
  Users,
  ShieldCheck,
  Image as ImageIcon,
  Settings,
  History,
  X,
  LogOut,
  Store,
  ChevronRight,
} from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import BrandLogo from '../../../components/BrandLogo';

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  user,
  onLogout,
}) {
  const { logoUrl } = useSettings();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
  const staffPermissions = Array.isArray(user?.permissions) ? user.permissions : [];

  // Helper check if user can view a menu item
  const canAccess = (key) => {
    if (isSuperAdmin || user?.role === 'ADMIN') return true;
    if (user?.role === 'STAFF') {
      return (
        staffPermissions.includes(key) ||
        staffPermissions.includes('ALL') ||
        (key === 'categories' && staffPermissions.includes('products'))
      );
    }
    return false;
  };

  const navGroups = [
    {
      title: 'TỔNG QUAN & BÁO CÁO',
      items: [
        { id: 'DASHBOARD', label: 'Tổng Quan', icon: LayoutDashboard, perm: 'dashboard' },
        { id: 'REPORTS', label: 'Báo Cáo Doanh Thu', icon: TrendingUp, perm: 'dashboard' },
      ],
    },
    {
      title: 'QUẢN LÝ BÁN HÀNG',
      items: [
        { id: 'ORDERS', label: 'Đơn Hàng', icon: ShoppingBag, perm: 'orders' },
        { id: 'TEMPLATES', label: 'Đàn Phủ', icon: Boxes, perm: 'products' },
        { id: 'PRODUCTS', label: 'Lễ Phẩm', icon: Package, perm: 'products' },
        { id: 'CATEGORIES', label: 'Danh Mục Lễ Phẩm', icon: Layers, perm: 'categories' },
        { id: 'CUSTOM_ORDERS', label: 'Đặt Theo Yêu Cầu', icon: FileCheck, perm: 'custom_orders' },
        { id: 'CONSULTATIONS', label: 'Yêu Cầu Tư Vấn', icon: PhoneCall, perm: 'orders' },
      ],
    },
    {
      title: 'KHO HÀNG & MARKETING',
      items: [
        { id: 'INVENTORY', label: 'Kho Hàng', icon: Boxes, perm: 'inventory' },
        { id: 'COUPONS', label: 'Mã Giảm Giá', icon: Ticket, perm: 'coupons' },
        { id: 'REVIEWS', label: 'Đánh Giá', icon: Star, perm: 'reviews' },
      ],
    },
    {
      title: 'TÀI KHOẢN & PHÂN QUYỀN',
      items: [
        { id: 'CUSTOMERS', label: 'Khách Hàng', icon: Users, perm: 'customers' },
        { id: 'STAFF', label: 'Nhân Viên & Quyền', icon: ShieldCheck, perm: 'users' },
      ],
    },
    {
      title: 'GIAO DIỆN & CÀI ĐẶT',
      items: [
        { id: 'BANNERS', label: 'Banner', icon: ImageIcon, perm: 'banners' },
        { id: 'SETTINGS', label: 'Cài Đặt Cửa Hàng', icon: Settings, perm: 'settings' },
        { id: 'AUDIT_LOGS', label: 'Nhật Ký Hoạt Động', icon: History, perm: 'audit_logs' },
      ],
    },
  ];

  const handleSelectTab = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-fadeIn"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white text-gray-800 flex flex-col transition-transform duration-300 ease-in-out border-r border-gray-200 shadow-sm ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-gray-200 bg-white">
          <Link to="/admin" className="flex items-center gap-3">
            <BrandLogo variant="admin" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User preview card in sidebar */}
        <div className="px-3.5 py-3 mx-3 mt-3 rounded-xl bg-gray-50 border border-gray-200/90 shadow-2xs">
          <div className="flex items-center gap-2.5">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-[#d70018]/30 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#d70018] text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">{user?.name || 'Quản trị viên'}</div>
              <div className="text-[10px] font-semibold text-[#d70018] tracking-wide">
                {user?.role === 'SUPER_ADMIN' ? '👑 TỔNG QUẢN TRỊ' : user?.role === 'ADMIN' ? '⭐ QUẢN TRỊ VIÊN' : '🔨 NHÂN VIÊN'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
          {navGroups.map((group, idx) => {
            const accessibleItems = group.items.filter((item) => canAccess(item.perm));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={idx}>
                <div className="px-3 mb-1.5 text-[11px] font-bold text-gray-400 tracking-wider uppercase">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {accessibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${
                          isActive
                            ? 'bg-[#d70018] text-white font-bold shadow-xs shadow-red-200'
                            : 'text-gray-700 hover:bg-red-50/80 hover:text-[#d70018] font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#d70018]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="p-3 border-t border-gray-200 bg-gray-50/70 space-y-1">
          <Link
            to="/"
            target="_blank"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white hover:text-[#d70018] border border-transparent hover:border-gray-200 shadow-2xs transition-all"
          >
            <Store className="w-4 h-4 text-gray-500" />
            <span className="truncate">Xem Cửa Hàng Phố Hàng Mã</span>
          </Link>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Đăng Xuất Khỏi Hệ Thống</span>
          </button>
        </div>
      </aside>
    </>
  );
}
