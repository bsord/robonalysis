import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }
  try {
    const { searchParams } = new URL(request.url);
    // Accept either comma-separated programIds or repeated programIds
    const programIdsParam = searchParams.getAll('programIds');
    const programIds: string[] = [];
    for (const p of programIdsParam) {
      for (const piece of p.split(',')) {
        const s = piece.trim();
        if (s) programIds.push(s);
      }
    }

    // Accept either comma-separated teamIds or repeated teamIds
    const teamIdsParam = searchParams.getAll('teamIds');
    const teamIds: string[] = [];
    for (const t of teamIdsParam) {
      for (const piece of t.split(',')) {
        const s = piece.trim();
        if (s) teamIds.push(s);
      }
    }

    const qs = new URLSearchParams();
    qs.set('per_page', '250');
    qs.set('sort', 'year');
    qs.set('order', 'desc');
  for (const id of programIds) qs.append('program[]', id);
  for (const id of teamIds) qs.append('team[]', id);

    const url = `https://www.robotevents.com/api/v2/seasons?${qs.toString()}`;
    const res = await fetch(url, {
      headers: { accept: 'application/json', Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: json?.message || 'Failed to fetch seasons.' }, { status: res.status });
    }
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: 'Error fetching seasons.' }, { status: 500 });
  }
}
