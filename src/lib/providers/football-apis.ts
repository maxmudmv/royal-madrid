import { ParsedMatch } from '../parsers/openfootball-parser';
import { getDb } from '../db';

export interface ProviderSyncResult {
  providerCode: string;
  fetchedCount: number;
  matches: ParsedMatch[];
  quotaRemaining: number | null;
  statusMessage: string;
}

async function fetchWithBackoff(
  url: string,
  headers: Record<string, string>,
  maxRetries = 2
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, {
        headers,
        cache: 'no-store',
      });
      // Do not retry 401/403/404 client errors (permanently invalid requests)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }
      if (response.ok || attempt >= maxRetries) {
        return response;
      }
    } catch (err) {
      if (attempt >= maxRetries) throw err;
    }
    attempt++;
    const delayMs = 1000 * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

/**
 * Server-side adapter for football-data.org v4 Free Tier
 * Team ID 86 = Real Madrid CF
 */
export async function fetchFootballDataOrgCompletedMatches(): Promise<ProviderSyncResult> {
  const apiKey = process.env.FOOTBALL_DATA_ORG_API_KEY?.trim();
  if (!apiKey) {
    return {
      providerCode: 'FOOTBALL_DATA_ORG',
      fetchedCount: 0,
      matches: [],
      quotaRemaining: null,
      statusMessage:
        'Skipped remote fetch (FOOTBALL_DATA_ORG_API_KEY not configured; using verified OpenFootball & local archive).',
    };
  }

  try {
    const res = await fetchWithBackoff(
      'https://api.football-data.org/v4/teams/86/matches?status=FINISHED&limit=30',
      { 'X-Auth-Token': apiKey }
    );

    const remainingHeader = res.headers.get('x-requests-available-minute');
    const quotaRemaining = remainingHeader ? parseInt(remainingHeader, 10) : null;

    if (!res.ok) {
      return {
        providerCode: 'FOOTBALL_DATA_ORG',
        fetchedCount: 0,
        matches: [],
        quotaRemaining,
        statusMessage: `HTTP ${res.status} from football-data.org Free Tier`,
      };
    }

    const payload = (await res.json()) as {
      matches?: Array<{
        id: number;
        utcDate: string;
        matchday?: number;
        stage?: string;
        competition?: { code?: string; name?: string };
        season?: { startDate?: string; endDate?: string };
        homeTeam?: { id?: number; name?: string };
        awayTeam?: { id?: number; name?: string };
        score?: {
          fullTime?: { home?: number | null; away?: number | null };
          halfTime?: { home?: number | null; away?: number | null };
        };
      }>;
    };

    const parsed: ParsedMatch[] = [];
    for (const m of payload.matches || []) {
      const ftH = m.score?.fullTime?.home;
      const ftA = m.score?.fullTime?.away;
      if (ftH === null || ftH === undefined || ftA === null || ftA === undefined) {
        continue;
      }
      const matchDate = m.utcDate.slice(0, 10);
      const startYear = m.season?.startDate
        ? parseInt(m.season.startDate.slice(0, 4), 10)
        : 2025;
      const seasonCode = `${startYear}/${String(startYear + 1).slice(-2)}`;
      const compCode =
        m.competition?.code === 'CL'
          ? 'UCL'
          : m.competition?.code === 'PD'
          ? 'LA_LIGA'
          : 'OTHER';
      if (compCode === 'OTHER') continue;

      const rmIsHome = m.homeTeam?.id === 86 || /Real Madrid/i.test(m.homeTeam?.name || '');
      const homeTeam = rmIsHome ? 'Real Madrid CF' : m.homeTeam?.name || 'Opponent';
      const awayTeam = !rmIsHome ? 'Real Madrid CF' : m.awayTeam?.name || 'Opponent';
      const rmGoals = rmIsHome ? ftH : ftA;
      const opponentGoals = rmIsHome ? ftA : ftH;

      parsed.push({
        externalId: `fdo_${m.id}`,
        seasonCode,
        competitionCode: compCode,
        stage: m.stage || 'Regular Season',
        matchday: m.matchday ? `Matchday ${m.matchday}` : null,
        matchDate,
        kickoffTime: m.utcDate.slice(11, 16),
        homeTeam,
        awayTeam,
        venue: rmIsHome ? 'Estadio Santiago Bernabéu' : null,
        city: rmIsHome ? 'Madrid' : null,
        attendance: null,
        referee: null,
        homeScore: ftH,
        awayScore: ftA,
        htHomeScore: m.score?.halfTime?.home ?? null,
        htAwayScore: m.score?.halfTime?.away ?? null,
        aetHomeScore: null,
        aetAwayScore: null,
        penHomeScore: null,
        penAwayScore: null,
        wentToExtraTime: false,
        wentToPenalties: false,
        rmIsHome,
        rmGoals,
        opponentGoals,
        rmResult: rmGoals > opponentGoals ? 'W' : rmGoals < opponentGoals ? 'L' : 'D',
        hasDetailedEvents: false,
        hasLineups: false,
        completenessStatus: 'Partial',
        sourceCitation: 'football-data.org v4 Free Tier API',
        events: [],
        lineups: [],
        substitutions: [],
      });
    }

    const db = await getDb();
    await db.query(
      `UPDATE data_sources SET last_checked_at = NOW(), last_sync_at = NOW() WHERE code = 'FOOTBALL_DATA_ORG';`
    );

    return {
      providerCode: 'FOOTBALL_DATA_ORG',
      fetchedCount: parsed.length,
      matches: parsed,
      quotaRemaining,
      statusMessage: `Fetched ${parsed.length} completed matches from football-data.org Free Tier.`,
    };
  } catch (err) {
    return {
      providerCode: 'FOOTBALL_DATA_ORG',
      fetchedCount: 0,
      matches: [],
      quotaRemaining: null,
      statusMessage: `Network/sandbox restriction when contacting football-data.org: ${(err as Error).message}`,
    };
  }
}

