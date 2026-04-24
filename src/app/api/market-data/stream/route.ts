import { NextRequest } from "next/server";
import { marketStore, SYMBOLS } from "@/lib/dataStore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "AAPL";

  if (!SYMBOLS.includes(symbol)) {
    return new Response("Unknown symbol", { status: 400 });
  }

  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;
  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;

      // Send initial snapshot
      const bars = marketStore.getOHLCV(symbol, 10);
      const summary = marketStore.getSummary(symbol);
      ctrl.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "snapshot", symbol, bars, summary })}\n\n`
        )
      );

      // Stream live ticks every 1.5s
      interval = setInterval(() => {
        try {
          const newBar = marketStore.ingestTick(symbol);
          const updatedSummary = marketStore.getSummary(symbol);
          ctrl.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "tick", symbol, bar: newBar, summary: updatedSummary })}\n\n`
            )
          );
        } catch {
          if (interval) clearInterval(interval);
          try { ctrl.close(); } catch {}
        }
      }, 1500);
    },
    cancel() {
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
