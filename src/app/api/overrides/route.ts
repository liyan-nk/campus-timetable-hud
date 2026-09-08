import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const CR_ADMIN_KEY = process.env.CR_ADMIN_KEY || 'cr1234';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      // Return all overrides
      const all = await prisma.periodOverride.findMany({
        orderBy: { date: 'asc' },
      });
      return NextResponse.json(all);
    }

    // Parse date YYYY-MM-DD
    const startDate = new Date(`${dateStr}T00:00:00.000Z`);
    const endDate = new Date(`${dateStr}T23:59:59.999Z`);

    const overrides = await prisma.periodOverride.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { periodIndex: 'asc' },
    });

    return NextResponse.json(overrides);
  } catch (error) {
    console.error('Error fetching overrides:', error);
    return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey, date, periodIndex, status, overrideSubject, overrideFaculty, overrideVenue, note } = body;

    // Verify Passkey
    if (passkey !== CR_ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized passkey' }, { status: 401 });
    }

    if (!date || periodIndex === undefined || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);

    // If status is NORMAL, remove any existing override for this slot
    if (status === 'NORMAL') {
      await prisma.periodOverride.deleteMany({
        where: {
          date: targetDate,
          periodIndex: Number(periodIndex),
        },
      });
      return NextResponse.json({ success: true, message: 'Override reset to NORMAL' });
    }

    // Upsert override record
    const result = await prisma.periodOverride.upsert({
      where: {
        date_periodIndex: {
          date: targetDate,
          periodIndex: Number(periodIndex),
        },
      },
      update: {
        status,
        overrideSubject: overrideSubject || null,
        overrideFaculty: overrideFaculty || null,
        overrideVenue: overrideVenue || null,
        note: note || null,
      },
      create: {
        date: targetDate,
        periodIndex: Number(periodIndex),
        status,
        overrideSubject: overrideSubject || null,
        overrideFaculty: overrideFaculty || null,
        overrideVenue: overrideVenue || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, override: result });
  } catch (error) {
    console.error('Error updating override:', error);
    return NextResponse.json({ error: 'Failed to update override' }, { status: 500 });
  }
}
