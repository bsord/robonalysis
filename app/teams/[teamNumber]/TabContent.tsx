"use client";
import { useEffect, useMemo, useState } from "react";
// GraphDropdown must be outside the main component to use hooks
import dynamic from "next/dynamic";
const AverageMarginGraph = dynamic(() => import("./components/AverageMarginGraph"), { ssr: false });
import SeedBarGraph from "./components/SeedBarGraph";

import Tabs, { TabKey } from "./components/Tabs";
import EventsTab from "./components/EventsTab";
import MatchesTab from "./components/MatchesTab";
import SkillsTab from "./components/SkillsTab";
import AwardsTab from "./components/AwardsTab";
import SeasonPicker from "./components/SeasonPicker";
import type { SeasonGroup, Match, SkillRow, Award, Event } from "../../types";

function GraphDropdown({ matches, teamId, eventRanks }: { matches: Match[]; teamId: string; eventRanks: Record<string, { rank: number | null }> }) {
  const [selected, setSelected] = useState("margin");
  return (
    <>
      <label className="mb-4 w-full max-w-xs">
        <span className="block text-sm font-medium mb-2">Select Data</span>
        <select
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="margin">Average Margin</option>
          <option value="score">Placement</option>
          <option value="skills">Skills Points</option>
        </select>
      </label>
      <div className="w-full h-96 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 mt-8">
        {selected === "margin" ? (
          <AverageMarginGraph matches={matches} teamId={teamId} />
        ) : selected === "score" ? (
          <SeedBarGraph matches={matches} teamId={teamId} eventRanks={eventRanks} />
        ) : (
          <span className="text-slate-400 text-xl">[Placeholder Graph]</span>
        )}
      </div>
    </>
  );
}

type Props = {
  teamId: string;
  eventsCount: number;
  bySeason: SeasonGroup[];
  programId?: number;
};

