"use client";
import { StatsSummary } from "@/lib/analytics";
import styles from "./TickerBar.module.css";

interface Props {
  summaries: StatsSummary[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

export default function TickerBar({ summaries, selectedSymbol, onSelect }: Props) {
  return (
    <div className={styles.bar}>
      {summaries.map((s) => {
        const up = s.priceChangePct >= 0;
        const isSelected = s.symbol === selectedSymbol;
        return (
          <button
            key={s.symbol}
            className={`${styles.ticker} ${isSelected ? styles.selected : ""}`}
            onClick={() => onSelect(s.symbol)}
          >
            <span className={styles.symbol}>{s.symbol}</span>
            <span className={styles.price}>${formatPrice(s.lastPrice)}</span>
            <span className={`${styles.change} ${up ? styles.up : styles.down}`}>
              {up ? "▲" : "▼"} {Math.abs(s.priceChangePct).toFixed(2)}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

function formatPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 100) return p.toFixed(2);
  return p.toFixed(4);
}
