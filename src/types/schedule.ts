export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
export type PeriodType = 'LECTURE' | 'LAB' | 'BREAK' | 'LUNCH';
export type OverrideStatus = 'NORMAL' | 'CANCELED' | 'SWAPPED' | 'FREE';

export interface PeriodDefinition {
  id: string;
  day: DayOfWeek;
  periodIndex: number; // 1 to 6
  startTime: string;   // '09:00' (24h HH:mm)
  endTime: string;     // '09:55'
  subject: string;
  code: string;        // e.g. 'CST201'
  faculty: string;
  venue: string;       // e.g. 'Room 304' or 'CS Lab 2'
  type: PeriodType;
}

export interface PeriodOverrideData {
  id?: string;
  date: string;        // 'YYYY-MM-DD'
  periodIndex: number;
  status: OverrideStatus;
  overrideSubject?: string | null;
  overrideFaculty?: string | null;
  overrideVenue?: string | null;
  note?: string | null;
}

export type HUDStatus = 
  | 'BEFORE_COLLEGE' 
  | 'IN_CLASS' 
  | 'PASSING_PERIOD' 
  | 'LUNCH' 
  | 'COLLEGE_OVER' 
  | 'WEEKEND';

export interface MergedPeriod extends PeriodDefinition {
  overrideStatus?: OverrideStatus;
  overrideNote?: string | null;
  isOverridden?: boolean;
}

export interface TimeResolverResult {
  status: HUDStatus;
  currentPeriod: MergedPeriod | null;
  nextPeriod: MergedPeriod | null;
  remainingSeconds: number;
  progressPercentage: number;
  displayMessage: string;
}
