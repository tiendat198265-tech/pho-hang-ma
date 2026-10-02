import React, { useState } from 'react';
import { Menu, Bell, User as UserIcon, LogOut, ChevronDown, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminTopbar({
  setSidebarOpen,
  activeTabTitle = 'Bàn Làm Việc',
  user,
  onLogout,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-full">👑 TỔNG QUẢN TRỊ</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 rounded-full">⭐ QUẢN TRỊ VIÊN</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 rounded-full">🔨 NHÂN VIÊN XƯỞNG</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
          title="Mở menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Quản trị</span>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-800">{activeTabTitle}</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block">
          {getRoleBadge(user?.role)}
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-amber-300 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-200 border border-amber-300 text-black font-bold flex items-center justify-center text-xs shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-gray-800 leading-tight">{user?.name || 'Tài khoản'}</div>
              <div className="text-[10px] text-gray-500 truncate max-w-[120px]">{user?.email}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {profileDropdownOpen && (
            <>
              <div
                onClick={() => setProfileDropdownOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-scaleUp">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-xs text-gray-500">Đang đăng nhập với</div>
                  <div className="text-sm font-bold text-gray-800 truncate">{user?.name}</div>
                  <div className="text-xs text-gray-500 font-mono truncate">{user?.email}</div>
                  <div className="mt-2 sm:hidden">{getRoleBadge(user?.role)}</div>
                </div>

                <Link
                  to="/"
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <span>🏮 Trang chủ cửa hàng</span>
                </Link>

                <div className="border-t border-gray-100 my-1" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
