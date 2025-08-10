"use client";
import { useState } from "react";
import Tabs, { TabKey } from "./components/Tabs";
import EventsTab from "./components/EventsTab";
import MatchesTab from "./components/MatchesTab";
import AnalysisTab from "./components/AnalysisTab";

type Props = {
  eventsCount: number;
  bySeason: Array<{ key: string; name: string; code: string; events: any[] }>;
};

export default function ClientTabContent({ eventsCount, bySeason }: Props) {
  const [active, setActive] = useState<TabKey>("events");

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
  const isUpcoming = (ev: any) => {
    const end = parseDate(ev?.end);
    const start = parseDate(ev?.start);
    if (end && !isNaN(end.getTime())) return dateOnly(end) >= today;
    if (start && !isNaN(start.getTime())) return dateOnly(start) >= today;
    return false;
  };
  const isCompleted = (ev: any) => !isUpcoming(ev);

  return (
    <>
      <Tabs
        active={active}
        onChange={setActive}
        tabs={[
          { key: "events", label: "Events", count: eventsCount },
          { key: "matches", label: "Matches" },
          { key: "analysis", label: "Analysis" },
        ]}
      />
      <div className="mt-4">
        {active === "events" && (
          <EventsTab groups={bySeason} isCompleted={isCompleted} formatDate={formatDate} isSameDay={isSameDay} />
        )}
        {active === "matches" && <MatchesTab />}
        {active === "analysis" && <AnalysisTab />}
      </div>
    </>
  );
}
