import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { teamName, teamId }: { teamName?: string; teamId?: number | string } = await request.json();
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }

  if (!teamName && !teamId) {
    return NextResponse.json({ error: 'teamId or teamName is required.' }, { status: 400 });
  }

  const url = teamId
    ? `https://www.robotevents.com/api/v2/teams/${encodeURIComponent(String(teamId))}`
    : `https://www.robotevents.com/api/v2/teams?number=${encodeURIComponent(String(teamName))}`;

  try {
    const res = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: raw?.message || 'Failed to fetch team details.' }, { status: res.status });
    }
    // Normalize various upstream shapes to { data: Team[] }
    if (Array.isArray(raw?.data)) {
      return NextResponse.json(raw);
    }
    if (raw?.data && typeof raw.data === 'object') {
      return NextResponse.json({ ...raw, data: [raw.data] });
    }
    if (raw && typeof raw === 'object' && 'id' in raw) {
      return NextResponse.json({ data: [raw] });
    }
    return NextResponse.json({ data: [] });
  } catch {
    return NextResponse.json({ error: 'Error fetching team details.' }, { status: 500 });
  }
}
