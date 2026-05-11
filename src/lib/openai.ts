import type { ActionBrief, AnalysisRequest, SourceBundle } from "./types";
import { fallbackBrief } from "./fallback";

function extractOutputText(response: unknown): string {
  const maybe = response as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };

  if (maybe.output_text) return maybe.output_text;

  return (
    maybe.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

function parseJson(text: string): ActionBrief {
  const trimmed = text.trim();
  const json = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    : trimmed;
  try {
    return JSON.parse(json) as ActionBrief;
  } catch {
    const first = json.indexOf("{");
    const last = json.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(json.slice(first, last + 1)) as ActionBrief;
    }
    throw new Error("Model did not return parseable JSON.");
  }
}

const actionBriefSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "deepSignal",
    "marketSignal",
    "consumerTension",
    "consumerInsight",
    "obviousAnswerToReject",
    "creativeBets",
    "trendTerritories",
    "creativeDirections",
    "selectedBet",
    "hypothesis",
    "testPlan",
    "metrics",
    "killCondition",
    "businessImpactPath",
    "confidence",
    "confidenceRationale",
    "evidenceTrace",
    "watchOuts"
  ],
  properties: {
    title: { type: "string" },
    deepSignal: {
      type: "object",
      additionalProperties: false,
      required: ["name", "depth", "whyItIsDeeperThanCategory", "evidencePattern"],
      properties: {
        name: { type: "string" },
        depth: { type: "string", enum: ["Weak", "Medium", "Strong"] },
        whyItIsDeeperThanCategory: { type: "string" },
        evidencePattern: { type: "string" }
      }
    },
    marketSignal: { type: "string" },
    consumerTension: { type: "string" },
    consumerInsight: { type: "string" },
    obviousAnswerToReject: {
      type: "object",
      additionalProperties: false,
      required: ["recommendation", "whyItIsWeak"],
      properties: {
        recommendation: { type: "string" },
        whyItIsWeak: { type: "string" }
      }
    },
    creativeBets: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "idea", "whyItCouldWork", "risk", "score"],
        properties: {
          type: { type: "string", enum: ["Messaging", "Product Surface", "Behavioral"] },
          idea: { type: "string" },
          whyItCouldWork: { type: "string" },
          risk: { type: "string" },
          score: { type: "number" }
        }
      }
    },
    trendTerritories: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "trendCue", "creativeOpportunity"],
        properties: {
          name: { type: "string" },
          trendCue: { type: "string" },
          creativeOpportunity: { type: "string" }
        }
      }
    },
    creativeDirections: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["conceptName", "hook", "visualIdea", "channelActivation", "whyItIsFresh"],
        properties: {
          conceptName: { type: "string" },
          hook: { type: "string" },
          visualIdea: { type: "string" },
          channelActivation: { type: "string" },
          whyItIsFresh: { type: "string" }
        }
      }
    },
    selectedBet: { type: "string" },
    hypothesis: { type: "string" },
    testPlan: {
      type: "object",
      additionalProperties: false,
      required: ["audience", "channels", "messageA", "messageB", "offerMechanic", "duration"],
      properties: {
        audience: { type: "string" },
        channels: { type: "array", items: { type: "string" } },
        messageA: { type: "string" },
        messageB: { type: "string" },
        offerMechanic: { type: "string" },
        duration: { type: "string" }
      }
    },
    metrics: { type: "array", items: { type: "string" } },
    killCondition: { type: "string" },
    businessImpactPath: { type: "string" },
    confidence: { type: "string", enum: ["High", "Medium", "Low"] },
    confidenceRationale: { type: "string" },
    evidenceTrace: { type: "array", items: { type: "string" } },
    watchOuts: { type: "array", items: { type: "string" } }
  }
};

