"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Team } from "../types";

export default function TeamQuickSearch({ placeholder = "Search team (e.g. 1234A)", compact = false, maxWidthClass = "max-w-md", fullWidth = true, alignRight = false }: { placeholder?: string; compact?: boolean; maxWidthClass?: string; fullWidth?: boolean; alignRight?: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q) {
      setResults([]);
      setOpen(false);
      setError(null);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamName: q }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to search");
        const list: Team[] = Array.isArray(data?.data) ? data.data : [];
        setResults(list);
        setOpen(true);
        setHighlight(0);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Search failed";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const goTo = (team?: Team) => {
    const t = team ?? results[0];
    if (t?.id != null) {
      router.push(`/teams/${t.id}`);
      setOpen(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popRef.current && !popRef.current.contains(target) && inputRef.current && !inputRef.current.contains(target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const sizeClasses = compact
    ? "h-9 text-sm px-3"
    : "h-11 text-base px-4";

  const wrapperCls = `relative ${fullWidth ? 'w-full' : ''} ${alignRight ? 'flex justify-end' : ''} ${maxWidthClass}`;

  return (
    <div className={wrapperCls} ref={popRef}>
  <div className={`flex items-center ${compact ? 'w-full max-w-[13rem] sm:max-w-none' : 'w-full'}`}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, Math.max(0, results.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(0, h - 1));
            } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length) goTo(results[highlight]);
            }
          }}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-300/80 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${sizeClasses}`}
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 w-full rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/90 backdrop-blur shadow-lg overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">Searching…</div>
          ) : error ? (
            <div className="px-4 py-3 text-sm text-rose-600 dark:text-rose-400">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">No teams found</div>
          ) : (
            <ul>
              {results.slice(0, 10).map((t, i) => (
                <li key={t.id ?? i}>
                  <button
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => goTo(t)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-3 ${i === highlight ? 'bg-indigo-600/10 dark:bg-indigo-500/10' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{t.number || t.team_name}</span>
                      <span className="text-slate-500">{t.team_name && t.team_name !== t.number ? `— ${t.team_name}` : ''}</span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t.program?.name || t.grade || ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
