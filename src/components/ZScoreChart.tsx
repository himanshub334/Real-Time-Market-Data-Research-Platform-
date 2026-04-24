"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AnomalyPoint } from "@/lib/analytics";
import styles from "./ZScoreChart.module.css";

interface Props {
  points: AnomalyPoint[];
}

export default function ZScoreChart({ points }: Props) {
  const data = points.slice(-100).map((p) => ({
    time: formatTime(p.timestamp),
    z: parseFloat(p.zScore.toFixed(3)),
    isAnomaly: p.isAnomaly,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipTime}>{d.time}</div>
        <div className={styles.tooltipRow}>
          <span>Z-Score</span>
          <span className={`${styles.tooltipVal} ${Math.abs(d.z) > 2.5 ? styles.anomaly : ""}`}>
            {d.z}σ
          </span>
        </div>
        {d.isAnomaly && <div className={styles.anomalyTag}>ANOMALY DETECTED</div>}
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Z-Score · Rolling Deviation</h3>
        <span className={styles.subtitle}>EWM-smoothed · threshold ±2.5σ</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="1 0" stroke="rgba(56,139,253,0.05)" />
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
            tickFormatter={(v) => `${v}σ`}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={2.5} stroke="rgba(248,81,73,0.4)" strokeDasharray="3 2" strokeWidth={1} />
          <ReferenceLine y={-2.5} stroke="rgba(248,81,73,0.4)" strokeDasharray="3 2" strokeWidth={1} />
          <ReferenceLine y={0} stroke="rgba(56,139,253,0.2)" strokeWidth={1} />
          <Area
            type="monotone"
            dataKey="z"
            stroke="#bc8cff"
            fill="rgba(188,140,255,0.08)"
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
