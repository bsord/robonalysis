
import { NextResponse } from 'next/server';
import type { Event } from '../../../types';

type PostBody = {
  teamId?: number | string;
  limit?: number;
  // Optional explicit season filter
  seasonId?: number | string;
  includeRank?: boolean;
};

export async function POST(request: Request) {
  const { teamId, limit, seasonId, includeRank }: PostBody = await request.json();
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required.' }, { status: 400 });
  }
  try {
    const resolvedTeamId: number | string = teamId;

    // Fetch events for the team ID, requesting newest first; forward seasons[] upstream when provided
    const qs = new URLSearchParams();
    qs.set('per_page', String(Math.max(1, Math.min(limit ?? 250, 250))));
    qs.set('sort', 'start');
    qs.set('order', 'desc');
    if (seasonId != null) {
      // RobotEvents expects singular 'season[]' even when passing multiples
      qs.append('season[]', String(seasonId));
    }
  const eventsUrl = `https://www.robotevents.com/api/v2/teams/${resolvedTeamId}/events?${qs.toString()}`;
    const eventsRes = await fetch(eventsUrl, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });
    const eventsData = await eventsRes.json();
    if (!eventsRes.ok) {
      return NextResponse.json({ error: eventsData.message || 'Failed to fetch events.' }, { status: eventsRes.status });
    }

    if (!Array.isArray(eventsData?.data)) {
      return NextResponse.json(eventsData);
    }

    // Ensure newest-first ordering
    const sorted: Event[] = [...eventsData.data].sort((a: Event, b: Event) => {
      const at = a?.start ? new Date(a.start).getTime() : 0;
      const bt = b?.start ? new Date(b.start).getTime() : 0;
      return bt - at;
    });

    const sliced = typeof limit === 'number' && limit > 0 ? sorted.slice(0, limit) : sorted;

    // Enrich events with team division rank where available
    const withRank: Event[] = await (async () => {
      if (!includeRank) return sliced; // skip enrichment unless requested
      const apiHeaders = { accept: 'application/json', Authorization: `Bearer ${apiKey}` } as const;
      // Helper to safely fetch JSON
      const getJson = async (url: string) => {
        const res = await fetch(url, { headers: apiHeaders, cache: 'no-store' });
        const json: unknown = await res.json();
        return { ok: res.ok, json } as { ok: boolean; json: unknown };
      };

      const isPage = (v: unknown): v is { data: unknown[] } => {
        if (typeof v !== 'object' || v === null) return false;
        const maybe = v as { data?: unknown };
        return Array.isArray(maybe.data);
      };

      // Limit concurrency to avoid hammering the API
      const results: Event[] = [];
      const batch = 4;
      for (let i = 0; i < sliced.length; i += batch) {
        const chunk = sliced.slice(i, i + batch);
        const enriched = await Promise.all(chunk.map(async (ev) => {
          const evId = ev?.id;
          if (!evId) return ev;
          // Try event rankings filtered by team directly
          const rankUrl = `https://www.robotevents.com/api/v2/events/${encodeURIComponent(String(evId))}/rankings?team[]=${encodeURIComponent(String(resolvedTeamId))}&per_page=1`;
          const r1 = await getJson(rankUrl);
          if (r1.ok && isPage(r1.json) && r1.json.data.length > 0) {
            const row = r1.json.data[0] as { rank?: unknown; division?: { name?: string | null } };
            const rank = typeof row?.rank === 'number' ? row.rank : (row?.rank != null ? Number(row.rank as number | string) : null);
            const divisionName: string | null = row?.division?.name ?? null;
            return { ...ev, teamRank: Number.isFinite(rank as number) ? (rank as number) : null, teamDivision: divisionName } as Event;
          }

          // Fallback: check each division
          const divs = Array.isArray(ev?.divisions) ? ev.divisions : [];
          for (const d of divs) {
            const divName = d?.name ?? null;
            // RobotEvents divisions endpoint often uses name in ranking rows; rankings endpoint may not require divisionId
            const divRankUrl = `https://www.robotevents.com/api/v2/events/${encodeURIComponent(String(evId))}/rankings?team[]=${encodeURIComponent(String(resolvedTeamId))}&per_page=1`;
            const r2 = await getJson(divRankUrl);
            if (r2.ok && isPage(r2.json) && r2.json.data.length > 0) {
              const row = r2.json.data[0] as { rank?: unknown };
              const rank = typeof row?.rank === 'number' ? row.rank : (row?.rank != null ? Number(row.rank as number | string) : null);
              if (rank != null) {
                return { ...ev, teamRank: Number.isFinite(rank as number) ? (rank as number) : null, teamDivision: divName } as Event;
              }
            }
          }
          return ev;
        }));
        results.push(...enriched);
      }
      return results;
    })();

    return NextResponse.json({ ...eventsData, data: withRank });
  } catch {
    return NextResponse.json({ error: 'Error fetching team or events.' }, { status: 500 });
  }
}
