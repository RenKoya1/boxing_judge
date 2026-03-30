import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadAndAnalyzeVideo(videoUrl: string): Promise<string> {
  const prompt = `あなたはプロのボクシング審判・アナリストです。この動画を詳細に分析してください。

以下のJSON形式で回答してください（日本語で）：
{
  "rounds": [
    {
      "round": 1,
      "summary": "ラウンドの概要",
      "events": [
        {
          "timestamp": "MM:SS",
          "type": "punch_landed | knockdown | combination | defensive | foul | referee | clinch",
          "fighter": "red_corner | blue_corner",
          "description": "詳細な説明",
          "punchType": "ジャブ | ストレート | フック | アッパー | ボディ | null",
          "impact": "clean | partial | blocked | missed",
          "significance": 1-10
        }
      ],
      "aiScoring": {
        "redCorner": { "cleanPunches": 0, "powerPunches": 0, "knockdowns": 0, "defense": 0, "aggression": 0, "ringControl": 0 },
        "blueCorner": { "cleanPunches": 0, "powerPunches": 0, "knockdowns": 0, "defense": 0, "aggression": 0, "ringControl": 0 }
      },
      "highlights": [
        { "timestamp": "MM:SS", "description": "ハイライトの説明", "significance": 1-10 }
      ]
    }
  ],
  "overallSummary": "試合全体の総括"
}

特に以下に注目してください：
1. クリーンヒット（パンチの種類と当たった部位）
2. ダウンシーン・ダウン寸前のシーン
3. インパクトのあるコンビネーション
4. 優れたディフェンス（スリップ、ブロック、カウンター）
5. 試合の流れの変化・モメンタムシフト
6. 反則やレフェリーの介入

ラウンドが明確に分からない場合は、動画を時間帯で区切って分析してください。
JSONのみを返してください。`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: videoUrl,
              mimeType: "video/mp4",
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      temperature: 0.2,
    },
  });

  return response.text || "{}";
}

export async function uploadVideoToGemini(
  fileBuffer: Buffer,
  fileName: string,
): Promise<string> {
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: "video/mp4" });

  const file = await ai.files.upload({
    file: blob,
    config: { mimeType: "video/mp4", displayName: fileName },
  });

  // Poll until processing complete
  let fileInfo = await ai.files.get({ name: file.name! });
  while (fileInfo.state?.toString() !== "ACTIVE") {
    await sleep(5000);
    fileInfo = await ai.files.get({ name: file.name! });
    if (fileInfo.state?.toString() === "FAILED") {
      throw new Error("Video processing failed");
    }
  }

  return fileInfo.uri!;
}

export async function analyzeVideoWithGemini(
  geminiFileUri: string,
): Promise<string> {
  return uploadAndAnalyzeVideo(geminiFileUri);
}
