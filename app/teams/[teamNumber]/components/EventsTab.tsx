
type EventsTabProps = {
  groups: Array<{ key: string; name: string; code: string; events: Event[] }>; // grouped by season
  isCompleted: (ev: Event) => boolean;
  formatDate: (s?: string) => string;
  isSameDay: (a?: string, b?: string) => boolean;
};

import { useEffect, useRef } from "react";
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
import type { Event } from "../../../types";

type GoogleMapProps = {
  events: Event[];
};

function GoogleMap({ events }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // Load Google Maps script
    const scriptId = "google-maps-script";
    const existingScript = document.getElementById(scriptId);
    if (!window.google && !existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);
    } else if (window.google) {
      initMap();
    } else if (existingScript) {
      existingScript.addEventListener("load", initMap);
    }

    function initMap() {
      if (!window.google || !mapRef.current) return;
      const validEvents = events.filter(ev => {
        const coords = ev.location?.coordinates;
        return coords && typeof coords.lat === "number" && typeof coords.lon === "number";
      });
      let center = { lat: 39.8283, lng: -98.5795 };
      if (validEvents.length > 0) {
        const coords = validEvents[0].location?.coordinates;
        if (coords && typeof coords.lat === "number" && typeof coords.lon === "number") {
          center = { lat: coords.lat, lng: coords.lon };
        }
      }
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: validEvents.length > 0 ? 4 : 2,
      });
      validEvents.forEach(ev => {
        const coords = ev.location?.coordinates;
        if (coords && typeof coords.lat === "number" && typeof coords.lon === "number") {
          const marker = new window.google.maps.Marker({
            position: { lat: coords.lat, lng: coords.lon },
            map,
            title: ev.name || "Event",
          });
          if (ev.name) {
            const infowindow = new window.google.maps.InfoWindow({
              content: `<div style='font-size:14px;font-weight:bold;color:black;'>${ev.name}</div>`
            });
            marker.addListener("click", () => {
              infowindow.open(map, marker);
            });
          }
        }
      });
    }
  }, [events]);

  return <div ref={mapRef} className="w-full h-64 rounded border" />;
}

export default function EventsTab({ groups, isCompleted, formatDate, isSameDay }: EventsTabProps) {
  return (
    <section className="w-full max-w-3xl">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
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
        </div>
        {/* Desktop/tablet: map on the side; mobile: map below */}
        <div className="w-full lg:w-80 order-2 lg:order-none mt-6 lg:mt-0">
          <GoogleMap events={groups.flatMap(g => g.events)} />
        </div>
      </div>
    </section>
  );
}
