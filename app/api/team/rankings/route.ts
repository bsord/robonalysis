import { NextResponse } from 'next/server';

type PostBody = {
  teamId?: string | number;
  seasonId?: string | number;
  debug?: boolean;
};

type RankingRow = {
  rank?: number | string | null;
  wins?: number | string | null;
  losses?: number | string | null;
  ties?: number | string | null;
  wp?: number | string | null;
  ap?: number | string | null;
  sp?: number | string | null;
  high_score?: number | string | null;
  total_points?: number | string | null;
  average_points?: number | string | null;
  event?: { id?: number | string | null; name?: string | null; code?: string | null } | null;
  division?: { id?: number | string | null; name?: string | null; code?: string | null } | null;
  team?: { id?: number | string | null; name?: string | null; code?: string | null } | null;
};

type Page<T> = {
  data?: T[];
  meta?: { next_page_url?: string | null } | null;
  message?: string;
};

export async function POST(request: Request) {
  const { teamId, seasonId, debug }: PostBody = await request.json();
  console.log('[team rankings api][POST] request', { teamId, seasonId, debug });
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;
  if (!apiKey) {
    console.error('[team rankings api] missing ROBOT_EVENTS_API_KEY');
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }
  if (!teamId) {
    console.warn('[team rankings api] missing params', { teamId });
    return NextResponse.json({ error: 'teamId is required.' }, { status: 400 });
  }
  try {
    const headers = { accept: 'application/json', Authorization: `Bearer ${apiKey}` } as const;
    const base = 'https://www.robotevents.com/api/v2';
    const fetchAll = async <T>(url: string): Promise<T[]> => {
      const rows: T[] = [];
      let next: string | null = url;
      let guard = 0;
      while (next && guard < 50) {
        guard++;
        const res: Response = await fetch(next, { headers, cache: 'no-store' });
        const json = (await res.json()) as Page<T>;
        if (Array.isArray(json?.data)) rows.push(...json.data);
        next = (json?.meta?.next_page_url as string | null) || null;
        if (!res.ok) break;
      }
      return rows;
    };
    // Build query for all rankings for this team (optionally for a season)
    const qs = new URLSearchParams();
    qs.set('per_page', '250');
    if (seasonId != null) qs.append('season[]', String(seasonId));

    if (debug) {
      const url = `${base}/teams/${encodeURIComponent(String(teamId))}/rankings?${qs.toString()}`;
      const rows = await fetchAll<RankingRow>(url);
      return NextResponse.json({ debug: { teamId, seasonId, rowsCount: rows.length } });
    }

    try {
      const url = `${base}/teams/${encodeURIComponent(String(teamId))}/rankings?${qs.toString()}`;
      const rows = await fetchAll<RankingRow>(url);
      // Reduce to per-event best row (lowest rank)
      const byEvent = new Map<string, RankingRow>();
      for (const r of rows) {
        const eid = r?.event?.id != null ? String(r.event.id) : undefined;
        if (!eid) continue;
        const prev = byEvent.get(eid);
        const currRank = r?.rank != null ? Number(r.rank) : Number.POSITIVE_INFINITY;
        const prevRank = prev?.rank != null ? Number(prev.rank) : Number.POSITIVE_INFINITY;
        if (!prev || (Number.isFinite(currRank) && currRank > 0 && currRank <= prevRank)) {
          byEvent.set(eid, r);
        }
      }
      const data = Object.fromEntries(
        Array.from(byEvent.entries()).map(([eid, r]) => [
          eid,
          {
            rank: r?.rank != null ? Number(r.rank) : null,
            wins: r?.wins != null ? Number(r.wins) : null,
            losses: r?.losses != null ? Number(r.losses) : null,
            ties: r?.ties != null ? Number(r.ties) : null,
            wp: r?.wp != null ? Number(r.wp) : null,
            ap: r?.ap != null ? Number(r.ap) : null,
            sp: r?.sp != null ? Number(r.sp) : null,
            high_score: r?.high_score != null ? Number(r.high_score) : null,
            average_points: r?.average_points != null ? Number(r.average_points) : null,
            total_points: r?.total_points != null ? Number(r.total_points) : null,
          },
        ]),
      );
      return NextResponse.json({ data });
    } catch {
      return NextResponse.json({ data: {} });
    }
  } catch (err) {
    console.error('[team rankings api] exception', err);
    return NextResponse.json({ error: 'Error fetching rank.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId') || undefined;
  const seasonId = searchParams.get('seasonId') || undefined;
  const debug = ['1', 'true', 'yes'].includes((searchParams.get('debug') || '').toLowerCase());
  console.log('[team rankings api][GET] request', { teamId, seasonId, debug });
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;
  if (!apiKey) {
    console.error('[team rankings api] missing ROBOT_EVENTS_API_KEY');
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }
  if (!teamId) {
    console.warn('[team rankings api] missing params', { teamId });
    return NextResponse.json({ error: 'teamId is required.' }, { status: 400 });
  }
  try {
    const headers = { accept: 'application/json', Authorization: `Bearer ${apiKey}` } as const;
    const base = 'https://www.robotevents.com/api/v2';
    const fetchAll = async <T>(url: string): Promise<T[]> => {
      const rows: T[] = [];
      let next: string | null = url;
      let guard = 0;
      while (next && guard < 50) {
        guard++;
        const res: Response = await fetch(next, { headers, cache: 'no-store' });
        const json = (await res.json()) as Page<T>;
        if (Array.isArray(json?.data)) rows.push(...json.data);
        next = (json?.meta?.next_page_url as string | null) || null;
        if (!res.ok) break;
      }
      return rows;
    };
    const qs = new URLSearchParams();
    qs.set('per_page', '250');
    if (seasonId != null) qs.append('season[]', String(seasonId));

    if (debug) {
      const url = `${base}/teams/${encodeURIComponent(String(teamId))}/rankings?${qs.toString()}`;
      const rows = await fetchAll<RankingRow>(url);
      return NextResponse.json({ debug: { teamId, seasonId, rowsCount: rows.length } });
    }

    try {
      const url = `${base}/teams/${encodeURIComponent(String(teamId))}/rankings?${qs.toString()}`;
      const rows = await fetchAll<RankingRow>(url);
      const byEvent = new Map<string, RankingRow>();
      for (const r of rows) {
        const eid = r?.event?.id != null ? String(r.event.id) : undefined;
        if (!eid) continue;
        const prev = byEvent.get(eid);
        const currRank = r?.rank != null ? Number(r.rank) : Number.POSITIVE_INFINITY;
        const prevRank = prev?.rank != null ? Number(prev.rank) : Number.POSITIVE_INFINITY;
        if (!prev || (Number.isFinite(currRank) && currRank > 0 && currRank <= prevRank)) {
          byEvent.set(eid, r);
        }
      }
      const data = Object.fromEntries(
        Array.from(byEvent.entries()).map(([eid, r]) => [
          eid,
          {
            rank: r?.rank != null ? Number(r.rank) : null,
            wins: r?.wins != null ? Number(r.wins) : null,
            losses: r?.losses != null ? Number(r.losses) : null,
            ties: r?.ties != null ? Number(r.ties) : null,
            wp: r?.wp != null ? Number(r.wp) : null,
            ap: r?.ap != null ? Number(r.ap) : null,
            sp: r?.sp != null ? Number(r.sp) : null,
            high_score: r?.high_score != null ? Number(r.high_score) : null,
            average_points: r?.average_points != null ? Number(r.average_points) : null,
            total_points: r?.total_points != null ? Number(r.total_points) : null,
          },
        ]),
      );
      return NextResponse.json({ data });
    } catch {
      return NextResponse.json({ data: {} });
    }
  } catch (err) {
    console.error('[team rankings api] exception', err);
    return NextResponse.json({ error: 'Error fetching rank.' }, { status: 500 });
  }
}
