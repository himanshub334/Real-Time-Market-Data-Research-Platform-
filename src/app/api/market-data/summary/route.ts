import { NextRequest, NextResponse } from "next/server";
import { marketStore, SYMBOLS } from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");

  if (symbol) {
    if (!SYMBOLS.includes(symbol)) {
      return NextResponse.json({ error: "Unknown symbol" }, { status: 400 });
    }
    const summary = marketStore.getSummary(symbol);
    return NextResponse.json(summary);
  }

  const summaries = marketStore.getAllSummaries();
  return NextResponse.json({ symbols: SYMBOLS, summaries });
}
