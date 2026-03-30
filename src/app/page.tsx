"use client";

import { useState, useEffect, useCallback } from "react";
import VideoUploader from "@/components/VideoUploader";
import AnalysisResults from "@/components/AnalysisResults";
import ScoreCard from "@/components/ScoreCard";
import KnowledgePanel from "@/components/KnowledgePanel";
import MatchList from "@/components/MatchList";
import type { Analysis } from "@/types";
import { ArrowLeft } from "lucide-react";

export default function Home() {
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "score" | "knowledge">("results");
  const [matchListKey, setMatchListKey] = useState(0);

  const fetchAnalysis = useCallback(async (id: string) => {
    const res = await fetch(`/api/analyze?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setAnalysis(data);
    }
  }, []);

  useEffect(() => {
    if (analysisId) fetchAnalysis(analysisId);
  }, [analysisId, fetchAnalysis]);

  const handleAnalysisStart = (id: string) => {
    setAnalysisId(id);
    setMatchListKey((k) => k + 1); // refresh match list after new analysis
  };

  const handleBackToList = () => {
    setAnalysis(null);
    setAnalysisId(null);
    setActiveTab("results");
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={handleBackToList} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-xl font-black">
                B
              </div>
              <div>
                <h1 className="text-xl font-bold">Boxing Judge AI</h1>
                <p className="text-xs text-gray-500">ボクシング AI 採点・分析システム</p>
              </div>
            </button>
            {analysis && (
              <button
                onClick={handleBackToList}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                試合一覧に戻る
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Home: Upload + Match List */}
        {!analysis && (
          <div>
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2">ボクシング動画を分析</h2>
                <p className="text-gray-400">動画をアップロードすると、AIが試合を自動採点し、専門的な解説を生成します</p>
              </div>
              <VideoUploader
                onAnalysisStart={handleAnalysisStart}
                isAnalyzing={isAnalyzing}
                setIsAnalyzing={setIsAnalyzing}
              />
            </div>

            {/* Match History */}
            <div className="max-w-3xl mx-auto">
              <MatchList key={matchListKey} onSelectMatch={(id) => setAnalysisId(id)} />
            </div>
          </div>
        )}

        {/* Match Detail */}
        {analysis && (
          <div>
            {/* Fight header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-6">
                <span className="text-2xl font-bold text-red-400">{analysis.red_corner_name}</span>
                <span className="text-gray-600 text-lg">VS</span>
                <span className="text-2xl font-bold text-blue-400">{analysis.blue_corner_name}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(analysis.created_at).toLocaleDateString("ja-JP")} - {analysis.video_name}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-[var(--bg-secondary)] rounded-lg p-1 max-w-md mx-auto">
              {([
                ["results", "分析結果"],
                ["score", "採点"],
                ["knowledge", "ナレッジ"],
              ] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
                    ${activeTab === tab ? "bg-[var(--bg-card)] text-white" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {activeTab === "results" && (
                  <AnalysisResults
                    rounds={analysis.rounds || []}
                    overallSummary={analysis.overall_summary}
                    commentary={analysis.commentary}
                    redCornerName={analysis.red_corner_name}
                    blueCornerName={analysis.blue_corner_name}
                  />
                )}
                {activeTab === "score" && (
                  <ScoreCard
                    analysisId={analysis.id}
                    rounds={analysis.rounds || []}
                    redCornerName={analysis.red_corner_name}
                    blueCornerName={analysis.blue_corner_name}
                  />
                )}
                {activeTab === "knowledge" && (
                  <KnowledgePanel analysisId={analysis.id} />
                )}
              </div>
              <div className="space-y-6">
                {activeTab !== "knowledge" && <KnowledgePanel analysisId={analysis.id} />}
                {activeTab !== "score" && analysis.rounds?.length > 0 && (
                  <ScoreCard
                    analysisId={analysis.id}
                    rounds={analysis.rounds}
                    redCornerName={analysis.red_corner_name}
                    blueCornerName={analysis.blue_corner_name}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
