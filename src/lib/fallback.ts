import type { ActionBrief, EvidenceItem, SourceBundle } from "./types";

export const MALAYSIA_KEYWORDS = [
  "food delivery Malaysia",
  "office lunch KL",
  "delivery fee Malaysia",
  "menu rahmah",
  "makan bajet KL",
  "makan tengah hari",
  "promosi makanan",
  "set lunch bawah RM15",
  "set makan",
  "kedai makan viral",
  "group lunch order"
];

export const fallbackTrendItems: EvidenceItem[] = [
  {
    source: "Fallback",
    title: "makan tengah hari",
    summary: "Malay lunch-related search interest is treated as a proxy for weekday meal planning, not a complete signal by itself.",
    language: "ms",
    score: 74,
    kind: "seed"
  },
  {
    source: "Fallback",
    title: "set lunch bawah RM15",
    summary: "A price-ceiling phrase creates a deeper signal around total-cost certainty for routine meals.",
    language: "ms",
    score: 72,
    kind: "rising"
  },
  {
    source: "Fallback",
    title: "delivery fee Malaysia",
    summary: "Fee-related search behavior suggests the barrier may be final checkout uncertainty, not only item price.",
    language: "en/ms",
    score: 66,
    kind: "related"
  },
  {
    source: "Fallback",
    title: "makan bajet KL",
    summary: "Budget-meal language anchored to Kuala Lumpur creates a more local urban lunch signal.",
    language: "ms",
    score: 63,
    kind: "related"
  }
];

export const fallbackGdeltItems: EvidenceItem[] = [
  {
    source: "Fallback",
    title: "Malaysia consumers remain value-conscious around daily spending",
    summary: "Cost-of-living coverage suggests everyday meal choices need a clear budget justification.",
    language: "en",
    kind: "article"
  },
  {
    source: "Fallback",
    title: "Local food discovery remains strong in Klang Valley",
    summary: "Lifestyle and dining coverage keeps affordable food discovery culturally salient.",
    language: "en",
    kind: "article"
  }
];

export const fallbackLocalTrendItems: EvidenceItem[] = [
  {
    source: "Fallback",
    title: "Kopitiam and local cafe storytelling",
    summary:
      "Recent Malaysia food coverage often celebrates local cafe founders, kopitiam formats, and neighborhood food identity rather than pure discounting.",
    language: "en/ms",
    kind: "article"
  },
  {
    source: "Fallback",
    title: "Value proteins and smarter menus",
    summary:
      "Food coverage around secondary cuts and chef-led menu creativity suggests a trend toward value without making the brand feel cheap.",
    language: "en",
    kind: "article"
  },
  {
    source: "Fallback",
    title: "Neighborhood food discovery",
    summary:
      "Local dining stories point to consumers wanting trusted nearby food finds, not only anonymous deals.",
    language: "en",
    kind: "article"
  }
];

export function fallbackBundles(): SourceBundle[] {
  return [
    {
      source: "Google Trends",
      status: "fallback",
      note: "Google Trends live fetch was unavailable, so the demo is using curated Malaysia search-intent examples.",
      items: fallbackTrendItems
    },
    {
      source: "Local Trend Web",
      status: "fallback",
      note: "Local trend-web fetch was unavailable, so the demo is using curated Malaysia food-culture trend examples.",
      items: fallbackLocalTrendItems
    },
    {
      source: "GDELT",
      status: "fallback",
      note: "GDELT live fetch was unavailable, so the demo is using sample Malaysia market context.",
      items: fallbackGdeltItems
    }
  ];
}

