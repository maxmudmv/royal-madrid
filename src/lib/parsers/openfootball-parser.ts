import fs from 'fs';
import path from 'path';

export interface ParsedMatchEvent {
  isRealMadrid: boolean;
  teamName: string;
  eventType:
    | 'GOAL'
    | 'PENALTY_GOAL'
    | 'OWN_GOAL'
    | 'YELLOW_CARD'
    | 'SECOND_YELLOW_RED'
    | 'RED_CARD';
  minute: number;
  stoppageMinute: number | null;
  minuteDisplay: string;
  playerName: string;
  assistPlayerName?: string | null;
  notes?: string | null;
}

export interface ParsedLineupEntry {
  isRealMadrid: boolean;
  teamName: string;
  playerName: string;
  shirtNumber?: number | null;
  position?: string | null;
  isStarting: boolean;
  isCaptain: boolean;
  lineupOrder: number;
}

export interface ParsedSubstitution {
  isRealMadrid: boolean;
  teamName: string;
  minute: number;
  stoppageMinute: number | null;
  minuteDisplay: string;
  playerInName: string;
  playerOutName: string;
}

export interface ParsedMatch {
  externalId: string;
  seasonCode: string;
  competitionCode: string;
  stage: string | null;
  matchday: string | null;
  matchDate: string; // YYYY-MM-DD
  kickoffTime: string | null;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  city: string | null;
  attendance: number | null;
  referee: string | null;
  homeScore: number;
  awayScore: number;
  htHomeScore: number | null;
  htAwayScore: number | null;
  aetHomeScore: number | null;
  aetAwayScore: number | null;
  penHomeScore: number | null;
  penAwayScore: number | null;
  wentToExtraTime: boolean;
  wentToPenalties: boolean;
  rmIsHome: boolean;
  rmGoals: number;
  opponentGoals: number;
  rmResult: 'W' | 'D' | 'L';
  hasDetailedEvents: boolean;
  hasLineups: boolean;
  completenessStatus: 'Verified' | 'Partial';
  sourceCitation: string;
  events: ParsedMatchEvent[];
  lineups: ParsedLineupEntry[];
  substitutions: ParsedSubstitution[];
}

const MONTHS: Record<string, number> = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

export function cleanTeamName(raw: string): string {
  const withoutCountry = raw.replace(/\s*\([A-Z]{3}\)\s*$/i, '').trim();
  if (
    /^Real Madrid(\s+C\.?F\.?)?$/i.test(withoutCountry)
  ) {
    return 'Real Madrid CF';
  }
  const map: Record<string, string> = {
    'FC Barcelona': 'FC Barcelona',
    Barcelona: 'FC Barcelona',
    'Club Atlético de Madrid': 'Atlético Madrid',
    'Atlético Madrid': 'Atlético Madrid',
    'Athletic Club': 'Athletic Club',
    'Athletic Bilbao': 'Athletic Club',
    'Real Sociedad de Fútbol': 'Real Sociedad',
    'Real Sociedad': 'Real Sociedad',
    'Real Betis Balompié': 'Real Betis',
    'Real Betis': 'Real Betis',
    'RC Celta de Vigo': 'RC Celta',
    'RC Celta': 'RC Celta',
    'RCD Espanyol de Barcelona': 'RCD Espanyol',
    'Espanyol Barcelona': 'RCD Espanyol',
    'RCD Espanyol': 'RCD Espanyol',
    'Rayo Vallecano de Madrid': 'Rayo Vallecano',
    'Rayo Vallecano': 'Rayo Vallecano',
    'Deportivo Alavés': 'Deportivo Alavés',
    'CD Alavés': 'Deportivo Alavés',
    'Villarreal CF': 'Villarreal CF',
    Villarreal: 'Villarreal CF',
    'Bayern München': 'FC Bayern München',
    'FC Bayern München': 'FC Bayern München',
    'Paris Saint-Germain': 'Paris Saint-Germain',
    'Paris Saint-Germain FC': 'Paris Saint-Germain',
    'Manchester City': 'Manchester City',
    'Manchester City FC': 'Manchester City',
    'Manchester United': 'Manchester United',
    'Manchester United FC': 'Manchester United',
    'Inter': 'Inter Milan',
    'FC Internazionale Milano': 'Inter Milan',
    'Shakhtar Donetsk': 'Shakhtar Donetsk',
    'FK Shakhtar Donetsk': 'Shakhtar Donetsk',
    'Olympique Marseille': 'Olympique de Marseille',
    'Olympique de Marseille': 'Olympique de Marseille',
    'SL Benfica': 'SL Benfica',
    'Sport Lisboa e Benfica': 'SL Benfica',
  };
  return map[withoutCountry] || withoutCountry;
}

