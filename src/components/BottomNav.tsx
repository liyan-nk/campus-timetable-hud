'use client';

import React from 'react';
import { Compass, Calendar, CheckSquare } from 'lucide-react';

export type NavTab = 'hud' | 'timetable' | 'attendance';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  safeBunkCount?: number;
}

export function BottomNav({ activeTab, onSelectTab, safeBunkCount }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/90 px-4 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)] transition-colors duration-200 shadow-lg dark:shadow-2xl">
      <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
        {/* Tab 1: Live HUD */}
        <button
          onClick={() => onSelectTab('hud')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all font-mono text-xs ${
            activeTab === 'hud'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60 shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900/60'
          }`}
        >
          <Compass className={`w-5 h-5 mb-0.5 ${activeTab === 'hud' ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] tracking-wider uppercase">LIVE HUD</span>
        </button>

        {/* Tab 2: Timetable */}
        <button
          onClick={() => onSelectTab('timetable')}
          className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all font-mono text-xs ${
            activeTab === 'timetable'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60 shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900/60'
          }`}
        >
          <Calendar className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-wider uppercase">TIMETABLE</span>
        </button>

        {/* Tab 3: Attendance */}
        <button
          onClick={() => onSelectTab('attendance')}
          className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all font-mono text-xs ${
            activeTab === 'attendance'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60 shadow-sm'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-900/60'
          }`}
        >
          <CheckSquare className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-wider uppercase">ATTENDANCE</span>
          {safeBunkCount !== undefined && safeBunkCount > 0 && (
            <span className="absolute top-1 right-3 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
              {safeBunkCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
