"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Zap, Shield, AlertTriangle, Star } from "lucide-react";
import type { RoundAnalysis, BoxingEvent } from "@/types";

interface AnalysisResultsProps {
  rounds: RoundAnalysis[];
  overallSummary: string | null;
  commentary: string | null;
  redCornerName: string;
  blueCornerName: string;
}

function EventIcon({ type }: { type: BoxingEvent["type"] }) {
  switch (type) {
    case "punch_landed": return <Zap className="w-4 h-4 text-amber-400" />;
    case "knockdown": return <AlertTriangle className="w-4 h-4 text-red-500" />;
    case "combination": return <Zap className="w-4 h-4 text-orange-400" />;
    case "defensive": return <Shield className="w-4 h-4 text-green-400" />;
    default: return <Star className="w-4 h-4 text-gray-400" />;
  }
}

function SignificanceBadge({ value }: { value: number }) {
  const color = value >= 8 ? "text-red-400 bg-red-400/10" : value >= 5 ? "text-amber-400 bg-amber-400/10" : "text-gray-400 bg-gray-400/10";
  return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{value}/10</span>;
}

export default function AnalysisResults({ rounds, overallSummary, commentary, redCornerName, blueCornerName }: AnalysisResultsProps) {
  const [expandedRound, setExpandedRound] = useState<number | null>(0);
  const [showCommentary, setShowCommentary] = useState(true);

  return (
    <div className="space-y-6">
      {/* Commentary */}
      {commentary && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setShowCommentary(!showCommentary)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5"
          >
            <h3 className="text-lg font-bold text-amber-400">Claude 解説コメント</h3>
            {showCommentary ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showCommentary && (
            <div className="px-6 pb-6 prose prose-invert max-w-none text-sm whitespace-pre-wrap">
              {commentary}
            </div>
          )}
        </div>
      )}

      {/* Overall Summary */}
      {overallSummary && (
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6">
          <h3 className="text-lg font-bold mb-3">試合総括</h3>
          <p className="text-gray-300 leading-relaxed">{overallSummary}</p>
        </div>
      )}

      {/* Rounds */}
      {rounds.map((round, idx) => (
        <div key={idx} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <button
            onClick={() => setExpandedRound(expandedRound === idx ? null : idx)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5"
          >
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-amber-400">R{round.round}</span>
              <span className="text-sm text-gray-400 text-left">{round.summary}</span>
            </div>
            {expandedRound === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {expandedRound === idx && (
            <div className="px-6 pb-6 space-y-4">
              {/* Score comparison */}
              {round.aiScoring && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-500/10 rounded-lg p-4 border border-red-900/30">
                    <h4 className="font-bold text-red-400 mb-2">{redCornerName}</h4>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <span className="text-gray-400">クリーンヒット:</span><span>{round.aiScoring.redCorner.cleanPunches}</span>
                      <span className="text-gray-400">パワーパンチ:</span><span>{round.aiScoring.redCorner.powerPunches}</span>
                      <span className="text-gray-400">ダウン:</span><span>{round.aiScoring.redCorner.knockdowns}</span>
                      <span className="text-gray-400">ディフェンス:</span><span>{round.aiScoring.redCorner.defense}</span>
                      <span className="text-gray-400">アグレッション:</span><span>{round.aiScoring.redCorner.aggression}</span>
                      <span className="text-gray-400">リングコントロール:</span><span>{round.aiScoring.redCorner.ringControl}</span>
                    </div>
                  </div>
                  <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-900/30">
                    <h4 className="font-bold text-blue-400 mb-2">{blueCornerName}</h4>
                    <div className="grid grid-cols-2 gap-1 text-sm">
                      <span className="text-gray-400">クリーンヒット:</span><span>{round.aiScoring.blueCorner.cleanPunches}</span>
                      <span className="text-gray-400">パワーパンチ:</span><span>{round.aiScoring.blueCorner.powerPunches}</span>
                      <span className="text-gray-400">ダウン:</span><span>{round.aiScoring.blueCorner.knockdowns}</span>
                      <span className="text-gray-400">ディフェンス:</span><span>{round.aiScoring.blueCorner.defense}</span>
                      <span className="text-gray-400">アグレッション:</span><span>{round.aiScoring.blueCorner.aggression}</span>
                      <span className="text-gray-400">リングコントロール:</span><span>{round.aiScoring.blueCorner.ringControl}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Events timeline */}
              <div>
                <h4 className="font-medium text-gray-300 mb-2">イベントタイムライン</h4>
                <div className="space-y-2">
                  {round.events?.map((event, eidx) => (
                    <div key={eidx} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5">
                      <span className="text-xs font-mono text-amber-400 mt-0.5 whitespace-nowrap">{event.timestamp}</span>
                      <EventIcon type={event.type} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${event.fighter === "red_corner" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                            {event.fighter === "red_corner" ? redCornerName : blueCornerName}
                          </span>
                          <SignificanceBadge value={event.significance} />
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Highlights */}
              {round.highlights?.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-400 mb-2">ハイライト</h4>
                  {round.highlights.map((h, hidx) => (
                    <div key={hidx} className="flex items-center gap-3 p-2 bg-amber-500/5 rounded-lg mb-1">
                      <Star className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-mono text-amber-400">{h.timestamp}</span>
                      <span className="text-sm">{h.description}</span>
                      <SignificanceBadge value={h.significance} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
