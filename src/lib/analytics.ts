export interface OHLCVBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
  symbol: string;
}

export interface AnomalyPoint extends PricePoint {
  zScore: number;
  rollingMean: number;
  rollingStd: number;
  ewm: number;
  isAnomaly: boolean;
  severity: "low" | "medium" | "high";
}

export interface StatsSummary {
  symbol: string;
  count: number;
  mean: number;
  std: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  anomalyCount: number;
  anomalyRate: number;
  lastPrice: number;
  priceChange: number;
  priceChangePct: number;
  vwap: number;
}

export interface RollingStats {
  mean: number;
  std: number;
  upperBand: number;
  lowerBand: number;
}

// Z-score normalisation
export function zScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (value - mean) / std;
}

// Clip outliers at 3σ
export function clipOutliers(values: number[], sigma = 3): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  const lo = mean - sigma * std;
  const hi = mean + sigma * std;
  return values.map((v) => Math.min(hi, Math.max(lo, v)));
}

// Rolling mean and std over a window
export function rollingStats(values: number[], windowSize: number): RollingStats[] {
  const results: RollingStats[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / window.length;
    const std = Math.sqrt(variance);
    results.push({
      mean,
      std,
      upperBand: mean + 2 * std,
      lowerBand: mean - 2 * std,
    });
  }
  return results;
}

// Exponential weighted mean (EWM) to reduce false positives
export function exponentialWeightedMean(values: number[], alpha = 0.1): number[] {
  const ewm: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      ewm.push(values[0]);
    } else {
      ewm.push(alpha * values[i] + (1 - alpha) * ewm[i - 1]);
    }
  }
  return ewm;
}

// Anomaly detection: flag points > 2.5σ from rolling mean
export function detectAnomalies(
  points: PricePoint[],
  windowSize = 20,
  threshold = 2.5
): AnomalyPoint[] {
  const prices = points.map((p) => p.price);
  const rolling = rollingStats(prices, windowSize);
  const ewmValues = exponentialWeightedMean(prices);

  return points.map((p, i) => {
    const { mean, std, upperBand, lowerBand } = rolling[i];
    const z = zScore(p.price, mean, std);
    const isAnomaly = Math.abs(z) > threshold;
    const severity =
      Math.abs(z) > 4 ? "high" : Math.abs(z) > 3 ? "medium" : "low";

    return {
      ...p,
      zScore: z,
      rollingMean: mean,
      rollingStd: std,
      ewm: ewmValues[i],
      isAnomaly,
      severity,
    };
  });
}

// Compute percentile from sorted array
export function percentile(sorted: number[], p: number): number {
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

// VWAP calculation
export function vwap(bars: OHLCVBar[]): number {
  let totalPriceVol = 0;
  let totalVol = 0;
  for (const bar of bars) {
    const typical = (bar.high + bar.low + bar.close) / 3;
    totalPriceVol += typical * bar.volume;
    totalVol += bar.volume;
  }
  return totalVol === 0 ? 0 : totalPriceVol / totalVol;
}

// Summary stats for a symbol
export function computeSummary(
  symbol: string,
  points: AnomalyPoint[],
  bars: OHLCVBar[]
): StatsSummary {
  if (points.length === 0) {
    return {
      symbol, count: 0, mean: 0, std: 0, min: 0, max: 0,
      p50: 0, p95: 0, p99: 0, anomalyCount: 0, anomalyRate: 0,
      lastPrice: 0, priceChange: 0, priceChangePct: 0, vwap: 0,
    };
  }
  const prices = points.map((p) => p.price).sort((a, b) => a - b);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const std = Math.sqrt(prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length);
  const anomalyCount = points.filter((p) => p.isAnomaly).length;
  const lastPrice = points[points.length - 1].price;
  const firstPrice = points[0].price;

  return {
    symbol,
    count: points.length,
    mean,
    std,
    min: prices[0],
    max: prices[prices.length - 1],
    p50: percentile(prices, 50),
    p95: percentile(prices, 95),
    p99: percentile(prices, 99),
    anomalyCount,
    anomalyRate: anomalyCount / points.length,
    lastPrice,
    priceChange: lastPrice - firstPrice,
    priceChangePct: ((lastPrice - firstPrice) / firstPrice) * 100,
    vwap: vwap(bars),
  };
}

// Generate synthetic OHLCV with GBM (Geometric Brownian Motion)
export function generateOHLCV(
  symbol: string,
  basePrice: number,
  count: number,
  intervalMs = 60000,
  drift = 0.0002,
  volatility = 0.015
): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  let price = basePrice;
  const now = Date.now();
  const startTime = now - count * intervalMs;

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * intervalMs;
    const open = price;
    const rand = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.667;
    const ret = drift + volatility * rand();
    price = price * Math.exp(ret);

    const range = price * volatility * (0.5 + Math.random() * 0.5);
    const high = price + range * Math.random();
    const low = price - range * Math.random();
    const close = price;
    const volume = Math.floor(50000 + Math.random() * 200000);

    // Inject anomalies occasionally
    const anomalyChance = Math.random();
    const finalClose = anomalyChance < 0.03
      ? close * (1 + (Math.random() > 0.5 ? 0.04 : -0.04))
      : close;

    bars.push({ timestamp, open, high: Math.max(high, finalClose), low: Math.min(low, finalClose), close: finalClose, volume });
    price = finalClose;
  }

  return bars;
}

// Convert OHLCV bars to price points
export function barsToPoints(bars: OHLCVBar[], symbol: string): PricePoint[] {
  return bars.map((b) => ({
    timestamp: b.timestamp,
    price: b.close,
    volume: b.volume,
    symbol,
  }));
}
