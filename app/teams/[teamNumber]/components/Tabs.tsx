"use client";
import { useState } from "react";

export type TabKey = "events" | "matches" | "skills" | "awards" | "graphs";

type TabsProps = {
  defaultTab?: TabKey;
  active?: TabKey; // controlled
  onChange?: (key: TabKey) => void;
  tabs: Array<{ key: TabKey; label: string; count?: number }>;
};

export default function Tabs({ defaultTab = "events", active, onChange, tabs }: TabsProps) {
  const [internalActive, setInternalActive] = useState<TabKey>(defaultTab);
  const current = active ?? internalActive;

  const select = (key: TabKey) => {
    if (active === undefined) setInternalActive(key);
    onChange?.(key);
  };

  return (
    <div className="mb-6 w-full">
      <div className="flex w-full flex-wrap items-center gap-1 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/60 backdrop-blur shadow p-1">
        {tabs.map((t) => {
          const isActive = current === t.key;
          return (
            <button
              key={t.key}
              onClick={() => select(t.key)}
              className={`relative z-0 px-4 py-2 text-sm rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
              }`}
            >
              <span>{t.label}</span>
              {typeof t.count === "number" && (
                <span className={`ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs ${
                  isActive ? "bg-white/20" : "bg-slate-200/70 dark:bg-slate-700/70"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Content is rendered in page via active state prop if needed; for now, Tabs only handles header */}
    </div>
  );
}
