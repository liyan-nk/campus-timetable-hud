'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BASE_SCHEDULE } from '@/data/schedule';
import { getDayOfWeekString, parseHHMMToMinutes } from '@/lib/timeResolver';
import { PeriodOverrideData, OverrideStatus } from '@/types/schedule';
import { formatRangeTo12Hour } from '@/lib/formatTime';
import {
  Shield,
  Key,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Save,
} from 'lucide-react';

export default function CRAdminPage() {
  const [passkey, setPasskey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [, setOverrides] = useState<PeriodOverrideData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states per period index (1 to 7)
  const [formStates, setFormStates] = useState<{
    [key: number]: {
      status: OverrideStatus;
      overrideSubject: string;
      overrideFaculty: string;
      overrideVenue: string;
      note: string;
    };
  }>({});

  // Check stored passkey on load
  useEffect(() => {
    const saved = localStorage.getItem('cr_passkey');
    if (saved) {
      setPasskey(saved);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setAuthError('Please enter passkey');
      return;
    }
    localStorage.setItem('cr_passkey', passkey);
    setIsAuthenticated(true);
    setAuthError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('cr_passkey');
    setIsAuthenticated(false);
    setPasskey('');
  };

  // Fetch overrides when date changes
  const fetchOverrides = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/overrides?date=${selectedDateStr}`, { cache: 'no-store' });
      if (res.ok) {
        const data: PeriodOverrideData[] = await res.json();
        setOverrides(data);

        // Initialize form states for periods 1..7
        const initialForms: any = {};
        [1, 2, 3, 4, 5, 6, 7].forEach((pIdx) => {
          const existing = data.find((o) => o.periodIndex === pIdx);
          initialForms[pIdx] = {
            status: existing ? existing.status : 'NORMAL',
            overrideSubject: existing?.overrideSubject || '',
            overrideFaculty: existing?.overrideFaculty || '',
            overrideVenue: existing?.overrideVenue || '',
            note: existing?.note || '',
          };
        });
        setFormStates(initialForms);
      }
    } catch (err) {
      console.error('Failed to fetch overrides:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOverrides();
    }
  }, [isAuthenticated, selectedDateStr]);

  const targetDateObj = new Date(`${selectedDateStr}T00:00:00.000Z`);
  const dayStr = getDayOfWeekString(targetDateObj);

  const dayPeriods = BASE_SCHEDULE
    .filter(
      (p) =>
        p.day === (dayStr === 'SAT' || dayStr === 'SUN' ? 'MON' : dayStr) &&
        p.periodIndex > 0
    )
    .sort((a, b) => parseHHMMToMinutes(a.startTime) - parseHHMMToMinutes(b.startTime));

  const handleStatusToggle = (periodIndex: number, newStatus: OverrideStatus) => {
    setFormStates((prev) => ({
      ...prev,
      [periodIndex]: {
        ...prev[periodIndex],
        status: newStatus,
      },
    }));
  };

  const handleInputChange = (periodIndex: number, field: string, value: string) => {
    setFormStates((prev) => ({
      ...prev,
      [periodIndex]: {
        ...prev[periodIndex],
        [field]: value,
      },
    }));
  };

  const handleSaveOverride = async (periodIndex: number) => {
    const form = formStates[periodIndex];
    if (!form) return;

    try {
      setSavingIndex(periodIndex);
      setMessage(null);

      const res = await fetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passkey,
          date: selectedDateStr,
          periodIndex,
          status: form.status,
          overrideSubject: form.overrideSubject,
          overrideFaculty: form.overrideFaculty,
          overrideVenue: form.overrideVenue,
          note: form.note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setIsAuthenticated(false);
          setAuthError('Invalid CR Passkey');
          return;
        }
        throw new Error(data.error || 'Failed to update');
      }

      setMessage({ type: 'success', text: `Period ${periodIndex} override saved successfully!` });
      await fetchOverrides();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving override' });
    } finally {
      setSavingIndex(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-100 flex items-center justify-center p-4 selection:bg-emerald-500/30">
        <div className="max-w-sm w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl dark:shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-700 dark:text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-100">CR OVERRIDE PORTAL</h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Class Representative Authentication Required
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 font-mono">
            <div>
              <label className="text-xs text-zinc-600 dark:text-zinc-400 block mb-1.5 font-bold">
                ENTER PASSKEY (Default: cr1234)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Enter CR Passkey"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {authError && (
              <p className="text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/50 p-2 rounded-lg text-center">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-xl transition-all shadow-md dark:shadow-lg dark:shadow-emerald-500/20"
            >
              AUTHENTICATE
            </button>

            <Link
              href="/"
              className="block text-center text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 pt-2"
            >
              ← Return to Main HUD
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-100 flex flex-col pb-safe">
      {/* Header */}
      <header className="bg-white/90 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-40 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">
                CR QUICK-OVERRIDE
              </h1>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Runtime Class Controls</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 space-y-4 font-sans">
        {/* Date Selector & Refresh */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex items-center justify-between shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">TARGET DATE:</label>
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={fetchOverrides}
            className="p-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded"
            title="Refresh Overrides"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-mono border flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* List of Periods for Target Day */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            {dayStr} PERIODS — 1-TAP OVERRIDE ENGINE
          </h3>

          {dayPeriods.map((p) => {
            const form = formStates[p.periodIndex] || {
              status: 'NORMAL',
              overrideSubject: '',
              overrideFaculty: '',
              overrideVenue: '',
              note: '',
            };

            const isSaving = savingIndex === p.periodIndex;
            const periodLabel = p.id.includes('-p5-p6')
              ? 'PERIOD 5-6'
              : `PERIOD ${p.periodIndex}`;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/90 rounded-2xl p-4 space-y-3 shadow-sm dark:shadow-xl"
              >
                {/* Period Base Info */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-900 pb-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {periodLabel} • {formatRangeTo12Hour(p.startTime, p.endTime)}
                    </span>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{p.subject}</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Default: {p.faculty} • {p.venue}
                    </p>
                  </div>
                </div>

                {/* 1-Tap Status Switch Pills */}
                <div>
                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 block mb-1.5">
                    SELECT STATUS OVERRIDE:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['NORMAL', 'FREE', 'SWAPPED', 'CANCELED'] as OverrideStatus[]).map(
                      (st) => {
                        const isSelected = form.status === st;
                        let btnColor = 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800';

                        if (isSelected) {
                          if (st === 'NORMAL')
                            btnColor = 'bg-emerald-500 text-zinc-950 font-bold border-emerald-400';
                          if (st === 'FREE')
                            btnColor = 'bg-amber-500 text-zinc-950 font-bold border-amber-400';
                          if (st === 'SWAPPED')
                            btnColor = 'bg-purple-500 text-white font-bold border-purple-400';
                          if (st === 'CANCELED')
                            btnColor = 'bg-rose-500 text-white font-bold border-rose-400';
                        }

                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusToggle(p.periodIndex, st)}
                            className={`py-1.5 px-1 rounded-lg text-[11px] font-mono border transition-all text-center ${btnColor}`}
                          >
                            {st}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Conditional Input Fields for Swapped / Canceled / Notes */}
                {form.status === 'SWAPPED' && (
                  <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-zinc-900">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 block mb-0.5">
                        SWAPPED SUBJECT
                      </label>
                      <input
                        type="text"
                        placeholder={p.subject}
                        value={form.overrideSubject}
                        onChange={(e) =>
                          handleInputChange(p.periodIndex, 'overrideSubject', e.target.value)
                        }
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 block mb-0.5">
                          NEW FACULTY
                        </label>
                        <input
                          type="text"
                          placeholder={p.faculty}
                          value={form.overrideFaculty}
                          onChange={(e) =>
                            handleInputChange(p.periodIndex, 'overrideFaculty', e.target.value)
                          }
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 block mb-0.5">
                          NEW VENUE
                        </label>
                        <input
                          type="text"
                          placeholder={p.venue}
                          value={form.overrideVenue}
                          onChange={(e) =>
                            handleInputChange(p.periodIndex, 'overrideVenue', e.target.value)
                          }
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Override Note / Reason */}
                {form.status !== 'NORMAL' && (
                  <div>
                    <label className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 block mb-0.5">
                      NOTE / ANNOUNCEMENT (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bring lab journals / Combined class in Hall B"
                      value={form.note}
                      onChange={(e) =>
                        handleInputChange(p.periodIndex, 'note', e.target.value)
                      }
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}

                {/* Save Button for Period */}
                <button
                  onClick={() => handleSaveOverride(p.periodIndex)}
                  disabled={isSaving}
                  className="w-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-mono text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm dark:shadow-none"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'PUBLISHING...' : `SAVE ${periodLabel} OVERRIDE`}</span>
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

