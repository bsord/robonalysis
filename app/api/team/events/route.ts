
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { teamId, limit }: { teamId?: number | string; limit?: number } = await request.json();
  const apiKey = process.env.ROBOT_EVENTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
  }

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required.' }, { status: 400 });
  }
  try {
  const resolvedTeamId: number | string = teamId;

    // Step 2: Fetch events for the team ID
    // Try to request newest first via common sorting params; API may ignore unknown params.
    const qs = new URLSearchParams();
    // Common patterns used by APIs; harmless if ignored
    qs.set('per_page', String(Math.max(1, Math.min(limit ?? 250, 250))));
    qs.set('sort', 'start');
    qs.set('order', 'desc');
  const eventsUrl = `https://www.robotevents.com/api/v2/teams/${resolvedTeamId}/events?${qs.toString()}`;
    const eventsRes = await fetch(eventsUrl, {
      headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });
    const eventsData = await eventsRes.json();
    if (!eventsRes.ok) {
      return NextResponse.json({ error: eventsData.message || 'Failed to fetch events.' }, { status: eventsRes.status });
    }
    // Fallback: ensure newest-first ordering and optional limiting on the server
    if (Array.isArray(eventsData?.data)) {
      const sorted = [...eventsData.data].sort((a: any, b: any) => {
        const at = a?.start ? new Date(a.start).getTime() : 0;
        const bt = b?.start ? new Date(b.start).getTime() : 0;
        return bt - at;
      });
      const sliced = typeof limit === 'number' && limit > 0 ? sorted.slice(0, limit) : sorted;
      return NextResponse.json({ ...eventsData, data: sliced });
    }
    return NextResponse.json(eventsData);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching team or events.' }, { status: 500 });
  }
}
