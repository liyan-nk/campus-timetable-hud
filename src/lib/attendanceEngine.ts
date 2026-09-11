import {
  AttendanceRecordItem,
  AttendanceStatus,
  AttendanceSummaryResult,
  RunwayFlag,
  SubjectRunway,
} from '@/types/attendance';
import { BASE_SCHEDULE } from '@/data/schedule';

/**
 * Calculates Safe Bunk Margin for attendance >= 75%
 * Formula: floor((Attended - 0.75 * Conducted) / 0.75)
 */
export function calculateSafeBunks(attended: number, conducted: number): number {
  if (conducted === 0) return 0;
  const margin = Math.floor((attended - 0.75 * conducted) / 0.75);
  return Math.max(0, margin);
}

/**
 * Calculates Recovery Catch-Up Required for attendance < 75%
 * Formula: ceil((0.75 * Conducted - Attended) / 0.25)
 */
export function calculateCatchUpRequired(attended: number, conducted: number): number {
  if (conducted === 0) return 0;
  const needed = Math.ceil((0.75 * conducted - attended) / 0.25);
  return Math.max(0, needed);
}

/**
 * Determines runway status flag based on attendance percentage
 * - SAFE: >= 78% (emerald)
 * - WARNING: 75% <= pct < 78% (amber)
 * - CRITICAL: < 75% (rose)
 */
export function getRunwayFlag(percentage: number): RunwayFlag {
  if (percentage >= 78) return 'SAFE';
  if (percentage >= 75) return 'WARNING';
  return 'CRITICAL';
}

/**
 * Aggregates raw attendance records into subject-by-subject runways and overall summary.
 */
export function calculateAttendanceSummary(
  records: AttendanceRecordItem[]
): AttendanceSummaryResult {
  // Map of subjectCode -> { attended, conducted, subjectName }
  const subjectMap = new Map<
    string,
    { subjectCode: string; subjectName: string; attended: number; conducted: number }
  >();

  // Initialize known subjects from BASE_SCHEDULE
  BASE_SCHEDULE.forEach((slot) => {
    if (slot.periodIndex > 0 && slot.code) {
      if (!subjectMap.has(slot.code)) {
        subjectMap.set(slot.code, {
          subjectCode: slot.code,
          subjectName: slot.subject,
          attended: 0,
          conducted: 0,
        });
      }
    }
  });

  // Accumulate attendance counts
  records.forEach((rec) => {
    if (rec.status === 'OFF') return; // Exclude OFF / canceled slots from conducted

    let entry = subjectMap.get(rec.subjectCode);
    if (!entry) {
      entry = {
        subjectCode: rec.subjectCode,
        subjectName: rec.subjectCode,
        attended: 0,
        conducted: 0,
      };
      subjectMap.set(rec.subjectCode, entry);
    }

    entry.conducted += 1;
    if (rec.status === 'PRESENT' || rec.status === 'DUTY_LEAVE') {
      entry.attended += 1;
    }
  });

  let totalAttended = 0;
  let totalConducted = 0;

  const subjects: SubjectRunway[] = Array.from(subjectMap.values()).map((sub) => {
    const percentage = sub.conducted > 0 ? (sub.attended / sub.conducted) * 100 : 100;
    const flag = getRunwayFlag(percentage);
    const safeBunks = calculateSafeBunks(sub.attended, sub.conducted);
    const catchUp = calculateCatchUpRequired(sub.attended, sub.conducted);

    totalAttended += sub.attended;
    totalConducted += sub.conducted;

    let runwayMessage = '';
    if (sub.conducted === 0) {
      runwayMessage = 'No classes conducted yet';
    } else if (percentage >= 75) {
      runwayMessage = safeBunks === 1 ? '1 safe bunk available' : `${safeBunks} safe bunks available`;
    } else {
      runwayMessage = catchUp === 1 ? 'Must attend next 1 class' : `Must attend next ${catchUp} classes`;
    }

    return {
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      attended: sub.attended,
      conducted: sub.conducted,
      percentage: Math.round(percentage * 10) / 10,
      statusFlag: flag,
      safeBunks,
      catchUpRequired: catchUp,
      runwayMessage,
    };
  });

  const overallPercentage =
    totalConducted > 0 ? Math.round((totalAttended / totalConducted) * 1000) / 10 : 100;
  const overallFlag = getRunwayFlag(overallPercentage);
  const overallSafeBunks = calculateSafeBunks(totalAttended, totalConducted);
  const overallCatchUp = calculateCatchUpRequired(totalAttended, totalConducted);

  return {
    overallPercentage,
    overallAttended: totalAttended,
    overallConducted: totalConducted,
    overallFlag,
    overallSafeBunks,
    overallCatchUpRequired: overallCatchUp,
    subjects,
  };
}
