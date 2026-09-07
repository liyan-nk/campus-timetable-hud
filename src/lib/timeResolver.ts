import {
  DayOfWeek,
  MergedPeriod,
  PeriodDefinition,
  PeriodOverrideData,
  TimeResolverResult,
} from '../types/schedule';

export function parseHHMMToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function parseHHMMToSeconds(timeStr: string, baseDate: Date): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const target = new Date(baseDate);
  target.setHours(hours, minutes, 0, 0);
  return Math.floor(target.getTime() / 1000);
}

export function getDayOfWeekString(date: Date): DayOfWeek | 'SAT' | 'SUN' {
  const dayIndex = date.getDay();
  switch (dayIndex) {
    case 1:
      return 'MON';
    case 2:
      return 'TUE';
    case 3:
      return 'WED';
    case 4:
      return 'THU';
    case 5:
      return 'FRI';
    case 6:
      return 'SAT';
    default:
      return 'SUN';
  }
}

export function mergePeriodWithOverride(
  period: PeriodDefinition,
  overrides: PeriodOverrideData[]
): MergedPeriod {
  if (period.periodIndex === 0) {
    return { ...period, overrideStatus: 'NORMAL', isOverridden: false };
  }

  const override = overrides.find((o) => o.periodIndex === period.periodIndex);
  if (!override || override.status === 'NORMAL') {
    return { ...period, overrideStatus: 'NORMAL', isOverridden: false };
  }

  let merged: MergedPeriod = {
    ...period,
    overrideStatus: override.status,
    overrideNote: override.note || null,
    isOverridden: true,
  };

  if (override.status === 'FREE') {
    merged.subject = `FREE HOUR (${period.subject})`;
    merged.faculty = 'Unassigned';
    merged.venue = period.venue;
  } else if (override.status === 'CANCELED') {
    merged.subject = `[CANCELED] ${period.subject}`;
    merged.faculty = override.overrideFaculty || period.faculty;
    merged.venue = period.venue;
  } else if (override.status === 'SWAPPED') {
    merged.subject = override.overrideSubject || period.subject;
    merged.faculty = override.overrideFaculty || period.faculty;
    merged.venue = override.overrideVenue || period.venue;
  }

  return merged;
}

