'use client';

import React from 'react';
import { MergedPeriod } from '../types/schedule';
import { MapPin, Clock, AlertCircle } from 'lucide-react';
import { formatTo12Hour } from '@/lib/formatTime';

interface UpNextCardProps {
  nextPeriod: MergedPeriod | null;
}

export function UpNextCard({ nextPeriod }: UpNextCardProps) {
  if (!nextPeriod) {
    return (
      <div className="bg-white dark:bg-zinc-950/70 border border-slate-200 dark:border-zinc-800/80 rounded-xl p-3.5 flex items-center justify-between shadow-sm dark:shadow-none">
        <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-zinc-400 font-mono">
          <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
          <span>No remaining classes scheduled for today</span>
        </div>
      </div>
    );
  }

  const periodLabel = nextPeriod.id.includes('-p5-p6')
    ? 'PERIOD 5-6'
    : `PERIOD ${nextPeriod.periodIndex}`;

  return (
    <div className="bg-white dark:bg-zinc-950/90 border border-slate-200 dark:border-zinc-800/80 rounded-xl p-4 shadow-sm dark:shadow-lg hover:border-slate-300 dark:hover:border-zinc-700/80 transition-all">
      <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-zinc-400 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="uppercase tracking-wider font-bold">UP NEXT • {periodLabel}</span>
        </div>
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
          Starts at {formatTo12Hour(nextPeriod.startTime)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {nextPeriod.subject}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
            {nextPeriod.faculty}
          </p>
        </div>

        {/* Venue Badge */}
        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[120px]">{nextPeriod.venue}</span>
        </div>
      </div>

      {/* Override Alert in preview */}
      {nextPeriod.overrideStatus && nextPeriod.overrideStatus !== 'NORMAL' && (
        <div className="mt-2 text-[11px] font-mono text-amber-700 dark:text-amber-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Status: {nextPeriod.overrideStatus}</span>
        </div>
      )}
    </div>
  );
}