export default function ClientTabContent({ teamId, eventsCount, bySeason, programId }: Props) {
  const [active, setActive] = useState<TabKey>("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loadingAwards, setLoadingAwards] = useState(false);
  const [awardsError, setAwardsError] = useState<string | null>(null);
  // seasonId is driven by SeasonPicker (which fetches seasons by program and selects the most recent)
  const [seasonId, setSeasonId] = useState<string | undefined>(undefined);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventRanks, setEventRanks] = useState<Record<string, { rank: number | null; wins?: number | null; losses?: number | null; ties?: number | null; wp?: number | null; ap?: number | null; sp?: number | null; high_score?: number | null; average_points?: number | null; total_points?: number | null }>>({});
  // Derived: eventId -> divisionId (from matches once we have them)
  // Removed unused eventDivisionMap to satisfy lint

  // Stable derived eventIds for deps
  const eventIds = useMemo(() => {
    return Array.isArray(events)
      ? events
          .map((e) => e?.id)
          .filter((id): id is string | number => id != null)
      : [];
  }, [events]);

  // Fetch matches after events are loaded and when the season changes (regardless of active tab)
  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      if (!seasonId) return; // wait for a selected season
      // Use the season-scoped events to determine eventIds
      if (eventIds.length === 0) return;
      try {
        setLoadingMatches(true);
        setMatchesError(null);
        const res = await fetch(`/api/team/matches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, eventIds }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch matches");
        if (!ctrl.signal.aborted) setMatches(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Failed to fetch matches";
        setMatchesError(msg);
      } finally {
        if (!ctrl.signal.aborted) setLoadingMatches(false);
      }
    };
    load();
    return () => ctrl.abort();
  }, [teamId, seasonId, eventIds]);

  // Fetch skills after events are loaded (use same eventIds filter)
  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      if (!seasonId) return;
      if (eventIds.length === 0) return;
      try {
        setLoadingSkills(true);
        setSkillsError(null);
        const res = await fetch(`/api/team/skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, eventIds }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch skills");
        if (!ctrl.signal.aborted) setSkills(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Failed to fetch skills";
        setSkillsError(msg);
      } finally {
        if (!ctrl.signal.aborted) setLoadingSkills(false);
      }
    };
    load();
    return () => ctrl.abort();
  }, [teamId, seasonId, eventIds]);

  // Fetch awards after events are loaded (use same eventIds filter)
  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      if (!seasonId) return;
      if (eventIds.length === 0) return;
      try {
        setLoadingAwards(true);
        setAwardsError(null);
        const res = await fetch(`/api/team/awards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, eventIds }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch awards");
        if (!ctrl.signal.aborted) setAwards(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Failed to fetch awards";
        setAwardsError(msg);
      } finally {
        if (!ctrl.signal.aborted) setLoadingAwards(false);
      }
    };
    load();
    return () => ctrl.abort();
  }, [teamId, seasonId, eventIds]);

  // Fetch events whenever the selected season changes (not gated by tab)
  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      if (!seasonId) return; // wait for season selection from SeasonPicker
      try {
        setEventsLoading(true);
        setEventsError(null);
        const res = await fetch(`/api/team/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId, seasonId, includeRank: false }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch events");
        if (!ctrl.signal.aborted) setEvents(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (ctrl.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Failed to fetch events";
        setEventsError(msg);
      } finally {
        if (!ctrl.signal.aborted) setEventsLoading(false);
      }
    };
    load();
    return () => ctrl.abort();
  }, [teamId, seasonId]);

  // Fetch all rankings for this team (optionally filtered by season) in a single call
  useEffect(() => {
    const ctrl = new AbortController();
    const load = async () => {
      try {
        if (!teamId) return;
        const res = await fetch('/api/team/rankings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId, seasonId }),
          signal: ctrl.signal,
        });
  const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to fetch rankings');
        const map = (json?.data && typeof json.data === 'object') ? json.data : {};
        if (!ctrl.signal.aborted) setEventRanks(map);
  } catch {
        if (ctrl.signal.aborted) return;
        // Leave existing state; consumers will simply not show rank badges
      }
    };
    load();
    return () => ctrl.abort();
  }, [teamId, seasonId]);

  // Group events by season (client-side)
  const timeOf = (ev: Event) => (ev?.start ? new Date(ev.start).getTime() : 0);
  const groups = ((): SeasonGroup[] => {
    const list = Array.isArray(events) && events.length > 0 ? events : (Array.isArray(bySeason) ? bySeason.flatMap(g => g.events) : []);
    const map = new Map<string, { key: string; name: string; code: string; events: Event[]; sortTime: number }>();
    for (const ev of list) {
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
        g.sortTime = Math.max(g.sortTime, t);
      }
    }
  const arr = Array.from(map.values());
    arr.forEach(g => g.events.sort((a, b) => timeOf(b) - timeOf(a)));
    arr.sort((a, b) => b.sortTime - a.sortTime);
  // Return without the transient sortTime without binding an unused variable
  return arr.map((g) => ({ key: g.key, name: g.name, code: g.code, events: g.events }));
  })();

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
  const isUpcoming = (ev: Event) => {
    const end = parseDate(ev?.end);
    const start = parseDate(ev?.start);
    if (end && !isNaN(end.getTime())) return dateOnly(end) >= today;
    if (start && !isNaN(start.getTime())) return dateOnly(start) >= today;
    return false;
  };
  const isCompleted = (ev: Event) => !isUpcoming(ev);

  // Build map of eventId -> rank/division for quick access in MatchesTab
  // eventRanks state is populated lazily via the effect above

  return (
    <>
    <div className="w-full">
      <SeasonPicker initialSeasonId={seasonId} programId={programId} teamId={teamId} onChange={setSeasonId} />
    </div>
    <div className="-mt-2 w-full">
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
      { key: "matches", label: "Matches", count: Array.isArray(matches) ? matches.length : undefined },
      { key: "skills", label: "Skills", count: Array.isArray(skills) ? skills.length : undefined },
      { key: "awards", label: "Awards", count: Array.isArray(awards) ? awards.length : undefined },
      { key: "events", label: "Events", count: (Array.isArray(events) && events.length) || eventsCount },
  { key: "graphs", label: "Graphs" },
        ]}
      />
    </div>
      <div className="mt-4">
        {active === "events" && (
          eventsLoading ? (
            <section className="w-full max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
                <h3 className="text-xl font-semibold mb-2">Events</h3>
                <p className="text-slate-600 dark:text-slate-300">Loading events…</p>
              </div>
            </section>
          ) : eventsError ? (
            <section className="w-full max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
                <h3 className="text-xl font-semibold mb-2">Events</h3>
                <p className="text-rose-600 dark:text-rose-400">{eventsError}</p>
              </div>
            </section>
          ) : (
            <EventsTab groups={groups} isCompleted={isCompleted} formatDate={formatDate} isSameDay={isSameDay} />
          )
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
            <MatchesTab teamId={teamId} matches={matches} eventRanks={eventRanks} />
          )
        )}
  {active === "skills" && (
          loadingSkills ? (
            <section className="w-full max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
                <h3 className="text-xl font-semibold mb-2">Skills</h3>
                <p className="text-slate-600 dark:text-slate-300">Loading skills…</p>
              </div>
            </section>
          ) : skillsError ? (
            <section className="w-full max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
                <h3 className="text-xl font-semibold mb-2">Skills</h3>
                <p className="text-rose-600 dark:text-rose-400">{skillsError}</p>
              </div>
            </section>
          ) : (
            <SkillsTab skills={skills} />
          )
        )}
        {active === "awards" && (
          loadingAwards ? (
            <section className="w-full max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
                <h3 className="text-xl font-semibold mb-2">Awards</h3>
                <p className="text-slate-600 dark:text-slate-300">Loading awards…</p>
              </div>
            </section>
          ) : awardsError ? (
            <section className="w-full max-w-3xl">
              <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
                <h3 className="text-xl font-semibold mb-2">Awards</h3>
                <p className="text-rose-600 dark:text-rose-400">{awardsError}</p>
              </div>
            </section>
          ) : (
            <AwardsTab awards={awards} />
          )
        )}
        
      {active === "graphs" && (
        <section className="w-full max-w-3xl">
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
            <h3 className="text-xl font-semibold mb-2">Graphs</h3>
            <GraphDropdown matches={matches} teamId={teamId} eventRanks={eventRanks} />
          </div>
        </section>
      )}

      </div>
    </>
  );
}
