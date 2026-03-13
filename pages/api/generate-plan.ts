import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, type File as FormidableFile } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const MAX_CONTENT_CHARS = 30000; // fullContent 트림 상한

function getMimeType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", txt: "text/plain",
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

function trimContent(text: string): string {
  if (text.length <= MAX_CONTENT_CHARS) return text;
  return text.slice(0, MAX_CONTENT_CHARS) + "\n\n... (이하 생략, 총 " + text.length + "자)";
}

interface RefDocContent {
  summary?: string;
  fullContent?: string;
}

interface BPContent {
  fullContent?: string;
  strengths?: string[];
  structure?: string;
  expressions?: string[];
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

    const company = fields.company?.[0] ? JSON.parse(fields.company[0]) : null;
    const urlMeta = fields.urlMeta?.[0] ? JSON.parse(fields.urlMeta[0]) : null;
    const template = fields.template?.[0] ? JSON.parse(fields.template[0]) : null;
    const businessIdea = fields.businessIdea?.[0] || "";
    // 새 형식: fullContent 포함
    const refDocsContents: RefDocContent[] = fields.refDocsContents?.[0] ? JSON.parse(fields.refDocsContents[0]) : [];
    const bestPracticeContents: BPContent[] = fields.bestPracticeContents?.[0] ? JSON.parse(fields.bestPracticeContents[0]) : [];

    if (!company || !template) {
      return res.status(400).json({ error: "company와 template은 필수입니다." });
    }

    // Gemini parts: 파일 + 텍스트
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    const supportedForInline = ["pdf", "jpg", "jpeg", "png", "txt"];
    for (const file of files) {
      const ext = (file.originalFilename || "").split(".").pop()?.toLowerCase() || "";
      if (supportedForInline.includes(ext)) {
        const data = fs.readFileSync(file.filepath);
        parts.push({
          inlineData: {
            mimeType: getMimeType(file.originalFilename || ""),
            data: data.toString("base64"),
          },
        });
      }
    }

    const fileNames = files.map((f) => f.originalFilename || "unknown").join(", ");
    const hasFiles = files.length > 0;

    // 기존 사업계획서 전체 내용 포함
    const refContext = refDocsContents.length > 0
      ? `\n## 기존 사업계획서 참고자료 (반드시 이 내용을 기반으로 작성하세요)\n${refDocsContents.map((doc, i) =>
          `### [참고자료 ${i + 1}]\n요약: ${doc.summary || '없음'}\n\n--- 전체 내용 ---\n${trimContent(doc.fullContent || '')}`
        ).join('\n\n')}`
      : '';

    // 우수사례 전체 내용 + 분석 포함
    const bpContext = bestPracticeContents.length > 0
      ? `\n## 우수사례 사업계획서 (이 사업계획서의 구조, 표현, 논리를 반드시 참고하여 작성하세요)\n${bestPracticeContents.map((bp, i) =>
          `### [우수사례 ${i + 1}]\n- 강점: ${bp.strengths?.join(', ') || '분석 없음'}\n- 논리 구조: ${bp.structure || '분석 없음'}\n- 핵심 표현 패턴: ${bp.expressions?.join('; ') || '분석 없음'}\n\n--- 전체 내용 ---\n${trimContent(bp.fullContent || '')}`
        ).join('\n\n')}`
      : '';

    const templateStr = template.map((t: { number: string; title: string; description: string; subSections: string[]; items?: { label: string; detail: string }[]; maxPages?: number }) => {
      let sec = `${t.number}. ${t.title} (최대 ${t.maxPages || 3}p)\n   설명: ${t.description}\n   소제목: ${t.subSections.join(', ')}`;
      if (t.items?.length) {
        sec += `\n   세부 작성항목:\n${t.items.map(item => `     - ${item.label}${item.detail ? ': ' + item.detail : ''}`).join('\n')}`;
      }
      return sec;
    }).join('\n');

    const prompt = `당신은 한국 정부지원사업 사업계획서 작성 전문 컨설턴트입니다.
아래 정보를 바탕으로 사업계획서 각 섹션의 초안을 작성해주세요.
${hasFiles ? `\n첨부된 파일(${fileNames})을 참고하여 공고 요구사항에 맞게 작성해주세요.` : ''}

## 기업 정보
- 기업명: ${company.name}
- 대표자: ${company.representative}
- 업종: ${company.industry} / ${company.subIndustry}
- 업력: ${company.yearsInBusiness}년
- 직원수: ${company.employeeCount}명
- 연매출: ${company.annualRevenue ? (company.annualRevenue / 100000000).toFixed(1) + '억원' : '미입력'}
- 보유역량: ${company.capabilities}
- 인증현황: ${company.certifications}
- 대표자 특성: ${company.founderTags || ''}
- 인력 현황: ${company.personnelDetails || ''}
- 직접생산업체 증명: ${company.directProductions || ''}
- 나라장터 업종코드: ${company.naraCodes || ''}
- 기타 정보: ${company.extraInfo || ''}
- 비고: ${company.memo || ''}

## 지원사업 정보
- 사업명: ${urlMeta?.programName || '정부지원사업'}
- 주관기관: ${urlMeta?.agency || ''}
- 지원금액: ${urlMeta?.amount || ''}
${refContext}
${bpContext}

## 사업 아이디어
${businessIdea || '(기존 사업계획서 참고자료를 기반으로 작성)'}

## 사업계획서 양식 구조 (반드시 이 양식에 맞춰 작성하세요)
${templateStr}

## 작성 지침
1. **양식 구조를 반드시 준수하세요.** 각 섹션의 번호, 제목, 소제목, 세부 작성항목을 빠짐없이 포함하세요.
2. **기존 사업계획서가 있으면 해당 내용을 최대한 활용하세요.** 기존 내용의 핵심을 유지하되, 새 양식 구조에 맞게 재구성하세요.
3. **우수사례가 있으면 그 논리 구조, 표현 방식, 서술 패턴을 적극 반영하세요.** 우수사례처럼 높은 점수를 받을 수 있도록 작성하세요.
4. 마크다운 형식(##, **, 표, 리스트 등)을 사용하세요.
5. 각 섹션은 해당 maxPages에 맞는 분량으로 충분히 작성하세요.
6. 표는 마크다운 표 형식으로 작성하세요.
7. 정부지원사업 평가위원이 높은 점수를 줄 수 있도록 전문적이고 구체적으로 작성하세요.

반드시 아래 JSON 형식만 응답하세요. 다른 텍스트는 포함하지 마세요.

[
  {
    "number": "양식의 섹션 번호",
    "title": "양식의 섹션 제목",
    "content": "마크다운 형식의 섹션 내용 (충분히 상세하게)"
  }
]`;

    parts.push({ text: prompt });

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 65536 },
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
        error: "AI 응답이 토큰 한도로 인해 잘렸습니다. 사업계획서가 너무 복잡할 수 있습니다.",
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

    return res.status(200).json({ success: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Generation failed", details: message });
  }
}
