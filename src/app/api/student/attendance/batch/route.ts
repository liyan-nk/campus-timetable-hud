import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BASE_SCHEDULE } from '@/data/schedule';
import { getDayOfWeekString, mergePeriodWithOverride } from '@/lib/timeResolver';
import { calculateAttendanceSummary } from '@/lib/attendanceEngine';
import { AttendanceRecordItem } from '@/types/attendance';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceUuid, date, action } = body; // action: 'MARK_ABSENT' | 'RESET'

    if (!deviceUuid || !date || !action) {
      return NextResponse.json(
        { error: 'deviceUuid, date, and action are required' },
        { status: 400 }
      );
    }

    let student = await prisma.studentProfile.findUnique({
      where: { deviceUuid },
    });

    if (!student) {
      student = await prisma.studentProfile.create({
        data: { deviceUuid },
      });
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);

    if (action === 'RESET') {
      // Delete today's attendance records
      await prisma.attendanceRecord.deleteMany({
        where: {
          studentId: student.id,
          date: targetDate,
        },
      });
    } else if (action === 'MARK_ABSENT') {
      // Find today's valid academic periods from schedule
      const dayOfWeek = getDayOfWeekString(targetDate);
      
      if (dayOfWeek !== 'SAT' && dayOfWeek !== 'SUN') {
        const dateOverrides = await prisma.periodOverride.findMany({
          where: { date: targetDate },
        });

        const formattedOverrides = dateOverrides.map((o) => ({
          date: date,
          periodIndex: o.periodIndex,
          status: o.status as any,
          overrideSubject: o.overrideSubject,
          overrideFaculty: o.overrideFaculty,
          overrideVenue: o.overrideVenue,
          note: o.note,
        }));

        const dayPeriods = BASE_SCHEDULE.filter((p) => p.day === dayOfWeek && p.periodIndex > 0);

        for (const p of dayPeriods) {
          const merged = mergePeriodWithOverride(p, formattedOverrides);
          // Skip canceled or free periods
          if (merged.overrideStatus === 'CANCELED' || merged.overrideStatus === 'FREE') {
            continue;
          }

          const indices = p.id.includes('-p5-p6') ? [5, 6] : [p.periodIndex];

          for (const idx of indices) {
            await prisma.attendanceRecord.upsert({
              where: {
                studentId_date_periodIndex: {
                  studentId: student.id,
                  date: targetDate,
                  periodIndex: idx,
                },
              },
              update: {
                subjectCode: p.code,
                status: 'ABSENT',
              },
              create: {
                studentId: student.id,
                date: targetDate,
                periodIndex: idx,
                subjectCode: p.code,
                status: 'ABSENT',
              },
            });
          }
        }
      }
    }

    // Return updated records and summary
    const updatedStudent = await prisma.studentProfile.findUnique({
      where: { id: student.id },
      include: { records: true },
    });

    const allRecords: AttendanceRecordItem[] = (updatedStudent?.records || []).map((r) => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      periodIndex: r.periodIndex,
      subjectCode: r.subjectCode,
      status: r.status as any,
    }));

    const dayRecords = allRecords.filter((r) => r.date === date);
    const summary = calculateAttendanceSummary(allRecords);

    return NextResponse.json({
      success: true,
      records: allRecords,
      dayRecords,
      summary,
    });
  } catch (error) {
    console.error('Error in POST /api/student/attendance/batch:', error);
    return NextResponse.json({ error: 'Failed to process batch attendance' }, { status: 500 });
  }
}
