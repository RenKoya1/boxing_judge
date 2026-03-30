export interface BoxingEvent {
  timestamp: string;
  type: "punch_landed" | "knockdown" | "combination" | "defensive" | "foul" | "referee" | "clinch";
  fighter: "red_corner" | "blue_corner";
  description: string;
  punchType: string | null;
  impact: "clean" | "partial" | "blocked" | "missed";
  significance: number;
}

export interface FighterScore {
  cleanPunches: number;
  powerPunches: number;
  knockdowns: number;
  defense: number;
  aggression: number;
  ringControl: number;
}

export interface RoundAnalysis {
  round: number;
  summary: string;
  events: BoxingEvent[];
  aiScoring: {
    redCorner: FighterScore;
    blueCorner: FighterScore;
  };
  highlights: {
    timestamp: string;
    description: string;
    significance: number;
  }[];
}

export interface Analysis {
  id: string;
  created_at: string;
  video_url: string;
  video_name: string;
  status: "uploading" | "analyzing" | "commenting" | "completed" | "error";
  rounds: RoundAnalysis[];
  overall_summary: string | null;
  commentary: string | null;
  red_corner_name: string;
  blue_corner_name: string;
}

export interface UserEvaluation {
  id: string;
  analysis_id: string;
  created_at: string;
  round: number;
  red_corner_score: number;
  blue_corner_score: number;
  comment: string | null;
}

export interface Knowledge {
  id: string;
  analysis_id: string | null;
  created_at: string;
  title: string;
  content: string;
  tags: string[];
  category: "technique" | "strategy" | "rule" | "observation" | "general";
}
