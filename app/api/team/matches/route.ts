import { NextResponse } from 'next/server';
import type { Match } from '../../../types';

type PostBody = {
  teamId?: number | string;
  // Optional explicit event filter list (preferred)
  eventIds?: Array<number | string>;
};

export async function POST(request: Request) {
  const { teamId, eventIds }: PostBody = await request.json();
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required.' }, { status: 400 });
  }

  // No local season logic; we only forward season filters to upstream

  // Fetch all pages of matches for this team; then sort newest-first server-side
  const base = `https://www.robotevents.com/api/v2/teams/${encodeURIComponent(String(teamId))}/matches`;
  const qs = new URLSearchParams();
  qs.set('per_page', '250');
  qs.set('sort', 'started');
  qs.set('order', 'desc');
  // Only filter by explicit event IDs
  if (Array.isArray(eventIds) && eventIds.length > 0) {
    for (const id of eventIds) qs.append('event[]', String(id));
  }
  let url: string | null = `${base}?${qs.toString()}`;
  const all: Match[] = [] as unknown as Match[];
  try {
    let safety = 0;
    while (url && safety < 100) {
      safety++;
      const res: Response = await fetch(url, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        cache: 'no-store',
      });
  const page: { data?: Match[]; meta?: { next_page_url?: string | null }; message?: string } = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: page?.message || 'Failed to fetch matches.' }, { status: res.status });
      }
      if (Array.isArray(page?.data)) all.push(...(page.data as Match[]));
      url = page?.meta?.next_page_url || null;
    }

  const timeOf = (m: Match) => {
      const t = m?.updated_at || m?.started || m?.scheduled;
      return t ? new Date(t).getTime() : 0;
    };
    // Deduplicate by match id, keeping the most recently updated
  const byId = new Map<string | number, Match>();
    for (const m of all) {
      const id = (m && m.id != null) ? m.id : `${m?.event?.id ?? 'ev'}-${m?.round ?? 'r'}-${m?.matchnum ?? 'n'}-${m?.instance ?? 'i'}`;
      const prev = byId.get(id);
      if (!prev || timeOf(m) >= timeOf(prev)) byId.set(id, m);
    }
    const deduped = Array.from(byId.values());

  const sorted = deduped.sort((a, b) => timeOf(b) - timeOf(a));
    return NextResponse.json({ data: sorted });
  } catch {
    return NextResponse.json({ error: 'Error fetching matches.' }, { status: 500 });
  }
}