export function resolveTimeState(
  now: Date,
  allPeriods: PeriodDefinition[],
  overrides: PeriodOverrideData[] = []
): TimeResolverResult {
  const dayStr = getDayOfWeekString(now);

  // Weekend check
  if (dayStr === 'SAT' || dayStr === 'SUN') {
    return {
      status: 'WEEKEND',
      currentPeriod: null,
      nextPeriod: null,
      remainingSeconds: 0,
      progressPercentage: 0,
      displayMessage: 'Weekend — No Classes Scheduled',
    };
  }

  // Get today's slots sorted chronologically by startTime
  const todaySlots = allPeriods
    .filter((p) => p.day === dayStr)
    .sort((a, b) => parseHHMMToMinutes(a.startTime) - parseHHMMToMinutes(b.startTime));

  if (todaySlots.length === 0) {
    return {
      status: 'WEEKEND',
      currentPeriod: null,
      nextPeriod: null,
      remainingSeconds: 0,
      progressPercentage: 0,
      displayMessage: 'No classes scheduled for today',
    };
  }

  const mergedTodaySlots = todaySlots.map((p) =>
    mergePeriodWithOverride(p, overrides)
  );

  // Academic periods for today (excluding breaks & lunch)
  const academicPeriods = mergedTodaySlots.filter((p) => p.periodIndex > 0);

  const nowSec = Math.floor(now.getTime() / 1000);
  const firstSlot = mergedTodaySlots[0];
  const lastSlot = mergedTodaySlots[mergedTodaySlots.length - 1];

  const collegeStartSec = parseHHMMToSeconds(firstSlot.startTime, now);
  const collegeEndSec = parseHHMMToSeconds(lastSlot.endTime, now);

  // Helper to find next academic period starting at or after targetSec
  const getNextAcademicPeriod = (targetSec: number): MergedPeriod | null => {
    return (
      academicPeriods.find(
        (p) => parseHHMMToSeconds(p.startTime, now) >= targetSec
      ) || null
    );
  };

  // 1. BEFORE COLLEGE
  if (nowSec < collegeStartSec) {
    const remaining = collegeStartSec - nowSec;
    const nextP = getNextAcademicPeriod(collegeStartSec);
    return {
      status: 'BEFORE_COLLEGE',
      currentPeriod: null,
      nextPeriod: nextP,
      remainingSeconds: Math.max(0, remaining),
      progressPercentage: 0,
      displayMessage: `College starts at ${firstSlot.startTime}`,
    };
  }

  // 2. COLLEGE OVER (Specifically after 16:00 on Friday or end of last period)
  if (nowSec >= collegeEndSec) {
    return {
      status: 'COLLEGE_OVER',
      currentPeriod: null,
      nextPeriod: null,
      remainingSeconds: 0,
      progressPercentage: 100,
      displayMessage: 'Classes done for today',
    };
  }

  // 3. CHECK ACTIVE SLOT (Academic Class, Lunch, or Tea Break)
  for (let i = 0; i < mergedTodaySlots.length; i++) {
    const slot = mergedTodaySlots[i];
    const slotStartSec = parseHHMMToSeconds(slot.startTime, now);
    const slotEndSec = parseHHMMToSeconds(slot.endTime, now);

    if (nowSec >= slotStartSec && nowSec < slotEndSec) {
      const remaining = slotEndSec - nowSec;
      const elapsed = nowSec - slotStartSec;
      const totalDuration = slotEndSec - slotStartSec;
      const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

      const nextP = getNextAcademicPeriod(slotEndSec);

      if (slot.type === 'LUNCH') {
        return {
          status: 'LUNCH',
          currentPeriod: slot,
          nextPeriod: nextP,
          remainingSeconds: Math.max(0, remaining),
          progressPercentage: progress,
          displayMessage: 'Lunch Break in Progress',
        };
      }

      if (slot.type === 'BREAK') {
        return {
          status: 'PASSING_PERIOD',
          currentPeriod: slot,
          nextPeriod: nextP,
          remainingSeconds: Math.max(0, remaining),
          progressPercentage: progress,
          displayMessage: `Tea Break — Next class starts at ${nextP?.startTime || slot.endTime}`,
        };
      }

      // Standard Academic Class (LECTURE / LAB)
      return {
        status: 'IN_CLASS',
        currentPeriod: slot,
        nextPeriod: nextP,
        remainingSeconds: Math.max(0, remaining),
        progressPercentage: progress,
        displayMessage: `Period ${slot.periodIndex} Active`,
      };
    }
  }

  // 4. PASSING PERIOD / GAP BETWEEN SLOTS
  for (let i = 0; i < mergedTodaySlots.length - 1; i++) {
    const prevSlot = mergedTodaySlots[i];
    const nextSlot = mergedTodaySlots[i + 1];

    const prevEndSec = parseHHMMToSeconds(prevSlot.endTime, now);
    const nextStartSec = parseHHMMToSeconds(nextSlot.startTime, now);

    if (nowSec >= prevEndSec && nowSec < nextStartSec) {
      const remaining = nextStartSec - nowSec;
      const elapsed = nowSec - prevEndSec;
      const totalDuration = nextStartSec - prevEndSec;
      const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

      const nextP = getNextAcademicPeriod(nextStartSec);

      return {
        status: 'PASSING_PERIOD',
        currentPeriod: null,
        nextPeriod: nextP || (nextSlot.periodIndex > 0 ? nextSlot : null),
        remainingSeconds: Math.max(0, remaining),
        progressPercentage: progress,
        displayMessage: `Passing Period — Next class starts at ${nextSlot.startTime}`,
      };
    }
  }

  // Fallback
  return {
    status: 'COLLEGE_OVER',
    currentPeriod: null,
    nextPeriod: null,
    remainingSeconds: 0,
    progressPercentage: 100,
    displayMessage: 'Out of Class Hours',
  };
}
