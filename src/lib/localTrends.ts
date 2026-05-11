import type { AnalysisRequest, EvidenceItem, SourceBundle } from "./types";
import { fallbackLocalTrendItems } from "./fallback";

const QUERIES = [
  "Malaysia food trend KL viral food cafe kopitiam",
  "Malaysia lunch food trend office workers cafe hawker",
  "Kuala Lumpur food trend local cafe restaurant menu",
  "Malaysia viral food local food trend"
];

function decodeXml(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTag(item: string, tag: string) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1]).replace(/<[^>]+>/g, "").trim() : undefined;
}

function parseRss(xml: string): EvidenceItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  return items.slice(0, 4).map((item) => {
    const title = extractTag(item, "title") ?? "Malaysia food trend item";
    const source = extractTag(item, "source");
    const description = extractTag(item, "description");

    return {
      source: "Local Trend Web" as const,
      title,
      summary: source
        ? `Current food/lifestyle signal from ${source}. ${description ?? ""}`.trim()
        : description ?? "Current Malaysia food/lifestyle signal.",
      url: extractTag(item, "link"),
      publishedAt: extractTag(item, "pubDate"),
      language: "mixed",
      kind: "article" as const
    };
  });
}

async function fetchNewsQuery(query: string, input: AnalysisRequest): Promise<EvidenceItem[]> {
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", `${query} when:${input.window}d`);
  url.searchParams.set("hl", "en-MY");
  url.searchParams.set("gl", "MY");
  url.searchParams.set("ceid", "MY:en");

  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; grab-signal-lab-demo/0.1)" },
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`Local trend web returned ${response.status}`);
  return parseRss(await response.text());
}

export async function fetchLocalTrendSignals(input: AnalysisRequest): Promise<SourceBundle> {
  try {
    const settled = await Promise.allSettled(QUERIES.map((query) => fetchNewsQuery(query, input)));
    const items = settled
      .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
      .filter((item, index, all) => all.findIndex((candidate) => candidate.title === item.title) === index)
      .slice(0, 10);

    if (!items.length) throw new Error("Local trend web returned no usable items");

    return {
      source: "Local Trend Web",
      status: "live",
      note: `Fetched ${items.length} current Malaysia food/lifestyle trend items from local news search.`,
      items
    };
  } catch (error) {
    return {
      source: "Local Trend Web",
      status: "fallback",
      note:
        error instanceof Error
          ? `Local trend-web fallback: ${error.message}`
          : "Local trend-web fallback data used.",
      items: fallbackLocalTrendItems
    };
  }
}
