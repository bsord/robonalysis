"use client";
import { useMemo, useState } from "react";
import type { Award } from "../../../types";

type Props = { awards: Award[] };

export default function AwardsTab({ awards }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, { event: Award["event"]; awards: Award[] }>();
    for (const a of Array.isArray(awards) ? awards : []) {
      const eid = String(a?.event?.id ?? 'unknown');
      const ev = a?.event ?? { name: 'Unknown Event' };
      if (!map.has(eid)) map.set(eid, { event: ev, awards: [a] });
      else map.get(eid)!.awards.push(a);
    }
    return Array.from(map.entries()).map(([id, g]) => ({ id, ...g }));
  }, [awards]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  return (
    <section className="w-full max-w-3xl">
      {(!awards || awards.length === 0) ? (
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow p-6">
          <h3 className="text-xl font-semibold mb-2">Awards</h3>
          <p className="text-slate-600 dark:text-slate-300">No awards found for the selected season.</p>
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
                    <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{g.awards.length} awards</span>
                  </div>
                  <button onClick={() => toggle(g.id)} className="text-sm px-3 py-1 rounded-lg border border-slate-300/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800/40">
                    {isCollapsed ? 'Expand' : 'Collapse'}
                  </button>
                </div>
                {!isCollapsed && (
                  <ul className="divide-y">
                    {g.awards.map((a, idx: number) => (
                      <li key={a?.id ?? idx} className="p-4 sm:p-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{a?.title || 'Award'}</span>
                            {a?.designation && (
                              <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{String(a.designation)}</span>
                            )}
                            {a?.classification && (
                              <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{String(a.classification)}</span>
                            )}
                          </div>
                          {Array.isArray(a?.teamWinners) && a.teamWinners.length > 0 && (
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-medium">Team Winners:</span>
                              <ul className="mt-1 ml-4 list-disc">
                                {a.teamWinners.map((tw, i: number) => (
                                  <li key={i}>
                                    {tw?.team?.name || tw?.team?.code || 'Team'}
                                    {tw?.division?.name ? ` — ${tw.division.name}` : ''}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(a?.individualWinners) && a.individualWinners.length > 0 && (
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              <span className="font-medium">Individuals:</span>
                              <span> {a.individualWinners.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
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
