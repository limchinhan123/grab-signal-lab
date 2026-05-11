"use client";

import { useMemo, useState } from "react";
import type { ActionBrief, SourceBundle } from "@/lib/types";

type StageState = {
  sources: "idle" | "running" | "complete";
  synthesis: "idle" | "running" | "complete";
};

const initialStages: StageState = { sources: "idle", synthesis: "idle" };

function statusLabel(status: SourceBundle["status"]) {
  if (status === "live") return "Live";
  if (status === "fallback") return "Fallback";
  return "Error";
}

function confidenceClass(confidence?: ActionBrief["confidence"]) {
  if (confidence === "High") return "text-emerald-300 border-emerald-400/40 bg-emerald-400/10";
  if (confidence === "Low") return "text-rose-300 border-rose-400/40 bg-rose-400/10";
  return "text-amber-200 border-amber-300/40 bg-amber-300/10";
}

function depthClass(depth?: ActionBrief["deepSignal"]["depth"]) {
  if (depth === "Strong") return "text-emerald-300 border-emerald-400/40 bg-emerald-400/10";
  if (depth === "Weak") return "text-rose-300 border-rose-400/40 bg-rose-400/10";
  return "text-amber-200 border-amber-300/40 bg-amber-300/10";
}

function isEnhancedBrief(brief: ActionBrief | null): brief is ActionBrief {
  return Boolean(
    brief?.deepSignal &&
      brief.obviousAnswerToReject &&
      brief.creativeBets &&
      brief.trendTerritories &&
      brief.creativeDirections
  );
}

function clip(text: string, max = 150) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function DetailDrawer({
  title,
  children
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <details className="group rounded-md border border-white/10 bg-black/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-medium text-white/80">
        {title}
        <span className="text-xs text-white/35 transition group-open:rotate-45">+</span>
      </summary>
      <div className="border-t border-white/10 px-4 py-4">{children}</div>
    </details>
  );
}

