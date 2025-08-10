import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { teamId }: { teamId?: number | string } = await request.json();
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required.' }, { status: 400 });
  }

  // Fetch all pages of matches for this team; then sort newest-first server-side
  const base = `https://www.robotevents.com/api/v2/teams/${encodeURIComponent(String(teamId))}/matches`;
  let url: string | null = `${base}?per_page=250&sort=started&order=desc`;
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
        return NextResponse.json({ error: page?.message || 'Failed to fetch matches.' }, { status: res.status });
      }
      if (Array.isArray(page?.data)) all.push(...page.data);
      url = page?.meta?.next_page_url || null;
    }

    const timeOf = (m: any) => {
      const t = m?.updated_at || m?.started || m?.scheduled;
      return t ? new Date(t).getTime() : 0;
    };
    // Deduplicate by match id, keeping the most recently updated
    const byId = new Map<string | number, any>();
    for (const m of all) {
      const id = (m && m.id != null) ? m.id : `${m?.event?.id ?? 'ev'}-${m?.round ?? 'r'}-${m?.matchnum ?? 'n'}-${m?.instance ?? 'i'}`;
      const prev = byId.get(id);
      if (!prev || timeOf(m) >= timeOf(prev)) byId.set(id, m);
    }
    const deduped = Array.from(byId.values());
    const sorted = deduped.sort((a, b) => timeOf(b) - timeOf(a));
    return NextResponse.json({ data: sorted });
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching matches.' }, { status: 500 });
  }
}
