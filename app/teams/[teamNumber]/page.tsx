import TeamHeader from "./components/TeamHeader";
import ClientTabContent from "./TabContent";
import { headers } from "next/headers";
export default async function TeamSummaryPage({
  params,
}: {
  params: Promise<{ teamNumber: string }>;
}) {
  // Await Next.js 15 async params
  const { teamNumber } = await params;
  const teamId = teamNumber; // treat the dynamic route as teamId going forward

  // Build absolute base URL for server-side fetches
  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const protocol = hdrs.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = `${protocol}://${host}`;

  // Fetch events for this team by ID
  const eventsRes = await fetch(`${baseUrl}/api/team/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId }),
    cache: "no-store",
  });
  const eventsData = await eventsRes.json();

  // Fetch team details by ID (API may return a single object; our route normalizes to array)
  const teamRes = await fetch(`${baseUrl}/api/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamId }),
    cache: "no-store",
  });
  const teamData = await teamRes.json();
  const team = Array.isArray(teamData?.data) && teamData.data.length > 0 ? teamData.data[0] : null;

  if (eventsData?.error || !team) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow-xl p-6 sm:p-8">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-rose-600 dark:text-rose-400">{eventsData?.error || "Team not found."}</p>
        </div>
      </div>
    );
  }

  // Date helpers
  const parseDate = (s?: string) => (s ? new Date(s) : null);
  const formatDate = (s?: string) => {
    const d = parseDate(s);
    if (!d || isNaN(d.getTime())) return s ?? "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const isSameDay = (a?: string, b?: string) => {
    if (!a || !b) return false;
    const da = parseDate(a);
    const db = parseDate(b);
    if (!da || !db || isNaN(da.getTime()) || isNaN(db.getTime())) return a === b;
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };

  const allEvents: any[] = Array.isArray(eventsData?.data) ? eventsData.data : [];

  // Group by season, with most recent seasons first; events inside each season newest-first
  const timeOf = (ev: any) => parseDate(ev?.start)?.getTime() ?? 0;
  const groupBySeason = (
    events: any[]
  ): Array<{ key: string; name: string; code: string; events: any[]; sortTime: number }> => {
    const map = new Map<string, { key: string; name: string; code: string; events: any[]; sortTime: number }>();
    for (const ev of events) {
      const id = ev?.season?.id != null ? String(ev.season.id) : undefined;
      const code = ev?.season?.code ?? "";
      const name = ev?.season?.name ?? "";
      const key = id || code || name || "Unknown";
      const t = timeOf(ev);
      if (!map.has(key)) {
        map.set(key, { key, name: name || code || "Unknown", code: code || name || "Unknown", events: [ev], sortTime: t });
      } else {
        const g = map.get(key)!;
        g.events.push(ev);
        g.sortTime = Math.max(g.sortTime, t); // latest event time for season ordering
      }
    }
    const groups = Array.from(map.values());
    groups.forEach((g) => g.events.sort((a, b) => timeOf(b) - timeOf(a))); // newest-first inside season
    groups.sort((a, b) => b.sortTime - a.sortTime); // most recent seasons first
    return groups;
  };
  const bySeason = groupBySeason(allEvents).map(({ sortTime, ...rest }) => rest); // strip non-serializable fields

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <TeamHeader team={team} />

  <ClientTabContent teamId={teamId} eventsCount={allEvents.length} bySeason={bySeason as any} />
    </div>
  );
}
