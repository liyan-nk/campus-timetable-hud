'use client';

import React, { useState } from 'react';
import { DayOfWeek, PeriodOverrideData } from '../types/schedule';
import { BASE_SCHEDULE } from '../data/schedule';
import { mergePeriodWithOverride, parseHHMMToMinutes } from '../lib/timeResolver';
import { Calendar, MapPin, User, AlertCircle, X, Coffee, Utensils } from 'lucide-react';
import { formatRangeTo12Hour } from '@/lib/formatTime';

interface TimetableGridProps {
  currentDay: DayOfWeek;
  activePeriodIndex: number | null;
  overrides: PeriodOverrideData[];
  onClose?: () => void;
}

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'MON', label: 'Mon' },
  { key: 'TUE', label: 'Tue' },
  { key: 'WED', label: 'Wed' },
  { key: 'THU', label: 'Thu' },
  { key: 'FRI', label: 'Fri' },
];

export function TimetableGrid({
  currentDay,
  activePeriodIndex,
  overrides,
  onClose,
}: TimetableGridProps) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    DAYS.some((d) => d.key === currentDay) ? currentDay : 'MON'
  );

  const dayPeriods = BASE_SCHEDULE
    .filter((p) => p.day === selectedDay)
    .sort((a, b) => parseHHMMToMinutes(a.startTime) - parseHHMMToMinutes(b.startTime));

  return (
    <div className="bg-white border border-slate-200 dark:bg-zinc-950 dark:border-zinc-800/90 rounded-2xl p-4 shadow-sm dark:shadow-2xl space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-wide">
            WEEKLY TIMETABLE
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Day Selector Pills */}
      <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900/90 rounded-xl border border-slate-200 dark:border-zinc-800/80">
        {DAYS.map((d) => {
          const isSelected = selectedDay === d.key;
          const isToday = currentDay === d.key;

          return (
            <button
              key={d.key}
              onClick={() => setSelectedDay(d.key)}
              className={`py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all relative ${
                isSelected
                  ? 'bg-white text-zinc-950 shadow-sm border border-slate-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:shadow-md'
                  : 'text-zinc-600 hover:bg-slate-200/60 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/40'
              }`}
            >
              {d.label}
              {isToday && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Schedule List for Selected Day */}
      <div className="space-y-2.5">
        {dayPeriods.map((p) => {
          const merged = mergePeriodWithOverride(p, overrides);
          const isActive =
            currentDay === selectedDay &&
            activePeriodIndex !== null &&
            (activePeriodIndex === p.periodIndex || (p.id.includes('-p5-p6') && activePeriodIndex === 5));

          // Non-Academic Slots (Tea Break & Lunch)
          if (p.periodIndex === 0) {
            if (p.type === 'LUNCH') {
              return (
                <div
                  key={p.id}
                  className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono text-sky-800 dark:text-sky-400"
                >
                  <div className="flex items-center gap-2">
                    <Utensils className="w-3.5 h-3.5" />
                    <span className="font-bold">{p.subject}</span>
                  </div>
                  <span>{formatRangeTo12Hour(p.startTime, p.endTime)}</span>
                </div>
              );
            }
            return (
              <div
                key={p.id}
                className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg py-1.5 px-3 flex items-center justify-between text-[11px] font-mono text-amber-800 dark:text-amber-400/90"
              >
                <div className="flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold">{p.subject}</span>
                </div>
                <span>{formatRangeTo12Hour(p.startTime, p.endTime)}</span>
              </div>
            );
          }

          // Academic Slots
          let statusBadge = null;
          if (merged.overrideStatus === 'CANCELED') {
            statusBadge = (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                CANCELED
              </span>
            );
          } else if (merged.overrideStatus === 'FREE') {
            statusBadge = (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                FREE HOUR
              </span>
            );
          } else if (merged.overrideStatus === 'SWAPPED') {
            statusBadge = (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                SWAPPED
              </span>
            );
          }

          const periodLabel = p.id.includes('-p5-p6')
            ? 'P5-P6'
            : `P${p.periodIndex}`;

          return (
            <div
              key={p.id}
              className={`p-3 rounded-xl border transition-all ${
                isActive
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/60 shadow-sm dark:shadow-lg dark:shadow-emerald-950/20'
                  : 'bg-zinc-50 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {periodLabel} • {p.code}
                  </span>
                  {statusBadge}
                </div>
                <span className="text-zinc-500 dark:text-zinc-400">
                  {formatRangeTo12Hour(p.startTime, p.endTime)}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {merged.subject}
              </h4>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/50 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-zinc-500" />
                  <span className="truncate max-w-[170px]">{merged.faculty}</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-emerald-700 dark:text-emerald-400">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{merged.venue}</span>
                </div>
              </div>

              {merged.overrideNote && (
                <p className="mt-1.5 text-[11px] text-amber-800 dark:text-amber-300 font-mono flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{merged.overrideNote}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

