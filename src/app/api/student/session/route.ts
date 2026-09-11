import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceUuid, labGroup } = body;

    if (!deviceUuid || typeof deviceUuid !== 'string') {
      return NextResponse.json({ error: 'deviceUuid is required' }, { status: 400 });
    }

    let profile = await prisma.studentProfile.findUnique({
      where: { deviceUuid },
    });

    if (!profile) {
      profile = await prisma.studentProfile.create({
        data: {
          deviceUuid,
          labGroup: labGroup || 'G1',
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in POST /api/student/session:', error);
    return NextResponse.json({ error: 'Failed to process student session' }, { status: 500 });
  }
}
