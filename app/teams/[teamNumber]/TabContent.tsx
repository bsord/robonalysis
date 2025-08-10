"use client";
import { useEffect, useState } from "react";
import Tabs, { TabKey } from "./components/Tabs";
import EventsTab from "./components/EventsTab";
import MatchesTab from "./components/MatchesTab";
import AnalysisTab from "./components/AnalysisTab";

type Props = {
  teamId: string;
  eventsCount: number;
  bySeason: Array<{ key: string; name: string; code: string; events: any[] }>;
};

export default function ClientTabContent({ teamId, eventsCount, bySeason }: Props) {
  const [active, setActive] = useState<TabKey>("events");
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // Fetch matches on-demand when user switches to Matches
  useEffect(() => {
    const load = async () => {
      if (active !== "matches" || matches.length > 0 || loadingMatches) return;
      try {
        setLoadingMatches(true);
        setMatchesError(null);
  const res = await fetch(`/api/team/matches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch matches");
  setMatches(Array.isArray(data?.data) ? data.data : []);
      } catch (e: any) {
        setMatchesError(e?.message || "Failed to fetch matches");
      } finally {
        setLoadingMatches(false);
      }
    };
    load();
  }, [active, teamId]);

  // Date helpers (client-side)
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
  const dateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = dateOnly(new Date());
  const isUpcoming = (ev: any) => {
    const end = parseDate(ev?.end);
    const start = parseDate(ev?.start);
    if (end && !isNaN(end.getTime())) return dateOnly(end) >= today;
    if (start && !isNaN(start.getTime())) return dateOnly(start) >= today;
    return false;
  };
  const isCompleted = (ev: any) => !isUpcoming(ev);

  return (
    <>
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
          { key: "events", label: "Events", count: eventsCount },
          { key: "matches", label: "Matches" },
          { key: "analysis", label: "Analysis" },
        ]}
      />
      <div className="mt-4">
        {active === "events" && (
          <EventsTab groups={bySeason} isCompleted={isCompleted} formatDate={formatDate} isSameDay={isSameDay} />
        )}
        {active === "matches" && (
          loadingMatches ? (
            <section className="w-full max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
                <h3 className="text-xl font-semibold mb-2">Matches</h3>
                <p className="text-slate-600 dark:text-slate-300">Loading matches…</p>
              </div>
            </section>
          ) : matchesError ? (
            <section className="w-full max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
                <h3 className="text-xl font-semibold mb-2">Matches</h3>
                <p className="text-rose-600 dark:text-rose-400">{matchesError}</p>
              </div>
            </section>
          ) : (
            <MatchesTab teamId={teamId} matches={matches} />
          )
        )}
        {active === "analysis" && <AnalysisTab />}
      </div>
    </>
  );
}
