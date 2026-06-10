import React, { useState } from 'react';
import logo from '../assets/logo.png';

/**
 * Branded first-load splash. Stays mounted while `show` is true, then fades
 * out smoothly and unmounts itself once the fade completes. Driven by App,
 * which keeps it up until the homepage data has loaded (with a hard cap).
 */
const SplashScreen = ({ show }) => {
  const [render, setRender] = useState(true);

  if (!render) return null;

  return (
    <div
      onTransitionEnd={() => {
        if (!show) setRender(false);
      }}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center mithai-bg transition-opacity duration-700 ease-out ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Logo with pulsing rings */}
      <div className="relative flex items-center justify-center">
        <span className="absolute h-40 w-40 rounded-full border-2 border-[#d80a4e]/30 animate-splash-ring" />
        <span
          className="absolute h-40 w-40 rounded-full border-2 border-[#e8a317]/30 animate-splash-ring"
          style={{ animationDelay: '0.6s' }}
        />
        <img
          src={logo}
          alt="Chowdhry Sweet House"
          className="relative h-24 w-auto object-contain animate-splash-pop sm:h-28"
        />
      </div>

      {/* Wordmark */}
      <h1 className="font-display mt-6 animate-splash-pop text-center text-xl font-bold text-gray-900 sm:text-2xl" style={{ animationDelay: '0.15s' }}>
        Chowdhry Sweet House
      </h1>
      <p className="mt-1 animate-splash-pop text-xs tracking-[0.25em] text-[#d80a4e] uppercase sm:text-sm" style={{ animationDelay: '0.3s' }}>
        Sweetness Since 1970
      </p>

      {/* Loading dots */}
      <div className="mt-7 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d80a4e] animate-splash-dot" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d80a4e] animate-splash-dot" style={{ animationDelay: '0.15s' }} />
        <span className="h-2.5 w-2.5 rounded-full bg-[#d80a4e] animate-splash-dot" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  );
};

export default SplashScreen;
