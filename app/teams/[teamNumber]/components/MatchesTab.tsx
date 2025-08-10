"use client";
import { useMemo, useState } from "react";

type Match = any;

type Props = { teamId: string; matches: Match[] };

export default function MatchesTab({ teamId, matches }: Props) {
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
    const map = new Map<string, { event: any; matches: any[] }>();
    for (const m of matches || []) {
      const eid = String(m?.event?.id ?? 'unknown');
      if (!map.has(eid)) map.set(eid, { event: m?.event ?? { name: 'Unknown Event' }, matches: [m] });
      else map.get(eid)!.matches.push(m);
    }
    return Array.from(map.entries()).map(([id, g]) => ({ id, ...g }));
  }, [matches]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <section className="w-full max-w-3xl">
      {matches.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Matches</h3>
          <p className="text-slate-600 dark:text-slate-300">No matches found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => {
            const isCollapsed = !!collapsed[g.id];
            return (
              <div key={g.id} className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow">
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">{g.event?.name || 'Event'}</h3>
                    <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{g.matches.length} matches</span>
                    {/* SP/SOS removed */}
                  </div>
                  <button onClick={() => toggle(g.id)} className="text-sm px-3 py-1 rounded-lg border border-slate-300/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/40">
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>
                {!isCollapsed && (
                  <ul className="divide-y">
                    {g.matches.map((m: any) => {
                      const key = m?.id ?? `${m?.event?.id}-${m?.round}-${m?.matchnum}-${m?.instance}-${m?.scheduled || m?.started || ''}`;
                      const alliances: any[] = Array.isArray(m?.alliances) ? m.alliances : [];
                      const red = alliances.find((a) => a?.color === 'red');
                      const blue = alliances.find((a) => a?.color === 'blue');
                      const extract = (a: any) => ({
                        score: typeof a?.score === 'number' ? a.score : null,
                        teamIds: Array.isArray(a?.teams) ? a.teams.map((t: any) => t?.team?.id ?? t?.team_id ?? t?.id).filter((x: any) => x != null) : [],
                        teamNames: Array.isArray(a?.teams) ? a.teams.map((t: any) => t?.team?.name || t?.team?.number || t?.name).filter(Boolean) : [],
                        teamNumbers: Array.isArray(a?.teams) ? a.teams.map((t: any) => t?.team?.number || t?.number || '').filter(Boolean) : [],
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
                      return (
                        <li key={key} className="p-4 sm:p-5">
                          <div className="flex flex-col gap-1">
                            <div className="text-sm text-slate-600 dark:text-slate-400">{fmt(m?.started || m?.scheduled)}</div>
                            <div className="flex flex-wrap items-center gap-2">
                              {m?.division?.name && (
                                <span className="text-xs px-2 py-0.5 rounded-full border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300">{m.division.name}</span>
                              )}
                              {m?.round && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">{m.round} {m?.name ? `- ${m.name}` : ''}</span>
                              )}
                              {m?.field && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">Field: {m.field}</span>
                              )}
                              {/* SP badges removed */}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              {/* Our alliance left, opponent right */}
                              <div className={`flex items-center gap-3 ${ourOnRed ? 'text-rose-600' : 'text-sky-600'}`}>
                                <span className="font-medium">{ourLabel}</span>
                                <span className="text-slate-800 dark:text-slate-100">{ourAlliance.teamNames.join(', ') || 'TBD'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-2xl sm:text-3xl font-extrabold ${outcome === 'W' ? 'text-emerald-500' : outcome === 'L' ? 'text-rose-500' : 'text-slate-400'}`}>{ourAlliance.score ?? '-'}</span>
                                <span className="text-slate-500">-</span>
                                <span className="text-xl sm:text-2xl font-bold text-slate-300">{oppAlliance.score ?? '-'}</span>
                                <span className={`ml-3 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${outcome === 'W' ? 'bg-emerald-600/20 text-emerald-400' : outcome === 'L' ? 'bg-rose-600/20 text-rose-400' : 'bg-slate-600/20 text-slate-300'}`}>{outcome}</span>
                              </div>
                              <div className={`flex items-center gap-3 ${ourOnRed ? 'text-sky-600' : 'text-rose-600'}`}>
                                <span className="font-medium">{oppLabel}</span>
                                <span className="text-slate-800 dark:text-slate-100">{oppAlliance.teamNames.join(', ') || 'TBD'}</span>
                              </div>
                            </div>
                            {/* SOS/Underdog removed */}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