export const fallbackBrief: ActionBrief = {
  title: "No-Surprise Lunch: A Klang Valley GrabFood Bet",
  deepSignal: {
    name: "Total-cost certainty for routine weekday meals",
    depth: "Medium",
    whyItIsDeeperThanCategory:
      "The useful signal is not that people search for lunch or promos. It is that routine weekday meals need a predictable final price before delivery feels justifiable.",
    evidencePattern:
      "Malay lunch intent, price-ceiling phrases, delivery-fee concern, and value-conscious consumer context point to checkout certainty as the sharper territory."
  },
  marketSignal:
    "Malaysia food signals point toward value-conscious weekday lunch planning, with stronger texture around price ceilings and final-cost anxiety than generic food discovery.",
  consumerTension:
    "I want the convenience of delivery for an ordinary workday lunch, but I do not want the final bill to feel like an indulgence or a surprise.",
  consumerInsight:
    "Urban consumers may not need a bigger discount; they need permission to make delivery feel routine by seeing the full meal economics upfront.",
  obviousAnswerToReject: {
    recommendation: "Run a broad RM5 weekday lunch discount.",
    whyItIsWeak:
      "It tests whether people like cheaper food, not whether GrabFood can create a more defensible lunch habit. It is margin-costly and easy for competitors to copy."
  },
  creativeBets: [
    {
      type: "Messaging",
      idea: "Frame lunch as 'under RM15 all-in' rather than 'deals near you'.",
      whyItCouldWork: "It answers the final-cost anxiety directly and makes the decision feel controlled.",
      risk: "The price ceiling may be hard to maintain across merchants and delivery distances.",
      score: 82
    },
    {
      type: "Product Surface",
      idea: "Create a No-Surprise Lunch shelf showing only meals where item, fees, and delivery stay within a visible ceiling.",
      whyItCouldWork: "It turns a vague promo into a product promise that reduces checkout abandonment.",
      risk: "Operational accuracy and merchant supply must be tight enough to avoid broken trust.",
      score: 88
    },
    {
      type: "Behavioral",
      idea: "Test office lunch pods where colleagues ordering before 11:30 unlock clearer delivery economics.",
      whyItCouldWork: "It shifts the behavior from individual discount hunting to a repeatable workplace habit.",
      risk: "More complex to explain and may require product support beyond a simple campaign.",
      score: 76
    }
  ],
  trendTerritories: [
    {
      name: "No-surprise spending",
      trendCue: "Price-ceiling searches and delivery-fee concern point to consumers wanting control before checkout.",
      creativeOpportunity: "Make the final price the hero, not the discount mechanic."
    },
    {
      name: "Office lunch autopilot",
      trendCue: "Weekday lunch intent is routine-driven rather than discovery-driven.",
      creativeOpportunity: "Position GrabFood as the thing that removes the daily lunch decision."
    },
    {
      name: "Budget pride, not budget shame",
      trendCue: "Makan bajet language can be reframed as smart local know-how.",
      creativeOpportunity: "Make value feel clever and culturally fluent, not cheap."
    }
  ],
  creativeDirections: [
    {
      conceptName: "The Receipt That Behaves",
      hook: "Lunch that stays inside the number in your head.",
      visualIdea: "A receipt UI where every line item snaps into one calm RM15 total instead of creeping upward.",
      channelActivation: "Short video, in-app tile, and push using a before/after checkout-cost reveal.",
      whyItIsFresh: "It dramatizes hidden-fee anxiety instead of announcing another promo."
    },
    {
      conceptName: "11:30 Lunch Lock",
      hook: "Lock lunch before the queue locks you in.",
      visualIdea: "Office workers tapping one fixed-price lunch shelf before the lunch rush clock turns red.",
      channelActivation: "Timed push and homepage takeover between 10:45am and 11:30am.",
      whyItIsFresh: "It makes timing and certainty the behavior, not only price."
    },
    {
      conceptName: "Bajet Boss Lunch",
      hook: "Smart lunch, not sad lunch.",
      visualIdea: "Local dishes framed like confident budget wins with clear all-in pricing.",
      channelActivation: "Creator-style carousel highlighting RM15 all-in picks by neighborhood.",
      whyItIsFresh: "It borrows local value language and gives it personality instead of corporate deal-speak."
    }
  ],
  selectedBet: "Product Surface: No-Surprise Lunch shelf",
  hypothesis:
    "If GrabFood packages weekday lunch around visible all-in price certainty rather than generic promo language, Klang Valley office workers will convert at a higher rate during the lunch window.",
  testPlan: {
    audience: "Klang Valley office workers and early-career professionals who browse GrabFood between 10:30am and 1:30pm.",
    channels: ["GrabFood homepage tile", "Push notification", "In-app offer shelf"],
    messageA: "Lunch deals near you",
    messageB: "No-surprise lunch under RM15 all-in",
    offerMechanic: "Curated merchant shelf where meal price, delivery fee, and service fees stay within a displayed ceiling.",
    duration: "7 days, Monday to Friday focus"
  },
  metrics: ["Tile CTR", "Add-to-cart rate", "Order conversion", "Repeat order within 7 days"],
  killCondition:
    "Kill the bet if value-framed messaging lifts clicks but does not improve order conversion versus generic lunch deals.",
  businessImpactPath:
    "Higher weekday order frequency and promo efficiency by moving from blanket discounting to clearer value framing.",
  confidence: "Medium",
  confidenceRationale:
    "The evidence supports value-conscious meal intent, but external signals alone do not prove GrabFood transaction lift.",
  evidenceTrace: ["Google Trends fallback: makan tengah hari", "Google Trends fallback: promosi makanan", "GDELT fallback: value-conscious consumers"],
  watchOuts: ["Do not overgeneralize beyond Klang Valley.", "Avoid a pure discount race if merchant economics are weak."]
};
