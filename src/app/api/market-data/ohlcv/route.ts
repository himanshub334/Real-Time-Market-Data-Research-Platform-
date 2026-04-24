import { NextRequest, NextResponse } from "next/server";
import { marketStore, SYMBOLS } from "@/lib/dataStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "AAPL";
  const limit = parseInt(searchParams.get("limit") ?? "200");

  if (!SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: "Unknown symbol" }, { status: 400 });
  }

  const bars = marketStore.getOHLCV(symbol, limit);
  return NextResponse.json({ symbol, count: bars.length, bars });
}
