import { fetchGdeltSignals } from "@/lib/gdelt";
import { fetchGoogleTrendSignals } from "@/lib/googleTrends";
import { fetchLocalTrendSignals } from "@/lib/localTrends";
import { synthesizeBrief } from "@/lib/openai";
import type { AnalysisRequest, SourceBundle } from "@/lib/types";
import { fallbackBrief } from "@/lib/fallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function send(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  controller.enqueue(new TextEncoder().encode(`${JSON.stringify({ event, data })}\n`));
}

function normalizeRequest(body: Partial<AnalysisRequest>): AnalysisRequest {
  return {
    market: "Malaysia",
    product: "GrabFood",
    goal: body.goal || "Increase weekday lunch orders",
    window: body.window || "14"
  };
}

export async function POST(request: Request) {
  const input = normalizeRequest(await request.json().catch(() => ({})));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, "stage", {
          id: "sources",
          status: "running",
          message: "Scanning Malaysia search intent and market context..."
        });

        const [trends, localTrends, gdelt] = await Promise.all([
          fetchGoogleTrendSignals(input),
          fetchLocalTrendSignals(input),
          fetchGdeltSignals(input)
        ]);
        const bundles: SourceBundle[] = [trends, localTrends, gdelt];

        send(controller, "sources", bundles);
        send(controller, "stage", {
          id: "sources",
          status: "complete",
          message: "Signals collected and normalized."
        });

        send(controller, "stage", {
          id: "synthesis",
          status: "running",
          message: "Converting signals into a GrabFood hypothesis and test plan..."
        });

        try {
          const brief = await synthesizeBrief(input, bundles);
          send(controller, "brief", brief);
        } catch (error) {
          send(controller, "brief", {
            ...fallbackBrief,
            confidence: "Low",
            confidenceRationale:
              error instanceof Error
                ? `OpenAI synthesis was unavailable, so fallback synthesis is shown. ${error.message}`
                : "OpenAI synthesis was unavailable, so fallback synthesis is shown."
          });
        }

        send(controller, "stage", {
          id: "synthesis",
          status: "complete",
          message: "Hypothesis-to-plan brief ready."
        });
        send(controller, "done", true);
      } catch (error) {
        send(controller, "error", error instanceof Error ? error.message : "Analysis failed.");
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform"
    }
  });
}
