"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, Trash2, Tag, X } from "lucide-react";
import type { Knowledge } from "@/types";

const CATEGORIES = [
  { value: "technique", label: "テクニック", color: "text-green-400" },
  { value: "strategy", label: "戦略", color: "text-blue-400" },
  { value: "rule", label: "ルール", color: "text-red-400" },
  { value: "observation", label: "観察", color: "text-purple-400" },
  { value: "general", label: "一般", color: "text-gray-400" },
] as const;

interface KnowledgePanelProps {
  analysisId?: string;
}

export default function KnowledgePanel({ analysisId }: KnowledgePanelProps) {
  const [entries, setEntries] = useState<Knowledge[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchKnowledge = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter) params.set("category", filter);
    if (analysisId) params.set("analysis_id", analysisId);
    const res = await fetch(`/api/knowledge?${params}`);
    if (res.ok) setEntries(await res.json());
  }, [filter, analysisId]);

  useEffect(() => { fetchKnowledge(); }, [fetchKnowledge]);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const saveKnowledge = async () => {
    if (!title.trim() || !content.trim()) return;
    await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis_id: analysisId || null, title, content, tags, category }),
    });
    setTitle(""); setContent(""); setTags([]); setCategory("general"); setShowForm(false);
    fetchKnowledge();
  };

  const deleteKnowledge = async (id: string) => {
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    fetchKnowledge();
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          ナレッジベース
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
        >
          <Plus className="w-4 h-4" /> 追加
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`text-xs px-2 py-1 rounded-full transition-all ${!filter ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          すべて
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilter(cat.value)}
            className={`text-xs px-2 py-1 rounded-full transition-all ${filter === cat.value ? "bg-white/10 " + cat.color : "text-gray-500 hover:text-gray-300"}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="border border-amber-900/30 rounded-lg p-4 space-y-3 bg-amber-500/5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-white placeholder:text-gray-600 focus:outline-none"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="ナレッジ内容..."
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-white placeholder:text-gray-600 focus:outline-none resize-none"
            rows={4}
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`text-xs px-2 py-1 rounded-full border transition-all
                  ${category === cat.value ? "border-amber-500 " + cat.color : "border-[var(--border)] text-gray-500"}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Tag className="w-4 h-4 text-gray-500" />
            {tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/10 flex items-center gap-1">
                {tag}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setTags(tags.filter((t) => t !== tag))} />
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="タグを追加"
              className="text-xs px-2 py-1 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-gray-500"
            />
          </div>
          <button
            onClick={saveKnowledge}
            className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 font-medium text-sm"
          >
            保存
          </button>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {entries.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">ナレッジがまだありません</p>
        )}
        {entries.map((entry) => {
          const cat = CATEGORIES.find((c) => c.value === entry.category);
          return (
            <div key={entry.id} className="border border-[var(--border)] rounded-lg p-3 hover:bg-white/5 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs ${cat?.color}`}>{cat?.label}</span>
                    <h4 className="font-medium text-sm truncate">{entry.title}</h4>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{entry.content}</p>
                  {entry.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => deleteKnowledge(entry.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
