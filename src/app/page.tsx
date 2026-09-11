'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { HeroPeriodCard } from '@/components/HeroPeriodCard';
import { UpNextCard } from '@/components/UpNextCard';
import { TimetableGrid } from '@/components/TimetableGrid';
import { TimeSimulator } from '@/components/TimeSimulator';
import { AttendanceDrawer } from '@/components/AttendanceDrawer';
import { BottomNav, NavTab } from '@/components/BottomNav';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { BASE_SCHEDULE } from '@/data/schedule';
import { resolveTimeState, getDayOfWeekString } from '@/lib/timeResolver';
import { PeriodOverrideData, TimeResolverResult } from '@/types/schedule';
import { AttendanceRecordItem, AttendanceStatus, AttendanceSummaryResult } from '@/types/attendance';
import { calculateAttendanceSummary } from '@/lib/attendanceEngine';
import { useStudentSession } from '@/hooks/useStudentSession';
import { Calendar, ChevronDown, ChevronUp, Layers } from 'lucide-react';

function MobileHUDContent() {
  const searchParams = useSearchParams();
  const isDev = process.env.NODE_ENV === 'development';
  const isPreview = searchParams.get('preview') === 'true' || searchParams.get('test') === 'true';
  const showSimulator = isDev || isPreview;

  const session = useStudentSession();

  const [activeTab, setActiveTab] = useState<NavTab>('hud');
  const [now, setNow] = useState<Date>(new Date());
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [showGridModal, setShowGridModal] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<PeriodOverrideData[]>([]);
  const [, setIsLoadingOverrides] = useState<boolean>(false);

  // Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordItem[]>([]);
  const [dayAttendanceRecords, setDayAttendanceRecords] = useState<AttendanceRecordItem[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryResult>(
    calculateAttendanceSummary([])
  );

  // Effective Date: real now or simulated date
  const currentDate = simulatedDate || now;
  const currentDateStr = currentDate.toISOString().split('T')[0];

  // Real-time ticking interval every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (!simulatedDate) {
        setNow(new Date());
      } else {
        setSimulatedDate((prev) => (prev ? new Date(prev.getTime() + 1000) : null));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [simulatedDate]);

  // Fetch Overrides for current date YYYY-MM-DD
  const fetchOverrides = useCallback(async (dateObj: Date) => {
    try {
      setIsLoadingOverrides(true);
      const dateStr = dateObj.toISOString().split('T')[0];
      const res = await fetch(`/api/overrides?date=${dateStr}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOverrides(data);
      }
    } catch (err) {
      console.warn('Failed to fetch overrides, offline fallback active:', err);
    } finally {
      setIsLoadingOverrides(false);
    }
  }, []);

  useEffect(() => {
    fetchOverrides(currentDate);
  }, [currentDateStr, fetchOverrides]);

  // Fetch Attendance Records & Summary for current device
  const fetchAttendance = useCallback(async () => {
    if (!session.deviceUuid) return;
    try {
      const res = await fetch(
        `/api/student/attendance?deviceUuid=${encodeURIComponent(session.deviceUuid)}&date=${currentDateStr}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data.records || []);
        setDayAttendanceRecords(data.dayRecords || []);
        if (data.summary) {
          setAttendanceSummary(data.summary);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch attendance records:', err);
    }
  }, [session.deviceUuid, currentDateStr]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // 1-Tap Attendance Toggle Handler
  const handleMarkAttendance = async (
    periodIndex: number,
    subjectCode: string,
    status: AttendanceStatus,
    periodIndices?: number[]
  ) => {
    if (!session.deviceUuid) return;

    // Optimistic local update
    const indices = Array.isArray(periodIndices) && periodIndices.length > 0 ? periodIndices : [periodIndex];
    
    setAttendanceRecords((prev) => {
      const filtered = prev.filter((r) => !(r.date === currentDateStr && indices.includes(r.periodIndex)));
      const newEntries: AttendanceRecordItem[] = indices.map((idx) => ({
        date: currentDateStr,
        periodIndex: idx,
        subjectCode,
        status,
      }));
      const updated = [...filtered, ...newEntries];
      setAttendanceSummary(calculateAttendanceSummary(updated));
      return updated;
    });

    setDayAttendanceRecords((prev) => {
      const filtered = prev.filter((r) => !indices.includes(r.periodIndex));
      const newEntries: AttendanceRecordItem[] = indices.map((idx) => ({
        date: currentDateStr,
        periodIndex: idx,
        subjectCode,
        status,
      }));
      return [...filtered, ...newEntries];
    });

    // API Sync
    try {
      await fetch('/api/student/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceUuid: session.deviceUuid,
          date: currentDateStr,
          periodIndex,
          periodIndices: indices,
          subjectCode,
          status,
        }),
      });
      fetchAttendance();
    } catch (err) {
      console.warn('Failed to save attendance record:', err);
    }
  };

  // Resolve current time state
  const timeState: TimeResolverResult = resolveTimeState(
    currentDate,
    BASE_SCHEDULE,
    overrides
  );

  // Active period attendance lookup
  const activePeriodRecord = timeState.currentPeriod
    ? dayAttendanceRecords.find((r) => r.periodIndex === timeState.currentPeriod?.periodIndex)
    : null;

  // Time simulator actions
  const handleSelectPreset = (timeStr: string, dayOffset = 0) => {
    const target = new Date();
    if (dayOffset !== 0) {
      target.setDate(target.getDate() + dayOffset);
    }
    const [hrs, mins] = timeStr.split(':').map(Number);
    target.setHours(hrs, mins, 0, 0);
    setSimulatedDate(target);
  };

  const handleCustomTimeChange = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return;
    const [hrs, mins] = timeStr.split(':').map(Number);
    const target = new Date(`${dateStr}T${timeStr}:00`);
    setSimulatedDate(target);
  };

  const handleResetTime = () => {
    setSimulatedDate(null);
    setNow(new Date());
  };

  const dayOfWeek = getDayOfWeekString(currentDate);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col pb-safe selection:bg-emerald-500/30 transition-colors duration-200">
      {/* Top Bar Header */}
      <Header
        simulatedDate={currentDate}
        isSimulated={!!simulatedDate}
        onResetTime={handleResetTime}
        onToggleSimulator={() => setIsSimulatorOpen((prev) => !prev)}
        isSimulatorOpen={isSimulatorOpen}
        showSimulator={showSimulator}
      />

      {/* Main Content Area with Bottom Nav padding offset */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 pb-24 space-y-4">
        {/* Time Simulator Panel (Expandable) */}
        {showSimulator && isSimulatorOpen && (
          <TimeSimulator
            simulatedDate={currentDate}
            onSelectPreset={handleSelectPreset}
            onCustomTimeChange={handleCustomTimeChange}
            onReset={handleResetTime}
          />
        )}

        {/* TAB 1: LIVE HUD VIEW */}
        {activeTab === 'hud' && (
          <>
            {/* FOCAL POINT: Hero Period Card with Inline Attendance Actions */}
            <HeroPeriodCard
              timeState={timeState}
              currentAttendanceStatus={activePeriodRecord?.status || null}
              onMarkAttendance={(idx, code, status) => {
                const isLab = timeState.currentPeriod?.id.includes('-p5-p6');
                handleMarkAttendance(idx, code, status, isLab ? [5, 6] : [idx]);
              }}
            />

            {/* "UP NEXT" Preview Subcard */}
            <UpNextCard nextPeriod={timeState.nextPeriod} />

            {/* Secondary Action: Timetable Sheet Toggle */}
            <div className="pt-2">
              <button
                onClick={() => setShowGridModal((prev) => !prev)}
                className="w-full bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/90 border border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-xl p-3.5 flex items-center justify-between text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 transition-all shadow-sm dark:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="uppercase tracking-wide font-bold">
                    {showGridModal ? 'HIDE WEEKLY TIMETABLE' : 'VIEW FULL WEEK TIMETABLE'}
                  </span>
                </div>
                {showGridModal ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                )}
              </button>
            </div>

            {/* Expandable Timetable Grid Modal */}
            {showGridModal && (
              <div className="animate-in fade-in slide-in-from-top-3 duration-200">
                <TimetableGrid
                  currentDay={dayOfWeek === 'SAT' || dayOfWeek === 'SUN' ? 'MON' : dayOfWeek}
                  activePeriodIndex={timeState.currentPeriod?.periodIndex || null}
                  overrides={overrides}
                  attendanceRecords={dayAttendanceRecords}
                  onMarkAttendance={handleMarkAttendance}
                  onClose={() => setShowGridModal(false)}
                />
              </div>
            )}
          </>
        )}

        {/* TAB 2: FULL TIMETABLE VIEW */}
        {activeTab === 'timetable' && (
          <div className="animate-in fade-in duration-200">
            <TimetableGrid
              currentDay={dayOfWeek === 'SAT' || dayOfWeek === 'SUN' ? 'MON' : dayOfWeek}
              activePeriodIndex={timeState.currentPeriod?.periodIndex || null}
              overrides={overrides}
              attendanceRecords={dayAttendanceRecords}
              onMarkAttendance={handleMarkAttendance}
            />
          </div>
        )}

        {/* TAB 3: ATTENDANCE RUNWAY VIEW */}
        {activeTab === 'attendance' && (
          <div className="animate-in fade-in duration-200">
            <AttendanceDrawer summary={attendanceSummary} />
          </div>
        )}

        {/* Footer Meta */}
        <footer className="pt-6 pb-4 text-center border-t border-slate-200 dark:border-zinc-900/80">
          <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 flex items-center justify-center gap-1.5">
            <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
            <span>CAMPUS HUD PWA • REAL-TIME TIME TABLE RESOLVER</span>
          </p>
        </footer>
      </main>

      {/* Fixed Tactical Bottom Navbar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        safeBunkCount={attendanceSummary.overallSafeBunks}
      />

      {/* PWA iOS / Android Install Prompt Banner */}
      <PWAInstallBanner />
    </div>
  );
}

export default function MobileHUDPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 dark:bg-[#09090b] text-slate-500 dark:text-zinc-400 flex items-center justify-center font-mono text-xs">
          LOADING CAMPUS HUD...
        </div>
      }
    >
      <MobileHUDContent />
    </Suspense>
  );
}
