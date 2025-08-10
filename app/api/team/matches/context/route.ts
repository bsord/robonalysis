import { NextResponse } from 'next/server';

type Match = any;

const timeOf = (m: any) => {
  const t = m?.started || m?.scheduled || m?.updated_at;
  return t ? new Date(t).getTime() : 0;
};

const keyOf = (m: any) => m?.id ?? `${m?.event?.id}-${m?.round}-${m?.matchnum}-${m?.instance}-${m?.scheduled || m?.started || ''}`;

// Simple in-memory caches with TTL (15 minutes). Store on globalThis to persist across HMR in dev.
const FIFTEEN_MIN = 15 * 60 * 1000;
type CacheEntry = { expires: number; data: Match[] };
type GlobalCaches = { team: Map<string, CacheEntry>; event: Map<string, CacheEntry> };
const globalForCache = globalThis as unknown as { __robonalysisCaches?: GlobalCaches; __robonalysisCacheGen?: number };
if (!globalForCache.__robonalysisCaches) {
  globalForCache.__robonalysisCaches = { team: new Map(), event: new Map() };
}
if (!globalForCache.__robonalysisCacheGen) {
  globalForCache.__robonalysisCacheGen = Date.now();
}
const teamCache = globalForCache.__robonalysisCaches.team;
const eventCache = globalForCache.__robonalysisCaches.event;

async function fetchAllTeamMatches(teamId: string | number, apiKey: string, debug?: boolean): Promise<Match[]> {
  const log = (...args: any[]) => debug && console.log('[ctx][team]', ...args);
  const cacheKey = String(teamId);
  const now = Date.now();
  const cached = teamCache.get(cacheKey);
  if (cached && cached.expires > now) {
    log('cache hit', { teamId: cacheKey, count: cached.data.length, expiresInMs: cached.expires - now });
    return cached.data;
  }
  log('cache miss; fetching team matches', { teamId: cacheKey });
  const base = `https://www.robotevents.com/api/v2/teams/${encodeURIComponent(String(teamId))}/matches`;
  let url: string | null = `${base}?per_page=250&sort=started&order=asc`;
  const all: any[] = [];
  let safety = 0;
  const t0 = now;
  while (url && safety < 100) {
    safety++;
    const res: Response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });
    const page: any = await res.json();
    if (!res.ok) {
      throw new Error(page?.message || `Failed to fetch matches for team ${teamId}`);
    }
    if (Array.isArray(page?.data)) all.push(...page.data);
    url = page?.meta?.next_page_url || null;
  }
  // dedupe latest per id and return ascending for timeline sims
  const byId = new Map<string | number, any>();
  for (const m of all) {
    const id = (m && m.id != null) ? m.id : `${m?.event?.id ?? 'ev'}-${m?.round ?? 'r'}-${m?.matchnum ?? 'n'}-${m?.instance ?? 'i'}`;
    const prev = byId.get(id);
    if (!prev || timeOf(m) >= timeOf(prev)) byId.set(id, m);
  }
  const asc = Array.from(byId.values()).sort((a, b) => timeOf(a) - timeOf(b));
  teamCache.set(cacheKey, { expires: now + FIFTEEN_MIN, data: asc });
  log('fetched team matches', { teamId: cacheKey, pages: safety, total: all.length, deduped: asc.length, ms: Date.now() - t0, cacheSize: teamCache.size });
  return asc;
}

async function fetchEventMatches(eventId: string | number, apiKey: string, debug?: boolean): Promise<Match[]> {
  const log = (...args: any[]) => debug && console.log('[ctx][event]', ...args);
  const cacheKey = String(eventId);
  const now = Date.now();
  const cached = eventCache.get(cacheKey);
  if (cached && cached.expires > now) {
    log('cache hit', { eventId: cacheKey, count: cached.data.length, expiresInMs: cached.expires - now });
    return cached.data;
  }
  log('cache miss; fetching event matches', { eventId: cacheKey });
  const base = `https://www.robotevents.com/api/v2/events/${encodeURIComponent(String(eventId))}/matches`;
  let url: string | null = `${base}?per_page=250&sort=started&order=asc`;
  const all: any[] = [];
  let safety = 0;
  const t0 = now;
  while (url && safety < 100) {
    safety++;
    const res: Response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });
    const page: any = await res.json();
    if (!res.ok) {
      throw new Error(page?.message || `Failed to fetch matches for event ${eventId}`);
    }
    if (Array.isArray(page?.data)) all.push(...page.data);
    url = page?.meta?.next_page_url || null;
  }
  const byId = new Map<string | number, any>();
  for (const m of all) {
    const id = (m && m.id != null) ? m.id : `${m?.event?.id ?? 'ev'}-${m?.round ?? 'r'}-${m?.matchnum ?? 'n'}-${m?.instance ?? 'i'}`;
    const prev = byId.get(id);
    if (!prev || timeOf(m) >= timeOf(prev)) byId.set(id, m);
  }
  const asc = Array.from(byId.values()).sort((a, b) => timeOf(a) - timeOf(b));
  eventCache.set(cacheKey, { expires: now + FIFTEEN_MIN, data: asc });
  log('fetched event matches', { eventId: cacheKey, pages: safety, total: all.length, deduped: asc.length, ms: Date.now() - t0, cacheSize: eventCache.size });
  return asc;
}

