export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'DUTY_LEAVE' | 'OFF';

export type RunwayFlag = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface SubjectRunway {
  subjectCode: string;
  subjectName: string;
  attended: number;
  conducted: number;
  percentage: number;
  statusFlag: RunwayFlag;
  safeBunks: number;
  catchUpRequired: number;
  runwayMessage: string;
}

export interface AttendanceRecordItem {
  id?: string;
  date: string; // 'YYYY-MM-DD'
  periodIndex: number;
  subjectCode: string;
  status: AttendanceStatus;
}

export interface AttendanceSummaryResult {
  overallPercentage: number;
  overallAttended: number;
  overallConducted: number;
  overallFlag: RunwayFlag;
  overallSafeBunks: number;
  overallCatchUpRequired: number;
  subjects: SubjectRunway[];
}
