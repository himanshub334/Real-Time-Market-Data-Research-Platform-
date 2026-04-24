"use client";
import styles from "./PipelineStatus.module.css";

interface Props {
  tickCount: number;
  latency: number;
  throughput: number;
  isConnected: boolean;
  symbol: string;
}

export default function PipelineStatus({
  tickCount,
  latency,
  throughput,
  isConnected,
  symbol,
}: Props) {
  const metrics = [
    { label: "Status", value: isConnected ? "LIVE" : "OFFLINE", accent: isConnected ? "green" : "red" },
    { label: "Symbol", value: symbol, accent: "blue" },
    { label: "Ticks recv", value: tickCount.toLocaleString(), accent: "neutral" },
    { label: "Write latency", value: `${latency}ms`, accent: latency < 10 ? "teal" : "amber" },
    { label: "Throughput", value: `${throughput.toLocaleString()}/s`, accent: "neutral" },
    { label: "Workers", value: "32", accent: "neutral" },
    { label: "Window size", value: "20 bars", accent: "neutral" },
    { label: "σ threshold", value: "2.5σ", accent: "purple" },
    { label: "EWM α", value: "0.10", accent: "purple" },
    { label: "Clip σ", value: "3.0σ", accent: "neutral" },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.sectionTitle}>Pipeline</div>
      {metrics.map((m) => (
        <div key={m.label} className={styles.row}>
          <span className={styles.label}>{m.label}</span>
          <span className={`${styles.value} ${styles[m.accent]}`}>{m.value}</span>
        </div>
      ))}

      <div className={styles.divider} />
      <div className={styles.sectionTitle}>Schema</div>

      <div className={styles.schemaItem}>
        <span className={styles.schemaLabel}>Partition</span>
        <span className={styles.schemaVal}>monthly range</span>
      </div>
      <div className={styles.schemaItem}>
        <span className={styles.schemaLabel}>Index</span>
        <span className={styles.schemaVal}>BRIN timestamp</span>
      </div>
      <div className={styles.schemaItem}>
        <span className={styles.schemaLabel}>Mat. view</span>
        <span className={styles.schemaVal}>OHLCV daily</span>
      </div>
      <div className={styles.schemaItem}>
        <span className={styles.schemaLabel}>p99 read</span>
        <span className={`${styles.schemaVal} ${styles.teal}`}>&lt;5ms</span>
      </div>
      <div className={styles.schemaItem}>
        <span className={styles.schemaLabel}>p95 write</span>
        <span className={`${styles.schemaVal} ${styles.teal}`}>&lt;10ms</span>
      </div>
    </div>
  );
}