export default function Home() {
  const [goal, setGoal] = useState("Increase weekday lunch orders");
  const [windowDays, setWindowDays] = useState<"7" | "14" | "30">("14");
  const [stages, setStages] = useState<StageState>(initialStages);
  const [sources, setSources] = useState<SourceBundle[]>([]);
  const [brief, setBrief] = useState<ActionBrief | null>(null);
  const [message, setMessage] = useState("Ready to turn live market signals into a testable plan.");
  const [running, setRunning] = useState(false);

  const sourceCount = useMemo(
    () => sources.reduce((sum, bundle) => sum + bundle.items.length, 0),
    [sources]
  );

  async function runAnalysis() {
    setRunning(true);
    setSources([]);
    setBrief(null);
    setStages(initialStages);
    setMessage("Starting analysis...");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        market: "Malaysia",
        product: "GrabFood",
        goal,
        window: windowDays
      })
    });

    if (!response.body) {
      setMessage("The analysis stream did not start.");
      setRunning(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const payload = JSON.parse(line) as { event: string; data: unknown };
        if (payload.event === "stage") {
          const stage = payload.data as {
            id: keyof StageState;
            status: StageState[keyof StageState];
            message: string;
          };
          setMessage(stage.message);
          setStages((current) => ({ ...current, [stage.id]: stage.status }));
        }
        if (payload.event === "sources") setSources(payload.data as SourceBundle[]);
        if (payload.event === "brief") setBrief(payload.data as ActionBrief);
        if (payload.event === "error") setMessage(String(payload.data));
      }
    }

    setRunning(false);
  }

  async function copyBrief() {
    if (!brief) return;
    const markdown = `# ${brief.title}

## Market Signal
${brief.deepSignal.name} (${brief.deepSignal.depth} depth)
${brief.deepSignal.whyItIsDeeperThanCategory}

${brief.marketSignal}

## Consumer Tension
${brief.consumerTension}

## Consumer Insight
${brief.consumerInsight}

## Obvious Answer Rejected
${brief.obviousAnswerToReject.recommendation}
${brief.obviousAnswerToReject.whyItIsWeak}

## Creative Bets
${brief.creativeBets.map((bet) => `- ${bet.type} (${bet.score}/100): ${bet.idea}`).join("\n")}

## Trend Territories
${brief.trendTerritories.map((territory) => `- ${territory.name}: ${territory.creativeOpportunity}`).join("\n")}

## Creative Directions
${brief.creativeDirections.map((direction) => `- ${direction.conceptName}: ${direction.hook} ${direction.visualIdea}`).join("\n")}

## Selected Bet
${brief.selectedBet}

## Hypothesis
${brief.hypothesis}

## Test Plan
- Audience: ${brief.testPlan.audience}
- Channels: ${brief.testPlan.channels.join(", ")}
- Message A: ${brief.testPlan.messageA}
- Message B: ${brief.testPlan.messageB}
- Offer: ${brief.testPlan.offerMechanic}
- Duration: ${brief.testPlan.duration}

## Metrics
${brief.metrics.map((metric) => `- ${metric}`).join("\n")}

## Kill Condition
${brief.killCondition}

## Business Impact Path
${brief.businessImpactPath}

## Confidence
${brief.confidence}: ${brief.confidenceRationale}`;

    await navigator.clipboard.writeText(markdown);
    setMessage("Copied the brief as markdown.");
  }

  return (
    <main className="min-h-screen bg-[#080b0a] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Grab Signal Lab</h1>
            <p className="mt-1 text-sm text-white/55">
              Malaysia market signals into actionable GrabFood hypotheses and plans.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={running}
            className="h-11 rounded-md bg-[#00B14F] px-5 text-sm font-semibold text-[#03140a] transition hover:bg-[#20d66f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {running ? "Running..." : "Run Analysis"}
          </button>
        </header>

        <section className="grid gap-4 py-5 lg:grid-cols-[180px_180px_1fr]">
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Market</p>
            <p className="mt-3 text-lg font-medium">Malaysia</p>
          </div>
          <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/35">Product</p>
            <p className="mt-3 text-lg font-medium">GrabFood</p>
          </div>
          <div className="grid gap-4 rounded-md border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[1fr_160px]">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.22em] text-white/35">Business Goal</span>
              <input
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                className="mt-3 h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-[#00B14F]"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.22em] text-white/35">Window</span>
              <select
                value={windowDays}
                onChange={(event) => setWindowDays(event.target.value as "7" | "14" | "30")}
                className="mt-3 h-11 w-full rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition focus:border-[#00B14F]"
              >
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </label>
          </div>
        </section>

        <div className="mb-5 rounded-md border border-[#00B14F]/25 bg-[#00B14F]/10 px-4 py-3 text-sm text-[#b9ffd5]">
          {message}
        </div>

        <section className="grid flex-1 gap-5 lg:grid-cols-[0.95fr_1.25fr]">
          <div className="space-y-5">
            <div className="rounded-md border border-white/10 bg-[#101412] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#00B14F]">1. Market Signals</p>
                  <h2 className="mt-2 text-xl font-semibold">Evidence Intake</h2>
                </div>
                <span className="rounded-sm border border-white/10 px-2 py-1 text-xs text-white/55">
                  {stages.sources === "running" ? "Scanning" : `${sourceCount} items`}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {sources.length === 0 ? (
                  <div className="rounded-md border border-dashed border-white/15 p-5 text-sm text-white/45">
                    Sources will appear here. Google Trends is best-effort with fallback; GDELT is live where available.
                  </div>
                ) : (
                  sources.map((bundle) => (
                    <div key={bundle.source} className="rounded-md border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium">{bundle.source}</h3>
                        <span className="rounded-sm border border-white/10 px-2 py-1 text-xs text-white/65">
                          {statusLabel(bundle.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-white/45">{bundle.note}</p>
                      <div className="mt-4 space-y-3">
                        {bundle.items.slice(0, 5).map((item, index) => (
                          <a
                            key={`${item.title}-${index}`}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded border border-white/8 bg-white/[0.03] p-3 transition hover:border-[#00B14F]/50"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-white">{item.title}</p>
                              {typeof item.score === "number" ? (
                                <span className="text-xs text-[#00B14F]">{item.score}/100</span>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-white/40">
                              {item.kind ? <span>{item.kind}</span> : null}
                              {item.language ? <span>{item.language}</span> : null}
                              <span>{clip(item.summary, 96)}</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-white/10 bg-[#101412] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#00B14F]">
                  2. Insight to Plan
                </p>
                <h2 className="mt-2 text-xl font-semibold">Hypothesis-to-Plan Brief</h2>
              </div>
              {brief ? (
                <button
                  onClick={copyBrief}
                  className="h-9 rounded-md border border-white/10 px-3 text-xs font-medium text-white/70 transition hover:border-[#00B14F]/60 hover:text-white"
                >
                  Copy Markdown
                </button>
              ) : null}
            </div>

            {!isEnhancedBrief(brief) ? (
              <div className="mt-5 grid min-h-[560px] place-items-center rounded-md border border-dashed border-white/15 p-8 text-center">
                <div>
                  <p className="text-lg font-medium text-white/80">
                    Run the analysis to generate one practical business bet.
                  </p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
                    The final output connects market signal, consumer insight, hypothesis, action plan,
                    measurement, and kill condition.
                  </p>
                </div>
              </div>
            ) : (
              <article className="mt-5 space-y-4">
                <section className="rounded-md border border-[#00B14F]/30 bg-[#00B14F]/[0.07] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[#73e8a5]">
                        Recommended Creative Bet
                      </p>
                      <h3 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white">
                        {brief.selectedBet}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-md border px-3 py-1 text-sm ${depthClass(brief.deepSignal.depth)}`}>
                        {brief.deepSignal.depth} signal
                      </span>
                      <span className={`rounded-md border px-3 py-1 text-sm ${confidenceClass(brief.confidence)}`}>
                        {brief.confidence} confidence
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Signal</p>
                      <p className="mt-2 text-sm leading-5 text-white/80">{brief.deepSignal.name}</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Tension</p>
                      <p className="mt-2 text-sm leading-5 text-white/80">{clip(brief.consumerTension, 130)}</p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/20 p-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Kill Rule</p>
                      <p className="mt-2 text-sm leading-5 text-white/80">{clip(brief.killCondition, 120)}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-md border border-white/10 bg-black/20 p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-white/35">Creative Routes</p>
                      <p className="mt-2 text-sm text-white/45">Pick a route to brief, mock, or test.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {brief.creativeDirections.map((direction) => (
                      <div
                        key={direction.conceptName}
                        className="rounded-md border border-white/10 bg-white/[0.035] p-4"
                      >
                        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                          <div>
                            <p className="text-lg font-semibold text-white">{direction.conceptName}</p>
                            <p className="mt-2 text-base font-medium leading-6 text-[#73e8a5]">{direction.hook}</p>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Visual</p>
                              <p className="mt-1 text-sm leading-5 text-white/75">{clip(direction.visualIdea, 130)}</p>
                            </div>
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">Activation</p>
                              <p className="mt-1 text-sm leading-5 text-white/75">
                                {clip(direction.channelActivation, 130)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid gap-3 md:grid-cols-3">
                  {brief.trendTerritories.map((territory) => (
                    <section key={territory.name} className="rounded-md border border-white/10 bg-black/20 p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#73e8a5]">Trend Territory</p>
                      <p className="mt-2 text-sm font-semibold text-white">{territory.name}</p>
                      <p className="mt-2 text-xs leading-5 text-white/50">{clip(territory.creativeOpportunity, 115)}</p>
                    </section>
                  ))}
                </div>

                <DetailDrawer title="Strategy Spine">
                  <div className="grid gap-3 md:grid-cols-2">
                    {[
                      ["Consumer insight", brief.consumerInsight],
                      ["Hypothesis", brief.hypothesis],
                      ["Business impact", brief.businessImpactPath],
                      ["Why not obvious", brief.obviousAnswerToReject.whyItIsWeak]
                    ].map(([label, text]) => (
                      <div key={label}>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
                        <p className="mt-2 text-sm leading-6 text-white/75">{text}</p>
                      </div>
                    ))}
                  </div>
                </DetailDrawer>

                <DetailDrawer title="Test Plan">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Audience</p>
                      <p className="mt-2 text-sm leading-6 text-white/75">{brief.testPlan.audience}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Channels</p>
                      <p className="mt-2 text-sm leading-6 text-white/75">{brief.testPlan.channels.join(", ")}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">A</p>
                      <p className="mt-2 text-sm leading-6 text-white/75">{brief.testPlan.messageA}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">B</p>
                      <p className="mt-2 text-sm leading-6 text-white/75">{brief.testPlan.messageB}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Mechanic</p>
                      <p className="mt-2 text-sm leading-6 text-white/75">{brief.testPlan.offerMechanic}</p>
                    </div>
                  </div>
                </DetailDrawer>

                <DetailDrawer title="Creative Bet Scores">
                  <div className="grid gap-3 lg:grid-cols-3">
                    {brief.creativeBets.map((bet) => (
                      <div key={bet.type} className="rounded-md border border-white/10 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{bet.type}</p>
                          <span className="text-xs text-[#00B14F]">{bet.score}/100</span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/75">{bet.idea}</p>
                        <p className="mt-3 text-xs leading-5 text-white/40">Risk: {bet.risk}</p>
                      </div>
                    ))}
                  </div>
                </DetailDrawer>

                <DetailDrawer title="Evidence, Metrics, Risks">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Evidence</p>
                      <ul className="mt-3 space-y-2 text-sm text-white/70">
                        {brief.evidenceTrace.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Metrics</p>
                      <ul className="mt-3 space-y-2 text-sm text-white/70">
                        {brief.metrics.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/35">Risks</p>
                      <ul className="mt-3 space-y-2 text-sm text-white/70">
                        {brief.watchOuts.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </DetailDrawer>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
