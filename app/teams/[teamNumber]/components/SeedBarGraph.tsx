"use client";
import type { Match } from "../../../types";
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

export default function SeedBarGraph({ matches, teamId, eventRanks }: { matches: Match[]; teamId: string; eventRanks: Record<string, { rank: number | null }> }) {
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
  const barColors: string[] = [];
  let eventIndex = 1;
  // Helper to interpolate color from green to red
  function seedToColor(seed: number) {
    // Clamp seed between 1 and 30
    const s = Math.max(1, Math.min(seed, 30));
    // 1 = green, 30 = red
    // Interpolate from green (0,200,0) to red (200,0,0)
    const r = Math.round((s - 1) * (200 - 0) / (30 - 1));
    const g = Math.round(200 - (s - 1) * (200 - 0) / (30 - 1));
    return `rgb(${r},${g},0)`;
  }
  for (const eid in eventMap) {
    const { name } = eventMap[eid];
    labels.push(String(eventIndex));
    eventNames.push(name);
    eventIndex++;
    // Get seed from eventRanks
    const rankObj = eventRanks[eid];
    const seed = rankObj && typeof rankObj.rank === 'number' ? rankObj.rank : null;
    data.push(seed ?? 0);
    barColors.push(seedToColor(seed ?? 50));
  }
  return (
    <div className="w-full overflow-x-auto" style={{ minWidth: '320px', height: '400px' }}>
      <div style={{ minWidth: 400, height: '100%' }}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Seed Per Event",
                data,
                backgroundColor: barColors,
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
                formatter: (value: number) => value,
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
