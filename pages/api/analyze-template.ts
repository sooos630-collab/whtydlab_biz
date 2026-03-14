import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, type File as FormidableFile } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

const MAX_INLINE_SIZE = 20 * 1024 * 1024; // 20MB Gemini inline limit

function getMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    hwp: "application/x-hwp",
    hwpx: "application/x-hwpx",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const { fields, files } = await parseForm(req);

    const programName = fields.programName?.[0] || "";
    const category = fields.category?.[0] || "기타";
    const urlMeta = fields.urlMeta?.[0] ? JSON.parse(fields.urlMeta[0]) : null;

    // Gemini parts 구성: 텍스트 프롬프트 + 업로드된 파일들
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Gemini inline 지원 확장자
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
    const inlineCount = parts.length; // 실제 Gemini에 전달되는 파일 수

    if (files.length === 0) {
      return res.status(400).json({ error: "사업계획서 양식 파일이 첨부되지 않았습니다. 파일을 업로드한 후 다시 시도해주세요." });
    }

    if (inlineCount === 0) {
      return res.status(400).json({
        error: "AI가 분석할 수 있는 파일이 없습니다. PDF, JPG, PNG, TXT 형식만 지원됩니다.",
        skippedFiles,
      });
    }

    const prompt = `당신은 PDF 문서 구조 추출 전문가입니다.

첨부된 사업계획서 양식 PDF 파일(${fileNames})의 **전체 내용**을 원본과 100% 동일하게 추출해야 합니다.
목차/항목 구조뿐만 아니라, 각 항목 안에 있는 **모든 세부 작성항목, 기입란, 표 양식, 안내문, 체크리스트, 작성 지시사항** 등을 빠짐없이 추출하세요.

## 절대 규칙
1. PDF에 있는 목차/항목 번호, 제목, 소제목을 **한 글자도 바꾸지 말고 그대로** 추출하세요.
2. 항목 번호 체계(1, 1-1, 1-2 또는 Ⅰ, Ⅱ 또는 1., 2. 등)를 PDF 원본 그대로 유지하세요.
3. PDF에 없는 항목을 추가하거나, 있는 항목을 생략하거나, 제목을 임의로 변경하지 마세요.
4. 소제목/하위항목도 PDF에 표기된 그대로 추출하세요.
5. description은 PDF에 해당 항목의 작성 안내/설명이 있으면 그것을 그대로 옮기고, 없으면 빈 문자열로 두세요.
6. maxPages는 PDF에 페이지 제한이 명시되어 있으면 그 값을, 없으면 null로 두세요.
7. **items 배열이 핵심입니다.** 각 항목 안에 있는 세부 작성내용을 전부 추출하세요:
   - 작성해야 하는 질문/지시사항 (예: "개발하고자 하는 기술의 목표를 정량적으로 기술하시오")
   - 기입해야 하는 표의 컬럼 구조 (예: "표: 구분 | 세부내용 | 금액 | 비고")
   - 체크리스트 항목 (예: "□ 해당 □ 비해당")
   - 작성 참고사항/유의사항 (예: "※ 20페이지 이내로 작성")
   - 빈칸/기입란의 레이블 (예: "과제명:", "총 사업기간:")
8. items의 label은 PDF 원문 그대로, detail은 부연설명/표구조/기입양식 등을 그대로 기재하세요.

반드시 아래 JSON 형식만 응답하세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "number": "PDF 원본 항목번호 그대로",
    "title": "PDF 원본 제목 그대로",
    "description": "PDF에 있는 작성 안내문 그대로 (없으면 빈 문자열)",
    "subSections": ["PDF 원본 소제목1 그대로", "소제목2 그대로"],
    "items": [
      {"label": "PDF 원문 그대로의 작성항목/질문/기입란 제목", "detail": "표 구조, 선택지, 참고사항 등 PDF 원문 그대로"},
      {"label": "표: 컬럼명1 | 컬럼명2 | 컬럼명3", "detail": "표의 행 수나 작성 안내가 있으면 그대로"},
      {"label": "※ 유의사항/참고사항", "detail": "PDF 원문 그대로"}
    ],
    "maxPages": null
  }
]`;

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
        details: JSON.stringify(geminiData?.candidates?.[0] || {}),
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
