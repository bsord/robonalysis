"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import type { Match, Team, Alliance, MatchTeamRef } from "../../../types";

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
  // Popup state for team quick info
  const [popupTeamId, setPopupTeamId] = useState<string | number | null>(null);
  const [popupTeamNumber, setPopupTeamNumber] = useState<string | number | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [popupData, setPopupData] = useState<Team | null>(null);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
    setPopupTeamId(null);
    setPopupTeamNumber(null);
    setPopupData(null);
    setPopupError(null);
  }, []);

  const openTeamPopup = useCallback((id: string | number | null, numberVal: string | number | null) => {
    if (!id && !numberVal) return;
    setPopupTeamId(id ?? numberVal);
    setPopupTeamNumber(numberVal ?? id);
    setPopupOpen(true);
  }, []);

  useEffect(() => {
    if (!popupOpen || (!popupTeamId && !popupTeamNumber)) return;
    let cancelled = false;
    (async () => {
      setPopupLoading(true);
      setPopupError(null);
      setPopupData(null);
      try {
  const body: Record<string, string | number | null> = popupTeamId ? { teamId: popupTeamId } : { teamName: popupTeamNumber };
        const res = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setPopupError(json?.error || 'Failed to load team info');
        } else {
          const first = Array.isArray(json?.data) ? json.data[0] as Team : null;
          setPopupData(first);
        }
      } catch {
        if (!cancelled) setPopupError('Network error');
      } finally {
        if (!cancelled) setPopupLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [popupOpen, popupTeamId, popupTeamNumber]);

  useEffect(() => {
    if (!popupOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePopup(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popupOpen, closePopup]);

  const renderTeamName = (t: MatchTeamRef, primary: boolean) => {
    const id = t?.team?.id ?? t?.team_id ?? t?.id ?? null;
  const numberVal = t?.team?.number ?? t?.team_id ?? t?.id ?? null;
  const display = t?.team?.name ?? (numberVal != null ? String(numberVal) : undefined) ?? 'Unknown';
    const isCurrent = id != null && String(id) === String(teamId);
    return (
      <button
        key={`${id ?? display}`}
        type="button"
        onClick={(e) => { e.stopPropagation(); openTeamPopup(id, numberVal); }}
        className={`underline decoration-dotted underline-offset-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 rounded px-0.5 ${primary ? 'font-semibold' : ''} ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'hover:text-indigo-600 dark:hover:text-indigo-400'}`}
        title={isCurrent ? 'This team (currently viewed)' : 'View quick info'}
      >{display}</button>
    );
  };

  const renderAllianceNames = (alliance: Alliance | undefined, reorderForTeamId: string | number) => {
    if (!alliance) return null;
  const teams: MatchTeamRef[] = Array.isArray(alliance?.teams) ? alliance.teams.slice() : [];
    // Reorder so the current page team is first if present
    const idx = teams.findIndex(t => String(t?.team?.id ?? t?.team_id ?? t?.id) === String(reorderForTeamId));
    if (idx > 0) {
      const [it] = teams.splice(idx, 1);
      teams.unshift(it);
    }
    return teams.map((t, i) => (
      <span key={i} className="whitespace-nowrap">
        {renderTeamName(t, String(t?.team?.id ?? t?.team_id ?? t?.id) === String(reorderForTeamId))}{i < teams.length - 1 ? <span className="text-slate-400">, </span> : null}
      </span>
    ));
  };
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

  // Group by event id, then by round code inside each event
  const groups = useMemo(() => {
    // Base labels (some overridden dynamically below)
    const ROUND_LABELS: Record<string, string> = {
      '0': 'Unspecified',
      '1': 'Practice',
      '2': 'Qualifications',
      '6': 'Round of 16',
      '3': 'Quarterfinals',
      '4': 'Semifinals',
      '5': 'Finals',
    };
    const getRoundLabel = (roundKey: string, sampleMatch?: Match): string => {
      if (roundKey === '6') {
        // Always treat code 6 as Round of 16 (first elimination stage with 16 alliances)
        return 'Round of 16';
      }
      return ROUND_LABELS[roundKey] || (typeof sampleMatch?.name === 'string' && sampleMatch.name.trim() !== '' ? sampleMatch.name : `Round ${roundKey}`);
    };
    const map = new Map<string, { event: Match["event"]; rounds: Array<{ round: string; label: string; matches: Match[] }> }>();
    for (const m of matches || []) {
      const eid = String(m?.event?.id ?? 'unknown');
      if (!map.has(eid)) map.set(eid, { event: m?.event ?? { name: 'Unknown Event' }, rounds: [] });
      const container = map.get(eid)!;
      const roundKeyRaw = m?.round;
      const roundKey = roundKeyRaw == null || roundKeyRaw === '' ? '0' : String(roundKeyRaw);
      let roundEntry = container.rounds.find(r => r.round === roundKey);
      if (!roundEntry) {
        const dynamic = getRoundLabel(roundKey, m);
        const label = dynamic || (typeof m?.name === 'string' && m.name.trim() !== '' ? m.name : `Round ${roundKey}`);
        roundEntry = { round: roundKey, label, matches: [] };
        container.rounds.push(roundEntry);
      }
      roundEntry.matches.push(m);
    }
    // Sort rounds within each event numerically by code while keeping unknown ('0') first
    for (const [, g] of map) {
      // Custom ordering: Unknown (0), Practice (1), Qualifications (2), Round of 16 (6), Quarterfinals (3), Semifinals (4), Finals (5), others afterwards
      const ORDER: Record<string, number> = { '0': 0, '1': 10, '2': 20, '6': 30, '3': 40, '4': 50, '5': 60 };
      g.rounds.sort((a, b) => {
        const oa = ORDER[a.round] ?? (Number.isFinite(Number(a.round)) ? Number(a.round) + 1000 : 9999);
        const ob = ORDER[b.round] ?? (Number.isFinite(Number(b.round)) ? Number(b.round) + 1000 : 9999);
        if (oa === ob) return a.round.localeCompare(b.round);
        return oa - ob;
      });
      // Within each round, preserve existing (API provided) order (already newest-first overall) or optionally sort by match number
      for (const r of g.rounds) {
        r.matches.sort((a, b) => {
          const aNum = Number(a?.matchnum);
          const bNum = Number(b?.matchnum);
          if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
          return 0; // leave as-is if not numeric
        });
  // No dynamic rename; elimination Grand Finals not represented by round code 6 here.
      }
    }
    const computePlacement = (g: { rounds: { round: string; matches: Match[]; label: string }[] }) => {
      // Gather matches by round code
      const byRound: Record<string, Match[]> = {};
      for (const r of g.rounds) byRound[r.round] = r.matches;
      const outcomeFor = (m: Match): 'W' | 'L' | 'T' | 'TBD' => {
        const alliances = Array.isArray(m?.alliances) ? m.alliances : [];
  let our: Alliance | null = null, opp: Alliance | null = null;
        for (const a of alliances) {
          const has = Array.isArray(a?.teams) && a.teams.some(t => String(t?.team?.id ?? t?.team_id ?? t?.id) === String(teamId));
          if (has) our = a; else opp = a; // simplistic (only two alliances expected)
        }
        if (!our || !opp) return 'TBD';
        if (typeof our.score !== 'number' || typeof opp.score !== 'number') return 'TBD';
        if (our.score > opp.score) return 'W';
        if (our.score < opp.score) return 'L';
        return 'T';
      };
      const finals = byRound['5'] || [];
      if (finals.length) {
        const decided = finals.filter(m => outcomeFor(m) !== 'TBD');
        if (decided.length) {
          const last = decided[decided.length - 1];
          const o = outcomeFor(last);
          if (o === 'W') return 'Champion';
          if (o === 'L' || o === 'T') return 'Finalist';
        }
        return 'Finalist'; // default if finals reached but undecided
      }
      const semis = byRound['4'] || [];
      if (semis.length) {
        // If any semi match won but none finals appear yet => at least Semifinalist (eliminated in semi)
        return 'Semifinalist';
      }
      const quarters = byRound['3'] || [];
      if (quarters.length) return 'Quarterfinalist';
      const r16 = byRound['6'] || [];
      if (r16.length) return 'Round of 16';
      // Only qualifications present
      return 'Participant';
    };
    return Array.from(map.entries()).map(([id, g]) => ({ id, placement: computePlacement(g), ...g }));
  }, [matches, teamId]);

  // SP removed from the match list for a cleaner UI

  // Collapsing removed to simplify the UI for long event titles

  return (
    <>
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
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 break-words">
                      {g.event?.name || 'Event'}
                      {(() => {
                        // Calculate average margin for this event
                        const allMatches = g.rounds.flatMap(r => r.matches);
                        let ownTotal = 0, oppTotal = 0, played = 0;
                        for (const m of allMatches) {
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
                          ownTotal += own;
                          oppTotal += opp;
                          played++;
                        }
                        const avgMargin = played ? ((ownTotal - oppTotal) / played).toFixed(1) : null;
                        return avgMargin !== null ? (
                          <span className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400 bg-indigo-600/10 rounded-full px-2 py-0.5 align-middle">Avg Margin: {avgMargin}</span>
                        ) : null;
                      })()}
                    </h3>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-xs rounded-full px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{g.rounds.reduce((s,r)=>s + r.matches.length,0)} matches</span>
                    {g.placement && (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">{g.placement}</span>
                    )}
                    {(() => {
                      // Derive seed from qualification rank (round '2') using existing eventRanks map
                      const firstQual = g.rounds.find(r => r.round === '2');
                      const firstMatch = firstQual?.matches?.[0];
                      const eid = firstMatch?.event?.id;
                      const seed = eid != null ? eventRanks?.[eid]?.rank : null;
                      if (typeof seed !== 'number') return null;
                      return <span className="text-xs rounded-full px-2 py-0.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">Seed #{seed}</span>;
                    })()}
                  </div>
                </div>
                <div className="divide-y divide-transparent">
                  {g.rounds.map(rg => (
                    <div key={rg.round} className="pt-2 first:pt-0">
                      <div className="px-4 sm:px-5 mt-4 mb-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">{rg.label}</h4>
                          {/* Rank pill removed (seed now only shown in event header) */}
                        </div>
                        {(() => {
                          // Keep qualification metrics summary below header (rank pill removed)
                          if (rg.round !== '2') return null;
                          const firstMatch = rg.matches?.[0];
                          const info = firstMatch?.event?.id != null ? eventRanks?.[firstMatch.event.id] : undefined;
                          if (!info) return null;
                          const wl: string[] = [];
                          if (info.wins != null || info.losses != null || info.ties != null) wl.push(`${info.wins ?? 0}-${info.losses ?? 0}-${info.ties ?? 0}`);
                          const metrics: string[] = [];
                          if (info.wp != null) metrics.push(`WP ${info.wp}`);
                          if (info.ap != null) metrics.push(`AP ${info.ap}`);
                          if (info.sp != null) metrics.push(`SP ${info.sp}`);
                          if (info.high_score != null) metrics.push(`HS ${info.high_score}`);
                          if (info.average_points != null) metrics.push(`Avg ${(typeof info.average_points === 'number' ? info.average_points.toFixed(1) : info.average_points)}`);
                          if (info.total_points != null) metrics.push(`TP ${info.total_points}`);
                          if (!wl.length && !metrics.length) return null;
                          return (
                            <div className="flex items-center gap-2 flex-wrap">
                              {wl.length ? <span className="text-[10px] sm:text-xs rounded-full px-2 py-0.5 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-medium">{wl.join(' ')}</span> : null}
                              {metrics.length ? <span className="text-[10px] sm:text-xs rounded-full px-2 py-0.5 bg-violet-600/10 text-violet-600 dark:text-violet-400 font-medium">{metrics.join(' • ')}</span> : null}
                            </div>
                          );
                        })()}
                      </div>
                      <ul className="space-y-4">
                        {rg.matches.map((m) => {
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
                      // Removed unused primaryIdNum and primaryIdStr
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
                                <span className="text-slate-800 dark:text-slate-100 flex flex-wrap gap-x-1 gap-y-0.5">{renderAllianceNames(ourOnRed ? red : blue, teamId) || 'TBD'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`text-2xl sm:text-3xl font-extrabold ${outcome === 'W' ? 'text-emerald-500' : outcome === 'L' ? 'text-rose-500' : 'text-slate-400'}`}>{ourAlliance.score ?? '-'}</span>
                                <span className="text-slate-500">-</span>
                                <span className="text-xl sm:text-2xl font-bold text-slate-300">{oppAlliance.score ?? '-'}</span>
                                {/* Outcome is shown in header now */}
                              </div>
                              <div className={`flex items-center gap-3 ${ourOnRed ? 'text-sky-600' : 'text-rose-600'}`}>
                                <span className="font-medium">{oppLabel}</span>
                                <span className="text-slate-800 dark:text-slate-100 flex flex-wrap gap-x-1 gap-y-0.5">{renderAllianceNames(ourOnRed ? blue : red, teamId) || 'TBD'}</span>
                              </div>
                            </div>
                            {/* Mobile: stacked, color-coded blocks */}
              <div className="sm:hidden space-y-2">
                <div className="px-3 py-2 flex items-center justify-between rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-medium opacity-80 ${ourOnRed ? 'text-rose-600' : 'text-sky-600'}`}>{ourLabel}</div>
                                    <div className="text-sm truncate text-slate-800 dark:text-slate-100 flex flex-wrap gap-x-1 gap-y-0.5">{renderAllianceNames(ourOnRed ? red : blue, teamId) || 'TBD'}</div>
                                  </div>
                                  <div className={`ml-3 text-2xl font-extrabold ${outcome === 'W' ? 'text-emerald-500' : outcome === 'L' ? 'text-rose-500' : 'text-slate-400'}`}>{ourAlliance.score ?? '-'}</div>
                                </div>
                <div className="px-3 py-2 flex items-center justify-between rounded-lg border border-slate-200/60 dark:border-slate-800/60">
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-xs font-medium opacity-80 ${ourOnRed ? 'text-sky-600' : 'text-rose-600'}`}>{oppLabel}</div>
                                    <div className="text-sm truncate text-slate-800 dark:text-slate-100 flex flex-wrap gap-x-1 gap-y-0.5">{renderAllianceNames(ourOnRed ? blue : red, teamId) || 'TBD'}</div>
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
                  ))}
                </div>
                {/* Footer placement summary for clarity at end */}
                {g.placement && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 text-xs text-slate-500 dark:text-slate-400">
                    Event Result: <span className="font-medium text-slate-700 dark:text-slate-300">{g.placement}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
  </section>
  {popupOpen && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closePopup} />
        <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
          <div className="flex items-start justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
            <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Team Info</h5>
            <button onClick={closePopup} className="ml-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/40 p-1">
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          <div className="p-4 sm:p-5 space-y-3 overflow-y-auto">
            {popupLoading && <div className="text-sm text-slate-500 dark:text-slate-400">Loading...</div>}
            {popupError && <div className="text-sm text-rose-600 dark:text-rose-400">{popupError}</div>}
            {!popupLoading && !popupError && popupData && (
              <div className="space-y-2">
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {popupData?.number}{popupData?.team_name ? <span className="opacity-70"> – {popupData.team_name}</span> : null}
                </div>
                <div className="grid grid-cols-1 gap-1 text-sm text-slate-700 dark:text-slate-300">
                  {popupData?.organization && <div><span className="font-medium">Org:</span> {popupData.organization}</div>}
                  {popupData?.location && (popupData.location.city || popupData.location.region || popupData.location.country) && (
                    <div><span className="font-medium">Location:</span> {[popupData.location.city, popupData.location.region, popupData.location.country].filter(Boolean).join(', ')}</div>
                  )}
                  {popupData?.grade && <div><span className="font-medium">Grade:</span> {popupData.grade}</div>}
                  {popupData?.program?.name && <div><span className="font-medium">Program:</span> {popupData.program.name}</div>}
                  {popupData?.robot_name && <div><span className="font-medium">Robot:</span> {popupData.robot_name}</div>}
                </div>
              </div>
            )}
          </div>
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500">Press Esc to close</span>
            {popupData && (popupData.id || popupData.number) && (
              <a href={`/teams/${encodeURIComponent(String(popupData.id ?? popupData.number))}`} className="inline-flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                View Team Page ↗
              </a>
            )}
          </div>
        </div>
      </div>
  )}
  </>
  );
}