export async function synthesizeBrief(input: AnalysisRequest, bundles: SourceBundle[]): Promise<ActionBrief> {
  if (!process.env.OPENAI_API_KEY) {
    return {
      ...fallbackBrief,
      confidenceRationale: `${fallbackBrief.confidenceRationale} Add OPENAI_API_KEY to enable live synthesis.`
    };
  }

  const prompt = `
You are building an interview demo for Grab's product marketing team in Malaysia.

Transform messy external signals into a strategy-grade Hypothesis-to-Plan Brief.

Inputs:
- Market: ${input.market}
- Product: ${input.product}
- Goal: ${input.goal}
- Window: last ${input.window} days
- Evidence bundles:
${JSON.stringify(bundles, null, 2)}

Rules:
- Output exactly one recommended business hypothesis, but first show the deeper signal, consumer tension, obvious answer rejected, and three creative bets.
- Keep it specific to Malaysia and GrabFood.
- Use the chain: specific signal territory -> consumer tension -> non-obvious implication -> creative bets -> selected test plan -> business impact.
- Be honest about weak evidence. If Google Trends is fallback, say confidence is not High.
- Avoid generic phrases like "leverage social media" unless you name the channel role.
- Do not invent internal Grab data.
- Do not default to "give a discount" as the main idea. Prefer a framing, packaging, targeting, timing, or offer-clarity test.
- If an incentive is included, keep the same commercial mechanic across Message A and Message B so the test isolates positioning rather than discount size.
- The kill condition should distinguish attention from business impact, for example clicks without order conversion.
- Reject category-level "insights" like "people are price sensitive" unless you sharpen them into a tension with desire + friction + behavioral unlock.
- Do not let pricing dominate unless the non-pricing evidence is weak. Actively look for cultural food trends, occasions, merchant formats, local food stories, creator/social language, and behavior shifts from Local Trend Web and GDELT.
- Treat Google Trends fallback items as directional seeds only. Use Local Trend Web and GDELT to add trend texture and avoid a purely price-led recommendation.
- At least two trendTerritories should be non-price territories unless the evidence has no credible non-price cues.
- Generate exactly three creative bets: one Messaging, one Product Surface, and one Behavioral. Score them from 0-100 on novelty, evidence fit, business upside, testability, and margin risk.
- The selected bet should be the highest strategic-value bet, not necessarily the easiest promo.
- Add a creative strategy layer that draws from trend cues in the evidence, even when the data is fallback. Translate those cues into three trend territories.
- Then generate three creative directions with campaign hooks, visual ideas, and channel activations. These should feel like concepts a PMM/creative team could brief, not generic A/B copy.
- Avoid templated performance marketing language. The creative directions should have a cultural or behavioral angle, but stay plausible for GrabFood Malaysia.
- Return only valid JSON with this exact shape:
{
  "title": "string",
  "deepSignal": {
    "name": "string",
    "depth": "Weak|Medium|Strong",
    "whyItIsDeeperThanCategory": "string",
    "evidencePattern": "string"
  },
  "marketSignal": "string",
  "consumerTension": "string",
  "consumerInsight": "string",
  "obviousAnswerToReject": {
    "recommendation": "string",
    "whyItIsWeak": "string"
  },
  "creativeBets": [
    {
      "type": "Messaging|Product Surface|Behavioral",
      "idea": "string",
      "whyItCouldWork": "string",
      "risk": "string",
      "score": 0
    }
  ],
  "trendTerritories": [
    {
      "name": "string",
      "trendCue": "string",
      "creativeOpportunity": "string"
    }
  ],
  "creativeDirections": [
    {
      "conceptName": "string",
      "hook": "string",
      "visualIdea": "string",
      "channelActivation": "string",
      "whyItIsFresh": "string"
    }
  ],
  "selectedBet": "string",
  "hypothesis": "string",
  "testPlan": {
    "audience": "string",
    "channels": ["string"],
    "messageA": "string",
    "messageB": "string",
    "offerMechanic": "string",
    "duration": "string"
  },
  "metrics": ["string"],
  "killCondition": "string",
  "businessImpactPath": "string",
  "confidence": "High|Medium|Low",
  "confidenceRationale": "string",
  "evidenceTrace": ["string"],
  "watchOuts": ["string"]
}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "action_brief",
          strict: true,
          schema: actionBriefSchema
        }
      },
      max_output_tokens: 2600
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI synthesis failed: ${response.status} ${error.slice(0, 240)}`);
  }

  const data = await response.json();
  return parseJson(extractOutputText(data));
}
