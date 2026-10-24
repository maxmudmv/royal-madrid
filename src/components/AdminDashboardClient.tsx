'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import {
  Shield,
  RefreshCw,
  Database,
  AlertTriangle,
  FileCode,
  Edit3,
  History,
  LogOut,
  CheckCircle2,
  Lock,
  Unlock,
} from 'lucide-react';

interface AdminDashboardProps {
  authenticated: boolean;
  username?: string;
  dashboardData?: {
    sources: Array<{
      id: number;
      code: string;
      name: string;
      provider_type: string;
      base_url: string;
      license: string;
      free_tier_limits: string;
      daily_quota_limit: number | null;
      daily_quota_used: number | null;
      status: string;
      priority_rank: number;
      last_checked_at: string | null;
      last_sync_at: string | null;
      notes: string | null;
    }>;
    coverage: Array<{
      id: number;
      competition_code: string;
      competition_name: string;
      season_code: string;
      available_fields: string[];
      missing_fields: string[];
      source_name: string;
      license: string;
      completeness_status: string;
      matches_covered: number | null;
      matches_expected: number | null;
      last_checked_date: string;
      known_gaps: string | null;
    }>;
    importRuns: Array<{
      id: number;
      run_type: string;
      source_name: string;
      status: string;
      records_processed: number;
      records_inserted: number;
      records_skipped_override: number;
      errors_count: number;
      summary: string | null;
      started_at: string;
      completed_at: string | null;
    }>;
    syncLogs: Array<{
      id: number;
      import_run_id: number | null;
      log_level: string;
      component: string;
      message: string;
      created_at: string;
    }>;
    issues: Array<{
      id: number;
      issue_code: string;
      issue_type: string;
      severity: string;
      entity_table: string;
      entity_ref: string;
      description: string;
      source_a_value: string | null;
      source_b_value: string | null;
      resolution_policy: string;
      status: string;
      detected_at: string;
    }>;
    overrides: Array<{
      id: number;
      entity_table: string;
      entity_key: string;
      field_name: string;
      override_value_json: unknown;
      previous_value_json: unknown;
      reason: string;
      created_by: string;
      is_active: boolean;
      created_at: string;
    }>;
    auditLog: Array<{
      id: number;
      actor: string;
      action: string;
      entity_table: string;
      entity_id: string;
      old_values: unknown;
      new_values: unknown;
      reason: string;
      created_at: string;
    }>;
  };
}

