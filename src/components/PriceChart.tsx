"use client";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { AnomalyPoint } from "@/lib/analytics";
import styles from "./PriceChart.module.css";

interface ChartPoint {
  time: string;
  price: number;
  mean: number;
  upper: number;
  lower: number;
  ewm: number;
  isAnomaly: boolean;
  zScore: number;
}

interface Props {
  points: AnomalyPoint[];
  symbol: string;
  livePrice?: number;
}

export default function PriceChart({ points, symbol, livePrice }: Props) {
  const data: ChartPoint[] = points.map((p) => ({
    time: formatTime(p.timestamp),
    price: parseFloat(p.price.toFixed(4)),
    mean: parseFloat(p.rollingMean.toFixed(4)),
    upper: parseFloat((p.rollingMean + 2 * p.rollingStd).toFixed(4)),
    lower: parseFloat((p.rollingMean - 2 * p.rollingStd).toFixed(4)),
    ewm: parseFloat(p.ewm.toFixed(4)),
    isAnomaly: p.isAnomaly,
    zScore: parseFloat(p.zScore.toFixed(3)),
  }));

  const anomalyPoints = data.filter((d) => d.isAnomaly);
  const prices = data.map((d) => d.price);
  const min = Math.min(...data.map((d) => d.lower)) * 0.999;
  const max = Math.max(...data.map((d) => d.upper)) * 1.001;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as ChartPoint;
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipTime}>{d.time}</div>
        <div className={styles.tooltipRow}>
          <span>Price</span>
          <span className={styles.tooltipVal}>${formatPrice(d.price)}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span>Mean</span>
          <span>${formatPrice(d.mean)}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span>EWM</span>
          <span>${formatPrice(d.ewm)}</span>
        </div>
        <div className={styles.tooltipRow}>
          <span>Z-Score</span>
          <span className={Math.abs(d.zScore) > 2.5 ? styles.anomalyText : ""}>{d.zScore}</span>
        </div>
        {d.isAnomaly && <div className={styles.anomalyBadge}>⚠ ANOMALY</div>}
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>{symbol} — Price · Rolling Mean · 2σ Bands</h2>
        {livePrice && (
          <span className={styles.live}>
            <span className={styles.dot} />
            LIVE ${formatPrice(livePrice)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 10 }}>
          <CartesianGrid strokeDasharray="1 0" stroke="rgba(56,139,253,0.06)" />
          <XAxis
            dataKey="time"
            tick={{ fill: "#484f58", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            tickLine={false}
            axisLine={{ stroke: "rgba(56,139,253,0.1)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min, max]}
            tick={{ fill: "#484f58", fontSize: 10, fontFamily: "IBM Plex Mono" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatPrice}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* 2σ band fill */}
          <Area
            type="monotone"
            dataKey="upper"
            fill="rgba(56,139,253,0.06)"
            stroke="rgba(56,139,253,0.15)"
            strokeWidth={1}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="lower"
            fill="var(--bg-primary)"
            stroke="rgba(56,139,253,0.15)"
            strokeWidth={1}
            dot={false}
          />

          {/* Rolling mean */}
          <Line
            type="monotone"
            dataKey="mean"
            stroke="rgba(56,139,253,0.6)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />

          {/* EWM */}
          <Line
            type="monotone"
            dataKey="ewm"
            stroke="rgba(188,140,255,0.4)"
            strokeWidth={1}
            dot={false}
          />

          {/* Price */}
          <Line
            type="monotone"
            dataKey="price"
            stroke="#388bfd"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#388bfd", strokeWidth: 0 }}
          />

          {/* Anomaly markers */}
          {anomalyPoints.map((p, i) => (
            <ReferenceDot
              key={i}
              x={p.time}
              y={p.price}
              r={5}
              fill="#f85149"
              stroke="#f85149"
              strokeWidth={0}
              opacity={0.85}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      <div className={styles.legend}>
        <span className={styles.legendItem} style={{ color: "#388bfd" }}>
          <span className={styles.line} style={{ background: "#388bfd" }} /> Price
        </span>
        <span className={styles.legendItem} style={{ color: "rgba(56,139,253,0.7)" }}>
          <span className={styles.line} style={{ background: "rgba(56,139,253,0.5)", borderTop: "2px dashed rgba(56,139,253,0.5)" }} /> Rolling Mean
        </span>
        <span className={styles.legendItem} style={{ color: "rgba(188,140,255,0.7)" }}>
          <span className={styles.line} style={{ background: "rgba(188,140,255,0.5)" }} /> EWM
        </span>
        <span className={styles.legendItem} style={{ color: "rgba(56,139,253,0.4)" }}>
          <span className={styles.band} /> 2σ Band
        </span>
        <span className={styles.legendItem} style={{ color: "#f85149" }}>
          <span className={styles.dot2} /> Anomaly
        </span>
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function formatPrice(p: number | string): string {
  const n = typeof p === "string" ? parseFloat(p) : p;
  if (n >= 10000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 100) return n.toFixed(2);
  return n.toFixed(2);
}
