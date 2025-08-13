import { NextResponse } from 'next/server';
import type { Award } from '../../../types';

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

  const base = `https://www.robotevents.com/api/v2/teams/${encodeURIComponent(String(teamId))}/awards`;
  const qs = new URLSearchParams();
  qs.set('per_page', '250');
  if (Array.isArray(eventIds) && eventIds.length > 0) {
    for (const id of eventIds) qs.append('event[]', String(id));
  }

  let url: string | null = `${base}?${qs.toString()}`;
  const all: Award[] = [] as unknown as Award[];
  try {
    let safety = 0;
    while (url && safety < 100) {
      safety++;
      const res: Response = await fetch(url, {
        headers: { accept: 'application/json', Authorization: `Bearer ${apiKey}` },
        cache: 'no-store',
      });
  const page: { data?: Award[]; meta?: { next_page_url?: string | null }; message?: string } = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: page?.message || 'Failed to fetch awards.' }, { status: res.status });
      }
  if (Array.isArray(page?.data)) all.push(...(page.data as Award[]));
      url = page?.meta?.next_page_url || null;
    }

    // Sort for display: event id desc (proxy for recency), then order asc, then title asc
    const eid = (a: Award) => (a?.event?.id != null ? Number(a.event.id) : -1);
    const ord = (a: Award) => {
      const o = (a as unknown as { order?: number })?.order;
      return o != null ? Number(o) : Number.POSITIVE_INFINITY;
    };
  const title = (a: Award) => String(a?.title || '');
    const sorted = all.sort((a, b) => {
      const ed = eid(b) - eid(a);
      if (ed !== 0) return ed;
      const od = ord(a) - ord(b);
      if (od !== 0) return od;
      return title(a).localeCompare(title(b));
    });

    return NextResponse.json({ data: sorted });
  } catch {
    return NextResponse.json({ error: 'Error fetching awards.' }, { status: 500 });
  }
}
