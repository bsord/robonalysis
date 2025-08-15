"use client";
// Minimal local type matching the shape produced by the client grouping logic
type EventSkills = {
  eventId: number;
  eventName?: string | null;
  total: number;
  rank?: number | null;
  driver?: { score: number; attempts?: number } | null;
  programming?: { score: number; attempts?: number } | null;
};
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

export default function SkillsBarGraph({ skills }: { skills: EventSkills[] }) {
  const labels: string[] = skills.map((e, i) => String(i + 1));
  const eventNames: string[] = skills.map((e) => e.eventName || "Event");
  const driverData: number[] = skills.map((e) => e.driver?.score ?? 0);
  const programmingData: number[] = skills.map((e) => e.programming?.score ?? 0);

  return (
    <div className="w-full overflow-x-auto" style={{ minWidth: '320px', height: '400px' }}>
      <div style={{ minWidth: 400, height: '100%' }}>
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: "Driver Skills",
                data: driverData,
                backgroundColor: "#6366f1",
              },
              {
                label: "Programming Skills",
                data: programmingData,
                backgroundColor: "#10b981",
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
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
