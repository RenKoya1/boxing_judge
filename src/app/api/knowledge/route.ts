import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis_id, title, content, tags, category } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "タイトルと内容は必須です" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("knowledge")
      .insert({
        analysis_id: analysis_id || null,
        title,
        content,
        tags: tags || [],
        category: category || "general",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Knowledge save error:", error);
    const message = error instanceof Error ? error.message : "ナレッジの保存に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const analysisId = searchParams.get("analysis_id");

  let query = supabase.from("knowledge").select("*").order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (analysisId) query = query.eq("analysis_id", analysisId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("knowledge").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
