"use client";
import { AnomalyPoint } from "@/lib/analytics";
import styles from "./AnomalyLog.module.css";

interface Props {
  points: AnomalyPoint[];
}

export default function AnomalyLog({ points }: Props) {
  const anomalies = points
    .filter((p) => p.isAnomaly)
    .slice(-15)
    .reverse();

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>Anomaly Log</h3>
        <span className={styles.count}>{anomalies.length} detected</span>
      </div>
      {anomalies.length === 0 ? (
        <div className={styles.empty}>No anomalies in current window</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Price</th>
                <th>Z-Score</th>
                <th>Severity</th>
                <th>vs Mean</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((p, i) => {
                const pctFromMean = ((p.price - p.rollingMean) / p.rollingMean) * 100;
                const up = p.price > p.rollingMean;
                return (
                  <tr key={i} className={styles.row}>
                    <td className={styles.mono}>{formatTime(p.timestamp)}</td>
                    <td className={styles.mono}>${formatPrice(p.price)}</td>
                    <td className={`${styles.mono} ${styles.zScore}`}>
                      {p.zScore.toFixed(2)}σ
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[p.severity]}`}>
                        {p.severity}
                      </span>
                    </td>
                    <td className={`${styles.mono} ${up ? styles.up : styles.down}`}>
                      {up ? "+" : ""}{pctFromMean.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return p.toFixed(2);
}
