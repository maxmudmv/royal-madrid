import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { runDailySync } from '@/lib/importer';

async function isAuthorizedCronOrAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('authorization') || '';
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const admin = await getAuthenticatedAdmin();
  return admin.authenticated;
}

export async function GET(request: Request) {
  if (!(await isAuthorizedCronOrAdmin(request))) {
    return NextResponse.json(
      {
        error:
          'Unauthorized: Provide valid Bearer CRON_SECRET header or authenticated Admin session.',
      },
      { status: 401 }
    );
  }

  try {
    const result = await runDailySync({ runWeeklyAuditIfSunday: true });
    return NextResponse.json({
      ok: true,
      scheduledJob: 'DAILY_SYNC_AND_SUNDAY_AUDIT',
      executedAt: new Date().toISOString(),
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Scheduled cron sync failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
