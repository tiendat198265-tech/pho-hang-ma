import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useNotification();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-[380px] w-full pointer-events-none px-3 sm:px-0"
    >
      {toasts.map((toast) => {
        const { id, type, title, message } = toast;

        let icon = <Info size={19} className="text-[#8C6D18] shrink-0 mt-0.5" />;
        let borderColor = 'border-[#C59B27]';
        let bgStyle = 'bg-[#FAF7F2]';
        let titleColor = 'text-[#262626]';

        if (type === 'success') {
          icon = <CheckCircle2 size={19} className="text-emerald-700 shrink-0 mt-0.5" />;
          borderColor = 'border-emerald-600/40';
          bgStyle = 'bg-[#FAFDF7]';
        } else if (type === 'error') {
          icon = <AlertCircle size={19} className="text-[#8B1E21] shrink-0 mt-0.5" />;
          borderColor = 'border-[#8B1E21]/50';
          bgStyle = 'bg-[#FDF6F6]';
          titleColor = 'text-[#8B1E21]';
        } else if (type === 'warning') {
          icon = <AlertTriangle size={19} className="text-amber-700 shrink-0 mt-0.5" />;
          borderColor = 'border-amber-500/40';
          bgStyle = 'bg-[#FFFDF5]';
        }

        return (
          <div
            key={id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl ${borderColor} ${bgStyle} transition-all duration-300 transform translate-y-0 opacity-100 backdrop-blur-xs`}
            style={{
              boxShadow: '0 8px 24px -4px rgba(62, 39, 35, 0.15), 0 2px 6px -1px rgba(0,0,0,0.06)',
            }}
          >
            {icon}
            <div className="flex-1 min-w-0 pr-1">
              {title && (
                <h5 className={`text-[13px] font-bold ${titleColor} leading-tight mb-0.5 tracking-tight`}>
                  {title}
                </h5>
              )}
              {message && (
                <p className="text-[12px] text-[#584140] leading-snug line-clamp-3">
                  {message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(id)}
              className="text-[#8C6D18] hover:text-[#8B1E21] p-1 rounded-md transition-colors shrink-0 -mr-1 -mt-1 cursor-pointer"
              title="Đóng thông báo"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
