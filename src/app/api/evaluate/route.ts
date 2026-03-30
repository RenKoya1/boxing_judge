import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis_id, round, red_corner_score, blue_corner_score, comment } = body;

    if (!analysis_id || round === undefined || !red_corner_score || !blue_corner_score) {
      return NextResponse.json({ error: "必須パラメータが不足しています" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("evaluations")
      .upsert(
        {
          analysis_id,
          round,
          red_corner_score,
          blue_corner_score,
          comment,
        },
        { onConflict: "analysis_id,round" }
      )
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Evaluation error:", error);
    const message = error instanceof Error ? error.message : "評価の保存に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const analysisId = searchParams.get("analysis_id");

  if (!analysisId) {
    return NextResponse.json({ error: "analysis_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("round");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
