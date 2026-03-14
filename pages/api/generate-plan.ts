import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, type File as FormidableFile } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${GEMINI_API_KEY}`;

const MAX_CONTENT_CHARS = 30000;

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
    const businessIdea = fields.businessIdea?.[0] || "";
    const refDocsContents = fields.refDocsContents?.[0] ? JSON.parse(fields.refDocsContents[0]) : [];
    const bestPracticeContents = fields.bestPracticeContents?.[0] ? JSON.parse(fields.bestPracticeContents[0]) : [];

    // 섹션별 호출: 현재 섹션 정보
    const currentSection = fields.currentSection?.[0] ? JSON.parse(fields.currentSection[0]) : null;
    // 전체 목차
    const allSections = fields.allSections?.[0] ? JSON.parse(fields.allSections[0]) : [];
    // 이미 생성된 앞 섹션들
    const previousSections = fields.previousSections?.[0] ? JSON.parse(fields.previousSections[0]) : [];

    if (!company || !currentSection) {
      return res.status(400).json({ error: "company와 currentSection은 필수입니다." });
    }

    // 파일 parts 준비
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

    // 참고자료 컨텍스트
    const refContext = refDocsContents.length > 0
      ? `\n## 기존 사업계획서 참고자료 (반드시 이 내용을 기반으로 작성하세요)\n${refDocsContents.map((doc: { fullContent?: string }, i: number) =>
          `### [참고자료 ${i + 1}]\n--- 전체 내용 ---\n${trimContent(doc.fullContent || '')}`
        ).join('\n\n')}`
      : '';

    const bpContext = bestPracticeContents.length > 0
      ? `\n## 우수사례 사업계획서 (이 사업계획서의 구조, 표현, 논리를 반드시 참고하여 작성하세요)\n${bestPracticeContents.map((bp: { fullContent?: string; strengths?: string[]; structure?: string; expressions?: string[] }, i: number) =>
          `### [우수사례 ${i + 1}]\n- 강점: ${bp.strengths?.join(', ') || '분석 없음'}\n- 논리 구조: ${bp.structure || '분석 없음'}\n- 핵심 표현 패턴: ${bp.expressions?.join('; ') || '분석 없음'}\n\n--- 전체 내용 ---\n${trimContent(bp.fullContent || '')}`
        ).join('\n\n')}`
      : '';

    // 현재 섹션 상세
    let sectionDetail = `${currentSection.number}. ${currentSection.title} (최대 ${currentSection.maxPages || 3}페이지 분량)`;
    sectionDetail += `\n   설명: ${currentSection.description || ''}`;
    sectionDetail += `\n   소제목: ${(currentSection.subSections || []).join(', ')}`;
    if (currentSection.items?.length) {
      sectionDetail += `\n   세부 작성항목:\n${currentSection.items.map((item: { label: string; detail?: string }) => `     - ${item.label}${item.detail ? ': ' + item.detail : ''}`).join('\n')}`;
    }

    // 전체 목차
    const allSectionsOverview = allSections.map((s: { number: string; title: string }) => `${s.number}. ${s.title}`).join('\n');

    // 앞 섹션 컨텍스트 (일관성 유지용, 각 섹션 앞부분만)
    const previousContext = previousSections.length > 0
      ? `\n## 이미 작성된 앞 섹션들 (내용의 일관성을 유지하세요)\n${previousSections.map((s: { number: string; title: string; content: string }) =>
          `### ${s.number}. ${s.title}\n${s.content.slice(0, 2000)}${s.content.length > 2000 ? '\n...(이하 생략)' : ''}`
        ).join('\n\n')}`
      : '';

    const prompt = `당신은 한국 정부지원사업 사업계획서 작성 전문 컨설턴트입니다.
지금부터 사업계획서의 **"${currentSection.number}. ${currentSection.title}"** 섹션 하나만 집중해서 작성합니다.

${hasFiles ? `첨부된 파일(${fileNames})을 참고하여 공고 요구사항에 맞게 작성해주세요.\n` : ''}
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
${previousContext}

## 전체 사업계획서 목차 (현재 위치 확인용)
${allSectionsOverview}

## 지금 작성할 섹션
${sectionDetail}

## 작성 지침 (반드시 준수)
1. **이 섹션("${currentSection.number}. ${currentSection.title}")만 작성하세요.** 다른 섹션은 작성하지 마세요.
2. **${currentSection.maxPages || 3}페이지 분량에 맞게 충분히 상세하게** 작성하세요. 절대 요약하거나 축약하지 마세요.
3. 소제목(${(currentSection.subSections || []).join(', ')})을 모두 포함하고, 각 소제목별로 최소 3~5개 문단 이상 상세히 서술하세요.
4. 세부 작성항목이 있으면 각 항목을 빠짐없이 구체적으로 작성하세요.
5. 기존 사업계획서가 있으면 해당 내용을 최대한 활용하되, 양식에 맞게 재구성하세요.
6. 우수사례가 있으면 그 논리 구조, 표현 방식, 서술 패턴을 적극 반영하세요.
7. 구체적인 수치, 데이터, 근거, 일정, 방법론을 포함하세요. 추상적이거나 모호한 서술은 피하세요.
8. 기술적 내용은 원리, 적용방법, 차별성, 기대효과를 구체적으로 설명하세요.
9. 시장분석은 시장규모, 성장률, 경쟁현황, 목표시장 세분화를 포함하세요.
10. 사업화 전략은 구체적인 실행 로드맵, 마일스톤, KPI를 명시하세요.
11. 마크다운 형식(##, **, 표, 리스트 등)을 사용하세요. 표는 마크다운 표 형식으로 작성하세요.
12. 정부지원사업 평가위원이 높은 점수를 줄 수 있도록 **전문적이고 구체적으로** 작성하세요.
13. 실제 제출 가능한 수준의 완성된 사업계획서 품질로 작성하세요.

반드시 아래 JSON 형식만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "number": "${currentSection.number}",
  "title": "${currentSection.title}",
  "content": "마크다운 형식의 섹션 내용 (최대한 상세하고 전문적으로)"
}`;

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
      return res.status(500).json({ error: `Gemini API error: ${geminiRes.status}`, details: errText.slice(0, 500) });
    }

    const geminiData = await geminiRes.json();
    const candidate = geminiData?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return res.status(500).json({ error: "AI가 빈 응답을 반환했습니다." });
    }

    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      // JSON 파싱 실패 시 rawText를 content로 사용
      parsed = {
        number: currentSection.number,
        title: currentSection.title,
        content: rawText,
      };
    }

    return res.status(200).json({ success: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Generation failed", details: message });
  }
}
