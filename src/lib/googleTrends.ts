import type { AnalysisRequest, EvidenceItem, SourceBundle } from "./types";
import { fallbackTrendItems, MALAYSIA_KEYWORDS } from "./fallback";

const GOOGLE_TRENDS_TZ = "-480";

function trendsTime(input: AnalysisRequest) {
  if (input.window === "7") return "now 7-d";
  return "today 1-m";
}

function stripGooglePrefix(text: string) {
  return text.replace(/^\)\]\}',?\n?/, "");
}

async function trendsFetch(url: URL) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        Accept: "application/json,text/plain,*/*"
      },
      signal: controller.signal,
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Google Trends returned ${response.status}`);
    return stripGooglePrefix(await response.text());
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchKeywordScore(keyword: string, input: AnalysisRequest): Promise<EvidenceItem | null> {
  const exploreReq = {
    comparisonItem: [
      {
        keyword,
        geo: "MY",
        time: trendsTime(input)
      }
    ],
    category: 0,
    property: ""
  };

  const exploreUrl = new URL("https://trends.google.com/trends/api/explore");
  exploreUrl.searchParams.set("hl", "en-US");
  exploreUrl.searchParams.set("tz", GOOGLE_TRENDS_TZ);
  exploreUrl.searchParams.set("req", JSON.stringify(exploreReq));

  const explore = JSON.parse(await trendsFetch(exploreUrl)) as {
    widgets?: Array<{ id?: string; token?: string; request?: unknown }>;
  };
  const widget = explore.widgets?.find((candidate) => candidate.id === "TIMESERIES");
  if (!widget?.token || !widget.request) return null;

  const dataUrl = new URL("https://trends.google.com/trends/api/widgetdata/multiline");
  dataUrl.searchParams.set("hl", "en-US");
  dataUrl.searchParams.set("tz", GOOGLE_TRENDS_TZ);
  dataUrl.searchParams.set("req", JSON.stringify(widget.request));
  dataUrl.searchParams.set("token", widget.token);

  const data = JSON.parse(await trendsFetch(dataUrl)) as {
    default?: { timelineData?: Array<{ value?: number[] }> };
  };

  const values = data.default?.timelineData?.flatMap((point) => point.value ?? []) ?? [];
  const usable = values.filter((value) => typeof value === "number");
  if (!usable.length) return null;

  const recent = usable.slice(Math.max(0, usable.length - 3));
  const score = Math.round(recent.reduce((sum, value) => sum + value, 0) / recent.length);

  return {
    source: "Google Trends",
    title: keyword,
    summary: `Recent Malaysia search interest score: ${score}/100 over the last ${input.window} days.`,
    language: /[a-z]/i.test(keyword) ? "en/ms" : "unknown",
    score,
    kind: "seed"
  };
}

async function fetchRelatedQueries(keyword: string, input: AnalysisRequest): Promise<EvidenceItem[]> {
  const exploreReq = {
    comparisonItem: [
      {
        keyword,
        geo: "MY",
        time: trendsTime(input)
      }
    ],
    category: 0,
    property: ""
  };

  const exploreUrl = new URL("https://trends.google.com/trends/api/explore");
  exploreUrl.searchParams.set("hl", "en-US");
  exploreUrl.searchParams.set("tz", GOOGLE_TRENDS_TZ);
  exploreUrl.searchParams.set("req", JSON.stringify(exploreReq));

  const explore = JSON.parse(await trendsFetch(exploreUrl)) as {
    widgets?: Array<{ id?: string; token?: string; request?: unknown }>;
  };
  const widget = explore.widgets?.find((candidate) => candidate.id === "RELATED_QUERIES");
  if (!widget?.token || !widget.request) return [];

  const dataUrl = new URL("https://trends.google.com/trends/api/widgetdata/relatedsearches");
  dataUrl.searchParams.set("hl", "en-US");
  dataUrl.searchParams.set("tz", GOOGLE_TRENDS_TZ);
  dataUrl.searchParams.set("req", JSON.stringify(widget.request));
  dataUrl.searchParams.set("token", widget.token);

  const data = JSON.parse(await trendsFetch(dataUrl)) as {
    default?: {
      rankedList?: Array<{
        rankedKeyword?: Array<{ query?: string; value?: number; formattedValue?: string }>;
      }>;
    };
  };

  const rising = data.default?.rankedList?.[1]?.rankedKeyword ?? [];
  const top = data.default?.rankedList?.[0]?.rankedKeyword ?? [];

  return [...rising.slice(0, 4), ...top.slice(0, 2)]
    .filter((item) => item.query)
    .map((item) => ({
      source: "Google Trends" as const,
      title: item.query ?? keyword,
      summary: `Related query from the seed "${keyword}"${item.formattedValue ? `, indexed as ${item.formattedValue}` : ""}.`,
      language: /[a-z]/i.test(item.query ?? "") ? "en/ms" : "unknown",
      score: typeof item.value === "number" ? item.value : undefined,
      kind: "rising" as const
    }));
}

export async function fetchGoogleTrendSignals(input: AnalysisRequest): Promise<SourceBundle> {
  try {
    const results: EvidenceItem[] = [];

    for (const keyword of MALAYSIA_KEYWORDS.slice(0, 4)) {
      const related = await fetchRelatedQueries(keyword, input);
      results.push(...related);
      if (results.length >= 5) break;
    }

    for (const keyword of MALAYSIA_KEYWORDS.slice(0, 6)) {
      if (results.length >= 8) break;
      const item = await fetchKeywordScore(keyword, input);
      if (item) results.push(item);
    }

    if (!results.length) throw new Error("Google Trends returned no usable keyword scores");

    return {
      source: "Google Trends",
      status: "live",
      note: `Fetched best-effort Malaysia related/rising queries and search-interest scores for ${results.length} localized terms.`,
      items: results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    };
  } catch (error) {
    return {
      source: "Google Trends",
      status: "fallback",
      note:
        error instanceof Error
          ? `Google Trends fallback: ${error.message}`
          : "Google Trends fallback data used.",
      items: fallbackTrendItems
    };
  }
}
