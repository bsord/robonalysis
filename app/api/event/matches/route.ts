import { NextResponse } from 'next/server';

// Cache event matches across requests with a 15-minute TTL; persist across HMR using globalThis
type Match = any;
type CacheEntry = { expires: number; data: Match[] };
const FIFTEEN_MIN = 15 * 60 * 1000;
const globalForCache = globalThis as unknown as { __robonalysisEventCache?: Map<string, CacheEntry> };
if (!globalForCache.__robonalysisEventCache) {
  globalForCache.__robonalysisEventCache = new Map();
}
const eventCache = globalForCache.__robonalysisEventCache;

export async function POST(request: Request) {
  const { eventId }: { eventId?: number | string } = await request.json();
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }
  if (!eventId) {
    return NextResponse.json({ error: 'eventId is required.' }, { status: 400 });
  }

  const cacheKey = String(eventId);
  const now = Date.now();
  const cached = eventCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return NextResponse.json({ data: cached.data });
  }

  const base = `https://www.robotevents.com/api/v2/events/${encodeURIComponent(String(eventId))}/matches`;
  let url: string | null = `${base}?per_page=250&sort=started&order=asc`;
  const all: any[] = [];
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
      const page: any = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: page?.message || 'Failed to fetch event matches.' }, { status: res.status });
      }
      if (Array.isArray(page?.data)) all.push(...page.data);
      url = page?.meta?.next_page_url || null;
    }

    const timeOf = (m: any) => {
      const t = m?.started || m?.scheduled || m?.updated_at;
      return t ? new Date(t).getTime() : 0;
    };
    // Deduplicate by id keeping latest
    const byId = new Map<string | number, any>();
    for (const m of all) {
      const id = (m && m.id != null) ? m.id : `${m?.event?.id ?? 'ev'}-${m?.round ?? 'r'}-${m?.matchnum ?? 'n'}-${m?.instance ?? 'i'}`;
      const prev = byId.get(id);
      if (!prev || timeOf(m) >= timeOf(prev)) byId.set(id, m);
    }
  const deduped = Array.from(byId.values());
  // Return ascending for easier chronological processing client-side
  const sortedAsc = deduped.sort((a, b) => timeOf(a) - timeOf(b));
  eventCache.set(cacheKey, { expires: now + FIFTEEN_MIN, data: sortedAsc });
  return NextResponse.json({ data: sortedAsc });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching event matches.' }, { status: 500 });
  }
}