export function isFirstTeamRealMadrid(rawTeam: string): boolean {
  const trimmed = rawTeam.replace(/\s*\([A-Z]{3}\)\s*$/i, '').trim();
  if (/Castilla|Real Madrid B\b|Real Madrid C$/i.test(trimmed)) {
    return false;
  }
  return /^Real Madrid(\s+C\.?F\.?)?$/i.test(trimmed);
}

function resolveDate(
  monthStr: string,
  dayNum: number,
  explicitYear: number | null,
  seasonStartYear: number,
  seasonEndYear: number
): string {
  const month = MONTHS[monthStr] || 1;
  const year =
    explicitYear ?? (month >= 7 ? seasonStartYear : seasonEndYear);
  const mm = String(month).padStart(2, '0');
  const dd = String(dayNum).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function parseScoreDetails(scorePart: string): {
  homeScore: number;
  awayScore: number;
  htHomeScore: number | null;
  htAwayScore: number | null;
  aetHomeScore: number | null;
  aetAwayScore: number | null;
  penHomeScore: number | null;
  penAwayScore: number | null;
  wentToExtraTime: boolean;
  wentToPenalties: boolean;
} | null {
  const trimmed = scorePart.trim();
  if (trimmed.includes('[awarded]') || trimmed.includes('[cancelled]')) {
    return null;
  }

  // Case 1: Penalties + AET e.g. "4-2 pen. 1-0 a.e.t. (1-0, 1-0)" or "3-4 pen. 1-1 a.e.t. (1-1, 0-1)" or "4-2 pen. (1-1)"
  const penMatch = trimmed.match(
    /^(\d+)-(\d+)\s*pen\.?\s*(?:(\d+)-(\d+)\s*a\.e\.t\.?)?\s*(?:\(([^)]+)\))?/i
  );
  if (penMatch) {
    const penH = parseInt(penMatch[1], 10);
    const penA = parseInt(penMatch[2], 10);
    let ftH = penMatch[3] ? parseInt(penMatch[3], 10) : penH;
    let ftA = penMatch[4] ? parseInt(penMatch[4], 10) : penA;
    let htH: number | null = null;
    let htA: number | null = null;

    if (penMatch[5]) {
      const parts = penMatch[5].split(',').map((s) => s.trim());
      if (!penMatch[3] && parts[0]) {
        const m0 = parts[0].match(/^(\d+)-(\d+)$/);
        if (m0) {
          ftH = parseInt(m0[1], 10);
          ftA = parseInt(m0[2], 10);
        }
      }
      const lastPart = parts[parts.length - 1];
      const mLast = lastPart?.match(/^(\d+)-(\d+)$/);
      if (mLast && parts.length >= 2) {
        htH = parseInt(mLast[1], 10);
        htA = parseInt(mLast[2], 10);
      }
    }

    return {
      homeScore: ftH,
      awayScore: ftA,
      htHomeScore: htH,
      htAwayScore: htA,
      aetHomeScore: ftH,
      aetAwayScore: ftA,
      penHomeScore: penH,
      penAwayScore: penA,
      wentToExtraTime: true,
      wentToPenalties: true,
    };
  }

  // Case 2: Extra time e.g. "2-1 a.e.t. (1-1, 0-1)" or "3-1 a.e.t. (1-1)"
  const aetMatch = trimmed.match(
    /^(\d+)-(\d+)\s*a\.e\.t\.?\s*(?:\(([^)]+)\))?/i
  );
  if (aetMatch) {
    const aetH = parseInt(aetMatch[1], 10);
    const aetA = parseInt(aetMatch[2], 10);
    let htH: number | null = null;
    let htA: number | null = null;
    if (aetMatch[3]) {
      const parts = aetMatch[3].split(',').map((s) => s.trim());
      const last = parts[parts.length - 1]?.match(/^(\d+)-(\d+)$/);
      if (last) {
        htH = parseInt(last[1], 10);
        htA = parseInt(last[2], 10);
      }
    }
    return {
      homeScore: aetH,
      awayScore: aetA,
      htHomeScore: htH,
      htAwayScore: htA,
      aetHomeScore: aetH,
      aetAwayScore: aetA,
      penHomeScore: null,
      penAwayScore: null,
      wentToExtraTime: true,
      wentToPenalties: false,
    };
  }

  // Case 3: Standard score e.g. "2-1 (0-1)" or "0-0"
  const stdMatch = trimmed.match(/^(\d+)-(\d+)(?:\s*\((\d+)-(\d+)\))?$/);
  if (stdMatch) {
    return {
      homeScore: parseInt(stdMatch[1], 10),
      awayScore: parseInt(stdMatch[2], 10),
      htHomeScore: stdMatch[3] !== undefined ? parseInt(stdMatch[3], 10) : null,
      htAwayScore: stdMatch[4] !== undefined ? parseInt(stdMatch[4], 10) : null,
      aetHomeScore: null,
      aetAwayScore: null,
      penHomeScore: null,
      penAwayScore: null,
      wentToExtraTime: false,
      wentToPenalties: false,
    };
  }

  return null;
}

