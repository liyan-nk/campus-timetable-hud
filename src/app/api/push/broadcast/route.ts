import { NextRequest, NextResponse } from 'next/server';
import { sendBroadcastNotification } from '@/lib/pushNotifier';

export const dynamic = 'force-dynamic';

const CR_ADMIN_KEY = process.env.CR_ADMIN_KEY || 'cr1234';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey, title, message, url } = body;

    if (passkey !== CR_ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized passkey' }, { status: 401 });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message field is required' }, { status: 400 });
    }

    const alertTitle = title || '📢 CR Broadcast Alert';
    const result = await sendBroadcastNotification(alertTitle, message, url || '/');

    return NextResponse.json({
      success: true,
      message: 'Broadcast sent successfully',
      stats: result,
    });
  } catch (error) {
    console.error('Error in POST /api/push/broadcast:', error);
    return NextResponse.json({ error: 'Failed to send broadcast notification' }, { status: 500 });
  }
}
