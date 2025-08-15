"use client";
import { useMemo, useState } from "react";
import type { SkillRow } from "../../../types";

type Props = { skills: SkillRow[] };

export type EventSkills = {
  eventId: number;
  eventName?: string;
  rank?: number;
  driver?: { score: number; attempts?: number };
  programming?: { score: number; attempts?: number };
  total: number;
};

export default function SkillsTab({ skills }: Props) {
  const grouped = useMemo<EventSkills[]>(() => {
  const rows = Array.isArray(skills) ? skills : [] as SkillRow[];
    const map = new Map<number, EventSkills>();
  for (const s of rows) {
      const evId = Number(s?.event?.id);
      if (!Number.isFinite(evId)) continue;
      const existing = map.get(evId);
      const entry: EventSkills = existing ?? { eventId: evId, eventName: s?.event?.name, total: 0 };
      // rank: store once (prefer the first seen)
      if (entry.rank == null && s?.rank != null) entry.rank = Number(s.rank);
      const score = Number(s?.score ?? 0) || 0;
      const attempts = s?.attempts != null ? Number(s.attempts) : undefined;
      if (s?.type === "driver") {
        // keep the best score
        if (!entry.driver || score > entry.driver.score) entry.driver = { score, attempts };
      } else if (s?.type === "programming") {
        if (!entry.programming || score > entry.programming.score) entry.programming = { score, attempts };
      } else {
        // ignore other types for total for now
      }
      map.set(evId, entry);
    }
    // compute total = driver + programming
    const list = Array.from(map.values()).map((e) => ({
      ...e,
      total: (e.driver?.score || 0) + (e.programming?.score || 0),
    }));
    // Sort by event id desc (proxy for recency) then rank asc
    list.sort((a, b) => {
      if (b.eventId !== a.eventId) return b.eventId - a.eventId;
      const ra = a.rank ?? Number.POSITIVE_INFINITY;
      const rb = b.rank ?? Number.POSITIVE_INFINITY;
      return ra - rb;
    });
    return list;
  }, [skills]);

  const stats = useMemo(() => {
    const events = grouped.length;
    if (!events) {
      return {
        events: 0,
        bestTotal: 0,
        avgTotal: 0,
        bestDriver: 0,
        avgDriver: 0,
        bestProg: 0,
        avgProg: 0,
        bestRank: undefined as number | undefined,
      };
    }
    const totals = grouped.map(g => g.total);
    const drivers = grouped.map(g => g.driver?.score).filter((v): v is number => typeof v === 'number');
    const progs = grouped.map(g => g.programming?.score).filter((v): v is number => typeof v === 'number');
    const ranks = grouped.map(g => g.rank).filter((v): v is number => typeof v === 'number' && isFinite(v));
    const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);
    const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
    return {
      events,
      bestTotal: Math.max(...totals, 0),
      avgTotal: avg(totals),
      bestDriver: drivers.length ? Math.max(...drivers) : 0,
      avgDriver: avg(drivers),
      bestProg: progs.length ? Math.max(...progs) : 0,
      avgProg: avg(progs),
      bestRank: ranks.length ? Math.min(...ranks) : undefined,
    };
  }, [grouped]);

  const metrics: { label: string; value: string; hint?: string }[] = useMemo(() => [
    { label: 'Events with Skills', value: String(stats.events) },
    { label: 'Best Total', value: String(stats.bestTotal) },
    { label: 'Avg Total', value: stats.avgTotal.toFixed(1) },
    { label: 'Best Driver', value: String(stats.bestDriver) },
    { label: 'Avg Driver', value: stats.avgDriver.toFixed(1) },
    { label: 'Best Programming', value: String(stats.bestProg) },
    { label: 'Avg Programming', value: stats.avgProg.toFixed(1) },
    { label: 'Best Rank', value: stats.bestRank != null ? String(stats.bestRank) : '-' },
  ], [stats]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <section className="w-full max-w-3xl">
      {grouped.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Skills</h3>
          <p className="text-slate-600 dark:text-slate-300">No skills found for the selected season.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</div>
                <div className="mt-1 text-2xl font-semibold">{m.value}</div>
                {m.hint && <div className="text-xs text-slate-500 dark:text-slate-400">{m.hint}</div>}
              </div>
            ))}
          </div>

          {grouped.map((e) => {
            const id = String(e.eventId);
            const isCollapsed = !!collapsed[id];
            return (
              <div key={id} className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow">
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">{e.eventName || 'Event'}</h3>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Rank {e.rank ?? '-'}</span>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Total {e.total}</span>
                  </div>
                  <button onClick={() => toggle(id)} className="text-sm px-3 py-1 rounded-lg border border-slate-300/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/40">
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Driver</span>
                        <span className="text-slate-900 dark:text-slate-100">{e.driver?.score ?? '-'}</span>
                        {e.driver?.attempts != null && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">({e.driver.attempts} att)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Programming</span>
                        <span className="text-slate-900 dark:text-slate-100">{e.programming?.score ?? '-'}</span>
                        {e.programming?.attempts != null && (
                          <span className="text-xs text-slate-500 dark:text-slate-400">({e.programming.attempts} att)</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
