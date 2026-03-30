import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const maxDuration = 120;

async function generateCommentaryWithClaude(prompt: string, systemPrompt: string): Promise<string> {
  // Try Claude Agent SDK first
  try {
    const { query } = await import("@anthropic-ai/claude-code");
    for await (const message of query({
      prompt,
      options: {
        maxTurns: 1,
        customSystemPrompt: systemPrompt,
      },
    })) {
      if (message.type === "result" && message.subtype === "success") {
        return message.result;
      }
    }
  } catch {
    // Fallback to Anthropic SDK directly
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock ? textBlock.text : "";
  }
  return "";
}

export async function POST(request: NextRequest) {
  try {
    const { analysis_id } = await request.json();

    if (!analysis_id) {
      return NextResponse.json({ error: "analysis_id is required" }, { status: 400 });
    }

    const { data: analysis, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysis_id)
      .single();

    if (error || !analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    await supabase
      .from("analyses")
      .update({ status: "commenting" })
      .eq("id", analysis_id);

    const analysisData = JSON.stringify(analysis.rounds, null, 2);

    const prompt = `あなたはプロのボクシング解説者・アナリストです。以下の試合分析データに基づいて、専門的な解説コメントを作成してください。

## 試合情報
- 赤コーナー: ${analysis.red_corner_name}
- 青コーナー: ${analysis.blue_corner_name}

## 分析データ
${analysisData}

## AI総括
${analysis.overall_summary || "なし"}

以下の形式でMarkdownの解説を作成してください：

1. **試合概要** - 試合全体の流れ
2. **注目のハイライト** - 最もインパクトのあった3-5シーン
3. **テクニカル分析** - 両選手の技術的な特徴
4. **採点コメント** - 各ラウンドの見どころと採点理由
5. **総合評価** - 試合の質と各選手への評価

ボクシングの専門用語を使いつつ、わかりやすい解説をお願いします。
ナレッジとして後から参照できるような、具体的で有益な内容にしてください。`;

    const systemPrompt = "あなたはプロのボクシング解説者です。専門的かつわかりやすい解説を日本語で提供してください。";

    const commentary = await generateCommentaryWithClaude(prompt, systemPrompt);

    await supabase
      .from("analyses")
      .update({ commentary, status: "completed" })
      .eq("id", analysis_id);

    return NextResponse.json({ commentary });
  } catch (error: unknown) {
    console.error("Commentary error:", error);
    const message = error instanceof Error ? error.message : "解説の生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
