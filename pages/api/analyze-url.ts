import type { NextApiRequest, NextApiResponse } from "next";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    // 1. URL에서 HTML 가져오기
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      },
    });

    if (!pageRes.ok) {
      return res.status(400).json({ error: `Failed to fetch URL: ${pageRes.status}` });
    }

    const html = await pageRes.text();

    // HTML에서 불필요한 태그 제거 (script, style, nav, footer 등)
    const cleanedHtml = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();

    // 텍스트가 너무 길면 잘라내기 (Gemini 토큰 제한)
    const maxLen = 30000;
    const text = cleanedHtml.length > maxLen ? cleanedHtml.slice(0, maxLen) : cleanedHtml;

    // 2. Gemini API로 분석
    const prompt = `당신은 한국 정부지원사업 공고 분석 전문가입니다.
아래는 정부지원사업 공고 웹페이지에서 추출한 텍스트입니다. 이 내용을 분석하여 아래 JSON 형식으로 정확하게 추출해주세요.

반드시 아래 JSON 형식만 응답하세요. 다른 텍스트는 포함하지 마세요.
정보가 없는 항목은 빈 문자열 "" 또는 빈 배열 []로 채워주세요.

{
  "programName": "사업명 (정식 명칭)",
  "agency": "주관기관 / 전담기관",
  "category": "분류 (R&D, 사업화, 인력, 수출, 기타 중 택1)",
  "deadline": "접수 마감일 (YYYY-MM-DD)",
  "amount": "지원금액 (예: 최대 2억원)",
  "period": "수행기간 (예: 협약일 ~ 2026.05.31)",
  "overview": "사업 개요 설명 (2~3문장으로 요약)",
  "eligibility": ["지원자격 요건 1", "지원자격 요건 2", ...],
  "ineligibility": ["신청제외 대상 1", "신청제외 대상 2", ...],
  "supportDetails": [
    {"category": "카테고리명", "items": ["항목1", "항목2"]},
    ...
  ],
  "requiredDocs": ["제출서류 1", "제출서류 2", ...],
  "schedule": [
    {"date": "날짜", "content": "일정내용"},
    ...
  ],
  "evaluationCriteria": [
    {"item": "평가항목", "weight": "배점"},
    ...
  ],
  "contactInfo": "문의처 정보 (전화번호, 이메일 등)"
}

웹페이지 텍스트:
${text}`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(500).json({ error: `Gemini API error: ${geminiRes.status}`, details: errText });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // JSON 추출 (마크다운 코드블록 제거)
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
