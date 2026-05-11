import type { AnalysisRequest, SourceBundle } from "./types";
import { fallbackGdeltItems } from "./fallback";

function windowToTimespan(days: string) {
  return `${days}d`;
}

export async function fetchGdeltSignals(input: AnalysisRequest): Promise<SourceBundle> {
  const query = [
    "sourcecountry:MY",
    "(GrabFood OR \"food delivery\" OR lunch OR dining OR restaurant OR cafe OR \"makan tengah hari\" OR \"makanan murah\" OR \"promosi makanan\")"
  ].join(" ");

  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("maxrecords", "20");
  url.searchParams.set("format", "json");
  url.searchParams.set("timespan", windowToTimespan(input.window));
  url.searchParams.set("sort", "hybridrel");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "grab-signal-lab-demo/0.1" },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`GDELT returned ${response.status}`);
    }

    const data = (await response.json()) as {
      articles?: Array<{
        title?: string;
        seendate?: string;
        url?: string;
        sourceCountry?: string;
        language?: string;
        domain?: string;
      }>;
    };

    const items = (data.articles ?? []).slice(0, 10).map((article) => ({
      source: "GDELT" as const,
      title: article.title || "Untitled Malaysia market article",
      summary: `Regional news/context item from ${article.domain || "GDELT"} for ${input.product} hypothesis generation.`,
      url: article.url,
      language: article.language,
      publishedAt: article.seendate,
      kind: "article" as const
    }));

    if (!items.length) {
      throw new Error("GDELT returned no articles");
    }

    return {
      source: "GDELT",
      status: "live",
      note: `Fetched ${items.length} Malaysia market-context articles from GDELT.`,
      items
    };
  } catch (error) {
    return {
      source: "GDELT",
      status: "fallback",
      note: error instanceof Error ? `GDELT fallback: ${error.message}` : "GDELT fallback data used.",
      items: fallbackGdeltItems
    };
  }
}
