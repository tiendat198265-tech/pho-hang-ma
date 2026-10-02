import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import {
  Bell,
  CheckCheck,
  Package,
  FileText,
  Flame,
  Info,
  ExternalLink,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;

  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } =
    useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === 'unread') return !item.isRead;
    return true;
  });

  const handleItemClick = (item) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    if (item.link) {
      setIsOpen(false);
      navigate(item.link);
    }
  };

  const getItemIcon = (type) => {
    switch (type) {
      case 'order':
        return (
          <div className="w-8 h-8 rounded-full bg-red-100 text-[#8B1E21] flex items-center justify-center shrink-0">
            <Package size={16} />
          </div>
        );
      case 'quote':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
        );
      case 'promotion':
        return (
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Flame size={16} />
          </div>
        );
      case 'system':
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-stone-100 text-[#3E2723] flex items-center justify-center shrink-0">
            <Info size={16} />
          </div>
        );
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-1.5 text-[#3E2723] hover:text-[#8B1E21] transition-colors focus:outline-none flex items-center justify-center rounded-full hover:bg-[#FAF7F2]"
        title="Thông báo"
        aria-label="Thông báo"
      >
        <Bell size={21} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#8B1E21] text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-sm animate-pulse border-2 border-[#FAF7F2]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] bg-white border border-[#E6DFD5] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-[#FAF7F2] border-b border-[#E6DFD5] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-[#262626]">Thông báo</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold bg-[#8B1E21]/10 text-[#8B1E21] px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[12px] font-medium text-[#8B1E21] hover:text-[#5E1315] flex items-center gap-1 transition-colors"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck size={14} />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-[#E6DFD5] text-[12px] bg-white">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`flex-1 py-2 text-center font-medium transition-colors border-b-2 ${
                filterTab === 'all'
                  ? 'border-[#8B1E21] text-[#8B1E21] font-bold bg-[#FAF7F2]/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('unread')}
              className={`flex-1 py-2 text-center font-medium transition-colors border-b-2 ${
                filterTab === 'unread'
                  ? 'border-[#8B1E21] text-[#8B1E21] font-bold bg-[#FAF7F2]/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E6DFD5]/50 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-stone-400 flex items-center justify-center mx-auto mb-2 border border-[#E6DFD5]">
                  <Bell size={22} className="opacity-50" />
                </div>
                <p className="text-[13px] font-medium text-stone-600">
                  {filterTab === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Tin tức đơn hàng, hồ sơ đàn lễ và ưu đãi sẽ xuất hiện tại đây
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[#FAF7F2] transition-colors cursor-pointer relative group ${
                    !item.isRead ? 'bg-[#FAF7F2]/60' : 'bg-white'
                  }`}
                >
                  {getItemIcon(item.type)}

                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-[12.5px] leading-tight truncate ${
                          !item.isRead ? 'font-bold text-[#262626]' : 'font-medium text-[#4A4A4A]'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#8B1E21] shrink-0" title="Chưa đọc" />
                      )}
                    </div>

                    <p className="text-[11.5px] text-[#584140] line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between mt-1.5 text-[10.5px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {formatTimeAgo(item.createdAt)}
                      </span>

                      {item.link && (
                        <span className="text-[#8B1E21] font-medium flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem chi tiết <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#FAF7F2] border-t border-[#E6DFD5] text-center">
            <span className="text-[11px] text-[#584140] font-light">
              ✦ Xưởng Phố Hàng Mã phục vụ chu đáo mọi nghi lễ ✦
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
