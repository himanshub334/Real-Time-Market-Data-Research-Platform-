"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { OHLCVBar } from "@/lib/analytics";
import styles from "./VolumeChart.module.css";

interface Props {
  bars: OHLCVBar[];
}

export default function VolumeChart({ bars }: Props) {
  const data = bars.slice(-80).map((b) => ({
    time: formatTime(b.timestamp),
    volume: b.volume,
    up: b.close >= b.open,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipTime}>{d.time}</div>
        <div className={styles.tooltipRow}>
          <span>Volume</span>
          <span className={styles.tooltipVal}>{(d.volume / 1000).toFixed(0)}K</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Volume</h3>
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="1 0" stroke="rgba(56,139,253,0.04)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "#484f58", fontSize: 9, fontFamily: "IBM Plex Mono" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#484f58", fontSize: 9, fontFamily: "IBM Plex Mono" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(56,139,253,0.04)" }} />
          <Bar dataKey="volume" radius={[1, 1, 0, 0]} maxBarSize={6}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.up ? "rgba(63,185,80,0.5)" : "rgba(248,81,73,0.5)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
