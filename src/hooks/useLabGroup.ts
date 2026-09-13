'use client';

import { useState, useEffect, useCallback } from 'react';

export type LabGroup = 'G1' | 'G2';

const STORAGE_KEY = 'campus_hud_lab_group';

export function useLabGroup(deviceUuid?: string) {
  const [labGroup, setLabGroupState] = useState<LabGroup>('G1');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Read initial value from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'G1' || stored === 'G2') {
        setLabGroupState(stored);
      }
    } catch (err) {
      console.warn('Unable to read labGroup from localStorage:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Update labGroup state, localStorage, and optional DB background sync
  const setLabGroup = useCallback(
    async (newGroup: LabGroup) => {
      setLabGroupState(newGroup);
      try {
        localStorage.setItem(STORAGE_KEY, newGroup);
      } catch (err) {
        console.warn('Unable to save labGroup to localStorage:', err);
      }

      if (deviceUuid) {
        try {
          await fetch('/api/student/session', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deviceUuid,
              labGroup: newGroup,
            }),
          });
        } catch (err) {
          console.warn('Background sync for labGroup failed:', err);
        }
      }
    },
    [deviceUuid]
  );

  return {
    labGroup,
    setLabGroup,
    isHydrated,
  };
}
