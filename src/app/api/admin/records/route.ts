import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  const auth = await getAuthenticatedAdmin();
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'Unauthorized: Administrator session required.' },
      { status: 401 }
    );
  }

  const actor = auth.username || 'admin';
  const db = await getDb();

  try {
    const body = (await request.json()) as {
      operation:
        | 'OVERRIDE_MATCH'
        | 'OVERRIDE_PLAYER'
        | 'IMPORT_TRANSFERS_JSON'
        | 'RELEASE_OVERRIDE'
        | 'RESOLVE_ISSUE';
      payload: Record<string, unknown>;
      reason?: string;
    };

    const reason =
      (body.reason || '').trim() ||
      'Verified historical correction by administrator';

    if (body.operation === 'OVERRIDE_MATCH') {
      const matchId = Number(body.payload.matchId);
      const attendance =
        body.payload.attendance !== undefined &&
        body.payload.attendance !== '' &&
        body.payload.attendance !== null
          ? Number(body.payload.attendance)
          : null;
      const referee =
        typeof body.payload.referee === 'string' &&
        body.payload.referee.trim() !== ''
          ? body.payload.referee.trim()
          : null;
      const venue =
        typeof body.payload.venue === 'string' &&
        body.payload.venue.trim() !== ''
          ? body.payload.venue.trim()
          : null;

      const existingRes = await db.query<{
        id: number;
        external_id: string;
        attendance: number | null;
        referee: string | null;
        venue: string | null;
      }>(
        `SELECT id, external_id, attendance, referee, venue FROM matches WHERE id = $1;`,
        [matchId]
      );

      if (existingRes.rows.length === 0) {
        return NextResponse.json(
          { error: `Match ID ${matchId} not found.` },
          { status: 404 }
        );
      }

      const prev = existingRes.rows[0];
      const nextAttendance =
        attendance !== null ? attendance : prev.attendance;
      const nextReferee = referee !== null ? referee : prev.referee;
      const nextVenue = venue !== null ? venue : prev.venue;

      await db.query(
        `UPDATE matches
         SET attendance = $1,
             referee = $2,
             venue = $3,
             is_manual_override = TRUE,
             last_synced_at = NOW()
         WHERE id = $4;`,
        [nextAttendance, nextReferee, nextVenue, matchId]
      );

      const newValues = {
        attendance: nextAttendance,
        referee: nextReferee,
        venue: nextVenue,
      };
      const oldValues = {
        attendance: prev.attendance,
        referee: prev.referee,
        venue: prev.venue,
      };

      await db.query(
        `INSERT INTO manual_overrides (
           entity_table, entity_key, field_name, override_value_json,
           previous_value_json, reason, created_by, is_active
         )
         VALUES ('matches', $1, 'metadata_bundle', $2, $3, $4, $5, TRUE)
         ON CONFLICT (entity_table, entity_key, field_name)
         DO UPDATE SET
           override_value_json = EXCLUDED.override_value_json,
           previous_value_json = EXCLUDED.previous_value_json,
           reason = EXCLUDED.reason,
           created_by = EXCLUDED.created_by,
           is_active = TRUE,
           updated_at = NOW();`,
        [
          prev.external_id,
          JSON.stringify(newValues),
          JSON.stringify(oldValues),
          reason,
          actor,
        ]
      );

      await db.query(
        `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, old_values, new_values, reason)
         VALUES ($1, 'MANUAL_OVERRIDE_MATCH', 'matches', $2, $3, $4, $5);`,
        [
          actor,
          prev.external_id,
          JSON.stringify(oldValues),
          JSON.stringify(newValues),
          reason,
        ]
      );

      return NextResponse.json({
        ok: true,
        message: `Match #${matchId} (${prev.external_id}) updated with protected manual override.`,
      });
    }

    if (body.operation === 'OVERRIDE_PLAYER') {
      const slug = String(body.payload.slug || '').trim();
      const allTimeApps =
        body.payload.all_time_rm_apps !== undefined &&
        body.payload.all_time_rm_apps !== ''
          ? Number(body.payload.all_time_rm_apps)
          : null;
      const allTimeGoals =
        body.payload.all_time_rm_goals !== undefined &&
        body.payload.all_time_rm_goals !== ''
          ? Number(body.payload.all_time_rm_goals)
          : null;
      const allTimeTrophies =
        body.payload.all_time_rm_trophies !== undefined &&
        body.payload.all_time_rm_trophies !== ''
          ? Number(body.payload.all_time_rm_trophies)
          : null;

      const existingRes = await db.query<{
        id: number;
        slug: string;
        all_time_rm_apps: number | null;
        all_time_rm_goals: number | null;
        all_time_rm_trophies: number | null;
      }>(
        `SELECT id, slug, all_time_rm_apps, all_time_rm_goals, all_time_rm_trophies
         FROM players WHERE slug = $1;`,
        [slug]
      );

      if (existingRes.rows.length === 0) {
        return NextResponse.json(
          { error: `Player '${slug}' not found.` },
          { status: 404 }
        );
      }

      const prev = existingRes.rows[0];
      const nextApps =
        allTimeApps !== null ? allTimeApps : prev.all_time_rm_apps;
      const nextGoals =
        allTimeGoals !== null ? allTimeGoals : prev.all_time_rm_goals;
      const nextTrophies =
        allTimeTrophies !== null
          ? allTimeTrophies
          : prev.all_time_rm_trophies;

      await db.query(
        `UPDATE players
         SET all_time_rm_apps = $1,
             all_time_rm_goals = $2,
             all_time_rm_trophies = $3,
             is_manual_override = TRUE,
             last_updated_at = NOW()
         WHERE slug = $4;`,
        [nextApps, nextGoals, nextTrophies, slug]
      );

      const newValues = {
        all_time_rm_apps: nextApps,
        all_time_rm_goals: nextGoals,
        all_time_rm_trophies: nextTrophies,
      };
      const oldValues = {
        all_time_rm_apps: prev.all_time_rm_apps,
        all_time_rm_goals: prev.all_time_rm_goals,
        all_time_rm_trophies: prev.all_time_rm_trophies,
      };

      await db.query(
        `INSERT INTO manual_overrides (
           entity_table, entity_key, field_name, override_value_json,
           previous_value_json, reason, created_by, is_active
         )
         VALUES ('players', $1, 'career_totals_bundle', $2, $3, $4, $5, TRUE)
         ON CONFLICT (entity_table, entity_key, field_name)
         DO UPDATE SET
           override_value_json = EXCLUDED.override_value_json,
           previous_value_json = EXCLUDED.previous_value_json,
           reason = EXCLUDED.reason,
           created_by = EXCLUDED.created_by,
           is_active = TRUE,
           updated_at = NOW();`,
        [
          slug,
          JSON.stringify(newValues),
          JSON.stringify(oldValues),
          reason,
          actor,
        ]
      );

      await db.query(
        `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, old_values, new_values, reason)
         VALUES ($1, 'MANUAL_OVERRIDE_PLAYER', 'players', $2, $3, $4, $5);`,
        [
          actor,
          slug,
          JSON.stringify(oldValues),
          JSON.stringify(newValues),
          reason,
        ]
      );

      return NextResponse.json({
        ok: true,
        message: `Player '${slug}' updated with protected manual override.`,
      });
    }

    if (body.operation === 'IMPORT_TRANSFERS_JSON') {
      const rawJson = String(body.payload.jsonText || '[]');
      const items = JSON.parse(rawJson) as Array<{
        external_id: string;
        player_name: string;
        player_position?: string;
        season_code: string;
        transfer_year: number;
        transfer_date?: string | null;
        direction: 'IN' | 'OUT';
        previous_club: string;
        destination_club: string;
        fee_eur?: number | null;
        fee_display?: string;
        transfer_type?: string;
        era_category?: string;
        source_name?: string;
      }>;

      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { error: 'Provide a non-empty JSON array of transfer records.' },
          { status: 400 }
        );
      }

      let importedCount = 0;
      for (const item of items) {
        if (!item.external_id || !item.player_name || !item.season_code) {
          continue;
        }
        const feeEur =
          item.fee_eur === undefined || item.fee_eur === null
            ? null
            : item.fee_eur;
        const feeDisplay =
          item.fee_display ||
          (feeEur === null
            ? 'Undisclosed / Unknown'
            : `€${(feeEur / 1_000_000).toFixed(1)}M`);

        await db.query(
          `INSERT INTO transfers (
             external_id, player_name, player_position, season_code,
             transfer_year, transfer_date, direction, previous_club,
             destination_club, fee_eur, fee_display, transfer_type,
             era_category, source_name, verification_status, is_manual_override
           )
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'Verified',TRUE)
           ON CONFLICT (external_id) DO UPDATE SET
             player_name = EXCLUDED.player_name,
             fee_eur = EXCLUDED.fee_eur,
             fee_display = EXCLUDED.fee_display,
             source_name = EXCLUDED.source_name,
             is_manual_override = TRUE;`,
          [
            item.external_id,
            item.player_name,
            item.player_position || 'MID',
            item.season_code,
            item.transfer_year || 2024,
            item.transfer_date || null,
            item.direction || 'IN',
            item.previous_club || 'Unknown Club',
            item.destination_club || 'Real Madrid CF',
            feeEur,
            feeDisplay,
            item.transfer_type || 'Permanent',
            item.era_category || 'Modern Archive (2011–Present)',
            item.source_name || 'Admin Verified Import',
          ]
        );
        importedCount++;
      }

      await db.query(
        `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, new_values, reason)
         VALUES ($1, 'IMPORT_VERIFIED_JSON', 'transfers', $2, $3, $4);`,
        [
          actor,
          `batch_${importedCount}`,
          JSON.stringify({ importedCount }),
          reason,
        ]
      );

      return NextResponse.json({
        ok: true,
        message: `Imported ${importedCount} verified transfer record(s) into PostgreSQL.`,
      });
    }

    if (body.operation === 'RELEASE_OVERRIDE') {
      const overrideId = Number(body.payload.overrideId);
      const ovRes = await db.query<{
        id: number;
        entity_table: string;
        entity_key: string;
      }>(
        `UPDATE manual_overrides SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id, entity_table, entity_key;`,
        [overrideId]
      );

      if (ovRes.rows.length > 0) {
        const ov = ovRes.rows[0];
        if (ov.entity_table === 'matches') {
          await db.query(
            `UPDATE matches SET is_manual_override = FALSE WHERE external_id = $1;`,
            [ov.entity_key]
          );
        } else if (ov.entity_table === 'players') {
          await db.query(
            `UPDATE players SET is_manual_override = FALSE WHERE slug = $1;`,
            [ov.entity_key]
          );
        }

        await db.query(
          `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, reason)
           VALUES ($1, 'RELEASE_MANUAL_OVERRIDE', $2, $3, $4);`,
          [actor, ov.entity_table, ov.entity_key, reason]
        );
      }

      return NextResponse.json({
        ok: true,
        message: `Manual override #${overrideId} deactivated.`,
      });
    }

    if (body.operation === 'RESOLVE_ISSUE') {
      const issueId = Number(body.payload.issueId);
      await db.query(
        `UPDATE data_quality_issues
         SET status = 'RESOLVED_BY_ADMIN', resolved_at = NOW()
         WHERE id = $1;`,
        [issueId]
      );
      await db.query(
        `INSERT INTO admin_audit_log (actor, action, entity_table, entity_id, reason)
         VALUES ($1, 'RESOLVE_DATA_QUALITY_ISSUE', 'data_quality_issues', $2, $3);`,
        [actor, String(issueId), reason]
      );
      return NextResponse.json({
        ok: true,
        message: `Data quality issue #${issueId} marked as resolved.`,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported admin operation.' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Admin record operation failed' },
      { status: 500 }
    );
  }
}
