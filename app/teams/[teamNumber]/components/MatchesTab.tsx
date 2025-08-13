"use client";
import { useMemo } from "react";
import type { Match } from "../../../types";

type RankInfo = {
  rank: number | null;
  wins?: number | null;
  losses?: number | null;
  ties?: number | null;
  wp?: number | null;
  ap?: number | null;
  sp?: number | null;
  high_score?: number | null;
  average_points?: number | null;
  total_points?: number | null;
};
type Props = { teamId: string; matches: Match[]; eventRanks?: Record<string | number, RankInfo>; };

export default function MatchesTab({ teamId, matches, eventRanks }: Props) {
  // Performance metrics derived from matches (same logic as PerformanceTab)
  const perf = useMemo(() => {
    const list = Array.isArray(matches) ? matches : [];
    type Row = { when: number; own: number; opp: number; win: boolean; tie: boolean };
    const rows: Row[] = [];
    for (const m of list) {
      const alliances = Array.isArray(m?.alliances) ? m.alliances : [];
      let own = 0, opp = 0, found = false;
      for (const a of alliances) {
        const teams = Array.isArray(a?.teams) ? a.teams : [];
        const has = teams.some(t => String(t?.team?.id) === String(teamId));
        if (has) {
          own = typeof a?.score === 'number' ? a.score : 0;
          found = true;
        } else {
          const s = typeof a?.score === 'number' ? a.score : 0;
          opp = Math.max(opp, s);
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
    return { played, wins, losses, ties, winrate, ownAvg, oppAvg, diffAvg };
  }, [matches, teamId]);

  const fmt = (s?: string) => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  };

  // Group by event id
  const groups = useMemo(() => {
  const map = new Map<string, { event: Match["event"]; matches: Match[] }>();
    for (const m of matches || []) {
      const eid = String(m?.event?.id ?? 'unknown');
      if (!map.has(eid)) map.set(eid, { event: m?.event ?? { name: 'Unknown Event' }, matches: [m] });
      else map.get(eid)!.matches.push(m);
    }
    return Array.from(map.entries()).map(([id, g]) => ({ id, ...g }));
  }, [matches]);

  // SP removed from the match list for a cleaner UI

  // Collapsing removed to simplify the UI for long event titles

  return (
    <section className="w-full max-w-3xl">
      {/* Performance summary cards */}
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[{ label: 'Matches Played', value: perf.played.toLocaleString() },
          { label: 'Wins', value: perf.wins.toLocaleString() },
          { label: 'Losses', value: perf.losses.toLocaleString() },
          { label: 'Ties', value: perf.ties.toLocaleString() },
          { label: 'Win Rate', value: `${(perf.winrate * 100).toFixed(1)}%` },
          { label: 'Avg Own Score', value: perf.ownAvg.toFixed(1) },
          { label: 'Avg Opp Score', value: perf.oppAvg.toFixed(1) },
          { label: 'Avg Margin', value: perf.diffAvg.toFixed(1) }].map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</div>
              <div className="mt-1 text-2xl font-semibold">{m.value}</div>
            </div>
        ))}
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Matches</h3>
          <p className="text-slate-600 dark:text-slate-300">No matches found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => {
            return (
              <div key={g.id} className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow">
                <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 break-words">{g.event?.name || 'Event'}</h3>
                    {(() => {
                      const evId = g.matches?.[0]?.event?.id;
                      const info = evId != null ? eventRanks?.[evId] : undefined;
                      return typeof info?.rank === 'number' ? (
                        <div className="shrink-0 inline-flex items-center gap-2">
                          <span title="Event rank" className="text-sm sm:text-base rounded-full px-3 py-1 bg-indigo-600 text-white">Rank #{info.rank}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{g.matches.length} matches</span>
                    {(() => {
                      const evId = g.matches?.[0]?.event?.id;
                      const info = evId != null ? eventRanks?.[evId] : undefined;
                      if (!info) return null;
                      const parts: string[] = [];
                      if (info.wins != null || info.losses != null || info.ties != null) parts.push(`${info.wins ?? 0}-${info.losses ?? 0}-${info.ties ?? 0}`);
                      if (info.wp != null) parts.push(`WP ${info.wp}`);
                      if (info.ap != null) parts.push(`AP ${info.ap}`);
                      if (info.sp != null) parts.push(`SP ${info.sp}`);
                      return parts.length ? (
                        <span className="text-xs rounded-full px-2 py-0.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">{parts.join(' • ')}</span>
                      ) : null;
                    })()}
                    {(() => {
                      const evId = g.matches?.[0]?.event?.id;
                      const info = evId != null ? eventRanks?.[evId] : undefined;
                      if (!info) return null;
                      const parts2: string[] = [];
                      if (info.high_score != null) parts2.push(`HS ${info.high_score}`);
                      if (info.average_points != null) {
                        const avg = typeof info.average_points === 'number' ? info.average_points.toFixed(1) : info.average_points;
                        parts2.push(`Avg ${avg}`);
                      }
                      if (info.total_points != null) parts2.push(`TP ${info.total_points}`);
                      return parts2.length ? (
                        <span className="text-xs rounded-full px-2 py-0.5 bg-violet-600/10 text-violet-600 dark:text-violet-400">{parts2.join(' • ')}</span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <ul className="space-y-4">
                    {g.matches.map((m) => {
                      const key = m?.id ?? `${m?.event?.id}-${m?.round}-${m?.matchnum}-${m?.instance}-${m?.scheduled || m?.started || ''}`;
                      const alliances = Array.isArray(m?.alliances) ? m.alliances : [];
                      const red = alliances.find((a) => a?.color === 'red');
                      const blue = alliances.find((a) => a?.color === 'blue');
                      const extract = (a: NonNullable<Match["alliances"]>[number] | undefined) => ({
                        score: typeof a?.score === 'number' ? a.score : null,
                        teamIds: Array.isArray(a?.teams) ? a.teams.map((t) => (t?.team?.id ?? (t as { team_id?: string | number })?.team_id ?? t?.id)).filter((x): x is string | number => x != null) : [],
                        teamNames: Array.isArray(a?.teams) ? a.teams.map((t) => {
                          const n1 = t?.team?.name;
                          const n2 = t?.team?.number != null ? String(t.team.number) : undefined;
                          const n3 = (t as { name?: string })?.name;
                          return n1 || n2 || n3;
                        }).filter((v): v is string => Boolean(v)) : [],
                        teamNumbers: Array.isArray(a?.teams) ? a.teams.map((t) => {
                          const n1 = t?.team?.number;
                          const n2 = (t as { number?: string | number })?.number;
                          return n1 ?? n2 ?? '';
                        }).filter((v): v is string | number => v !== undefined && v !== '') : [],
                      });
                      const r = extract(red);
                      const b = extract(blue);
                      const ourOnRed = r.teamIds.includes(Number(teamId)) || r.teamIds.includes(String(teamId));
                      const ourAlliance = ourOnRed ? r : b;
                      const oppAlliance = ourOnRed ? b : r;
                      const ourLabel = ourOnRed ? 'Red' : 'Blue';
                      const oppLabel = ourOnRed ? 'Blue' : 'Red';
                      const ourScore = ourAlliance.score ?? 0;
                      const oppScore = oppAlliance.score ?? 0;
                      const outcome = ourAlliance.score == null || oppAlliance.score == null
                        ? 'TBD'
                        : ourScore > oppScore
                          ? 'W'
                          : ourScore < oppScore
                            ? 'L'
                            : 'T';
                      // Ensure the primary team appears first in its alliance listing
                      const primaryIdNum = Number(teamId);
                      const primaryIdStr = String(teamId);
                      const reorderNames = (names: string[], ids: Array<string | number>) => {
                        const idx = ids.findIndex((id) => Number(id) === primaryIdNum || String(id) === primaryIdStr);
                        if (idx > 0) {
                          const arr = names.slice();
                          const [item] = arr.splice(idx, 1);
                          arr.unshift(item);
                          return arr;
                        }
                        return names;
                      };
                      const ourAllianceIds = ourOnRed ? r.teamIds : b.teamIds;
                      const ourNamesOrdered = reorderNames(ourAlliance.teamNames, ourAllianceIds);
                      return (
                        <li key={key} className="p-4 sm:p-5 border-y border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/30">
                          <div className="flex flex-col gap-2">
                            {/* Header with date/metadata on left and outcome on right */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm text-slate-600 dark:text-slate-400">{fmt(m?.started || m?.scheduled)}</div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                  {m?.round && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{m?.name ? `${m.name}` : ''}</span>
                                  )}
                                  {m?.field && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Field: {m.field}</span>
                                  )}
                                </div>
                              </div>
                              <span className={`shrink-0 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${outcome === 'W' ? 'bg-emerald-600/20 text-emerald-500' : outcome === 'L' ? 'bg-rose-600/20 text-rose-500' : 'bg-slate-600/20 text-slate-400'}`}>{outcome}</span>
                            </div>
                            {/* Desktop/tablet: side-by-side */}
                            <div className="hidden sm:flex items-center justify-between gap-4">
                              <div className={`flex items-center gap-3 ${ourOnRed ? 'text-rose-600' : 'text-sky-600'}`}>
                                <span className="font-medium">{ourLabel}</span>
                                <span className="text-slate-800 dark:text-slate-100">{ourNamesOrdered.join(', ') || 'TBD'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-2xl sm:text-3xl font-extrabold ${outcome === 'W' ? 'text-emerald-500' : outcome === 'L' ? 'text-rose-500' : 'text-slate-400'}`}>{ourAlliance.score ?? '-'}</span>
                                <span className="text-slate-500">-</span>
                                <span className="text-xl sm:text-2xl font-bold text-slate-300">{oppAlliance.score ?? '-'}</span>
                                {/* Outcome is shown in header now */}
                              </div>
                              <div className={`flex items-center gap-3 ${ourOnRed ? 'text-sky-600' : 'text-rose-600'}`}>
                                <span className="font-medium">{oppLabel}</span>
                                <span className="text-slate-800 dark:text-slate-100">{oppAlliance.teamNames.join(', ') || 'TBD'}</span>
                              </div>
                            </div>
                            {/* Mobile: stacked, color-coded blocks */}
              <div className="sm:hidden space-y-2">
                <div className="px-3 py-2 flex items-center justify-between rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-medium opacity-80 ${ourOnRed ? 'text-rose-600' : 'text-sky-600'}`}>{ourLabel}</div>
                                    <div className="text-sm truncate text-slate-800 dark:text-slate-100">{ourNamesOrdered.join(', ') || 'TBD'}</div>
                                  </div>
                                  <div className={`ml-3 text-2xl font-extrabold ${outcome === 'W' ? 'text-emerald-500' : outcome === 'L' ? 'text-rose-500' : 'text-slate-400'}`}>{ourAlliance.score ?? '-'}</div>
                                </div>
                <div className="px-3 py-2 flex items-center justify-between rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-medium opacity-80 ${ourOnRed ? 'text-sky-600' : 'text-rose-600'}`}>{oppLabel}</div>
                                    <div className="text-sm truncate text-slate-800 dark:text-slate-100">{oppAlliance.teamNames.join(', ') || 'TBD'}</div>
                                  </div>
                                  <div className="ml-3 text-2xl font-extrabold text-slate-400">{oppAlliance.score ?? '-'}</div>
                              </div>
                              {/* Outcome is shown in header now; no SP */}
                            </div>
                            {/* basic result row */}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
