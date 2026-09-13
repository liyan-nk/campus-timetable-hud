'use client';

import React from 'react';
import { MergedPeriod, TimeResolverResult } from '../types/schedule';
import { MapPin, User, AlertTriangle, Clock } from 'lucide-react';
import { formatTo12Hour, formatRangeTo12Hour } from '@/lib/formatTime';

import { AttendanceStatus } from '@/types/attendance';

interface HeroPeriodCardProps {
  timeState: TimeResolverResult;
  currentAttendanceStatus?: AttendanceStatus | null;
  onMarkAttendance?: (periodIndex: number, subjectCode: string, status: AttendanceStatus) => void;
}

export function HeroPeriodCard({ timeState, currentAttendanceStatus, onMarkAttendance }: HeroPeriodCardProps) {
  const { status, currentPeriod, nextPeriod, remainingSeconds, progressPercentage, displayMessage } =
    timeState;

  // Format seconds to HH:MM:SS or MM:SS
  const formatSeconds = (totalSec: number) => {
    if (totalSec <= 0) return '00:00';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Status Styling & Configuration
  let cardBorder = 'border-zinc-200 dark:border-zinc-800/80';
  let countdownColor = 'text-emerald-700 dark:text-emerald-400';
  let badgeBg = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
  let badgeLabel = 'ACTIVE CLASS';
  let progressColor = 'bg-emerald-500';

  if (currentPeriod?.overrideStatus === 'CANCELED') {
    cardBorder = 'border-rose-300 dark:border-rose-800/60';
    countdownColor = 'text-rose-700 dark:text-rose-400';
    badgeBg = 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/70';
    badgeLabel = 'CLASS CANCELED';
    progressColor = 'bg-rose-500';
  } else if (currentPeriod?.overrideStatus === 'SWAPPED') {
    cardBorder = 'border-purple-300 dark:border-purple-800/60';
    countdownColor = 'text-purple-700 dark:text-purple-400';
    badgeBg = 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/70';
    badgeLabel = 'ROOM / FACULTY SWAPPED';
    progressColor = 'bg-purple-500';
  } else if (currentPeriod?.overrideStatus === 'FREE') {
    cardBorder = 'border-amber-300 dark:border-amber-800/60';
    countdownColor = 'text-amber-700 dark:text-amber-400';
    badgeBg = 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/70';
    badgeLabel = 'FREE HOUR';
    progressColor = 'bg-amber-500';
  } else if (status === 'PASSING_PERIOD') {
    cardBorder = 'border-amber-300 dark:border-amber-800/60';
    countdownColor = 'text-amber-700 dark:text-amber-400';
    badgeBg = 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/70';
    badgeLabel = 'TEA BREAK / PASSING';
    progressColor = 'bg-amber-500';
  } else if (status === 'LUNCH') {
    cardBorder = 'border-sky-300 dark:border-sky-800/60';
    countdownColor = 'text-sky-700 dark:text-sky-400';
    badgeBg = 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/70';
    badgeLabel = 'LUNCH HOUR';
    progressColor = 'bg-sky-500';
  } else if (status === 'BEFORE_COLLEGE') {
    cardBorder = 'border-indigo-300 dark:border-indigo-800/60';
    countdownColor = 'text-indigo-700 dark:text-indigo-400';
    badgeBg = 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/70';
    badgeLabel = 'BEFORE HOURS';
    progressColor = 'bg-indigo-500';
  } else if (status === 'COLLEGE_OVER' || status === 'WEEKEND') {
    cardBorder = 'border-slate-200 dark:border-zinc-800/80';
    countdownColor = 'text-slate-500 dark:text-zinc-500';
    badgeBg = 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-zinc-700/60';
    badgeLabel = status === 'WEEKEND' ? 'WEEKEND' : 'CLASSES DONE';
    progressColor = 'bg-slate-300 dark:bg-zinc-700';
  }

  const targetPeriod: MergedPeriod | null = currentPeriod || nextPeriod;

  const getPeriodBadgeText = (p: MergedPeriod) => {
    if (p.id.includes('-p5-p6')) return 'PERIOD 5-6';
    if (p.periodIndex > 0) return `PERIOD ${p.periodIndex}`;
    return p.subject;
  };

  return (
    <div
      className={`relative overflow-hidden bg-white border-slate-200 dark:bg-zinc-950/90 rounded-2xl border ${cardBorder} p-5 shadow-sm dark:shadow-2xl transition-all duration-300`}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

      {/* Header Bar inside card */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border tracking-wide uppercase ${badgeBg}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {badgeLabel}
        </span>

        {targetPeriod && (
          <span className="text-xs font-mono text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 px-2 py-1 rounded border border-slate-200 dark:border-zinc-800">
            {formatRangeTo12Hour(targetPeriod.startTime, targetPeriod.endTime)}
          </span>
        )}
      </div>

      {/* Hero Content */}
      {status === 'IN_CLASS' && currentPeriod && (
        <div className="space-y-4">
          <div>
            <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest block mb-1">
              {getPeriodBadgeText(currentPeriod)} • {currentPeriod.code}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight">
              {currentPeriod.subject}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300 pt-1">
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg">
              <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span className="font-medium text-xs text-zinc-800 dark:text-zinc-200">{currentPeriod.faculty}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50/80 dark:bg-zinc-900/90 border border-emerald-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">{currentPeriod.venue}</span>
            </div>
            {currentPeriod.activeLabGroup && (
              <div className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg text-xs font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>● BATCH {currentPeriod.activeLabGroup}</span>
              </div>
            )}
          </div>

          {currentPeriod.overrideNote && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span>{currentPeriod.overrideNote}</span>
            </div>
          )}

          {/* 1-Tap Attendance Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/60">
            <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-zinc-400 uppercase mb-1.5 flex items-center justify-between">
              <span>RECORD ATTENDANCE</span>
              {currentPeriod.overrideStatus === 'CANCELED' || currentPeriod.overrideStatus === 'FREE' ? (
                <span className="text-amber-600 dark:text-amber-400">Class Canceled / Free</span>
              ) : null}
            </div>

            {currentPeriod.overrideStatus === 'CANCELED' || currentPeriod.overrideStatus === 'FREE' ? (
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-mono text-slate-500 dark:text-zinc-400 text-center">
                Canceled / No Attendance Required
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onMarkAttendance?.(currentPeriod.periodIndex, currentPeriod.code, 'PRESENT')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all border flex items-center justify-center gap-1 ${
                    currentAttendanceStatus === 'PRESENT'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/40'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  <span>✓</span>
                  <span>Present</span>
                </button>

                <button
                  onClick={() => onMarkAttendance?.(currentPeriod.periodIndex, currentPeriod.code, 'ABSENT')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all border flex items-center justify-center gap-1 ${
                    currentAttendanceStatus === 'ABSENT'
                      ? 'bg-rose-500 text-white border-rose-600 shadow-md ring-2 ring-rose-500/40'
                      : 'bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400'
                  }`}
                >
                  <span>✕</span>
                  <span>Absent</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'PASSING_PERIOD' && (
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest block">
            {currentPeriod ? currentPeriod.subject : 'HEAD TO NEXT CLASS'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {nextPeriod ? nextPeriod.subject : 'Passing Period'}
          </h2>
          {nextPeriod && (
            <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span className="text-zinc-500 dark:text-zinc-400">Next Venue:</span>
              <span className="font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded text-xs">
                {nextPeriod.venue} ({formatTo12Hour(nextPeriod.startTime)})
              </span>
            </div>
          )}
        </div>
      )}

      {status === 'LUNCH' && (
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase tracking-widest block">
            BREAK TIME
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {currentPeriod?.subject || 'Campus Lunch Break'}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Refuel & recharge. Next class starts at {nextPeriod ? formatTo12Hour(nextPeriod.startTime) : 'after lunch'}.
          </p>
        </div>
      )}

      {status === 'BEFORE_COLLEGE' && nextPeriod && (
        <div className="space-y-3">
          <span className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest block">
            FIRST PERIOD TODAY
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {nextPeriod.subject}
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
            <span>{nextPeriod.faculty}</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">{nextPeriod.venue}</span>
          </div>
        </div>
      )}

      {(status === 'COLLEGE_OVER' || status === 'WEEKEND') && (
        <div className="space-y-2 py-2">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {status === 'WEEKEND' ? 'Enjoy the Weekend' : 'All Classes Completed'}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{displayMessage}</p>
        </div>
      )}

      {/* Tabular Countdown Display */}
      {status !== 'COLLEGE_OVER' && status !== 'WEEKEND' && (
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-900 flex items-baseline justify-between">
          <div>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              {status === 'IN_CLASS' || status === 'LUNCH' || status === 'PASSING_PERIOD'
                ? 'REMAINING TIME'
                : 'STARTS IN'}
            </span>
            <div className={`text-5xl font-mono font-black ${countdownColor} tabular-nums tracking-tight mt-1`}>
              {formatSeconds(remainingSeconds)}
            </div>
          </div>
          <Clock className={`w-8 h-8 ${countdownColor} opacity-20`} />
        </div>
      )}

      {/* Progress Bar across bottom of card */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        <div
          className={`h-full ${progressColor} transition-all duration-1000 ease-linear`}
          style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
        />
      </div>
    </div>
  );
}

