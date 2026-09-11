import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateAttendanceSummary } from '@/lib/attendanceEngine';
import { AttendanceRecordItem } from '@/types/attendance';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceUuid = searchParams.get('deviceUuid');
    const dateStr = searchParams.get('date');

    if (!deviceUuid) {
      return NextResponse.json({ error: 'deviceUuid parameter required' }, { status: 400 });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { deviceUuid },
      include: { records: true },
    });

    if (!student) {
      return NextResponse.json({
        records: [],
        dayRecords: [],
        summary: calculateAttendanceSummary([]),
      });
    }

    const records: AttendanceRecordItem[] = student.records.map((r) => ({
      id: r.id,
      date: r.date.toISOString().split('T')[0],
      periodIndex: r.periodIndex,
      subjectCode: r.subjectCode,
      status: r.status as any,
    }));

    const dayRecords = dateStr
      ? records.filter((r) => r.date === dateStr)
      : records;

    const summary = calculateAttendanceSummary(records);

    return NextResponse.json({
      records,
      dayRecords,
      summary,
    });
  } catch (error) {
    console.error('Error in GET /api/student/attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceUuid, date, periodIndex, subjectCode, status, periodIndices } = body;

    if (!deviceUuid || !date || !subjectCode || !status) {
      return NextResponse.json(
        { error: 'deviceUuid, date, subjectCode, and status are required' },
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

    // Handle single period or multi-period lab block (e.g. periodIndices: [5, 6])
    const indicesToUpdate: number[] = Array.isArray(periodIndices) && periodIndices.length > 0
      ? periodIndices
      : [periodIndex];

    for (const idx of indicesToUpdate) {
      await prisma.attendanceRecord.upsert({
        where: {
          studentId_date_periodIndex: {
            studentId: student.id,
            date: targetDate,
            periodIndex: idx,
          },
        },
        update: {
          subjectCode,
          status,
        },
        create: {
          studentId: student.id,
          date: targetDate,
          periodIndex: idx,
          subjectCode,
          status,
        },
      });
    }

    // Fetch all student records to return updated summary
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
    console.error('Error in POST /api/student/attendance:', error);
    return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 });
  }
}
