import { useEffect } from 'react';

export const useAntiDevTools = () => {
  useEffect(() => {
    // Không kích hoạt trong môi trường development để lập trình viên có thể debug cục bộ
    if (import.meta.env.DEV) {
      return;
    }

    // 1. Chặn chuột phải
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 2. Chặn các tổ hợp phím tắt F12, Ctrl+Shift+I/J/C, Ctrl+U
    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 || // F12
        e.key === 'F12' ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.keyCode === 73 ||
            e.keyCode === 74 ||
            e.keyCode === 67 ||
            ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key))) || // Ctrl+Shift+I/J/C
        (e.ctrlKey && (e.keyCode === 85 || e.key === 'u' || e.key === 'U')) // Ctrl+U
      ) {
        e.preventDefault();
        triggerRedirect();
      }
    };

    // 3. Hàm xử lý khi phát hiện DevTools: Xóa Token & Chuyển hướng
    const triggerRedirect = () => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        // Bỏ qua lỗi truy cập storage trong chế độ ẩn danh
      }
      window.location.href = 'https://www.google.com';
    };

    // 4. Bẫy đo chênh lệch kích thước màn hình (Phát hiện DevTools dạng Docked)
    const checkScreenThreshold = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        triggerRedirect();
      }
    };

    // 5. Bẫy Debugger Loop (Làm đơ console nếu cố tình mở DevTools)
    const debuggerInterval = setInterval(() => {
      const startTime = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const endTime = performance.now();
      // Nếu thời gian xử lý dòng debugger bị kéo dài > 100ms -> DevTools đang mở
      if (endTime - startTime > 100) {
        triggerRedirect();
      }
    }, 1000);

    // Đăng ký Event Listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', checkScreenThreshold);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', checkScreenThreshold);
      clearInterval(debuggerInterval);
    };
  }, []);
};

export default useAntiDevTools;
