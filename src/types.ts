/**
 * Type definitions for Skynet MCP Server
 */

export interface EnrichedMetadata {
  type: "insight" | "fact" | "preference" | "pattern" | "connection";
  user?: string;
  confidence: number;
  tags?: string;
  importance: number;
  emotion?: "curiosity" | "satisfaction" | "concern" | "neutral" | "excitement";
  timestamp: string;
  source: string;
}

export interface InteractionData {
  id: string;
  user: string;
  input: string;
  output: string;
  timestamp: string;
  intent?: string;
  sentiment?: "positive" | "negative" | "neutral" | "mixed";
  entities: string[];
  topics: string[];
}

export interface UserProfile {
  user: string;
  interactionCount: number;
  isNew?: boolean;
  favoriteTopics?: Array<{ topic: string; frequency: number }>;
}

export interface ContextData {
  user: string;
  interactionCount: number;
  isNewUser: boolean;
  lastInteractionId: string | null;
  recentContext: any[];
  suggestedTopics: string[];
  timestamp: string;
}