export function parseStandardOpenFootballFile(
  filePath: string,
  seasonFolder: string,
  competitionCode: string,
  sourceCitation: string
): ParsedMatch[] {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const [startStr, endShort] = seasonFolder.split('-');
  const seasonStartYear = parseInt(startStr, 10);
  const seasonEndYear =
    endShort.length === 2
      ? Math.floor(seasonStartYear / 100) * 100 + parseInt(endShort, 10)
      : parseInt(endShort, 10);
  const seasonCode = `${seasonStartYear}/${String(seasonEndYear).slice(-2)}`;

  let currentStage: string | null = null;
  let currentMatchday: string | null = null;
  let currentDate = `${seasonStartYear}-08-15`;

  const matches: ParsedMatch[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('=') || line.startsWith('#')) continue;

    // Heading / Stage / Matchday line starting with ▪ or Round/Matchday/Group
    if (line.startsWith('▪') || line.startsWith('»')) {
      const headerText = line.replace(/^[▪»]\s*/, '').trim();
      if (headerText.includes(',')) {
        const [st, md] = headerText.split(',').map((s) => s.trim());
        currentStage = st;
        currentMatchday = md;
      } else if (/Matchday/i.test(headerText)) {
        currentStage = 'Regular Season';
        currentMatchday = headerText;
      } else {
        currentStage = headerText;
        currentMatchday = headerText;
      }
      continue;
    }

    // Standalone Date line e.g. "Fri Aug 11 2023" or "Sat Sep 2" or "[Fri Aug 11]"
    const dateOnlyMatch = line.match(
      /^\[?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\]?$/
    );
    if (dateOnlyMatch) {
      const monthStr = dateOnlyMatch[1];
      const dayNum = parseInt(dateOnlyMatch[2], 10);
      const explicitYear = dateOnlyMatch[3]
        ? parseInt(dateOnlyMatch[3], 10)
        : null;
      currentDate = resolveDate(
        monthStr,
        dayNum,
        explicitYear,
        seasonStartYear,
        seasonEndYear
      );
      continue;
    }

    if (!line.includes('Real Madrid')) continue;

    let workLine = line;
    let kickoffTime: string | null = null;

    // Inline date prefix e.g. "Sat Sep 12 2015  18:00 ..."
    const inlineDateMatch = workLine.match(
      /^\[?(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\]?\s+(.*)$/
    );
    if (inlineDateMatch) {
      currentDate = resolveDate(
        inlineDateMatch[1],
        parseInt(inlineDateMatch[2], 10),
        inlineDateMatch[3] ? parseInt(inlineDateMatch[3], 10) : null,
        seasonStartYear,
        seasonEndYear
      );
      workLine = inlineDateMatch[4].trim();
    }

    // Optional kickoff time prefix e.g. "21:00  ..."
    const timeMatch = workLine.match(/^(\d{1,2}:\d{2})\s+(.*)$/);
    if (timeMatch) {
      kickoffTime = timeMatch[1];
      workLine = timeMatch[2].trim();
    }

    // Strip any trailing @ venue or [notes] unless it's [awarded]
    if (/\[(awarded|cancelled|postponed)\]/i.test(workLine)) {
      continue;
    }
    let venue: string | null = null;
    if (workLine.includes('@')) {
      const [beforeAt, afterAt] = workLine.split('@');
      workLine = beforeAt.trim();
      venue = afterAt.trim();
    }

    let rawHome = '';
    let rawAway = '';
    let scoreSection = '';

    // Format A: "Home Team v Away Team  2-1 (1-0)"
    const formatAMatch = workLine.match(
      /^(.+?)\s+v\s+(.+?)\s{2,}(\d+-\d+.*)$/
    );
    if (formatAMatch) {
      rawHome = formatAMatch[1].trim();
      rawAway = formatAMatch[2].trim();
      scoreSection = formatAMatch[3].trim();
    } else {
      // Format B: "Home Team  2-1 (1-0)  Away Team"
      const formatBMatch = workLine.match(
        /^(.+?)\s{2,}(\d+-\d+(?:\s*pen\.?)?(?:\s*\d+-\d+)?(?:\s*a\.e\.t\.?)?(?:\s*\([^)]+\))?)\s{2,}(.+?)$/i
      );
      if (formatBMatch) {
        rawHome = formatBMatch[1].trim();
        scoreSection = formatBMatch[2].trim();
        rawAway = formatBMatch[3].trim();
      }
    }

    if (!rawHome || !rawAway || !scoreSection) continue;

    const homeIsRM = isFirstTeamRealMadrid(rawHome);
    const awayIsRM = isFirstTeamRealMadrid(rawAway);
    if (!homeIsRM && !awayIsRM) continue;

    const scoreDetails = parseScoreDetails(scoreSection);
    if (!scoreDetails) continue;

    const homeTeam = cleanTeamName(rawHome);
    const awayTeam = cleanTeamName(rawAway);
    const rmIsHome = homeIsRM;
    const rmGoals = rmIsHome ? scoreDetails.homeScore : scoreDetails.awayScore;
    const opponentGoals = rmIsHome
      ? scoreDetails.awayScore
      : scoreDetails.homeScore;

    let rmResult: 'W' | 'D' | 'L' = 'D';
    if (scoreDetails.wentToPenalties && scoreDetails.penHomeScore !== null && scoreDetails.penAwayScore !== null) {
      const rmPen = rmIsHome ? scoreDetails.penHomeScore : scoreDetails.penAwayScore;
      const oppPen = rmIsHome ? scoreDetails.penAwayScore : scoreDetails.penHomeScore;
      rmResult = rmPen > oppPen ? 'W' : rmPen < oppPen ? 'L' : 'D';
    } else {
      rmResult =
        rmGoals > opponentGoals ? 'W' : rmGoals < opponentGoals ? 'L' : 'D';
    }

    const externalId = `openfootball_${competitionCode.toLowerCase()}_${seasonFolder}_${currentDate}_${homeTeam
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}_vs_${awayTeam
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}`;

    matches.push({
      externalId,
      seasonCode,
      competitionCode,
      stage: currentStage,
      matchday: currentMatchday,
      matchDate: currentDate,
      kickoffTime,
      homeTeam,
      awayTeam,
      venue: venue || (rmIsHome ? 'Estadio Santiago Bernabéu' : null),
      city: rmIsHome ? 'Madrid' : null,
      attendance: null,
      referee: null,
      homeScore: scoreDetails.homeScore,
      awayScore: scoreDetails.awayScore,
      htHomeScore: scoreDetails.htHomeScore,
      htAwayScore: scoreDetails.htAwayScore,
      aetHomeScore: scoreDetails.aetHomeScore,
      aetAwayScore: scoreDetails.aetAwayScore,
      penHomeScore: scoreDetails.penHomeScore,
      penAwayScore: scoreDetails.penAwayScore,
      wentToExtraTime: scoreDetails.wentToExtraTime,
      wentToPenalties: scoreDetails.wentToPenalties,
      rmIsHome,
      rmGoals,
      opponentGoals,
      rmResult,
      hasDetailedEvents: false,
      hasLineups: false,
      completenessStatus: 'Partial',
      sourceCitation,
      events: [],
      lineups: [],
      substitutions: [],
    });
  }

  return matches;
}

