'use client';

import React, { useState } from 'react';
import { AttendanceSummaryResult } from '@/types/attendance';
import { CheckSquare, ShieldCheck, AlertTriangle, AlertCircle, X, Calendar, UserX, RotateCcw } from 'lucide-react';

interface AttendanceDrawerProps {
  summary: AttendanceSummaryResult;
  onLeaveToday?: () => Promise<void>;
  onResetToday?: () => Promise<void>;
  isLeaveTodayActive?: boolean;
  onOpenHistoryModal?: () => void;
  onClose?: () => void;
}

export function AttendanceDrawer({
  summary,
  onLeaveToday,
  onResetToday,
  isLeaveTodayActive = false,
  onOpenHistoryModal,
  onClose,
}: AttendanceDrawerProps) {
  const { subjects } = summary;

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Subject health summary metrics
  const totalSubjects = subjects.length;
  const safeSubjectsCount = subjects.filter((s) => s.percentage >= 75).length;
  const criticalSubjectsCount = subjects.filter((s) => s.percentage < 75).length;

  const handleConfirmLeaveToday = async () => {
    if (!onLeaveToday) return;
    try {
      setIsProcessing(true);
      await onLeaveToday();
      setShowLeaveConfirm(false);
    } catch (err) {
      console.warn('Failed to mark leave today:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmResetToday = async () => {
    if (!onResetToday) return;
    try {
      setIsProcessing(true);
      await onResetToday();
      setShowResetConfirm(false);
    } catch (err) {
      console.warn('Failed to reset today attendance:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/90 rounded-2xl p-4 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase font-mono tracking-wide">
            ATTENDANCE HUD & RUNWAY
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

      {/* Global Actions Row: Leave Today & Calendar History */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Leave Today Button */}
        {isLeaveTodayActive ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Today's Attendance</span>
          </button>
        ) : (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all shadow-sm"
          >
            <UserX className="w-4 h-4" />
            <span>I'm on Leave Today</span>
          </button>
        )}

        {/* Attendance History Calendar Button */}
        {onOpenHistoryModal && (
          <button
            onClick={onOpenHistoryModal}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 flex items-center justify-center gap-2 text-xs font-mono font-bold transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Attendance History & Calendar</span>
          </button>
        )}
      </div>

      {/* High-Level Subject Health Summary Bar */}
      <div className="bg-slate-50 dark:bg-zinc-900/80 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800/80 space-y-2">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          SUBJECT HEALTH SUMMARY
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          {/* Total Subjects */}
          <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800">
            <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 block">
              {totalSubjects}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 uppercase font-semibold">
              Total Subjects
            </span>
          </div>

          {/* Safe Subjects */}
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50">
            <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 block flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {safeSubjectsCount}
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">
              ● Safe (&ge;75%)
            </span>
          </div>

          {/* Critical / At Risk Subjects */}
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50">
            <span className="text-lg font-black text-rose-700 dark:text-rose-400 block flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              {criticalSubjectsCount}
            </span>
            <span className="text-[10px] text-rose-700 dark:text-rose-400 uppercase font-bold">
              ● Critical (&lt;75%)
            </span>
          </div>
        </div>
      </div>

      {/* Subject Breakdown List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
          INDIVIDUAL SUBJECT RUNWAYS
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

      {/* Leave Today Confirmation Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs">
              <UserX className="w-5 h-5 shrink-0" />
              <span>CONFIRM LEAVE TODAY</span>
            </div>
            <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
              Mark all academic periods for today as <strong>ABSENT</strong>? (Canceled and free slots will not be marked).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <button
                disabled={isProcessing}
                onClick={() => setShowLeaveConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 border border-slate-200 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={handleConfirmLeaveToday}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md"
              >
                {isProcessing ? 'Marking Leave...' : 'Confirm Leave Today'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Today Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <span>RESET TODAY'S ATTENDANCE</span>
            </div>
            <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
              Reset all logged attendance records for today? This will clear today's attendance choices.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
              <button
                disabled={isProcessing}
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 border border-slate-200 dark:border-zinc-700"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={handleConfirmResetToday}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 bg-amber-400 hover:bg-amber-300 shadow-md"
              >
                {isProcessing ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
