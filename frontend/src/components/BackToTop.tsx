import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled approximately 450-500px down
      if (window.scrollY > 450) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Scroll to top"
      className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl bg-[#0a0f1d]/90 hover:bg-[#11192e] text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-xl flex items-center justify-center transition-all duration-300 group cursor-pointer ${
        isVisible
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-75 pointer-events-none'
      }`}
    >
      <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" />
    </button>
  );
};
