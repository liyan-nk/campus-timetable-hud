'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { HeroPeriodCard } from '@/components/HeroPeriodCard';
import { UpNextCard } from '@/components/UpNextCard';
import { TimetableGrid } from '@/components/TimetableGrid';
import { TimeSimulator } from '@/components/TimeSimulator';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { BASE_SCHEDULE } from '@/data/schedule';
import { resolveTimeState, getDayOfWeekString } from '@/lib/timeResolver';
import { PeriodOverrideData, TimeResolverResult } from '@/types/schedule';
import { Calendar, ChevronDown, ChevronUp, Layers } from 'lucide-react';

function MobileHUDContent() {
  const searchParams = useSearchParams();
  const isDev = process.env.NODE_ENV === 'development';
  const isPreview = searchParams.get('preview') === 'true' || searchParams.get('test') === 'true';
  const showSimulator = isDev || isPreview;

  const [now, setNow] = useState<Date>(new Date());
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [showGridModal, setShowGridModal] = useState<boolean>(false);
  const [overrides, setOverrides] = useState<PeriodOverrideData[]>([]);
  const [, setIsLoadingOverrides] = useState<boolean>(false);

  // Effective Date: real now or simulated date
  const currentDate = simulatedDate || now;

  // Real-time ticking interval every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (!simulatedDate) {
        setNow(new Date());
      } else {
        // Advance simulated date by 1 second for smooth countdown
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
  }, [currentDate.toISOString().split('T')[0], fetchOverrides]);

  // Resolve current time state
  const timeState: TimeResolverResult = resolveTimeState(
    currentDate,
    BASE_SCHEDULE,
    overrides
  );

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
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col pb-safe selection:bg-emerald-500/30">
      {/* Top Bar Header */}
      <Header
        simulatedDate={currentDate}
        isSimulated={!!simulatedDate}
        onResetTime={handleResetTime}
        onToggleSimulator={() => setIsSimulatorOpen((prev) => !prev)}
        isSimulatorOpen={isSimulatorOpen}
        showSimulator={showSimulator}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4">
        {/* Time Simulator Panel (Expandable - unmounted unless showSimulator & isSimulatorOpen) */}
        {showSimulator && isSimulatorOpen && (
          <TimeSimulator
            simulatedDate={currentDate}
            onSelectPreset={handleSelectPreset}
            onCustomTimeChange={handleCustomTimeChange}
            onReset={handleResetTime}
          />
        )}

        {/* FOCAL POINT: Hero Period Card */}
        <HeroPeriodCard timeState={timeState} />

        {/* "UP NEXT" Preview Subcard */}
        <UpNextCard nextPeriod={timeState.nextPeriod} />

        {/* Secondary Action: Full Week Timetable Sheet Toggle */}
        <div className="pt-2">
          <button
            onClick={() => setShowGridModal((prev) => !prev)}
            className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 flex items-center justify-between text-xs font-mono font-bold text-zinc-300 transition-all shadow-md"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="uppercase tracking-wide">
                {showGridModal ? 'HIDE WEEKLY TIMETABLE' : 'VIEW FULL WEEK TIMETABLE'}
              </span>
            </div>
            {showGridModal ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        </div>

        {/* Expandable Timetable Grid */}
        {showGridModal && (
          <div className="animate-in fade-in slide-in-from-top-3 duration-200">
            <TimetableGrid
              currentDay={dayOfWeek === 'SAT' || dayOfWeek === 'SUN' ? 'MON' : dayOfWeek}
              activePeriodIndex={timeState.currentPeriod?.periodIndex || null}
              overrides={overrides}
              onClose={() => setShowGridModal(false)}
            />
          </div>
        )}

        {/* Footer Meta */}
        <footer className="pt-6 pb-4 text-center border-t border-zinc-900/80">
          <p className="text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-1.5">
            <Layers className="w-3 h-3 text-emerald-500" />
            <span>CAMPUS HUD PWA • REAL-TIME TIME TABLE RESOLVER</span>
          </p>
        </footer>
      </main>

      {/* PWA iOS / Android Install Prompt Banner */}
      <PWAInstallBanner />
    </div>
  );
}

export default function MobileHUDPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] text-zinc-400 flex items-center justify-center font-mono text-xs">
        LOADING CAMPUS HUD...
      </div>
    }>
      <MobileHUDContent />
    </Suspense>
  );
}

