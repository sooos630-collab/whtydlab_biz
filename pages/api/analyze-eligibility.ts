import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, type File as FormidableFile } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

    if (!company || !urlMeta) {
      return res.status(400).json({ error: "company and urlMeta are required" });
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

    const prompt = `당신은 한국 정부지원사업 지원 적합성 분석 전문가입니다.

아래 기업 정보와 정부지원사업 공고 정보를 비교 분석하여, 해당 기업이 이 사업에 지원 가능한지 판단해주세요.
${hasFiles ? `\n첨부된 파일(${fileNames})도 함께 분석하여 공고의 상세 지원자격, 평가기준, 제출서류 등을 정확히 파악해주세요.` : ''}

## 기업 정보
- 기업명: ${company.name}
- 사업자번호: ${company.businessNumber}
- 업종: ${company.industry} / ${company.subIndustry}
- 업력: ${company.yearsInBusiness}년
- 직원수: ${company.employeeCount}명
- 연매출: ${company.annualRevenue ? (company.annualRevenue / 100000000).toFixed(1) + '억원' : '미입력'}
- 사업자유형: ${company.businessType}
- 소재지: ${company.address}
- 보유역량: ${company.capabilities}
- 인증현황: ${company.certifications}
- 대표자 특성: ${company.founderTags || ''}
- 인력 현황: ${company.personnelDetails || ''}
- 직접생산업체 증명: ${company.directProductions || ''}
- 나라장터 업종코드: ${company.naraCodes || ''}
- 기타 정보: ${company.extraInfo || ''}
- 비고: ${company.memo || ''}

## 공고 정보
- 사업명: ${urlMeta.programName || ''}
- 주관기관: ${urlMeta.agency || ''}
- 지원금액: ${urlMeta.amount || ''}
- 수행기간: ${urlMeta.period || ''}
- 접수마감: ${urlMeta.deadline || ''}
- 지원자격: ${JSON.stringify(urlMeta.eligibility || [])}
- 신청제외: ${JSON.stringify(urlMeta.ineligibility || [])}

반드시 아래 JSON 형식만 응답하세요. 다른 텍스트는 포함하지 마세요.

{
  "programSummary": {
    "programName": "사업명",
    "agency": "주관기관",
    "applicationPeriod": "접수기간",
    "operationPeriod": "수행기간",
    "supportAmount": "지원금액",
    "eligibility": ["지원자격 요건 1", "지원자격 요건 2"],
    "supportDetails": ["지원내용 1", "지원내용 2"]
  },
  "eligibilityResult": {
    "isEligible": true,
    "matchedCriteria": ["충족하는 자격 요건과 이유 1", "충족하는 자격 요건과 이유 2"],
    "unmatchedCriteria": ["미충족 요건과 이유 1"],
    "warnings": ["확인 필요 사항 1", "주의사항 2"]
  },
  "requiredDocuments": {
    "mandatory": ["필수 서류 1", "필수 서류 2"],
    "optional": ["선택 서류 1"],
    "additionalPrep": ["추가 준비 사항 1"]
  }
}`;

    parts.push({ text: prompt });

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(500).json({ error: `Gemini API error: ${geminiRes.status}`, details: errText });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);
    return res.status(200).json({ success: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Analysis failed", details: message });
  }
}
