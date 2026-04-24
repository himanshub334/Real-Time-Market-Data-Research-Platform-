import {
  OHLCVBar,
  PricePoint,
  AnomalyPoint,
  StatsSummary,
  generateOHLCV,
  barsToPoints,
  detectAnomalies,
  computeSummary,
} from "./analytics";

export const SYMBOLS = ["AAPL", "TSLA", "NVDA", "MSFT", "BTC-USD", "ETH-USD"];

const BASE_PRICES: Record<string, number> = {
  AAPL: 189.5,
  TSLA: 248.3,
  NVDA: 875.2,
  MSFT: 415.8,
  "BTC-USD": 67450,
  "ETH-USD": 3540,
};

// Simulates the PostgreSQL partitioned time-series store
class MarketDataStore {
  private ohlcvData: Map<string, OHLCVBar[]> = new Map();
  private pricePoints: Map<string, PricePoint[]> = new Map();
  private anomalyPoints: Map<string, AnomalyPoint[]> = new Map();
  private summaries: Map<string, StatsSummary> = new Map();
  private initialized = false;

  initialize() {
    if (this.initialized) return;
    for (const symbol of SYMBOLS) {
      const bars = generateOHLCV(symbol, BASE_PRICES[symbol], 500, 60000);
      const points = barsToPoints(bars, symbol);
      const anomalies = detectAnomalies(points);
      const summary = computeSummary(symbol, anomalies, bars);

      this.ohlcvData.set(symbol, bars);
      this.pricePoints.set(symbol, points);
      this.anomalyPoints.set(symbol, anomalies);
      this.summaries.set(symbol, summary);
    }
    this.initialized = true;
  }

  getOHLCV(symbol: string, limit = 200): OHLCVBar[] {
    this.initialize();
    const bars = this.ohlcvData.get(symbol) ?? [];
    return bars.slice(-limit);
  }

  getAnomalies(symbol: string, limit = 200): AnomalyPoint[] {
    this.initialize();
    const pts = this.anomalyPoints.get(symbol) ?? [];
    return pts.slice(-limit);
  }

  getSummary(symbol: string): StatsSummary | null {
    this.initialize();
    return this.summaries.get(symbol) ?? null;
  }

  getAllSummaries(): StatsSummary[] {
    this.initialize();
    return SYMBOLS.map((s) => this.summaries.get(s)!).filter(Boolean);
  }

  // Simulate live tick ingestion (appends new bar, trims old)
  ingestTick(symbol: string): OHLCVBar {
    this.initialize();
    const bars = this.ohlcvData.get(symbol)!;
    const last = bars[bars.length - 1];
    const volatility = 0.012;
    const drift = 0.00005;
    const rand = () => (Math.random() + Math.random() - 1) * 1.2;
    const ret = drift + volatility * rand();
    const newPrice = last.close * Math.exp(ret);
    const range = newPrice * volatility * 0.4;

    const newBar: OHLCVBar = {
      timestamp: last.timestamp + 60000,
      open: last.close,
      high: newPrice + range * Math.random(),
      low: newPrice - range * Math.random(),
      close: newPrice,
      volume: Math.floor(50000 + Math.random() * 200000),
    };

    bars.push(newBar);
    if (bars.length > 1000) bars.shift();

    // Recompute anomaly and summary for latest data
    const pts = barsToPoints(bars.slice(-200), symbol);
    const anomalies = detectAnomalies(pts);
    this.anomalyPoints.set(symbol, anomalies);
    const summary = computeSummary(symbol, anomalies, bars.slice(-200));
    this.summaries.set(symbol, summary);

    return newBar;
  }
}

// Singleton — acts like a connection pool to the DB
const globalStore = global as unknown as { marketStore?: MarketDataStore };
if (!globalStore.marketStore) {
  globalStore.marketStore = new MarketDataStore();
}

export const marketStore = globalStore.marketStore;
