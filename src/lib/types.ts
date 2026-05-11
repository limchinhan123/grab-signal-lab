export type SourceStatus = "live" | "fallback" | "error";

export type AnalysisRequest = {
  market: "Malaysia";
  product: "GrabFood";
  goal: string;
  window: "7" | "14" | "30";
};

export type EvidenceItem = {
  source: "Google Trends" | "GDELT" | "Local Trend Web" | "Fallback";
  title: string;
  summary: string;
  url?: string;
  language?: string;
  publishedAt?: string;
  score?: number;
  kind?: "seed" | "rising" | "related" | "article" | "fallback";
};

export type SourceBundle = {
  source: "Google Trends" | "GDELT" | "Local Trend Web";
  status: SourceStatus;
  note: string;
  items: EvidenceItem[];
};

export type ActionBrief = {
  title: string;
  deepSignal: {
    name: string;
    depth: "Weak" | "Medium" | "Strong";
    whyItIsDeeperThanCategory: string;
    evidencePattern: string;
  };
  marketSignal: string;
  consumerTension: string;
  consumerInsight: string;
  obviousAnswerToReject: {
    recommendation: string;
    whyItIsWeak: string;
  };
  creativeBets: Array<{
    type: "Messaging" | "Product Surface" | "Behavioral";
    idea: string;
    whyItCouldWork: string;
    risk: string;
    score: number;
  }>;
  trendTerritories: Array<{
    name: string;
    trendCue: string;
    creativeOpportunity: string;
  }>;
  creativeDirections: Array<{
    conceptName: string;
    hook: string;
    visualIdea: string;
    channelActivation: string;
    whyItIsFresh: string;
  }>;
  selectedBet: string;
  hypothesis: string;
  testPlan: {
    audience: string;
    channels: string[];
    messageA: string;
    messageB: string;
    offerMechanic: string;
    duration: string;
  };
  metrics: string[];
  killCondition: string;
  businessImpactPath: string;
  confidence: "High" | "Medium" | "Low";
  confidenceRationale: string;
  evidenceTrace: string[];
  watchOuts: string[];
};
