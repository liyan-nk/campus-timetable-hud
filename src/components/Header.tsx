'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Wifi, WifiOff, Sliders, RefreshCw, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { LabGroup } from '@/types/schedule';

interface HeaderProps {
  simulatedDate: Date;
  isSimulated: boolean;
  onResetTime: () => void;
  onToggleSimulator: () => void;
  isSimulatorOpen: boolean;
  showSimulator?: boolean;
  labGroup?: LabGroup;
  onSelectLabGroup?: (group: LabGroup) => void;
}

export function Header({
  simulatedDate,
  isSimulated,
  onResetTime,
  onToggleSimulator,
  isSimulatorOpen,
  showSimulator = false,
  labGroup = 'G1',
  onSelectLabGroup,
}: HeaderProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formattedDate = simulatedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const dayOfWeek = simulatedDate
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase();

  return (
    <header className="w-full bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-40 px-4 py-3 transition-colors duration-200">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: App title & Date */}
        <div>
          <div className="flex items-center gap-2">
            <Link href="/cr-admin" className="flex items-center gap-2 group cursor-default">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xs font-mono font-bold tracking-wider text-zinc-600 dark:text-zinc-400 uppercase group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                CAMPUS HUD
              </h1>
            </Link>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
              {dayOfWeek}
            </span>
            {isSimulated && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                TEST MODE
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mt-0.5">
            {formattedDate}
          </p>
        </div>

        {/* Right: Actions & Lab Group Toggle */}
        <div className="flex items-center gap-1.5">
          {/* G1 / G2 Segmented Control Pill */}
          {onSelectLabGroup && (
            <div className="flex items-center p-0.5 rounded-lg border bg-slate-100 dark:bg-zinc-900 border-slate-300 dark:border-zinc-800 text-[11px] font-mono font-bold">
              <button
                onClick={() => onSelectLabGroup('G1')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  labGroup === 'G1'
                    ? 'bg-white text-emerald-700 font-semibold shadow-sm dark:bg-zinc-800 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
                title="Select Batch G1 Labs"
              >
                G1
              </button>
              <button
                onClick={() => onSelectLabGroup('G2')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  labGroup === 'G2'
                    ? 'bg-white text-emerald-700 font-semibold shadow-sm dark:bg-zinc-800 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                }`}
                title="Select Batch G2 Labs"
              >
                G2
              </button>
            </div>
          )}

          {/* Network status indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono border ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50'
            }`}
            title={isOnline ? 'Online - Live Overrides Active' : 'Offline - Loaded from Service Worker Cache'}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline text-[11px]">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span className="text-[11px]">OFFLINE</span>
              </>
            )}
          </div>

          {/* Dedicated Light/Dark Theme Switch */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Tactical Dark Theme'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Time Simulator Trigger (only when showSimulator is true) */}
          {showSimulator && (
            <button
              onClick={onToggleSimulator}
              className={`p-1.5 rounded border transition-all ${
                isSimulatorOpen
                  ? 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-amber-600 dark:text-amber-400'
                  : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
              title="Toggle Time Travel Test Controls"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* Reset time if simulated */}
          {isSimulated && (
            <button
              onClick={onResetTime}
              className="p-1.5 rounded text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 transition-all"
              title="Reset to Real Clock Time"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