export async function POST(request: Request) {
  const { teamId, debug: reqDebug }: { teamId?: number | string; debug?: boolean } = await request.json();
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required.' }, { status: 400 });
  }

  try {
    const debug = typeof reqDebug === 'boolean' ? reqDebug : process.env.MATCH_CONTEXT_DEBUG === '1' || process.env.NODE_ENV !== 'production';
    const log = (...args: any[]) => debug && console.log('[ctx]', ...args);
    const tTotal = Date.now();
  log('start', { teamId, cacheGen: globalForCache.__robonalysisCacheGen, teamCacheSize: teamCache.size, eventCacheSize: eventCache.size });
    // First get all matches for the primary team (we'll return these to the client)
    const t0 = Date.now();
    const primaryMatchesAsc = await fetchAllTeamMatches(teamId, apiKey, debug);
    log('primary team matches ready', { count: primaryMatchesAsc.length, ms: Date.now() - t0 });

    // Group primary matches by event id
    const byEvent: Map<string, Match[]> = new Map();
    for (const m of primaryMatchesAsc) {
      const eid = String(m?.event?.id ?? 'unknown');
      if (!eid || eid === 'unknown') continue;
      if (!byEvent.has(eid)) byEvent.set(eid, [m]);
      else byEvent.get(eid)!.push(m);
    }
    log('grouped events', { events: Array.from(byEvent.keys()) });

    // Fetch matches for each event directly (event-scoped, cached)
    const eventMatchesMap = new Map<string, Match[]>();
    for (const [eid] of byEvent.entries()) {
      try {
        const tE = Date.now();
        const list = await fetchEventMatches(eid, apiKey, debug);
        eventMatchesMap.set(eid, list);
        log('event fetched', { eventId: eid, count: list.length, ms: Date.now() - tE });
      } catch {
        // If event fetch fails, we'll fall back to primary-only list below
        log('event fetch failed; will fallback', { eventId: eid });
      }
    }

    // Compute SP/SOS context per match for the primary team's matches
    type Rec = { prior: number; gain: number | null; redSOS: number | null; blueSOS: number | null; redTeamSP: Array<{id:number, prior:number}>; blueTeamSP: Array<{id:number, prior:number}> };
    const context: Record<string, Rec> = {};
    const primaryIdNum = typeof teamId === 'string' ? Number(teamId) : teamId;

    for (const [eid, list] of byEvent.entries()) {
      const tSim = Date.now();
      const timeline = eventMatchesMap.get(eid) || list; // fallback to primary-only if fetch failed
      const teamSp = new Map<number, number>();
      const getSp = (id: any) => teamSp.get((typeof id === 'string' ? Number(id) : id) as number) ?? 0;
      const addSp = (id: any, delta: number) => {
        const n = (typeof id === 'string' ? Number(id) : id) as number;
        teamSp.set(n, (teamSp.get(n) ?? 0) + delta);
      };
      for (const m of timeline) {
        const alliances: any[] = Array.isArray(m?.alliances) ? m.alliances : [];
        const red = alliances.find((a) => a?.color === 'red');
        const blue = alliances.find((a) => a?.color === 'blue');
        const ids = (a: any) => (Array.isArray(a?.teams) ? a.teams.map((t: any) => t?.team?.id ?? t?.team_id ?? t?.id).filter((x: any) => x != null) : []);
        const redIds = ids(red);
        const blueIds = ids(blue);

        const rScore = typeof red?.score === 'number' ? red.score : null;
        const bScore = typeof blue?.score === 'number' ? blue.score : null;
        const bothHave = rScore != null && bScore != null;
        const losingScore = bothHave ? Math.min(rScore as number, bScore as number) : null;
        const gain = losingScore;

        const redSOS = redIds.length ? redIds.reduce((acc: number, id: any) => acc + getSp(id), 0) : null;
        const blueSOS = blueIds.length ? blueIds.reduce((acc: number, id: any) => acc + getSp(id), 0) : null;
        const redTeamSP = redIds.map((id: any) => ({ id: Number(id), prior: getSp(id) }));
        const blueTeamSP = blueIds.map((id: any) => ({ id: Number(id), prior: getSp(id) }));

        // If this match is one of the primary team's, store record
        const involvesPrimary = redIds.concat(blueIds).some((id: any) => Number(id) === Number(primaryIdNum));
        if (involvesPrimary) {
          const ourPrior = getSp(primaryIdNum);
          context[keyOf(m)] = { prior: ourPrior, gain, redSOS, blueSOS, redTeamSP, blueTeamSP };
        }

        if (bothHave && losingScore != null) {
          for (const id of redIds) addSp(id, losingScore);
          for (const id of blueIds) addSp(id, losingScore);
        }
      }
      log('simulated event', { eventId: eid, matches: timeline.length, ms: Date.now() - tSim });
    }

    // Also return primary team matches newest-first for display
    const primaryNewestFirst = [...primaryMatchesAsc].sort((a, b) => timeOf(b) - timeOf(a));
    log('done', { totalMs: Date.now() - tTotal });
    return NextResponse.json({ data: primaryNewestFirst, context });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error computing match context.' }, { status: 500 });
  }
}
