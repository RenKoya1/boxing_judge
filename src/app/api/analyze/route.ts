import { NextRequest, NextResponse } from "next/server";
import { uploadVideoToGemini, analyzeVideoWithGemini } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File;
    const redCornerName = (formData.get("redCornerName") as string) || "Red Corner";
    const blueCornerName = (formData.get("blueCornerName") as string) || "Blue Corner";

    if (!file) {
      return NextResponse.json({ error: "動画ファイルが必要です" }, { status: 400 });
    }

    // Create analysis record
    const { data: analysis, error: insertError } = await supabase
      .from("analyses")
      .insert({
        video_url: "",
        video_name: file.name,
        status: "uploading",
        red_corner_name: redCornerName,
        blue_corner_name: blueCornerName,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Upload video to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${analysis.id}/${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("videos")
      .upload(filePath, fileBuffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("videos").getPublicUrl(filePath);

    await supabase
      .from("analyses")
      .update({ video_url: urlData.publicUrl, status: "analyzing" })
      .eq("id", analysis.id);

    // Upload to Gemini and analyze
    const geminiUri = await uploadVideoToGemini(fileBuffer, file.name);
    const rawResult = await analyzeVideoWithGemini(geminiUri);

    // Parse JSON from Gemini response
    let parsed;
    try {
      const jsonMatch = rawResult.match(/```json\n?([\s\S]*?)\n?```/) ||
                        rawResult.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawResult;
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { rounds: [], overallSummary: rawResult };
    }

    await supabase
      .from("analyses")
      .update({
        rounds: parsed.rounds || [],
        overall_summary: parsed.overallSummary || null,
        status: "completed",
      })
      .eq("id", analysis.id);

    return NextResponse.json({ id: analysis.id, ...parsed });
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const message = error instanceof Error ? error.message : "分析中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
