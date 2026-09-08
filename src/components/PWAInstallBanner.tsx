'use client';

import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;

    if (isStandalone) {
      return; // Already installed as PWA
    }

    // Check if dismissed previously
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    if (dismissed) {
      return;
    }

    // Check user agent for iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iosDevice);

    // Show banner after 2 seconds
    const timer = setTimeout(() => {
      setShowBanner(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-50 bg-zinc-900/95 border border-zinc-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
              Install Campus HUD PWA
            </h4>
            <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
              {isIOS ? (
                <>
                  Tap <Share className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" /> Share, then scroll down and tap{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" /> &quot;Add to Home Screen&quot; for instant offline access.
                </>
              ) : (
                <>
                  Add to Home Screen from your browser menu for high-performance offline schedule tracking.
                </>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
