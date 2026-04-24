"use client";
import { StatsSummary } from "@/lib/analytics";
import styles from "./StatsPanel.module.css";

interface Props {
  summary: StatsSummary | null;
}

export default function StatsPanel({ summary }: Props) {
  if (!summary) return <div className={styles.loading}>Loading stats…</div>;

  const up = summary.priceChangePct >= 0;

  const cards = [
    { label: "Last Price", value: `$${formatPrice(summary.lastPrice)}`, accent: up ? "green" : "red" },
    { label: "Change", value: `${up ? "+" : ""}${summary.priceChangePct.toFixed(2)}%`, accent: up ? "green" : "red" },
    { label: "VWAP", value: `$${formatPrice(summary.vwap)}`, accent: "blue" },
    { label: "Mean", value: `$${formatPrice(summary.mean)}`, accent: "neutral" },
    { label: "Std Dev", value: `$${formatPrice(summary.std)}`, accent: "neutral" },
    { label: "P95", value: `$${formatPrice(summary.p95)}`, accent: "amber" },
    { label: "Anomaly Rate", value: `${(summary.anomalyRate * 100).toFixed(1)}%`, accent: summary.anomalyRate > 0.05 ? "red" : "teal" },
    { label: "Anomalies", value: summary.anomalyCount.toString(), accent: summary.anomalyCount > 10 ? "amber" : "neutral" },
    { label: "Data Points", value: summary.count.toLocaleString(), accent: "neutral" },
  ];

  return (
    <div className={styles.grid}>
      {cards.map((c) => (
        <div key={c.label} className={styles.card}>
          <span className={styles.label}>{c.label}</span>
          <span className={`${styles.value} ${styles[c.accent]}`}>{c.value}</span>
        </div>
      ))}
    </div>
  );
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 100) return p.toFixed(2);
  return p.toFixed(4);
}
