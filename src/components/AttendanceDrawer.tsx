'use client';

import React from 'react';
import { AttendanceSummaryResult } from '@/types/attendance';
import { CheckSquare, ShieldCheck, AlertTriangle, AlertCircle, X, Award } from 'lucide-react';

interface AttendanceDrawerProps {
  summary: AttendanceSummaryResult;
  onClose?: () => void;
}

export function AttendanceDrawer({ summary, onClose }: AttendanceDrawerProps) {
  const {
    overallPercentage,
    overallAttended,
    overallConducted,
    overallFlag,
    overallSafeBunks,
    overallCatchUpRequired,
    subjects,
  } = summary;

  let overallBadgeBg = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60';
  let overallIcon = <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;

  if (overallFlag === 'WARNING') {
    overallBadgeBg = 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60';
    overallIcon = <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
  } else if (overallFlag === 'CRITICAL') {
    overallBadgeBg = 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60';
    overallIcon = <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
  }

  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/90 rounded-2xl p-4 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-wide">
            PREDICTIVE ATTENDANCE RUNWAY
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

      {/* Overall Summary Card */}
      <div className={`p-4 rounded-xl border ${overallBadgeBg} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          {overallIcon}
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider opacity-80">
              OVERALL ATTENDANCE
            </div>
            <div className="text-2xl font-mono font-black tracking-tight">
              {overallPercentage}%
            </div>
            <div className="text-[11px] font-mono opacity-85 mt-0.5">
              {overallAttended} of {overallConducted} total classes attended
            </div>
          </div>
        </div>

        <div className="text-right font-mono">
          {overallPercentage >= 75 ? (
            <div className="bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800">
              <span className="text-xs font-bold block text-emerald-800 dark:text-emerald-300">
                {overallSafeBunks} SAFE BUNKS
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 opacity-90">
                Above 75% threshold
              </span>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800">
              <span className="text-xs font-bold block text-rose-800 dark:text-rose-300">
                NEED {overallCatchUpRequired} CLASSES
              </span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 opacity-90">
                To reach 75% target
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subject-by-Subject List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
          KTU SUBJECT BREAKDOWN
        </h4>

        {subjects.map((sub) => {
          let progressBg = 'bg-emerald-500';
          let badgeColor = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';

          if (sub.statusFlag === 'WARNING') {
            progressBg = 'bg-amber-500';
            badgeColor = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
          } else if (sub.statusFlag === 'CRITICAL') {
            progressBg = 'bg-rose-500';
            badgeColor = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50';
          }

          return (
            <div
              key={sub.subjectCode}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-900/70 border border-slate-200 dark:border-zinc-800/80 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {sub.subjectCode} • {sub.subjectName}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeColor}`}>
                  {sub.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressBg} transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, sub.percentage))}%` }}
                />
              </div>

              {/* Counts & Runway Pill */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-zinc-400">
                <span>
                  {sub.attended} / {sub.conducted} classes
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {sub.runwayMessage}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
