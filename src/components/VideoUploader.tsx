"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Video, Loader2 } from "lucide-react";

interface VideoUploaderProps {
  onAnalysisStart: (analysisId: string) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (v: boolean) => void;
}

export default function VideoUploader({ onAnalysisStart, isAnalyzing, setIsAnalyzing }: VideoUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [redCornerName, setRedCornerName] = useState("");
  const [blueCornerName, setBlueCornerName] = useState("");
  const [progress, setProgress] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setProgress("動画をアップロード中...");

    try {
      const formData = new FormData();
      formData.append("video", selectedFile);
      formData.append("redCornerName", redCornerName || "Red Corner");
      formData.append("blueCornerName", blueCornerName || "Blue Corner");

      setProgress("Geminiで動画を分析中...");
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setProgress("Claude で解説コメントを生成中...");
      await fetch("/api/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id: data.id }),
      });

      onAnalysisStart(data.id);
    } catch (err) {
      console.error(err);
      setProgress("エラーが発生しました");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fighter names */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-red-400 mb-1">赤コーナー</label>
          <input
            type="text"
            value={redCornerName}
            onChange={(e) => setRedCornerName(e.target.value)}
            placeholder="選手名"
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-red-900/50 text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-400 mb-1">青コーナー</label>
          <input
            type="text"
            value={blueCornerName}
            onChange={(e) => setBlueCornerName(e.target.value)}
            placeholder="選手名"
            className="w-full px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-blue-900/50 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${dragOver ? "border-amber-500 bg-amber-500/10" : "border-[var(--border)] hover:border-gray-500"}
          ${selectedFile ? "border-green-500/50 bg-green-500/5" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])}
        />
        {selectedFile ? (
          <div className="flex flex-col items-center gap-3">
            <Video className="w-12 h-12 text-green-400" />
            <p className="text-lg font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-400">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-gray-500" />
            <p className="text-lg">ボクシング動画をドラッグ&ドロップ</p>
            <p className="text-sm text-gray-500">またはクリックしてファイルを選択</p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile || isAnalyzing}
        className="w-full py-3 px-6 rounded-lg font-bold text-lg transition-all
          bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            {progress}
          </span>
        ) : (
          "AI分析を開始"
        )}
      </button>
    </div>
  );
}
