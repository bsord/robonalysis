import type { Match } from "../../../types";
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

export default function AverageMarginGraph({ matches, teamId }: { matches: Match[]; teamId: string }) {
  // Group matches by event
  const eventMap: Record<string, { name: string; matches: Match[] }> = {};
  for (const m of matches) {
    const eid = String(m?.event?.id ?? "unknown");
    const name = m?.event?.name || "Event";
    if (!eventMap[eid]) eventMap[eid] = { name, matches: [] };
    eventMap[eid].matches.push(m);
  }
  const labels: string[] = [];
  const eventNames: string[] = [];
  const data: number[] = [];
  let eventIndex = 1;
  for (const eid in eventMap) {
    const { name, matches } = eventMap[eid];
    labels.push(String(eventIndex));
    eventNames.push(name);
    eventIndex++;
    let ownTotal = 0, oppTotal = 0, played = 0;
    for (const m of matches) {
      const alliances = Array.isArray(m?.alliances) ? m.alliances : [];
      let own = 0, opp = 0, found = false;
      for (const a of alliances) {
        const teams = Array.isArray(a?.teams) ? a.teams : [];
  const has = teams.some((t: import("../../../types").MatchTeamRef) => String(t?.team?.id ?? "") === String(teamId));
        if (has) {
          own = typeof a?.score === "number" ? a.score : 0;
          found = true;
        } else {
          const s = typeof a?.score === "number" ? a.score : 0;
          opp = Math.max(opp, s);
        }
      }
      if (!found) continue;
      ownTotal += own;
      oppTotal += opp;
      played++;
    }
    const avgMargin = played ? (ownTotal - oppTotal) / played : 0;
    data.push(Number(avgMargin.toFixed(1)));
  }
  return (
    <div className="w-full overflow-x-auto" style={{ minWidth: '320px', height: '400px' }}>
      <div style={{ minWidth: 400, height: '100%' }}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Average Point Margin",
                data,
                backgroundColor: "#6366f1",
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: false },
              tooltip: {
                callbacks: {
                  title: (tooltipItems: import("chart.js").TooltipItem<'bar'>[]) => {
                    const idx = tooltipItems[0]?.dataIndex;
                    return eventNames[idx] || "Event";
                  },
                },
              },
              datalabels: {
                display: true,
                color: '#fff',
                font: { weight: 'bold', size: 14 },
                anchor: 'center',
                align: 'center',
                formatter: (value: number) => value.toFixed(1),
              },
            },
            scales: {
              x: {
                ticks: {
                  display: false,
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: (ctx: { tick: { value: number } }) => ctx.tick.value === 0 ? '#6b7280' : 'rgba(100,116,139,0.2)',
                  lineWidth: (ctx: { tick: { value: number } }) => ctx.tick.value === 0 ? 3 : 1,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
