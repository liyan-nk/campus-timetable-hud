'use client';

import { useState, useEffect } from 'react';

function getOrCreateDeviceUuid(): string {
  if (typeof window === 'undefined') return '';
  let uuid = localStorage.getItem('campus_hud_device_uuid');
  if (!uuid) {
    uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'dev-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('campus_hud_device_uuid', uuid);
  }
  return uuid;
}

export interface StudentSessionState {
  deviceUuid: string;
  studentId: string | null;
  labGroup: string;
  isRegistered: boolean;
}

export function useStudentSession() {
  const [session, setSession] = useState<StudentSessionState>({
    deviceUuid: '',
    studentId: null,
    labGroup: 'G1',
    isRegistered: false,
  });

  useEffect(() => {
    const uuid = getOrCreateDeviceUuid();
    if (!uuid) return;

    setSession((prev) => ({ ...prev, deviceUuid: uuid }));

    async function registerSession() {
      try {
        const res = await fetch('/api/student/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceUuid: uuid }),
        });
        if (res.ok) {
          const data = await res.json();
          setSession({
            deviceUuid: uuid,
            studentId: data.id,
            labGroup: data.labGroup || 'G1',
            isRegistered: true,
          });
        }
      } catch (err) {
        console.warn('Student session sync fallback active:', err);
      }
    }

    registerSession();
  }, []);

  return session;
}
