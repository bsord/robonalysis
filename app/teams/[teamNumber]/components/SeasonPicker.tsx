"use client";
import { useEffect, useState } from 'react';

type Season = { id: number; name: string; code?: string | null; year?: number };

type Props = {
  initialSeasonId?: string;
  programId?: string | number;
  teamId?: string | number;
  onChange: (seasonId?: string) => void;
};

export default function SeasonPicker({ initialSeasonId, programId, teamId, onChange }: Props) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | undefined>(initialSeasonId);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        // Prefer team-scoped seasons when teamId is provided; fallback to program filter
        if (teamId != null) {
          qs.append('teamIds', String(teamId));
        } else if (programId != null) {
          qs.append('programIds', String(programId));
        }
        const res = await fetch(`/api/seasons?${qs.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch seasons');
        const list: Season[] = Array.isArray(data?.data) ? data.data : [];
        setSeasons(list);
        // Default selection to the first (most recent) when not provided
        if (!initialSeasonId && list.length > 0) {
          setSelected(String(list[0].id));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch seasons';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
    // We intentionally exclude initialSeasonId to avoid refetching seasons
    // when the selected season changes upstream.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId, teamId]);

  useEffect(() => {
    onChange(selected);
  }, [selected, onChange]);

  return (
  <div className="mb-4 w-full">
      {loading ? (
        <span className="text-sm text-slate-500">Loading…</span>
      ) : error ? (
        <span className="text-sm text-rose-600">{error}</span>
      ) : (
  <div className="relative w-full">
        <select
          className="block w-full appearance-none text-base sm:text-lg rounded-xl border border-slate-300/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 backdrop-blur pr-10 pl-3 py-2.5 sm:py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          value={selected ?? ''}
          onChange={(e) => setSelected(e.target.value || undefined)}
        >
          <option value="">All seasons</option>
          {seasons.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </span>
        </div>
      )}
    </div>
  );
}
