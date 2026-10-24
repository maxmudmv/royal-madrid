import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import {
  runDailySync,
  runFullHistoricalImport,
  runWeeklyHistoricalAudit,
} from '@/lib/importer';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const auth = await getAuthenticatedAdmin();
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'Unauthorized: Administrator session required.' },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: 'DAILY_SYNC' | 'WEEKLY_AUDIT' | 'FULL_IMPORT';
      forceReplaceOverrides?: boolean;
    };

    const action = body.action || 'DAILY_SYNC';
    const db = await getDb();

    if (action === 'WEEKLY_AUDIT') {
      const auditResult = await runWeeklyHistoricalAudit();
      await db.query(
        `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, new_values, reason)
         VALUES ($1, 'TRIGGER_WEEKLY_AUDIT', 'data_import_runs', $2, $3, 'Manual weekly audit triggered via Admin Panel');`,
        [
          auth.username || 'admin',
          String(auditResult.auditRunId),
          JSON.stringify(auditResult),
        ]
      );
      return NextResponse.json({ ok: true, action, result: auditResult });
    }

    if (action === 'FULL_IMPORT') {
      const importResult = await runFullHistoricalImport({
        forceReplaceOverrides: Boolean(body.forceReplaceOverrides),
      });
      await db.query(
        `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, new_values, reason)
         VALUES ($1, 'TRIGGER_FULL_IMPORT', 'data_import_runs', $2, $3, $4);`,
        [
          auth.username || 'admin',
          String(importResult.runId),
          JSON.stringify(importResult),
          body.forceReplaceOverrides
            ? 'Full historical import with explicit override replacement'
            : 'Idempotent full historical import preserving manual overrides',
        ]
      );
      return NextResponse.json({ ok: true, action, result: importResult });
    }

    // Default: DAILY_SYNC
    const syncResult = await runDailySync({ forceWeeklyAudit: false });
    await db.query(
      `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, new_values, reason)
       VALUES ($1, 'TRIGGER_DAILY_SYNC', 'data_import_runs', $2, $3, 'Manual daily resynchronization triggered via Admin Panel');`,
      [
        auth.username || 'admin',
        String(syncResult.syncRunId),
        JSON.stringify({
          matchesProcessed: syncResult.importSummary.matchesProcessed,
          matchesSkippedManualOverride:
            syncResult.importSummary.matchesSkippedManualOverride,
          fdoStatus: syncResult.fdoStatus,
          apiFootballStatus: syncResult.apiFootballStatus,
        }),
      ]
    );

    return NextResponse.json({ ok: true, action, result: syncResult });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Sync operation failed' },
      { status: 500 }
    );
  }
}