export function AdminDashboardClient({
  authenticated,
  username,
  dashboardData,
}: AdminDashboardProps) {
  const router = useRouter();

  // Login State
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Feedback Banner
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Manual Match Override Form
  const [matchIdInput, setMatchIdInput] = useState('1');
  const [matchAttendanceInput, setMatchAttendanceInput] = useState('81044');
  const [matchRefereeInput, setMatchRefereeInput] = useState('');
  const [matchVenueInput, setMatchVenueInput] = useState('');
  const [matchReasonInput, setMatchReasonInput] = useState(
    'Verified against official UEFA/RFEF match delegate report'
  );

  // Manual Player Override Form
  const [playerSlugInput, setPlayerSlugInput] = useState('cristiano-ronaldo');
  const [playerAppsInput, setPlayerAppsInput] = useState('438');
  const [playerGoalsInput, setPlayerGoalsInput] = useState('450');
  const [playerTrophiesInput, setPlayerTrophiesInput] = useState('16');
  const [playerReasonInput, setPlayerReasonInput] = useState(
    'Verified against official Real Madrid CF historical registry (450 goals in 438 official appearances)'
  );

  // JSON Transfer Import Form
  const [jsonImportText, setJsonImportText] = useState(
    JSON.stringify(
      [
        {
          external_id: 'rm-transfer-2024-endrick-in',
          player_name: 'Endrick Felipe',
          player_position: 'FWD',
          season_code: '2024/25',
          transfer_year: 2024,
          transfer_date: '2024-07-21',
          direction: 'IN',
          previous_club: 'SE Palmeiras',
          destination_club: 'Real Madrid CF',
          fee_eur: null,
          fee_display: 'Undisclosed / Unknown',
          transfer_type: 'Permanent',
          era_category: 'Modern Archive (2011–Present)',
          source_name: 'Real Madrid Official Communiqué',
        },
      ],
      null,
      2
    )
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Authentication failed');
      } else {
        router.refresh();
      }
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.refresh();
  };

  const triggerSyncAction = async (
    action: 'DAILY_SYNC' | 'WEEKLY_AUDIT' | 'FULL_IMPORT'
  ) => {
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, forceReplaceOverrides: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Sync failed');
      } else {
        setStatusMessage(
          `Executed ${action} successfully. Manual overrides were preserved.`
        );
        router.refresh();
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitMatchOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'OVERRIDE_MATCH',
          payload: {
            matchId: Number(matchIdInput),
            attendance: matchAttendanceInput ? Number(matchAttendanceInput) : null,
            referee: matchRefereeInput,
            venue: matchVenueInput,
          },
          reason: matchReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to apply match override');
      } else {
        setStatusMessage(data.message);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitPlayerOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'OVERRIDE_PLAYER',
          payload: {
            slug: playerSlugInput,
            all_time_rm_apps: Number(playerAppsInput),
            all_time_rm_goals: Number(playerGoalsInput),
            all_time_rm_trophies: Number(playerTrophiesInput),
          },
          reason: playerReasonInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Failed to apply player override');
      } else {
        setStatusMessage(data.message);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const submitJsonImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/admin/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'IMPORT_TRANSFERS_JSON',
          payload: { jsonText: jsonImportText },
          reason: 'Verified JSON transfer import via Admin Panel',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'JSON import failed');
      } else {
        setStatusMessage(data.message);
        router.refresh();
      }
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const releaseOverride = async (overrideId: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'RELEASE_OVERRIDE',
          payload: { overrideId },
          reason: 'Administrator explicitly released manual override protection',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  // Unauthenticated View: Server-Backed Login Gate
  if (!authenticated || !dashboardData) {
    return (
      <div className="mx-auto max-w-md py-16">
        <div className="rounded border border-[#C9A64B]/60 bg-[#111111] p-8 shadow-2xl">
          <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
            <Lock className="h-4 w-4" />
            Protected Server-Side Access
          </div>
          <h1 className="mt-2 font-serif text-3xl font-bold text-[#F1EEE7]">
            ROYAL MADRID ADMIN
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#AAA69C]">
            Public visitors do not need accounts. Only the Archive Administrator Panel requires server-side HMAC session authentication.
          </p>

          {loginError && (
            <div className="mt-4 rounded border border-[#6B2E2E] bg-[#291414] p-3 text-xs text-[#E06C75]">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-user"
                className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]"
              >
                Administrator Username
              </label>
              <input
                id="admin-user"
                type="text"
                required
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3.5 py-2 text-sm text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-pass"
                className="block text-[11px] font-semibold uppercase tracking-wider text-[#AAA69C]"
              >
                Administrator Password
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="Enter ADMIN_PASSWORD from .env"
                className="mt-1.5 w-full rounded border border-[#3B321F] bg-[#171717] px-3.5 py-2 text-sm text-[#F1EEE7] focus:border-[#C9A64B] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded border border-[#C9A64B] bg-[#C9A64B] py-2.5 text-xs font-semibold uppercase tracking-widest text-[#080808] transition hover:bg-[#E6D3A0] disabled:opacity-50"
            >
              {loading ? 'Verifying Server Session...' : 'Sign In to Admin Panel'}
            </button>
          </form>

          <div className="mt-6 border-t border-[#3B321F]/60 pt-4 text-[11px] text-[#AAA69C]">
            Configured via <code className="text-[#E6D3A0]">ADMIN_USERNAME</code> and{' '}
            <code className="text-[#E6D3A0]">ADMIN_PASSWORD</code> environment variables (default local dev: <code className="text-[#C9A64B]">admin</code> / <code className="text-[#C9A64B]">RoyalMadridAdmin!2026</code>).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top Admin Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded border border-[#C9A64B]/50 bg-[#111111] p-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C9A64B]">
            <Shield className="h-4 w-4" />
            Authenticated Server Session · User: {username}
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold text-[#F1EEE7]">
            ARCHIVE GOVERNANCE &amp; DATA ENGINEERING PANEL
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => triggerSyncAction('DAILY_SYNC')}
            className="inline-flex items-center gap-1.5 rounded border border-[#C9A64B] bg-[#C9A64B] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#080808] hover:bg-[#E6D3A0] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Trigger Daily Sync
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => triggerSyncAction('WEEKLY_AUDIT')}
            className="inline-flex items-center gap-1.5 rounded border border-[#3B321F] bg-[#171717] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#E6D3A0] hover:border-[#C9A64B] disabled:opacity-50"
          >
            <Database className="h-3.5 w-3.5" />
            Run Weekly Audit
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded border border-[#6B2E2E] bg-[#291414] px-3.5 py-2 text-xs font-semibold text-[#E06C75] hover:bg-[#3B1B1B]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {statusMessage && (
        <div className="flex items-center gap-2.5 rounded border border-[#2E6B3E] bg-[#14291A] p-4 text-xs text-[#6CC070]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded border border-[#6B2E2E] bg-[#291414] p-4 text-xs text-[#E06C75]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Data Sources Status & Free-Tier Quota Usage */}
      <section className="rounded border border-[#3B321F] bg-[#111111] p-6">
        <h2 className="font-serif text-xl font-bold text-[#F1EEE7]">
          1. Football Data Sources, Licenses &amp; Free-Tier Quota Status
        </h2>
        <p className="mt-1 text-xs text-[#AAA69C]">
          Real Madrid data sources ordered by conflict-resolution priority rank. All providers operate strictly within free-tier quotas.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Source Name</th>
                <th className="px-4 py-2.5">Type &amp; License</th>
                <th className="px-4 py-2.5">Free-Tier Rate Limits</th>
                <th className="px-4 py-2.5 text-right">Daily Quota Used</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3B321F]/40">
              {dashboardData.sources.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono font-bold text-[#C9A64B]">
                    #{s.priority_rank}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[#F1EEE7]">{s.name}</p>
                    <p className="text-[10px] text-[#AAA69C]">{s.notes}</p>
                  </td>
                  <td className="px-4 py-3 text-[#AAA69C]">
                    <span className="text-[#E6D3A0]">{s.provider_type}</span> ·{' '}
                    {s.license}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-[#AAA69C]">
                    {s.free_tier_limits}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#F1EEE7]">
                    {s.daily_quota_limit
                      ? `${s.daily_quota_used ?? 0} / ${s.daily_quota_limit}`
                      : 'Unlimited (Local Repo)'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Conflict Reports & Incomplete Coverage Issues */}
      <section className="rounded border border-[#3B321F] bg-[#111111] p-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[#C9A64B]" />
          <h2 className="font-serif text-xl font-bold text-[#F1EEE7]">
            2. Source Conflicts &amp; Incomplete Coverage Registry
          </h2>
        </div>
        <p className="mt-1 text-xs text-[#AAA69C]">
          Discrepancies between providers (e.g., Cristiano Ronaldo’s disputed 2010 free-kick goal vs Real Sociedad) and documented free-dataset coverage gaps.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {dashboardData.issues.map((iss) => (
            <div
              key={iss.id}
              className="flex flex-col justify-between rounded border border-[#3B321F] bg-[#171717] p-4 text-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#C9A64B]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#E6D3A0]">
                    {iss.issue_type}
                  </span>
                  <StatusBadge status={iss.status} />
                </div>
                <p className="mt-2 font-mono text-[11px] text-[#C9A64B]">
                  Ref: {iss.entity_table} · {iss.entity_ref}
                </p>
                <p className="mt-1.5 leading-relaxed text-[#F1EEE7]">
                  {iss.description}
                </p>
                {(iss.source_a_value || iss.source_b_value) && (
                  <div className="mt-3 space-y-1 rounded border border-[#3B321F] bg-[#111111] p-2.5 text-[11px]">
                    {iss.source_a_value && (
                      <p className="text-[#6CC070]">
                        <strong>Source A:</strong> {iss.source_a_value}
                      </p>
                    )}
                    {iss.source_b_value && (
                      <p className="text-[#E6D3A0]">
                        <strong>Source B:</strong> {iss.source_b_value}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-3 border-t border-[#3B321F]/60 pt-2.5 text-[11px] text-[#AAA69C]">
                <strong>Resolution Policy:</strong> {iss.resolution_policy}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Manual Record Creation, Editing & CSV/JSON Import */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form A: Protected Match Override */}
        <form
          onSubmit={submitMatchOverride}
          className="rounded border border-[#3B321F] bg-[#111111] p-6"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A64B]">
            <Edit3 className="h-4 w-4" />
            Manual Match Override (Protected)
          </div>
          <p className="mt-1 text-xs text-[#AAA69C]">
            Edits a match record and locks it in `manual_overrides` so daily API/OpenFootball resyncs never overwrite it.
          </p>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#AAA69C]">
                Match Database ID (e.g., 1)
              </label>
              <input
                type="number"
                required
                value={matchIdInput}
                onChange={(e) => setMatchIdInput(e.target.value)}
                className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 text-[#F1EEE7]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#AAA69C]">
                Verified Official Attendance
              </label>
              <input
                type="number"
                value={matchAttendanceInput}
                onChange={(e) => setMatchAttendanceInput(e.target.value)}
                className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 text-[#F1EEE7]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#AAA69C]">
                Verified Referee Name (Optional)
              </label>
              <input
                type="text"
                value={matchRefereeInput}
                onChange={(e) => setMatchRefereeInput(e.target.value)}
                placeholder="e.g., Szymon Marciniak"
                className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 text-[#F1EEE7]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#AAA69C]">
                Verified Venue (Optional)
              </label>
              <input
                type="text"
                value={matchVenueInput}
                onChange={(e) => setMatchVenueInput(e.target.value)}
                placeholder="e.g., Estadio Santiago Bernabéu"
                className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 text-[#F1EEE7]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#AAA69C]">
                Audit Reason &amp; Source Citation
              </label>
              <input
                type="text"
                required
                value={matchReasonInput}
                onChange={(e) => setMatchReasonInput(e.target.value)}
                className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 text-[#F1EEE7]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded border border-[#C9A64B] bg-[#C9A64B] py-2 font-semibold uppercase tracking-wider text-[#080808] hover:bg-[#E6D3A0]"
            >
              Save Protected Match Override
            </button>
          </div>
        </form>

        {/* Form B: Protected Player Override */}
        <form
          onSubmit={submitPlayerOverride}
          className="rounded border border-[#3B321F] bg-[#111111] p-6"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A64B]">
            <Edit3 className="h-4 w-4" />
            Manual Player Career Override
          </div>
          <p className="mt-1 text-xs text-[#AAA69C]">
            Updates verified All-Time Real Madrid Career Totals and protects the record against automated overwrites.
          </p>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <label className="block text-[11px] text-[#AAA69C]">
                Player Slug
              </label>
              <input
                type="text"
                required
                value={playerSlugInput}
                onChange={(e) => setPlayerSlugInput(e.target.value)}
                className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 font-mono text-[#F1EEE7]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#AAA69C]">
                  RM Apps
                </label>
                <input
                  type="number"
                  required
                  value={playerAppsInput}
                  onChange={(e) => setPlayerAppsInput(e.target.value)}
                  className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-2.5 py-1.5 font-mono text-[#F1EEE7]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#AAA69C]">
                  RM Goals
                </label>
                <input
                  type="number"
                  required
                  value={playerGoalsInput}
                  onChange={(e) => setPlayerGoalsInput(e.target.value)}
                  className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-2.5 py-1.5 font-mono text-[#F1EEE7]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#AAA69C]">
                  Trophies
                </label>
                <input
                  type="number"
                  required
                  value={playerTrophiesInput}
                  onChange={(e) => setPlayerTrophiesInput(e.target.value)}
                  className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-2.5 py-1.5 font-mono text-[#F1EEE7]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-[#AAA69C]">
                Audit Reason &amp; Source Citation
              </label>
              <input
                type="text"
                required
                value={playerReasonInput}
                onChange={(e) => setPlayerReasonInput(e.target.value)}
                className="mt-1 w-full rounded border border-[#3B321F] bg-[#171717] px-3 py-1.5 text-[#F1EEE7]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded border border-[#C9A64B] bg-[#C9A64B] py-2 font-semibold uppercase tracking-wider text-[#080808] hover:bg-[#E6D3A0]"
            >
              Save Protected Player Override
            </button>
          </div>
        </form>

        {/* Form C: Verified JSON Batch Import */}
        <form
          onSubmit={submitJsonImport}
          className="rounded border border-[#3B321F] bg-[#111111] p-6"
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C9A64B]">
            <FileCode className="h-4 w-4" />
            Verified JSON Batch Import
          </div>
          <p className="mt-1 text-xs text-[#AAA69C]">
            Import verified transfer records. Unknown fees remain `null` (&quot;Undisclosed / Unknown&quot;).
          </p>

          <div className="mt-4 space-y-3 text-xs">
            <textarea
              rows={8}
              value={jsonImportText}
              onChange={(e) => setJsonImportText(e.target.value)}
              className="w-full rounded border border-[#3B321F] bg-[#171717] p-2.5 font-mono text-[11px] text-[#E6D3A0]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded border border-[#C9A64B] bg-[#171717] py-2 font-semibold uppercase tracking-wider text-[#E6D3A0] hover:bg-[#C9A64B] hover:text-[#080808]"
            >
              Import Verified JSON Batch
            </button>
          </div>
        </form>
      </section>

      {/* 4. Active Manual Overrides Registry */}
      <section className="rounded border border-[#3B321F] bg-[#111111] p-6">
        <h2 className="font-serif text-xl font-bold text-[#F1EEE7]">
          4. Active Manual Overrides Registry (`manual_overrides` Table)
        </h2>
        <p className="mt-1 text-xs text-[#AAA69C]">
          Records listed with <strong className="text-[#6CC070]">Active Protection</strong> are skipped during normal daily/weekly synchronization so manual historical corrections are never lost.
        </p>

        {dashboardData.overrides.length === 0 ? (
          <p className="mt-4 text-xs text-[#AAA69C]">
            No manual overrides recorded yet. Use the forms above to lock a verified correction.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">Table &amp; Key</th>
                  <th className="px-4 py-2.5">Overridden Value</th>
                  <th className="px-4 py-2.5">Reason &amp; Author</th>
                  <th className="px-4 py-2.5">Protection Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3B321F]/40">
                {dashboardData.overrides.map((ov) => (
                  <tr key={ov.id}>
                    <td className="px-4 py-2.5 font-mono text-[#C9A64B]">
                      #{ov.id}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[#F1EEE7]">
                      {ov.entity_table} :: {ov.entity_key}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[#E6D3A0]">
                      {JSON.stringify(ov.override_value_json)}
                    </td>
                    <td className="px-4 py-2.5 text-[#AAA69C]">
                      {ov.reason} ({ov.created_by})
                    </td>
                    <td className="px-4 py-2.5">
                      {ov.is_active ? (
                        <span className="rounded border border-[#2E6B3E] bg-[#14291A] px-2 py-0.5 text-[10px] font-semibold text-[#6CC070]">
                          Protected (Survives Resync)
                        </span>
                      ) : (
                        <span className="rounded bg-[#171717] px-2 py-0.5 text-[10px] text-[#AAA69C]">
                          Released
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {ov.is_active && (
                        <button
                          type="button"
                          onClick={() => releaseOverride(ov.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-[#E06C75] hover:underline"
                        >
                          <Unlock className="h-3 w-3" />
                          Release Lock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 5. Sync Runs & Admin Audit Log */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Data Import & Sync Runs */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <h2 className="font-serif text-xl font-bold text-[#F1EEE7]">
            5. Data Synchronization Runs (`data_import_runs`)
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  <th className="px-3 py-2">Run</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Processed</th>
                  <th className="px-3 py-2 text-right">Overrides Kept</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3B321F]/40">
                {dashboardData.importRuns.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5 font-mono text-[#C9A64B]">
                      #{r.id}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-[#F1EEE7]">{r.run_type}</p>
                      <p className="text-[10px] text-[#AAA69C]">{r.summary}</p>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#F1EEE7]">
                      {r.records_processed}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-[#6CC070]">
                      {r.records_skipped_override}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin Audit Log */}
        <div className="rounded border border-[#3B321F] bg-[#111111] p-6">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#C9A64B]" />
            <h2 className="font-serif text-xl font-bold text-[#F1EEE7]">
              6. Administrator Audit Log (`admin_audit_log`)
            </h2>
          </div>
          <p className="mt-1 text-xs text-[#AAA69C]">
            Immutable ledger of what changed, who changed it, when it changed, and why.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#3B321F] bg-[#171717] text-[10px] font-semibold uppercase tracking-wider text-[#AAA69C]">
                  <th className="px-3 py-2">Timestamp</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action &amp; Target</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3B321F]/40">
                {dashboardData.auditLog.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-[#AAA69C]">
                      No manual admin mutations logged yet.
                    </td>
                  </tr>
                ) : (
                  dashboardData.auditLog.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[10px] text-[#AAA69C]">
                        {String(log.created_at).slice(0, 19)}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-[#E6D3A0]">
                        {log.actor}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-[#C9A64B]">
                          {log.action}
                        </span>
                        <p className="font-mono text-[10px] text-[#F1EEE7]">
                          {log.entity_table} :: {log.entity_id}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-[#AAA69C]">
                        {log.reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
