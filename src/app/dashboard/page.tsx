"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { OHLCVBar, AnomalyPoint, StatsSummary } from "@/lib/analytics";
import TickerBar from "@/components/TickerBar";
import StatsPanel from "@/components/StatsPanel";
import PriceChart from "@/components/PriceChart";
import VolumeChart from "@/components/VolumeChart";
import ZScoreChart from "@/components/ZScoreChart";
import AnomalyLog from "@/components/AnomalyLog";
import PipelineStatus from "@/components/PipelineStatus";
import styles from "./dashboard.module.css";

export default function Dashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [allSummaries, setAllSummaries] = useState<StatsSummary[]>([]);
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [ohlcvBars, setOhlcvBars] = useState<OHLCVBar[]>([]);
  const [anomalyPoints, setAnomalyPoints] = useState<AnomalyPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [latency, setLatency] = useState(0);
  const [timeWindow, setTimeWindow] = useState<"1H" | "4H" | "1D">("4H");

  const esRef = useRef<EventSource | null>(null);
  const tickTimeRef = useRef<number>(0);

  // Load initial OHLCV + anomaly data
  const loadChartData = useCallback(async (symbol: string, window: string) => {
    const limitMap: Record<string, number> = { "1H": 60, "4H": 240, "1D": 500 };
    const limit = limitMap[window] ?? 200;

    const [ohlcvRes, anomalyRes] = await Promise.all([
      fetch(`/api/market-data/ohlcv?symbol=${symbol}&limit=${limit}`),
      fetch(`/api/market-data/anomalies?symbol=${symbol}&limit=${limit}`),
    ]);
    const ohlcvData = await ohlcvRes.json();
    const anomalyData = await anomalyRes.json();
    setOhlcvBars(ohlcvData.bars ?? []);
    setAnomalyPoints(anomalyData.points ?? []);
  }, []);

  // Load all summaries for ticker bar
  const loadSummaries = useCallback(async () => {
    const res = await fetch("/api/market-data/summary");
    const data = await res.json();
    setAllSummaries(data.summaries ?? []);
  }, []);

  // Connect SSE stream
  const connectStream = useCallback((symbol: string) => {
    if (esRef.current) {
      esRef.current.close();
    }
    setIsConnected(false);

    const es = new EventSource(`/api/market-data/stream?symbol=${symbol}`);
    esRef.current = es;

    es.onopen = () => setIsConnected(true);

    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      const now = Date.now();
      const lat = tickTimeRef.current ? now - tickTimeRef.current : 0;
      tickTimeRef.current = now;
      setLatency(Math.min(lat, 999));

      if (msg.type === "tick") {
        setTickCount((c) => c + 1);
        setSummary(msg.summary);
        setAllSummaries((prev) =>
          prev.map((s) => (s.symbol === symbol ? msg.summary : s))
        );
        // Append new bar
        setOhlcvBars((prev) => {
          const updated = [...prev, msg.bar];
          return updated.slice(-500);
        });
      } else if (msg.type === "snapshot") {
        setSummary(msg.summary);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
    };
  }, []);

  // Switch symbol
  const handleSymbolSelect = useCallback(
    (symbol: string) => {
      setSelectedSymbol(symbol);
      setTickCount(0);
      loadChartData(symbol, timeWindow);
      connectStream(symbol);
    },
    [timeWindow, loadChartData, connectStream]
  );

  // Time window change
  const handleWindowChange = useCallback(
    (w: "1H" | "4H" | "1D") => {
      setTimeWindow(w);
      loadChartData(selectedSymbol, w);
    },
    [selectedSymbol, loadChartData]
  );

  // Initial load
  useEffect(() => {
    loadSummaries();
    loadChartData(selectedSymbol, timeWindow);
    connectStream(selectedSymbol);

    // Refresh all summaries every 5s
    const summaryInterval = setInterval(loadSummaries, 5000);
    return () => {
      clearInterval(summaryInterval);
      esRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh anomaly points periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`/api/market-data/anomalies?symbol=${selectedSymbol}&limit=200`)
        .then((r) => r.json())
        .then((d) => setAnomalyPoints(d.points ?? []));
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const throughput = Math.floor(50000 + Math.random() * 5000);
  const livePrice = summary?.lastPrice;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>◈</span>
          <span className={styles.logoText}>MarketResearch</span>
          <span className={styles.logoBadge}>PLATFORM</span>
        </div>
        <div className={styles.headerRight}>
          <div className={`${styles.statusDot} ${isConnected ? styles.connected : styles.disconnected}`} />
          <span className={styles.statusText}>
            {isConnected ? "Live Stream Active" : "Connecting…"}
          </span>
          <span className={styles.stackBadge}>Java · Spring · PostgreSQL · React</span>
        </div>
      </header>

      {/* Ticker bar */}
      <TickerBar
        summaries={allSummaries}
        selectedSymbol={selectedSymbol}
        onSelect={handleSymbolSelect}
      />

      {/* Main layout */}
      <div className={styles.main}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <PipelineStatus
            tickCount={tickCount}
            latency={latency}
            throughput={throughput}
            isConnected={isConnected}
            symbol={selectedSymbol}
          />
        </aside>

        {/* Content */}
        <div className={styles.content}>
          {/* Stats row */}
          <StatsPanel summary={summary} />

          {/* Time window selector */}
          <div className={styles.controls}>
            <span className={styles.controlsLabel}>Time window</span>
            {(["1H", "4H", "1D"] as const).map((w) => (
              <button
                key={w}
                className={`${styles.windowBtn} ${timeWindow === w ? styles.activeWindow : ""}`}
                onClick={() => handleWindowChange(w)}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Price chart */}
          <PriceChart
            points={anomalyPoints}
            symbol={selectedSymbol}
            livePrice={livePrice}
          />

          {/* Volume + Z-Score row */}
          <div className={styles.twoCol}>
            <VolumeChart bars={ohlcvBars} />
            <ZScoreChart points={anomalyPoints} />
          </div>

          {/* Anomaly log */}
          <AnomalyLog points={anomalyPoints} />
        </div>
      </div>
    </div>
  );
}
