"use client";
import { useMemo } from "react";
import type { Match } from "../../../types";

export type PerformanceTabProps = {
  teamId: string | number;
  matches: Match[];
};

type Metric = { label: string; value: string; hint?: string };

function toNum(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : 0;
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function format(n: number): string {
  return n.toLocaleString();
}

// Tiny inline sparkline chart for an array of numbers
function Sparkline({ data, color = "#4f46e5" }: { data: number[]; color?: string }) {
  const width = 200;
  const height = 48;
  if (!data.length) return <svg width={width} height={height} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const norm = (v: number) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
  const step = width / Math.max(1, data.length - 1);
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${norm(v)}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={d} stroke={color} strokeWidth={2} fill="none" />
    </svg>
  );
}

export default function PerformanceTab({ teamId, matches }: PerformanceTabProps) {
  const stats = useMemo(() => {
    const list = Array.isArray(matches) ? matches : [];

    // derive per-match scores for the team
    type Row = { when: number; own: number; opp: number; win: boolean; tie: boolean };
    const rows: Row[] = [];

    for (const m of list) {
      const alliances = Array.isArray(m?.alliances) ? m.alliances : [];
      let own = 0, opp = 0, found = false;
      for (const a of alliances) {
        const teams = Array.isArray(a?.teams) ? a.teams : [];
        const has = teams.some(t => String(t?.team?.id) === String(teamId));
        if (has) {
          own = toNum(a?.score);
          found = true;
        } else {
          opp = Math.max(opp, toNum(a?.score));
        }
      }
      if (!found) continue;
      const whenStr = m?.started || m?.scheduled || m?.updated_at;
      const when = whenStr ? new Date(whenStr).getTime() : 0;
      const win = own > opp;
      const tie = own === opp;
      rows.push({ when, own, opp, win, tie });
    }

    const played = rows.length;
    const wins = rows.filter(r => r.win).length;
    const losses = rows.filter(r => !r.win && !r.tie).length;
    const ties = rows.filter(r => r.tie).length;
    const winrate = played ? wins / played : 0;

    const ownAvg = played ? rows.reduce((s, r) => s + r.own, 0) / played : 0;
    const oppAvg = played ? rows.reduce((s, r) => s + r.opp, 0) / played : 0;
    const diffAvg = ownAvg - oppAvg;

    // timeline series (sorted by time)
    const sorted = rows.slice().sort((a, b) => a.when - b.when);
    const ownSeries = sorted.map(r => r.own);
    const oppSeries = sorted.map(r => r.opp);
    const diffSeries = sorted.map(r => r.own - r.opp);

    // recent form: last 10
    const last = sorted.slice(-10);
    const lastWins = last.filter(r => r.win).length;

    return {
      played, wins, losses, ties, winrate,
      ownAvg, oppAvg, diffAvg,
      ownSeries, oppSeries, diffSeries,
      lastWins,
    };
  }, [matches, teamId]);

  const metrics: Metric[] = [
    { label: "Matches Played", value: format(stats.played) },
    { label: "Wins", value: format(stats.wins) },
    { label: "Losses", value: format(stats.losses) },
    { label: "Ties", value: format(stats.ties) },
    { label: "Win Rate", value: pct(stats.winrate) },
    { label: "Avg Own Score", value: stats.ownAvg.toFixed(1) },
    { label: "Avg Opp Score", value: stats.oppAvg.toFixed(1) },
    { label: "Avg Margin", value: stats.diffAvg.toFixed(1), hint: "Own - Opp" },
  ];

  return (
    <section className="w-full">
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</div>
            <div className="mt-1 text-2xl font-semibold">{m.value}</div>
            {m.hint && <div className="text-xs text-slate-500 dark:text-slate-400">{m.hint}</div>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
          <h4 className="text-lg font-semibold mb-2">Own Score Trend</h4>
          <Sparkline data={stats.ownSeries} />
        </div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
          <h4 className="text-lg font-semibold mb-2">Opponent Score Trend</h4>
          <Sparkline data={stats.oppSeries} color="#ef4444" />
        </div>
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
          <h4 className="text-lg font-semibold mb-2">Margin Trend</h4>
          <Sparkline data={stats.diffSeries} color="#10b981" />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
        <h4 className="text-lg font-semibold mb-2">Recent Form (last 10)</h4>
        <p className="text-slate-700 dark:text-slate-300">{stats.lastWins} wins in last 10.</p>
      </div>
    </section>
  );
}
