import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, type File as FormidableFile } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

const MAX_INLINE_SIZE = 20 * 1024 * 1024;

function getMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    txt: "text/plain",
  };
  return map[ext] || "application/octet-stream";
}

interface ParsedForm {
  fields: Record<string, string[]>;
  files: FormidableFile[];
}

function parseForm(req: NextApiRequest): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 50 * 1024 * 1024, multiples: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      const f: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(fields)) {
        f[k] = Array.isArray(v) ? v.map(String) : [String(v)];
      }
      const allFiles: FormidableFile[] = [];
      for (const v of Object.values(files)) {
        if (Array.isArray(v)) allFiles.push(...v);
        else if (v) allFiles.push(v);
      }
      resolve({ fields: f, files: allFiles });
    });
  });
}

function buildRefDocPrompt(fileNames: string): string {
  return `당신은 문서 내용 추출 전문가입니다.

첨부된 사업계획서 파일(${fileNames})의 **전체 내용**을 원본과 100% 동일하게 추출해야 합니다.

## 절대 규칙
1. 문서의 모든 텍스트를 빠짐없이 그대로 추출하세요.
2. 목차, 제목, 소제목, 본문 내용, 표, 그래프 설명, 각주, 참고문헌 등 모든 요소를 포함하세요.
3. 표는 마크다운 표 형식(| 컬럼1 | 컬럼2 |)으로 변환하세요.
4. 항목 번호, 들여쓰기 구조, 리스트 형식을 원본 그대로 유지하세요.
5. 내용을 요약하거나 생략하지 마세요. 모든 문장을 그대로 추출하세요.
6. 이미지/그림은 [그림: 설명] 형태로 표시하세요.
7. 요약하지 마세요. 분석하지 마세요. 오직 원본 텍스트 그대로만 추출하세요.

반드시 아래 JSON 형식만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "fullContent": "문서 전체 내용을 마크다운 형식으로 빠짐없이 기재"
}`;
}

function buildBestPracticePrompt(fileNames: string): string {
  return `당신은 정부지원사업 사업계획서 분석 전문가입니다.

첨부된 우수사례 사업계획서 파일(${fileNames})의 **전체 내용을 추출**하고, **우수한 점을 분석**해야 합니다.

## Part 1: 전체 내용 추출 (절대 규칙)
1. 문서의 모든 텍스트를 빠짐없이 그대로 추출하세요.
2. 목차, 제목, 소제목, 본문 내용, 표, 그래프 설명, 각주 등 모든 요소를 포함하세요.
3. 표는 마크다운 표 형식으로 변환하세요.
4. 내용을 요약하거나 생략하지 마세요.

## Part 2: 우수사례 분석
1. 이 사업계획서가 선정된 이유(강점)를 5개 이상 분석하세요.
2. 전체 논리 구조 흐름을 한 문장으로 정리하세요.
3. 평가위원에게 높은 점수를 받을 수 있었던 핵심 표현/문장 패턴을 5개 이상 추출하세요.
4. 추정 점수대를 기재하세요.

반드시 아래 JSON 형식만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "fullContent": "문서 전체 내용을 마크다운 형식으로 빠짐없이 기재",
  "strengths": ["강점1", "강점2", ...],
  "structure": "전체 논리 구조 흐름 한 문장 요약",
  "expressions": ["높은 점수의 핵심 표현 패턴1", "패턴2", ...],
  "score": "추정 점수 및 근거"
}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const { fields, files } = await parseForm(req);
    const mode = fields.mode?.[0] || "refDoc";

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    const supportedForInline = ["pdf", "jpg", "jpeg", "png", "txt"];
    const skippedFiles: string[] = [];

    for (const file of files) {
      const ext = (file.originalFilename || "").split(".").pop()?.toLowerCase() || "";
      if (!supportedForInline.includes(ext)) {
        skippedFiles.push(`${file.originalFilename} (.${ext} 미지원)`);
        continue;
      }
      const data = fs.readFileSync(file.filepath);
      if (data.length > MAX_INLINE_SIZE) {
        skippedFiles.push(`${file.originalFilename} (${Math.round(data.length / 1024 / 1024)}MB - 20MB 초과)`);
        continue;
      }
      parts.push({
        inlineData: {
          mimeType: getMimeType(file.originalFilename || ""),
          data: data.toString("base64"),
        },
      });
    }

    const fileNames = files.map((f) => f.originalFilename || "unknown").join(", ");
    const inlineCount = parts.length;

    if (files.length === 0) {
      return res.status(400).json({ error: "파일이 첨부되지 않았습니다." });
    }

    if (inlineCount === 0) {
      return res.status(400).json({
        error: "AI가 분석할 수 있는 파일이 없습니다. PDF, JPG, PNG, TXT 형식만 지원됩니다.",
        skippedFiles,
      });
    }

    const prompt = mode === "bestPractice"
      ? buildBestPracticePrompt(fileNames)
      : buildRefDocPrompt(fileNames);

    parts.push({ text: prompt });

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 65536 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(500).json({ error: `Gemini API error: ${geminiRes.status}`, details: errText });
    }

    const geminiData = await geminiRes.json();
    const candidate = geminiData?.candidates?.[0];
    const finishReason = candidate?.finishReason || "";
    const rawText = candidate?.content?.parts?.[0]?.text || "";

    if (finishReason === "MAX_TOKENS") {
      return res.status(500).json({
        error: "AI 응답이 토큰 한도로 인해 잘렸습니다. 파일이 너무 크거나 복잡할 수 있습니다.",
        partial: rawText.slice(0, 500),
      });
    }

    if (!rawText) {
      return res.status(500).json({
        error: "AI가 빈 응답을 반환했습니다.",
        finishReason,
      });
    }

    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return res.status(500).json({
        error: "AI 응답을 JSON으로 파싱할 수 없습니다.",
        rawPreview: rawText.slice(0, 1000),
      });
    }

    return res.status(200).json({
      success: true,
      data: parsed,
      ...(skippedFiles.length > 0 && { skippedFiles }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Analysis failed", details: message });
  }
}
