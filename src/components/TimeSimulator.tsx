'use client';

import React from 'react';
import { Sliders, RotateCcw, Play } from 'lucide-react';

interface TimeSimulatorProps {
  simulatedDate: Date;
  onSelectPreset: (presetTime: string, dayOffset?: number) => void;
  onCustomTimeChange: (dateStr: string, timeStr: string) => void;
  onReset: () => void;
}

const PRESETS = [
  { label: 'Mon 09:15 AM (Period 1)', time: '09:15', dayOffset: 0 },
  { label: 'Mon 10:45 AM (Tea Break)', time: '10:45', dayOffset: 0 },
  { label: 'Mon 12:45 PM (Lunch Break)', time: '12:45', dayOffset: 0 },
  { label: 'Mon 01:45 PM (Multi-Lab P5-P6)', time: '13:45', dayOffset: 0 },
  { label: 'Fri 01:15 PM (Fri Lunch/Prayer)', time: '13:15', dayOffset: 4 },
  { label: 'Fri 02:30 PM (Fri Period 5)', time: '14:30', dayOffset: 4 },
  { label: 'Fri 04:05 PM (Fri College Over)', time: '16:05', dayOffset: 4 },
  { label: 'Saturday (Weekend)', time: '10:00', dayOffset: 5 },
];

export function TimeSimulator({
  simulatedDate,
  onSelectPreset,
  onCustomTimeChange,
  onReset,
}: TimeSimulatorProps) {
  const yyyyMmDd = simulatedDate.toISOString().split('T')[0];
  const hhMm = simulatedDate.toTimeString().substring(0, 5);

  return (
    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 shadow-md dark:shadow-xl space-y-3 font-mono text-xs transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/40 pb-2">
        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
          <Sliders className="w-4 h-4" />
          <span className="font-bold uppercase tracking-wide">TIME TRAVEL SIMULATOR</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 text-amber-800 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700/50 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          <span>REAL TIME</span>
        </button>
      </div>

      {/* Preset Buttons Grid */}
      <div>
        <span className="text-[11px] text-amber-800/90 dark:text-amber-300/80 block mb-2 font-semibold">
          TEST HUD CONSTRAINTS (1-TAP):
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPreset(p.time, p.dayOffset)}
              className="py-1.5 px-2 bg-white dark:bg-zinc-900/90 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-amber-200 dark:border-amber-900/40 hover:border-amber-400 dark:hover:border-amber-700/60 text-zinc-800 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 rounded text-left flex items-center justify-between transition-all shadow-sm dark:shadow-none"
            >
              <span className="truncate">{p.label}</span>
              <Play className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input Controls */}
      <div className="pt-2 border-t border-amber-200 dark:border-amber-900/40 flex items-center gap-2">
        <div className="flex-1">
          <label className="text-[10px] text-zinc-600 dark:text-zinc-400 block mb-1">DATE</label>
          <input
            type="date"
            value={yyyyMmDd}
            onChange={(e) => onCustomTimeChange(e.target.value, hhMm)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="w-28">
          <label className="text-[10px] text-zinc-600 dark:text-zinc-400 block mb-1">TIME</label>
          <input
            type="time"
            value={hhMm}
            onChange={(e) => onCustomTimeChange(yyyyMmDd, e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
    </div>
  );
}

