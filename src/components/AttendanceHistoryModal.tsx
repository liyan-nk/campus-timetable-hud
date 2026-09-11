'use client';

import React, { useState } from 'react';
import { AttendanceRecordItem, AttendanceStatus } from '@/types/attendance';
import { BASE_SCHEDULE } from '@/data/schedule';
import { getDayOfWeekString, mergePeriodWithOverride } from '@/lib/timeResolver';
import { formatTo12Hour } from '@/lib/formatTime';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface AttendanceHistoryModalProps {
  allRecords: AttendanceRecordItem[];
  onMarkRetroactiveAttendance: (
    date: string,
    periodIndex: number,
    subjectCode: string,
    status: AttendanceStatus,
    periodIndices?: number[]
  ) => Promise<void>;
  onClose: () => void;
}

export function AttendanceHistoryModal({
  allRecords,
  onMarkRetroactiveAttendance,
  onClose,
}: AttendanceHistoryModalProps) {
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Double confirmation state for retroactive edits
  const [pendingEdit, setPendingEdit] = useState<{
    date: string;
    periodIndex: number;
    subjectCode: string;
    subjectName: string;
    status: AttendanceStatus;
    periodIndices?: number[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar math
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const monthLabel = currentMonthDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate day status map (dateStr -> 'GREEN' | 'RED' | 'GRAY')
  const dayStatusMap = new Map<string, 'GREEN' | 'RED' | 'GRAY'>();
  allRecords.forEach((r) => {
    if (r.status === 'OFF') return;
    const existing = dayStatusMap.get(r.date);
    if (r.status === 'ABSENT') {
      dayStatusMap.set(r.date, 'RED');
    } else if (!existing || existing !== 'RED') {
      dayStatusMap.set(r.date, 'GREEN');
    }
  });

  // Schedule for selected historical date
  const selectedDateObj = new Date(`${selectedDateStr}T00:00:00.000Z`);
  const selectedDayOfWeek = getDayOfWeekString(selectedDateObj);
  const isWeekend = selectedDayOfWeek === 'SAT' || selectedDayOfWeek === 'SUN';

  const dayPeriods = isWeekend
    ? []
    : BASE_SCHEDULE.filter((p) => p.day === selectedDayOfWeek && p.periodIndex > 0);

  const selectedDateRecords = allRecords.filter((r) => r.date === selectedDateStr);

  const handleConfirmEdit = async () => {
    if (!pendingEdit) return;
    try {
      setIsSubmitting(true);
      await onMarkRetroactiveAttendance(
        pendingEdit.date,
        pendingEdit.periodIndex,
        pendingEdit.subjectCode,
        pendingEdit.status,
        pendingEdit.periodIndices
      );
      setPendingEdit(null);
    } catch (err) {
      console.warn('Failed retroactive update:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-wide uppercase">
              ATTENDANCE HISTORY & CALENDAR
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-slate-100 dark:bg-zinc-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800/80">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase">
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-slate-500 dark:text-zinc-400 mb-1">
            <span>SU</span><span>MO</span><span>TU</span><span>WE</span><span>TH</span><span>FR</span><span>SA</span>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const dateObj = new Date(year, month, d);
              const dateStr = dateObj.toISOString().split('T')[0];
              const isSelected = selectedDateStr === dateStr;

              const status = dayStatusMap.get(dateStr);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-9 rounded-lg text-xs font-mono font-bold flex flex-col items-center justify-center transition-all relative border ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/40'
                      : 'bg-slate-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-slate-200 dark:border-zinc-800/80 hover:bg-slate-200/60 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <span>{d}</span>
                  {status && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        status === 'RED'
                          ? 'bg-rose-500'
                          : status === 'GREEN'
                          ? 'bg-emerald-400'
                          : 'bg-slate-400 dark:bg-zinc-600'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Schedule & Status */}
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              RECORDS FOR {selectedDateStr} ({selectedDayOfWeek})
            </span>
            <span className="text-slate-500 dark:text-zinc-400 text-[10px]">
              {isWeekend ? 'Weekend' : `${dayPeriods.length} Classes`}
            </span>
          </div>

          {isWeekend ? (
            <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 py-3 text-center">
              Weekend — No scheduled classes
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {dayPeriods.map((p) => {
                const rec = selectedDateRecords.find((r) => r.periodIndex === p.periodIndex);
                const status = rec?.status || 'NOT MARKED';
                const isLabBlock = p.id.includes('-p5-p6');
                const periodIndices = isLabBlock ? [5, 6] : [p.periodIndex];

                let statusColor = 'text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800';
                if (status === 'PRESENT' || status === 'DUTY_LEAVE') {
                  statusColor = 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50';
                } else if (status === 'ABSENT') {
                  statusColor = 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50';
                }

                return (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        P{p.periodIndex} • {p.code} - {p.subject}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                        {formatTo12Hour(p.startTime)} – {formatTo12Hour(p.endTime)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                        {status === 'NOT MARKED' ? 'UNMARKED' : status}
                      </span>

                      {/* Retroactive Action Buttons */}
                      <button
                        onClick={() =>
                          setPendingEdit({
                            date: selectedDateStr,
                            periodIndex: p.periodIndex,
                            subjectCode: p.code,
                            subjectName: p.subject,
                            status: 'PRESENT',
                            periodIndices,
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-[10px] font-bold"
                        title="Mark Present"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() =>
                          setPendingEdit({
                            date: selectedDateStr,
                            periodIndex: p.periodIndex,
                            subjectCode: p.code,
                            subjectName: p.subject,
                            status: 'ABSENT',
                            periodIndices,
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-200 dark:bg-zinc-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950 text-[10px] font-bold"
                        title="Mark Absent"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Double Confirmation Modal for Retroactive Past Edits */}
        {pendingEdit && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-mono font-bold text-xs">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>RETROACTIVE ATTENDANCE VERIFICATION</span>
              </div>

              <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                You are logging attendance for a past date (<strong className="font-mono">{pendingEdit.date}</strong>, Period <strong className="font-mono">{pendingEdit.periodIndex}</strong> - <strong>{pendingEdit.subjectName}</strong>).
              </p>

              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Are you sure you want to retroactively mark this as{' '}
                <span className={pendingEdit.status === 'PRESENT' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {pendingEdit.status}
                </span>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                <button
                  disabled={isSubmitting}
                  onClick={() => setPendingEdit(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 border border-slate-200 dark:border-zinc-700"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  onClick={handleConfirmEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Retroactive Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
