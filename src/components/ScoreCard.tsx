"use client";

import { useState } from "react";
import { Save, Check } from "lucide-react";
import type { RoundAnalysis } from "@/types";

interface ScoreCardProps {
  analysisId: string;
  rounds: RoundAnalysis[];
  redCornerName: string;
  blueCornerName: string;
}

interface RoundScore {
  red: number;
  blue: number;
  comment: string;
  saved: boolean;
}

export default function ScoreCard({
  analysisId,
  rounds,
  redCornerName,
  blueCornerName,
}: ScoreCardProps) {
  const [scores, setScores] = useState<Record<number, RoundScore>>(
    Object.fromEntries(
      rounds.map((r) => [
        r.round,
        { red: 10, blue: 10, comment: "", saved: false },
      ]),
    ),
  );
  const [saving, setSaving] = useState<number | null>(null);

  const updateScore = (
    round: number,
    field: keyof RoundScore,
    value: number | string | boolean,
  ) => {
    setScores((prev) => ({
      ...prev,
      [round]: { ...prev[round], [field]: value, saved: false },
    }));
  };

  const saveScore = async (round: number) => {
    setSaving(round);
    try {
      const score = scores[round];
      await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_id: analysisId,
          round,
          red_corner_score: score.red,
          blue_corner_score: score.blue,
          comment: score.comment || null,
        }),
      });
      updateScore(round, "saved", true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const totalRed = Object.values(scores).reduce((sum, s) => sum + s.red, 0);
  const totalBlue = Object.values(scores).reduce((sum, s) => sum + s.blue, 0);

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6 space-y-4">
      <h3 className="text-lg font-bold text-amber-400">あなたの採点</h3>

      {/* Total scores */}
      <div className="flex items-center justify-center gap-8 py-4 bg-[var(--bg-secondary)] rounded-lg">
        <div className="text-center">
          <p className="text-sm text-red-400">{redCornerName}</p>
          <p className="text-3xl font-bold text-red-400">{totalRed}</p>
        </div>
        <span className="text-2xl text-gray-600">-</span>
        <div className="text-center">
          <p className="text-sm text-blue-400">{blueCornerName}</p>
          <p className="text-3xl font-bold text-blue-400">{totalBlue}</p>
        </div>
      </div>

      {/* Per-round scoring */}
      {rounds.map((round) => (
        <div
          key={round.round}
          className="border border-[var(--border)] rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold">ラウンド {round.round}</span>
            <button
              onClick={() => saveScore(round.round)}
              disabled={saving === round.round}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50"
            >
              {scores[round.round]?.saved ? (
                <Check className="w-3 h-3" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              {scores[round.round]?.saved ? "保存済み" : "保存"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-red-400 block mb-1">
                {redCornerName}
              </label>
              <div className="flex items-center gap-2">
                {[6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateScore(round.round, "red", n)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all
                      ${scores[round.round]?.red === n ? "bg-red-500 text-white" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-blue-400 block mb-1">
                {blueCornerName}
              </label>
              <div className="flex items-center gap-2">
                {[6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => updateScore(round.round, "blue", n)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all
                      ${scores[round.round]?.blue === n ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <textarea
            value={scores[round.round]?.comment || ""}
            onChange={(e) =>
              updateScore(round.round, "comment", e.target.value)
            }
            placeholder="コメントを入力..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500 resize-none"
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}
