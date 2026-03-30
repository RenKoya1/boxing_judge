"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Trophy, ChevronRight, Loader2 } from "lucide-react";
import type { Analysis } from "@/types";

type MatchSummary = Pick<Analysis, "id" | "created_at" | "video_name" | "status" | "red_corner_name" | "blue_corner_name" | "overall_summary" | "rounds">;

interface MatchListProps {
  onSelectMatch: (id: string) => void;
}

function getMatchResult(match: MatchSummary): { winner: string; method: string } | null {
  if (!match.rounds || match.rounds.length === 0) return null;

  let redTotal = 0;
  let blueTotal = 0;
  for (const round of match.rounds) {
    if (round.aiScoring) {
      const r = round.aiScoring.redCorner;
      const b = round.aiScoring.blueCorner;
      redTotal += (r.cleanPunches || 0) + (r.powerPunches || 0) * 2 + (r.knockdowns || 0) * 5 + (r.defense || 0) + (r.aggression || 0) + (r.ringControl || 0);
      blueTotal += (b.cleanPunches || 0) + (b.powerPunches || 0) * 2 + (b.knockdowns || 0) * 5 + (b.defense || 0) + (b.aggression || 0) + (b.ringControl || 0);
    }
  }

  if (redTotal === blueTotal) return { winner: "ドロー", method: "" };
  return {
    winner: redTotal > blueTotal ? match.red_corner_name : match.blue_corner_name,
    method: `${Math.max(redTotal, blueTotal)} - ${Math.min(redTotal, blueTotal)}`,
  };
}

export default function MatchList({ onSelectMatch }: MatchListProps) {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/matches");
        if (res.ok) {
          const data = await res.json();
          setMatches(data.matches || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-400" />
        過去の試合
      </h3>
      <div className="space-y-3">
        {matches.map((match) => {
          const result = getMatchResult(match);
          const date = new Date(match.created_at);
          const statusLabel =
            match.status === "completed" ? "完了" :
            match.status === "analyzing" ? "分析中..." :
            match.status === "commenting" ? "解説生成中..." :
            match.status === "error" ? "エラー" : "処理中...";
          const statusColor =
            match.status === "completed" ? "text-green-400" :
            match.status === "error" ? "text-red-400" : "text-amber-400";

          return (
            <button
              key={match.id}
              onClick={() => onSelectMatch(match.id)}
              className="w-full text-left bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-gray-600 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {/* Fighter names */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-red-400">{match.red_corner_name}</span>
                    <span className="text-xs text-gray-600">VS</span>
                    <span className="font-bold text-blue-400">{match.blue_corner_name}</span>
                  </div>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {date.toLocaleDateString("ja-JP")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className={statusColor}>{statusLabel}</span>
                    {match.rounds && (
                      <span>{match.rounds.length} ラウンド</span>
                    )}
                  </div>

                  {/* Result */}
                  {result && match.status === "completed" && (
                    <p className="text-sm text-amber-400/80 mt-1">
                      {result.winner === "ドロー" ? "ドロー" : `${result.winner} 優勢`}
                      {result.method && ` (${result.method})`}
                    </p>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
