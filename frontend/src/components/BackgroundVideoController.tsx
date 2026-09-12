import React, { useEffect, useRef, useState } from 'react';

// Configurable constants as specified
export const VIDEO_SCROLL_START = 0.00;
export const VIDEO_SCROLL_END = 0.12;
export const VIDEO_CLICK_START = 0.13;
export const VIDEO_CLICK_END = 0.20;
export const VIDEO_SCROLL_RANGE = 1600;

export const BackgroundVideoController: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isClickPlayingRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);
  const clickRafIdRef = useRef<number | null>(null);
  const [isClickPulse, setIsClickPulse] = useState<boolean>(false);

  // Helper to compute target scroll time [0.00 -> 0.12s] based on scrollY
  const getScrollTime = (): number => {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const progress = Math.min(Math.max(scrollY / VIDEO_SCROLL_RANGE, 0), 1);
    return VIDEO_SCROLL_START + progress * (VIDEO_SCROLL_END - VIDEO_SCROLL_START);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      video.pause();
      video.currentTime = VIDEO_SCROLL_START;
      return;
    }

    // Initialize video state
    video.pause();
    video.currentTime = getScrollTime();

    // 1. SCROLL SCRUBBING HANDLER
    const onScroll = () => {
      // If click micro-playback is actively running, let it finish first
      if (isClickPlayingRef.current) return;

      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        if (!isClickPlayingRef.current && video) {
          const targetTime = getScrollTime();
          // Directly set currentTime without triggering video play or component re-renders
          if (Math.abs(video.currentTime - targetTime) > 0.005) {
            video.currentTime = targetTime;
          }
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // 2. CLICK MICRO-PLAYBACK HANDLER (0.13s -> 0.20s)
    const onDocumentClick = () => {
      if (prefersReducedMotion || !video) return;

      // Cancel any previous click animation cleanly
      if (clickRafIdRef.current) {
        cancelAnimationFrame(clickRafIdRef.current);
        clickRafIdRef.current = null;
      }

      isClickPlayingRef.current = true;
      setIsClickPulse(true);
      setTimeout(() => setIsClickPulse(false), 260);

      // Seek to 0.13s and begin play
      video.currentTime = VIDEO_CLICK_START;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Monitor playback with rAF until reaching 0.20s
            const checkTime = () => {
              if (!video) return;

              if (video.currentTime >= VIDEO_CLICK_END) {
                // Pause immediately upon reaching 0.20s
                video.pause();
                isClickPlayingRef.current = false;
                // Restore background to the scroll-dictated position
                video.currentTime = getScrollTime();
              } else if (isClickPlayingRef.current) {
                clickRafIdRef.current = requestAnimationFrame(checkTime);
              }
            };
            clickRafIdRef.current = requestAnimationFrame(checkTime);
          })
          .catch((err) => {
            // In case of browser autoplay prevention on non-user gesture, reset
            console.warn('Background video micro-playback notice:', err);
            isClickPlayingRef.current = false;
            video.currentTime = getScrollTime();
          });
      }

      // Safety timeout: Ensure control is always restored even if timeupdate stalls
      setTimeout(() => {
        if (isClickPlayingRef.current) {
          isClickPlayingRef.current = false;
          if (video) {
            video.pause();
            video.currentTime = getScrollTime();
          }
        }
      }, 500);
    };

    window.addEventListener('click', onDocumentClick);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onDocumentClick);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (clickRafIdRef.current) cancelAnimationFrame(clickRafIdRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-30 overflow-hidden" aria-hidden="true">
      {/* 1. Video Layer: Fixed Fullscreen Cover */}
      <video
        ref={videoRef}
        src="./can_you_make_this_delicate_glo.mp4"
        className="fixed inset-0 w-full h-full object-cover -z-30 pointer-events-none"
        muted
        playsInline
        preload="auto"
      />

      {/* 2. Dark Navy / Tinted Overlay (rgba(4, 8, 16, 0.55)) */}
      <div className="fixed inset-0 bg-[#040810]/55 -z-20 pointer-events-none" />

      {/* 3. Subtle Atmospheric Cyan Glow & Depth */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.12),rgba(255,255,255,0))] -z-15 pointer-events-none" />

      {/* 4. Click Visual Light Pulse Effect */}
      <div
        className={`fixed inset-0 bg-cyan-400/[0.04] -z-12 pointer-events-none transition-opacity duration-300 ${
          isClickPulse ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 5. Subtle Cyber Grid (32px x 32px, 0.05 opacity) */}
      <div className="fixed inset-0 cyber-grid opacity-60 -z-10 pointer-events-none" />
    </div>
  );
};
