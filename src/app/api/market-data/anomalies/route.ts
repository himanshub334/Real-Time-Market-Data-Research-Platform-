import { NextRequest, NextResponse } from "next/server";
import { marketStore, SYMBOLS } from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "AAPL";
  const limit = parseInt(searchParams.get("limit") ?? "200");
  const onlyAnomalies = searchParams.get("only") === "true";

  if (!SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: "Unknown symbol" }, { status: 400 });
  }

  let points = marketStore.getAnomalies(symbol, limit);
  if (onlyAnomalies) {
    points = points.filter((p) => p.isAnomaly);
  }

  return NextResponse.json({ symbol, count: points.length, points });
}