/**
 * Server-side adapter for API-Football v3 Free Plan (100 req/day, 10 req/min)
 * Team ID 541 = Real Madrid CF
 */
export async function fetchApiFootballCompletedMatches(): Promise<ProviderSyncResult> {
  const apiKey = process.env.API_FOOTBALL_KEY?.trim();
  if (!apiKey) {
    return {
      providerCode: 'API_FOOTBALL_V3',
      fetchedCount: 0,
      matches: [],
      quotaRemaining: 100,
      statusMessage:
        'Skipped remote fetch (API_FOOTBALL_KEY not configured; 100/100 free daily quota preserved).',
    };
  }

  try {
    const res = await fetchWithBackoff(
      'https://v3.football.api-sports.io/fixtures?team=541&status=FT&last=15',
      { 'x-apisports-key': apiKey }
    );
    const remaining = res.headers.get('x-ratelimit-requests-remaining');
    const quotaRemaining = remaining ? parseInt(remaining, 10) : null;

    const db = await getDb();
    if (quotaRemaining !== null) {
      await db.query(
        `UPDATE data_sources 
         SET daily_quota_used = GREATEST(0, COALESCE(daily_quota_limit, 100) - $1),
             last_checked_at = NOW(),
             last_sync_at = NOW()
         WHERE code = 'API_FOOTBALL_V3';`,
        [quotaRemaining]
      );
    }

    return {
      providerCode: 'API_FOOTBALL_V3',
      fetchedCount: 0,
      matches: [],
      quotaRemaining,
      statusMessage: res.ok
        ? `API-Football Free Plan reachable (Remaining daily quota: ${quotaRemaining ?? 'unknown'}).`
        : `HTTP ${res.status} from API-Football.`,
    };
  } catch (err) {
    return {
      providerCode: 'API_FOOTBALL_V3',
      fetchedCount: 0,
      matches: [],
      quotaRemaining: null,
      statusMessage: `Network/sandbox restriction when contacting API-Football: ${(err as Error).message}`,
    };
  }
}