function normalizePlayerDisplayName(raw: string): string {
  const cleaned = raw.replace(/\[c\]/g, '').trim();
  // Convert ALL CAPS surnames like "Kylian MBAPPE" or "Vinícius JUNIOR" into Title Case
  return cleaned
    .split(/\s+/)
    .map((word) => {
      if (word.length > 1 && word === word.toUpperCase()) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word;
    })
    .join(' ');
}

function parseMinuteToken(minStr: string): {
  minute: number;
  stoppageMinute: number | null;
  minuteDisplay: string;
} {
  const clean = minStr.replace(/'/g, '').trim();
  const plusMatch = clean.match(/^(\d+)\+(\d+)$/);
  if (plusMatch) {
    return {
      minute: parseInt(plusMatch[1], 10),
      stoppageMinute: parseInt(plusMatch[2], 10),
      minuteDisplay: `${plusMatch[1]}+${plusMatch[2]}'`,
    };
  }
  const num = parseInt(clean, 10) || 45;
  return {
    minute: num,
    stoppageMinute: null,
    minuteDisplay: `${num}'`,
  };
}

export function parseFullOpenFootballFile(
  filePath: string,
  seasonFolder: string,
  competitionCode: string,
  sourceCitation: string
): ParsedMatch[] {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/);

  const [startStr, endShort] = seasonFolder.split('-');
  const seasonStartYear = parseInt(startStr, 10);
  const seasonEndYear =
    endShort.length === 2
      ? Math.floor(seasonStartYear / 100) * 100 + parseInt(endShort, 10)
      : parseInt(endShort, 10);
  const seasonCode = `${seasonStartYear}/${String(seasonEndYear).slice(-2)}`;

  const results: ParsedMatch[] = [];
  let currentMatchday = 'Matchday 1';

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith('▪')) {
      currentMatchday = line
        .replace(/^▪\s*(Regular Season\s*-\s*)?/i, 'Matchday ')
        .trim();
      i++;
      continue;
    }

    // Header line e.g. "Tue Aug 19 21:00 UTC+2 @ Estadio Santiago Bernabéu, Madrid, Att: 75561"
    const metaMatch = line.match(
      /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{1,2}:\d{2})\s+UTC[+-]\d+\s+@\s+(.+)$/
    );
    if (metaMatch && i + 1 < lines.length) {
      const monthStr = metaMatch[1];
      const dayNum = parseInt(metaMatch[2], 10);
      const kickoffTime = metaMatch[3];
      const locationStr = metaMatch[4];
      const matchDate = resolveDate(
        monthStr,
        dayNum,
        null,
        seasonStartYear,
        seasonEndYear
      );

      let venue: string | null = null;
      let city: string | null = null;
      let attendance: number | null = null;

      const attMatch = locationStr.match(/^(.*),\s*Att:\s*(\d+)$/);
      const venueAndCity = attMatch ? attMatch[1] : locationStr;
      if (attMatch) {
        attendance = parseInt(attMatch[2], 10);
      }
      const vcParts = venueAndCity.split(',').map((s) => s.trim());
      venue = vcParts[0] || null;
      city = vcParts.slice(1).join(', ') || null;

      const scoreLine = lines[i + 1].trim();
      const teamsScoreMatch = scoreLine.match(
        /^(.+?)\s+v\s+(.+?)\s{2,}(\d+)-(\d+)(?:\s*\((\d+)-(\d+)\))?$/
      );

      // Advance i to collect block until next blank+meta or ▪
      let blockEnd = i + 2;
      while (
        blockEnd < lines.length &&
        !lines[blockEnd].trim().startsWith('▪') &&
        !/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{1,2}:\d{2}\s+UTC/.test(
          lines[blockEnd].trim()
        )
      ) {
        blockEnd++;
      }

      if (teamsScoreMatch) {
        const rawHome = teamsScoreMatch[1].trim();
        const rawAway = teamsScoreMatch[2].trim();
        const homeIsRM = isFirstTeamRealMadrid(rawHome);
        const awayIsRM = isFirstTeamRealMadrid(rawAway);

        if (homeIsRM || awayIsRM) {
          const homeTeam = cleanTeamName(rawHome);
          const awayTeam = cleanTeamName(rawAway);
          const homeScore = parseInt(teamsScoreMatch[3], 10);
          const awayScore = parseInt(teamsScoreMatch[4], 10);
          const htHomeScore =
            teamsScoreMatch[5] !== undefined
              ? parseInt(teamsScoreMatch[5], 10)
              : null;
          const htAwayScore =
            teamsScoreMatch[6] !== undefined
              ? parseInt(teamsScoreMatch[6], 10)
              : null;

          const blockLines = lines.slice(i + 2, blockEnd);
          const events: ParsedMatchEvent[] = [];
          const lineups: ParsedLineupEntry[] = [];
          const substitutions: ParsedSubstitution[] = [];
          let referee: string | null = null;

          // Parse goal block right after score line if starting with "("
          let bIdx = 0;
          if (
            bIdx < blockLines.length &&
            blockLines[bIdx].trim().startsWith('(')
          ) {
            let goalsParen = '';
            while (bIdx < blockLines.length) {
              const gl = blockLines[bIdx].trim();
              goalsParen += ' ' + gl;
              bIdx++;
              if (gl.endsWith(')')) break;
            }
            const inner = goalsParen.trim().replace(/^\(|\)$/g, '').trim();
            let homeGoalsRaw = '';
            let awayGoalsRaw = '';
            if (inner.includes(';')) {
              const parts = inner.split(';');
              homeGoalsRaw = parts[0].trim();
              awayGoalsRaw = parts.slice(1).join(';').trim();
            } else {
              if (homeScore > 0 && awayScore === 0) {
                homeGoalsRaw = inner;
              } else if (awayScore > 0 && homeScore === 0) {
                awayGoalsRaw = inner;
              }
            }

            const parseGoalSide = (
              sideRaw: string,
              teamName: string,
              isRM: boolean
            ) => {
              if (!sideRaw || sideRaw === '-') return;
              const items = sideRaw.split(',').map((s) => s.trim());
              let lastPlayer = '';
              for (const item of items) {
                if (!item) continue;
                const m = item.match(
                  /^(?:(.+?)\s+)?(\d+(?:\+\d+)?')(?:\((p|o\.g\.|og)\))?$/i
                );
                if (m) {
                  if (m[1]) {
                    lastPlayer = normalizePlayerDisplayName(m[1]);
                  }
                  const minInfo = parseMinuteToken(m[2]);
                  const flag = (m[3] || '').toLowerCase();
                  const eventType =
                    flag === 'p'
                      ? 'PENALTY_GOAL'
                      : flag === 'o.g.' || flag === 'og'
                      ? 'OWN_GOAL'
                      : 'GOAL';
                  events.push({
                    isRealMadrid: isRM,
                    teamName,
                    eventType,
                    minute: minInfo.minute,
                    stoppageMinute: minInfo.stoppageMinute,
                    minuteDisplay: minInfo.minuteDisplay,
                    playerName: lastPlayer || 'Unknown',
                  });
                }
              }
            };

            parseGoalSide(homeGoalsRaw, homeTeam, homeIsRM);
            parseGoalSide(awayGoalsRaw, awayTeam, awayIsRM);
          }

          // Parse team lineup blocks & cards & Refs
          let currentTeamName: string | null = null;
          let currentIsRM = false;
          let lineupRawBuffer = '';

          const flushLineupBuffer = (teamName: string, isRM: boolean, buf: string) => {
            if (!buf.trim()) return;
            // Format: Player A - Player B [c] (58' Sub B), Player C, Player D (70' Sub D) - ...
            // Replace " - " with ", " so we get all 11 starters and their inline substitutions
            const normalized = buf.replace(/\s+-\s+/g, ', ');
            const tokens = normalized.split(',').map((s) => s.trim()).filter(Boolean);
            let order = 1;
            for (const tok of tokens) {
              const isCaptain = tok.includes('[c]');
              const subMatch = tok.match(/^(.+?)\s*\((\d+(?:\+\d+)?')\s+(.+?)\)$/);
              if (subMatch) {
                const starterName = normalizePlayerDisplayName(subMatch[1]);
                const minInfo = parseMinuteToken(subMatch[2]);
                const subInName = normalizePlayerDisplayName(subMatch[3]);
                lineups.push({
                  isRealMadrid: isRM,
                  teamName,
                  playerName: starterName,
                  isStarting: true,
                  isCaptain,
                  lineupOrder: order++,
                });
                lineups.push({
                  isRealMadrid: isRM,
                  teamName,
                  playerName: subInName,
                  isStarting: false,
                  isCaptain: false,
                  lineupOrder: 11 + order,
                });
                substitutions.push({
                  isRealMadrid: isRM,
                  teamName,
                  minute: minInfo.minute,
                  stoppageMinute: minInfo.stoppageMinute,
                  minuteDisplay: minInfo.minuteDisplay,
                  playerInName: subInName,
                  playerOutName: starterName,
                });
              } else {
                const starterName = normalizePlayerDisplayName(tok);
                lineups.push({
                  isRealMadrid: isRM,
                  teamName,
                  playerName: starterName,
                  isStarting: true,
                  isCaptain,
                  lineupOrder: order++,
                });
              }
            }
          };

          for (; bIdx < blockLines.length; bIdx++) {
            const bl = blockLines[bIdx].trim();
            if (!bl) {
              if (currentTeamName && lineupRawBuffer) {
                flushLineupBuffer(currentTeamName, currentIsRM, lineupRawBuffer);
                lineupRawBuffer = '';
              }
              continue;
            }

            if (bl.startsWith('Refs:')) {
              if (currentTeamName && lineupRawBuffer) {
                flushLineupBuffer(currentTeamName, currentIsRM, lineupRawBuffer);
                lineupRawBuffer = '';
              }
              referee = bl.replace(/^Refs:\s*/, '').split(',')[0].trim();
              continue;
            }

            if (
              bl.startsWith('Yellow:') ||
              bl.startsWith('Yellow-Red:') ||
              bl.startsWith('Red:')
            ) {
              if (currentTeamName && lineupRawBuffer) {
                flushLineupBuffer(currentTeamName, currentIsRM, lineupRawBuffer);
                lineupRawBuffer = '';
              }
              const cardKind = bl.startsWith('Yellow-Red:')
                ? 'SECOND_YELLOW_RED'
                : bl.startsWith('Red:')
                ? 'RED_CARD'
                : 'YELLOW_CARD';
              const cardsStr = bl.replace(/^(Yellow-Red|Yellow|Red):\s*/, '').trim();
              const cardItems = cardsStr.split(',').map((s) => s.trim());
              for (const ci of cardItems) {
                const cm = ci.match(/^(.+?)\s+(\d+(?:\+\d+)?')$/);
                if (cm && currentTeamName) {
                  const minInfo = parseMinuteToken(cm[2]);
                  events.push({
                    isRealMadrid: currentIsRM,
                    teamName: currentTeamName,
                    eventType: cardKind,
                    minute: minInfo.minute,
                    stoppageMinute: minInfo.stoppageMinute,
                    minuteDisplay: minInfo.minuteDisplay,
                    playerName: normalizePlayerDisplayName(cm[1]),
                  });
                }
              }
              continue;
            }

            if (bl.startsWith(`${rawHome}:`)) {
              if (currentTeamName && lineupRawBuffer) {
                flushLineupBuffer(currentTeamName, currentIsRM, lineupRawBuffer);
              }
              currentTeamName = homeTeam;
              currentIsRM = homeIsRM;
              lineupRawBuffer = bl.slice(rawHome.length + 1).trim();
            } else if (bl.startsWith(`${rawAway}:`)) {
              if (currentTeamName && lineupRawBuffer) {
                flushLineupBuffer(currentTeamName, currentIsRM, lineupRawBuffer);
              }
              currentTeamName = awayTeam;
              currentIsRM = awayIsRM;
              lineupRawBuffer = bl.slice(rawAway.length + 1).trim();
            } else if (currentTeamName) {
              lineupRawBuffer += ' ' + bl;
            }
          }

          if (currentTeamName && lineupRawBuffer) {
            flushLineupBuffer(currentTeamName, currentIsRM, lineupRawBuffer);
          }

          const rmIsHome = homeIsRM;
          const rmGoals = rmIsHome ? homeScore : awayScore;
          const opponentGoals = rmIsHome ? awayScore : homeScore;
          const rmResult: 'W' | 'D' | 'L' =
            rmGoals > opponentGoals ? 'W' : rmGoals < opponentGoals ? 'L' : 'D';

          const externalId = `openfootball_${competitionCode.toLowerCase()}_${seasonFolder}_${matchDate}_${homeTeam
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}_vs_${awayTeam
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')}`;

          results.push({
            externalId,
            seasonCode,
            competitionCode,
            stage: 'Regular Season',
            matchday: currentMatchday,
            matchDate,
            kickoffTime,
            homeTeam,
            awayTeam,
            venue,
            city,
            attendance,
            referee,
            homeScore,
            awayScore,
            htHomeScore,
            htAwayScore,
            aetHomeScore: null,
            aetAwayScore: null,
            penHomeScore: null,
            penAwayScore: null,
            wentToExtraTime: false,
            wentToPenalties: false,
            rmIsHome,
            rmGoals,
            opponentGoals,
            rmResult,
            hasDetailedEvents: events.length > 0,
            hasLineups: lineups.length > 0,
            completenessStatus: 'Verified',
            sourceCitation,
            events,
            lineups,
            substitutions,
          });
        }
      }

      i = blockEnd;
      continue;
    }

    i++;
  }

  return results;
}

export function loadAllOpenFootballRealMadridMatches(
  workspaceRoot: string
): ParsedMatch[] {
  const espanaRoot = path.join(workspaceRoot, 'data', 'openfootball', 'espana');
  const uclRoot = path.join(
    workspaceRoot,
    'data',
    'openfootball',
    'champions-league'
  );

  const byKey = new Map<string, ParsedMatch>();

  if (fs.existsSync(espanaRoot)) {
    const seasonDirs = fs
      .readdirSync(espanaRoot)
      .filter((d) => /^\d{4}-\d{2}$/.test(d))
      .sort();

    for (const sDir of seasonDirs) {
      const ligaPath = path.join(espanaRoot, sDir, '1-liga.txt');
      if (fs.existsSync(ligaPath)) {
        const parsed = parseStandardOpenFootballFile(
          ligaPath,
          sDir,
          'LA_LIGA',
          `OpenFootball España (${sDir}/1-liga.txt, CC0-1.0 Public Domain)`
        );
        for (const m of parsed) {
          byKey.set(m.externalId, m);
        }
      }

      // If 1-liga-full.txt exists (e.g. 2025-26), enrich/replace with full lineup & event details!
      const ligaFullPath = path.join(espanaRoot, sDir, '1-liga-full.txt');
      if (fs.existsSync(ligaFullPath)) {
        const parsedFull = parseFullOpenFootballFile(
          ligaFullPath,
          sDir,
          'LA_LIGA',
          `OpenFootball España Detailed Archive (${sDir}/1-liga-full.txt, CC0-1.0 Public Domain)`
        );
        for (const m of parsedFull) {
          byKey.set(m.externalId, m);
        }
      }

      const cupPath = path.join(espanaRoot, sDir, 'cup.txt');
      if (fs.existsSync(cupPath)) {
        const parsedCup = parseStandardOpenFootballFile(
          cupPath,
          sDir,
          'COPA_DEL_REY',
          `OpenFootball España (${sDir}/cup.txt, CC0-1.0 Public Domain)`
        );
        for (const m of parsedCup) {
          byKey.set(m.externalId, m);
        }
      }
    }
  }

  if (fs.existsSync(uclRoot)) {
    const seasonDirs = fs
      .readdirSync(uclRoot)
      .filter((d) => /^\d{4}-\d{2}$/.test(d))
      .sort();

    for (const sDir of seasonDirs) {
      const clPath = path.join(uclRoot, sDir, 'cl.txt');
      if (fs.existsSync(clPath)) {
        const parsedCl = parseStandardOpenFootballFile(
          clPath,
          sDir,
          'UCL',
          `OpenFootball Champions League (${sDir}/cl.txt, CC0-1.0 Public Domain)`
        );
        for (const m of parsedCl) {
          byKey.set(m.externalId, m);
        }
      }
    }
  }

  return Array.from(byKey.values()).sort((a, b) =>
    b.matchDate.localeCompare(a.matchDate)
  );
}
