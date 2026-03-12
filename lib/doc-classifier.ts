// 파일명 키워드 기반 서류 자동 분류
// TODO: DB 연동 시에도 그대로 사용

interface ClassifyResult {
  name: string;
  category: string;
}

const rules: { keywords: string[]; name: string; category: string }[] = [
  // 사업자등록
  { keywords: ["사업자등록증명", "사업자등록 증명"], name: "사업자등록증명원", category: "registration" },
  { keywords: ["사업자등록", "사업자 등록"], name: "사업자등록증", category: "registration" },
  { keywords: ["통신판매"], name: "통신판매업 신고증", category: "registration" },

  // 인증/확인서
  { keywords: ["중소기업 확인", "중소기업확인", "소기업"], name: "중소기업 확인서", category: "certification" },
  { keywords: ["산업디자인전문", "산업디자인 전문", "디자인전문회사"], name: "산업디자인전문회사 등록증", category: "certification" },
  { keywords: ["직접생산", "직접 생산"], name: "직접생산업체 증명서", category: "certification" },
  { keywords: ["벤처기업", "벤처 확인"], name: "벤처기업 확인서", category: "certification" },
  { keywords: ["이노비즈", "inno-biz"], name: "이노비즈 인증서", category: "certification" },
  { keywords: ["소프트웨어사업자", "sw사업자"], name: "소프트웨어사업자 신고확인서", category: "certification" },

  // 세무/회계
  { keywords: ["부가세", "부가가치세"], name: "부가가치세 신고서", category: "tax" },
  { keywords: ["원천세", "원천징수"], name: "원천세 신고서", category: "tax" },
  { keywords: ["재무제표", "재무 제표"], name: "재무제표", category: "tax" },
  { keywords: ["법인세"], name: "법인세 신고서", category: "tax" },
  { keywords: ["종합소득세", "종소세"], name: "종합소득세 신고서", category: "tax" },
  { keywords: ["세금계산서"], name: "세금계산서", category: "tax" },
  { keywords: ["납세증명", "납세 증명"], name: "납세증명서", category: "tax" },

  // 보험/4대보험
  { keywords: ["4대보험", "사대보험", "4대 보험"], name: "4대보험 가입증명서", category: "insurance" },
  { keywords: ["산재보험", "산재 보험"], name: "산재보험 가입증명서", category: "insurance" },
  { keywords: ["고용보험"], name: "고용보험 가입증명서", category: "insurance" },
  { keywords: ["건강보험"], name: "건강보험 자격확인서", category: "insurance" },
  { keywords: ["국민연금"], name: "국민연금 가입증명서", category: "insurance" },

  // 통장/금융
  { keywords: ["통장사본", "통장 사본", "계좌"], name: "사업자 통장사본", category: "finance" },
  { keywords: ["신용평가", "신용 평가"], name: "신용평가서", category: "finance" },
  { keywords: ["잔고증명", "잔액증명"], name: "잔고증명서", category: "finance" },

  // 기타
  { keywords: ["인감증명", "인감 증명"], name: "인감증명서", category: "etc" },
  { keywords: ["등기부등본", "등기부 등본", "등기사항"], name: "법인등기부등본", category: "etc" },
  { keywords: ["위임장"], name: "위임장", category: "etc" },
  { keywords: ["계약서"], name: "계약서", category: "etc" },
];

export function classifyByFilename(filename: string): ClassifyResult | null {
  const lower = filename.toLowerCase().replace(/[_\-\.]/g, " ");

  for (const rule of rules) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return { name: rule.name, category: rule.category };
      }
    }
  }

  return null;
}
