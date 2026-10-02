import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Move, Volume2, VolumeX } from 'lucide-react';

/**
 * BannerDisplay: Shared banner rendering component used by both
 * HomePage (Customer facing) and Admin BannersTab (Live & Fullscreen Preview).
 * Ensures 100% visual and structural consistency.
 */
export default function BannerDisplay({
  banner = {},
  device = 'DESKTOP', // 'DESKTOP' | 'LAPTOP' | 'TABLET' | 'MOBILE'
  isInteractive = false, // If true, enables dragging image to change positionX & positionY
  onPositionChange, // ({ positionX, positionY }) => void
  onZoomChange, // (delta) => void
  isLivePreview = false, // In admin preview, buttons are not navigational
  aspectRatioOverride,
  heightClassOverride,
  showDragHint = true,
  className = '',
  isActive = true,
}) {
  const {
    title = '',
    subtitle = '',
    description = '',
    linkText = '',
    linkUrl = '/bo-mau',
    secondaryLinkText = '',
    secondaryLinkUrl = '',
    imageUrl = '',
    mobileImageUrl = '',
    mediaType = 'image',
    videoUrl = '',
    mobileVideoUrl = '',
    videoAutoplay = true,
    videoMuted = true,
    videoLoop = true,
    overlay = false,
    overlayOpacity = 30,
    aspectRatio = 2.63,
    heightSize = 'LARGE',
    customHeight = '',
    zoomX = 100,
    zoomY = 100,
    positionX = 0,
    positionY = 0,
    focalPoint = 'center',
    fitMode = 'cover',
    bgStyle = 'blur',
    isPureImage = false,
  } = banner;

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const [isMuted, setIsMuted] = useState(videoMuted !== false);

  useEffect(() => {
    setIsMuted(videoMuted !== false);
  }, [videoMuted]);

  // Video playback management: pause when inactive to save GPU/CPU cycles and prevent lag
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  // Determine active video & image
  const activeVideo =
    device === 'MOBILE' && mobileVideoUrl
      ? mobileVideoUrl
      : videoUrl || (/\.(mp4|webm|mov|ogg)($|\?)/i.test(imageUrl) ? imageUrl : '');

  const isVideo = mediaType === 'video' || Boolean(activeVideo);

  // Helper for YouTube embeds
  const getYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? match[1] : null;
  };
  const youTubeId = isVideo && activeVideo ? getYouTubeId(activeVideo) : null;

  // Choose appropriate image: mobileImageUrl on mobile device, else imageUrl
  const activeImage =
    device === 'MOBILE' && mobileImageUrl
      ? mobileImageUrl
      : imageUrl || '';

  // Drag handler for interactive mode
  useEffect(() => {
    if (!isInteractive || !isDragging) return;

    const handlePointerMove = (e) => {
      const clientX = e.clientX ?? e.touches?.[0]?.clientX;
      const clientY = e.clientY ?? e.touches?.[0]?.clientY;
      if (clientX === undefined || clientY === undefined) return;

      const deltaX = Math.round(clientX - dragStartRef.current.startX);
      const deltaY = Math.round(clientY - dragStartRef.current.startY);

      const nextX = Math.min(Math.max(dragStartRef.current.posX + deltaX, -800), 800);
      const nextY = Math.min(Math.max(dragStartRef.current.posY + deltaY, -800), 800);

      if (onPositionChange) {
        onPositionChange({ positionX: nextX, positionY: nextY });
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isInteractive, isDragging, onPositionChange]);

  const handlePointerDown = (e) => {
    if (!isInteractive) return;
    if (e.button !== undefined && e.button !== 0) return; // Left click only
    e.preventDefault();
    setIsDragging(true);

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      posX: positionX || 0,
      posY: positionY || 0,
    };
  };

  const handleWheel = (e) => {
    if (!isInteractive || !onZoomChange) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 5 : -5;
    onZoomChange(delta);
  };

  // Determine height classes for full presentation
  const getHeightStyleOrClass = () => {
    if (heightClassOverride) return { className: heightClassOverride, style: {} };
    if (heightSize === 'CUSTOM' && customHeight) {
      return { className: 'w-full', style: { height: customHeight } };
    }
    switch (heightSize) {
      case 'FULL':
        return { className: 'h-[520px] sm:h-[640px] lg:h-[780px] xl:h-[860px]', style: {} };
      case 'XLARGE':
        return { className: 'h-[480px] sm:h-[580px] lg:h-[700px]', style: {} };
      case 'STANDARD':
        return { className: 'h-[360px] sm:h-[440px] lg:h-[520px]', style: {} };
      case 'LARGE':
      default:
        return { className: 'h-[420px] sm:h-[520px] lg:h-[630px]', style: {} };
    }
  };

  const { className: heightClass, style: customHeightStyle } = getHeightStyleOrClass();

  // Background style container class
  const bgContainerClass =
    bgStyle === 'dark' ? 'bg-[#1E120D]' : bgStyle === 'black' ? 'bg-black' : 'bg-[#120B08]';

  // Has any text to display
  const hasText =
    !isPureImage &&
    Boolean(
      title?.trim() ||
        subtitle?.trim() ||
        description?.trim() ||
        linkText?.trim() ||
        secondaryLinkText?.trim()
    );

  // Responsive typography classes based on device
  const typography = {
    badge:
      device === 'MOBILE'
        ? 'text-[10px] px-2 py-0.5'
        : device === 'TABLET'
        ? 'text-[11px] px-2.5 py-0.5'
        : 'text-[11.5px] px-3 py-1',
    title:
      device === 'MOBILE'
        ? 'text-base font-bold leading-snug'
        : device === 'TABLET'
        ? 'text-xl font-bold leading-tight'
        : 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight',
    desc:
      device === 'MOBILE'
        ? 'text-[11px] line-clamp-2'
        : device === 'TABLET'
        ? 'text-xs line-clamp-2'
        : 'text-xs sm:text-sm lg:text-[15px] line-clamp-3',
    btn:
      device === 'MOBILE'
        ? 'text-[11px] px-3.5 py-1.5'
        : device === 'TABLET'
        ? 'text-xs px-4 py-2'
        : 'text-xs sm:text-sm px-5 py-2.5',
    padding:
      device === 'MOBILE'
        ? 'p-4 sm:p-5'
        : device === 'TABLET'
        ? 'p-5 sm:p-8'
        : 'p-4 sm:p-8 lg:p-12',
  };

  return (
    <div
      ref={containerRef}
      style={{
        ...customHeightStyle,
        ...(aspectRatioOverride
          ? { paddingBottom: `${(1 / aspectRatioOverride) * 100}%` }
          : {}),
      }}
      className={`relative w-full overflow-hidden select-none ${bgContainerClass} ${
        aspectRatioOverride ? '' : heightClass
      } ${className}`}
      onWheel={handleWheel}
    >
      {/* 1. Nền mờ nghệ thuật nếu bật - tối ưu GPU rasterization */}
      {bgStyle === 'blur' && activeImage && (
        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
        >
          <div
            className="w-full h-full filter blur-xl scale-110 opacity-50"
            style={{
              backgroundImage: `url(${activeImage})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              transform: 'translateZ(0)',
            }}
          />
        </div>
      )}

      {/* 2. Vùng ảnh chính với khả năng kéo thả nếu interactive */}
      <div
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className={`absolute inset-0 w-full h-full overflow-hidden flex items-center justify-center ${
          isInteractive
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : ''
        }`}
        title={
          isInteractive
            ? 'Nhấp giữ và kéo chuột để chọn vị trí hiển thị đẹp nhất. Lăn chuột để Zoom.'
            : undefined
        }
      >
        {isVideo && youTubeId ? (
          <div className="w-full h-full relative overflow-hidden pointer-events-none flex items-center justify-center">
            {isActive && (
              <iframe
                className="w-[120%] h-[120%] absolute pointer-events-none"
                src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1&mute=1&loop=1&playlist=${youTubeId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                title={title || 'Banner Video'}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
          </div>
        ) : isVideo && activeVideo ? (
          <div
            className="w-full h-full overflow-hidden flex items-center justify-center"
            style={{
              transform: `translate3d(${positionX}px, ${positionY}px, 0) scale(${zoomX / 100}, ${
                zoomY / 100
              })`,
              transformOrigin: focalPoint || 'center',
              willChange: isInteractive ? 'transform' : 'auto',
            }}
          >
            <video
              ref={videoRef}
              key={activeVideo}
              src={activeVideo}
              poster={activeImage || undefined}
              autoPlay={videoAutoplay !== false}
              muted={isMuted}
              loop={videoLoop !== false}
              playsInline
              preload="auto"
              style={{
                willChange: 'transform',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
              }}
              className={`w-full h-full pointer-events-none select-none ${
                isInteractive ? 'transition-transform duration-75' : ''
              } ${
                fitMode === 'contain'
                  ? 'object-contain'
                  : fitMode === 'fill'
                  ? 'object-fill'
                  : 'object-cover'
              }`}
            />
          </div>
        ) : activeImage ? (
          <div
            className="w-full h-full overflow-hidden flex items-center justify-center"
            style={{
              transform: `translate3d(${positionX}px, ${positionY}px, 0) scale(${zoomX / 100}, ${
                zoomY / 100
              })`,
              transformOrigin: focalPoint || 'center',
              willChange: isInteractive ? 'transform' : 'auto',
            }}
          >
            <picture className="w-full h-full block">
              {/* Tự động switch ảnh mobile trên màn hình thực tế của khách hàng nếu không ở chế độ giả lập device */}
              {!isLivePreview && mobileImageUrl && (
                <source media="(max-width: 768px)" srcSet={mobileImageUrl} />
              )}
              <img
                src={activeImage}
                alt={title || 'Phố Hàng Mã Banner'}
                draggable={false}
                style={{
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                }}
                className={`w-full h-full pointer-events-none select-none ${
                  isInteractive
                    ? 'transition-transform duration-75'
                    : 'transition-transform duration-[7000ms] ease-out'
                } ${
                  isActive && !isInteractive ? 'scale-105' : 'scale-100'
                } ${
                  fitMode === 'contain'
                    ? 'object-contain'
                    : fitMode === 'fill'
                    ? 'object-fill'
                    : 'object-cover'
                }`}
              />
            </picture>
          </div>
        ) : isInteractive || isLivePreview ? (
          <div className="flex flex-col items-center justify-center text-white/40 gap-2 p-4 text-center">
            <span className="text-sm font-light">Chưa có hình ảnh hoặc video banner</span>
            <span className="text-xs text-white/30">Vui lòng tải ảnh/video lên hoặc dán link</span>
          </div>
        ) : null}
      </div>

      {/* Floating Audio Mute/Unmute toggle for video */}
      {isVideo && activeVideo && !youTubeId && !isLivePreview && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted((prev) => !prev);
          }}
          className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 p-2 sm:px-3 sm:py-1.5 rounded-full bg-black/60 hover:bg-[#8B1E21] text-white backdrop-blur-md border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl flex items-center gap-1.5 text-xs"
          title={isMuted ? 'Bật âm thanh video' : 'Tắt tiếng video'}
          aria-label={isMuted ? 'Bật âm thanh video' : 'Tắt tiếng video'}
        >
          {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span className="text-[11px] hidden sm:inline font-medium">{isMuted ? 'Bật tiếng' : 'Tắt tiếng'}</span>
        </button>
      )}

      {/* 3. Lớp phủ Overlay với Opacity tùy chỉnh chính xác */}
      {overlay && (
        <div
          className="absolute inset-0 pointer-events-none z-10 transition-all duration-500"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${(overlayOpacity ?? 30) / 100})`,
          }}
        />
      )}

      {/* 4. Nội dung Banner (Chỉ hiển thị khi KHÔNG phải chế độ Pure Image và có dữ liệu) */}
      {hasText && (
        <div
          className={`absolute inset-0 z-20 flex flex-col justify-end text-white pointer-events-none ${typography.padding}`}
        >
          <div className="max-w-2xl space-y-2 sm:space-y-3 pointer-events-auto">
            {/* Phụ đề / Badge */}
            {subtitle?.trim() && (
              <div
                className={`transition-all duration-700 ease-out transform ${
                  isActive
                    ? 'opacity-100 translate-y-0 delay-100'
                    : 'opacity-0 translate-y-3'
                }`}
              >
                <span
                  className={`inline-block bg-[#C59B27] text-[#1E120D] font-bold rounded-sm shadow-md uppercase tracking-wider ${typography.badge}`}
                >
                  {subtitle}
                </span>
              </div>
            )}

            {/* Tiêu đề */}
            {title?.trim() && (
              <h2
                className={`font-serif text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all duration-700 ease-out transform ${typography.title} ${
                  isActive
                    ? 'opacity-100 translate-y-0 delay-200'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                {title}
              </h2>
            )}

            {/* Mô tả */}
            {description?.trim() && (
              <p
                className={`text-gray-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] font-light leading-relaxed max-w-xl transition-all duration-700 ease-out transform ${typography.desc} ${
                  isActive
                    ? 'opacity-100 translate-y-0 delay-300'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                {description}
              </p>
            )}

            {/* Nút bấm (Chỉ render nút nào có text thực sự) */}
            {(linkText?.trim() || secondaryLinkText?.trim()) && (
              <div
                className={`pt-2 sm:pt-3 flex items-center gap-2.5 sm:gap-3.5 flex-wrap transition-all duration-700 ease-out transform ${
                  isActive
                    ? 'opacity-100 translate-y-0 delay-500'
                    : 'opacity-0 translate-y-4'
                }`}
              >
                {linkText?.trim() && (
                  isLivePreview ? (
                    <span
                      className={`inline-flex items-center gap-1.5 bg-[#8B1E21] hover:bg-[#A32427] text-white font-semibold rounded-[4px] shadow-lg border border-[#A32427] transition-all cursor-pointer ${typography.btn}`}
                    >
                      <span>{linkText}</span>
                      <ArrowRight size={14} />
                    </span>
                  ) : (
                    <Link
                      to={linkUrl || '/bo-mau'}
                      className={`inline-flex items-center gap-1.5 bg-[#8B1E21] hover:bg-[#A32427] text-white font-semibold rounded-[4px] shadow-lg border border-[#A32427] transition-all hover:scale-105 active:scale-95 ${typography.btn}`}
                    >
                      <span>{linkText}</span>
                      <ArrowRight size={14} />
                    </Link>
                  )
                )}

                {secondaryLinkText?.trim() && (
                  isLivePreview ? (
                    <span
                      className={`inline-flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-medium rounded-[4px] border border-white/30 transition-all cursor-pointer ${typography.btn}`}
                    >
                      <span>{secondaryLinkText}</span>
                    </span>
                  ) : (
                    <Link
                      to={secondaryLinkUrl || '/lien-he'}
                      className={`inline-flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white font-medium rounded-[4px] border border-white/30 transition-all hover:bg-black/70 ${typography.btn}`}
                    >
                      <span>{secondaryLinkText}</span>
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Gợi ý tương tác trực tiếp khi đang ở chế độ chỉnh sửa Live */}
      {isInteractive && showDragHint && (
        <div className="absolute bottom-2.5 right-2.5 z-30 pointer-events-none flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full border border-white/20 text-[10.5px] shadow-lg animate-pulse">
          <Move className="w-3 h-3 text-[#C59B27]" />
          <span>Kéo ảnh trực tiếp trong khung để căn góc</span>
        </div>
      )}

      {/* 6. Chỉ báo tọa độ kéo thả nổi góc trái khi đang kéo */}
      {isInteractive && isDragging && (
        <div className="absolute top-3 left-3 z-30 pointer-events-none bg-[#8B1E21]/90 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-mono font-bold shadow-2xl border border-red-400">
          X: {positionX}px · Y: {positionY}px
        </div>
      )}
    </div>
  );
}
