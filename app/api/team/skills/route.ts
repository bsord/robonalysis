import { NextResponse } from 'next/server';
import type { SkillRow } from '../../../types';

type PostBody = {
  teamId?: number | string;
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

  const base = `https://www.robotevents.com/api/v2/teams/${encodeURIComponent(String(teamId))}/skills`;
  const qs = new URLSearchParams();
  qs.set('per_page', '250');
  // Forward explicit event filters if provided
  if (Array.isArray(eventIds) && eventIds.length > 0) {
    for (const id of eventIds) qs.append('event[]', String(id));
  }

  let url: string | null = `${base}?${qs.toString()}`;
  const all: SkillRow[] = [] as unknown as SkillRow[];
  try {
    let guard = 0;
    while (url && guard < 100) {
      guard++;
      const res: Response = await fetch(url, {
        headers: { accept: 'application/json', Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      });
  const page: { data?: SkillRow[]; meta?: { next_page_url?: string | null }; message?: string } = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: page?.message || 'Failed to fetch skills.' }, { status: res.status });
      }
  if (Array.isArray(page?.data)) all.push(...(page.data as SkillRow[]));
      url = page?.meta?.next_page_url || null;
    }

    // Sort: newest seasons first, then by event id desc, then by rank asc
    const seasonId = (s: SkillRow) => {
      const sid = (s as unknown as { season?: { id?: number } })?.season?.id;
      return sid != null ? Number(sid) : -1;
    };
    const eventId = (s: SkillRow) => (s?.event?.id != null ? Number(s.event.id) : -1);
    const rank = (s: SkillRow) => (s?.rank != null ? Number(s.rank) : Number.POSITIVE_INFINITY);
    const sorted = all.sort((a, b) => {
      const sd = seasonId(b) - seasonId(a);
      if (sd !== 0) return sd;
      const ed = eventId(b) - eventId(a);
      if (ed !== 0) return ed;
      return rank(a) - rank(b);
    });

    return NextResponse.json({ data: sorted });
  } catch {
    return NextResponse.json({ error: 'Error fetching skills.' }, { status: 500 });
  }
}
