import type { Event } from "../../../types";

type EventsTabProps = {
  groups: Array<{ key: string; name: string; code: string; events: Event[] }>; // grouped by season
  isCompleted: (ev: Event) => boolean;
  formatDate: (s?: string) => string;
  isSameDay: (a?: string, b?: string) => boolean;
};

export default function EventsTab({ groups, isCompleted, formatDate, isSameDay }: EventsTabProps) {
  return (
    <section className="w-full max-w-3xl">
      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key}>
              <ul className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow divide-y">
                {group.events.map((event) => (
                  <li key={event.id} className="p-4 sm:p-5">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5" title={isCompleted(event) ? "Completed" : "Upcoming"}>
                        {isCompleted(event) ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-emerald-600">
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                            <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-amber-500">
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                            <path d="M12 7v5l3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{event.name}</span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                          {formatDate(event.start)}
                          {!isSameDay(event.start, event.end) && event.end ? ` - ${formatDate(event.end)}` : ""}
                          {typeof event.teamRank === 'number' && (
                            <span className="ml-1 inline-flex items-center rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-xs font-medium">
                              Rank: {event.teamRank}
                              {event.teamDivision ? ` (${event.teamDivision})` : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-sm">{event.location && event.location.venue}</div>
                        <div className="mt-1 text-sm text-slate-700 dark:text-slate-300 flex flex-wrap gap-2">
                          <span><span className="font-medium">Level:</span> {event.level ?? "N/A"}</span>
                          <span><span className="font-medium">Type:</span> {event.event_type ?? "N/A"}</span>
                          <span><span className="font-medium">Ongoing:</span> {event.ongoing ? "Yes" : "No"}</span>
                          <span><span className="font-medium">Awards Finalized:</span> {event.awards_finalized ? "Yes" : "No"}</span>
                        </div>
            {Array.isArray(event.divisions) && event.divisions.length > 0 && (
                          <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                            <span className="font-medium">Divisions:</span>{" "}
              {event.divisions.filter(Boolean).map((d) => d?.name).filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur shadow divide-y">
          <li className="p-4 sm:p-5 text-slate-600 dark:text-slate-400">No events yet.</li>
        </ul>
      )}
    </section>
  );
}
