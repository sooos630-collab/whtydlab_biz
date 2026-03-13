// TODO: DB 연동 시 이 파일 삭제

export interface CompanyInfo {
  name: string;
  representative: string;
  businessNumber: string;
  industry: string;
  subIndustry: string;
  yearsInBusiness: number;
  employeeCount: number;
  annualRevenue: number;
  businessType: string;
  address: string;
  capabilities: string;
  certifications: string;
  founderTags: string;
  personnelDetails: string;
  directProductions: string;
  naraCodes: string;
  extraInfo: string;
  memo: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: "공고문" | "모집요강" | "제출양식" | "사업계획서양식" | "기타";
  size: string;
  uploadedAt: string;
}

export interface EligibilityAnalysis {
  programSummary: {
    programName: string;
    agency: string;
    applicationPeriod: string;
    operationPeriod: string;
    supportAmount: string;
    eligibility: string[];
    supportDetails: string[];
  };
  eligibilityResult: {
    isEligible: boolean;
    matchedCriteria: string[];
    unmatchedCriteria: string[];
    warnings: string[];
  };
  requiredDocuments: {
    mandatory: string[];
    optional: string[];
    additionalPrep: string[];
  };
}

export interface TemplateSubItem {
  label: string;
  detail: string;
}

export interface TemplateSection {
  number: string;
  title: string;
  description: string;
  subSections: string[];
  items: TemplateSubItem[];
  maxPages?: number | null;
}

export interface GeneratedSection {
  number: string;
  title: string;
  content: string;
}

export interface ProposalProject {
  id: string;
  name: string;
  targetProgram: string;
  status: "작성중" | "분석완료" | "계획서생성" | "제출완료";
  currentStep: number;
  createdAt: string;
  companyInfo: CompanyInfo;
  uploadedFiles: UploadedFile[];
  eligibilityAnalysis: EligibilityAnalysis | null;
  templateStructure: TemplateSection[];
  businessIdea: string;
  generatedPlan: GeneratedSection[];
}

export const defaultCompanyInfo: CompanyInfo = {
  name: "",
  representative: "",
  businessNumber: "",
  industry: "",
  subIndustry: "",
  yearsInBusiness: 0,
  employeeCount: 0,
  annualRevenue: 0,
  businessType: "",
  address: "",
  capabilities: "",
  certifications: "",
  founderTags: "",
  personnelDetails: "",
  directProductions: "",
  naraCodes: "",
  extraInfo: "",
  memo: "",
};

export const mockEligibilityAnalysis: EligibilityAnalysis = {
  programSummary: {
    programName: "2025 창업성장기술개발사업(디딤돌)",
    agency: "중소벤처기업부 / 중소기업기술정보진흥원",
    applicationPeriod: "2025.03.10 ~ 2025.04.10",
    operationPeriod: "협약일 ~ 2026.05.31 (최대 12개월)",
    supportAmount: "최대 2억원 (정부출연금 기준)",
    eligibility: [
      "중소기업기본법 제2조에 의한 중소기업",
      "창업 후 7년 이내 기업 (업력 7년 미만)",
      "기술개발 역량을 보유한 기업",
      "국세 및 지방세 체납 없는 기업",
      "동일 과제로 타 정부지원사업 수행 중이 아닌 기업",
    ],
    supportDetails: [
      "기술개발비 (인건비, 재료비, 외주가공비 등)",
      "시제품 제작비",
      "인증·시험·분석비",
      "기술도입비",
      "특허출원·등록비",
    ],
  },
  eligibilityResult: {
    isEligible: true,
    matchedCriteria: [
      "중소기업 해당 (매출 50억 미만)",
      "업력 3년 (7년 미만 조건 충족)",
      "기술개발 역량 보유 (SW개발 경험)",
      "IT/소프트웨어 업종 해당",
    ],
    unmatchedCriteria: [],
    warnings: [
      "국세 및 지방세 체납 여부 확인 필요",
      "동일 과제 중복지원 여부 최종 확인 필요",
      "기업부설연구소 보유 시 가점 부여 (현재 미보유로 추정)",
    ],
  },
  requiredDocuments: {
    mandatory: [
      "사업계획서 (지정양식)",
      "사업자등록증 사본",
      "중소기업확인서",
      "최근 3년 재무제표",
      "법인등기부등본 (법인인 경우)",
      "국세 납세증명서",
      "지방세 납세증명서",
    ],
    optional: [
      "특허·지식재산권 증빙",
      "기업부설연구소 인정서",
      "기술보유 증빙자료",
      "수출실적 증빙",
      "고용 관련 증빙",
    ],
    additionalPrep: [
      "기업신용평가등급 확인 (한국기업데이터, NICE 등)",
      "대표이사 4대보험 가입 이력",
      "기존 정부지원사업 수행 이력 정리",
    ],
  },
};

export const mockTemplateStructure: TemplateSection[] = [
  {
    number: "1",
    title: "사업 개요",
    description: "개발하고자 하는 기술/제품의 전체적인 개요",
    subSections: ["개발 배경 및 필요성", "개발 목표", "개발 내용 요약"],
    items: [],
    maxPages: 3,
  },
  {
    number: "2",
    title: "문제 인식 및 현황 분석",
    description: "현재 시장/기술의 문제점과 해결 필요성",
    subSections: ["국내외 기술 현황", "기존 기술의 한계점", "문제 해결의 시급성"],
    items: [],
    maxPages: 4,
  },
  {
    number: "3",
    title: "기술개발 내용",
    description: "핵심 기술 및 차별화된 해결 방안",
    subSections: ["핵심 기술 설명", "기술적 차별성", "기술개발 범위 및 세부내용"],
    items: [],
    maxPages: 6,
  },
  {
    number: "4",
    title: "시장성 분석",
    description: "목표 시장 규모와 성장 가능성",
    subSections: ["목표시장 정의", "시장 규모 및 성장률", "경쟁 현황 분석", "시장 진입 전략"],
    items: [],
    maxPages: 4,
  },
  {
    number: "5",
    title: "추진 전략 및 체계",
    description: "사업 수행 계획 및 추진 일정",
    subSections: ["추진 체계 (인력구성)", "추진 일정 (간트차트)", "외주/협력 계획"],
    items: [],
    maxPages: 3,
  },
  {
    number: "6",
    title: "사업화 전략",
    description: "개발 기술의 사업화 및 수익 모델",
    subSections: ["사업화 방안", "마케팅 전략", "매출 계획", "투자유치 계획"],
    items: [],
    maxPages: 3,
  },
  {
    number: "7",
    title: "예산 계획",
    description: "정부출연금 및 민간부담금 사용 계획",
    subSections: ["총 사업비 구성", "세부 항목별 예산", "연차별 투입 계획"],
    items: [],
    maxPages: 2,
  },
  {
    number: "8",
    title: "기대 효과",
    description: "기술적·경제적·사회적 기대효과",
    subSections: ["기술적 기대효과", "경제적 기대효과 (매출, 고용)", "사회적 기대효과"],
    items: [],
    maxPages: 2,
  },
];

export const mockGeneratedPlan: GeneratedSection[] = [
  {
    number: "1",
    title: "사업 개요",
    content: `## 1.1 개발 배경 및 필요성

국내 중소기업의 디지털 전환(DX)은 급격히 가속화되고 있으나, 실제 중소기업 현장에서는 여전히 수기 업무, 엑셀 기반 관리, 분산된 정보 시스템 등으로 인해 업무 효율성이 크게 저하되고 있습니다.

특히 정부지원사업 관련 업무에서는 공고문 확인, 지원 가능성 판단, 사업계획서 작성 등의 과정이 전문 인력 없이는 수행하기 어려우며, 컨설팅 비용 또한 높아 소규모 기업에게 큰 부담으로 작용하고 있습니다.

**핵심 문제:**
- 정부지원사업 공고 정보의 분산 및 파악 어려움
- 지원 적합성 판단에 소요되는 시간과 비용
- 사업계획서 작성의 전문성 부족
- 중소기업 맞춤형 AI 솔루션의 부재

## 1.2 개발 목표

AI 기반 중소기업 정부지원사업 매칭 및 사업계획서 자동 작성 시스템을 개발하여, 중소기업이 적합한 지원사업을 빠르게 찾고, 높은 품질의 사업계획서를 효율적으로 작성할 수 있도록 지원합니다.

## 1.3 개발 내용 요약

| 구분 | 내용 |
|------|------|
| 핵심 기능 | AI 기반 공고 분석, 지원 적합성 자동 판단, 사업계획서 초안 자동 생성 |
| 기술 스택 | LLM(Large Language Model), RAG, 문서 분석 AI |
| 대상 고객 | 업력 1~10년 중소기업, 스타트업 |
| 개발 기간 | 12개월 |`,
  },
  {
    number: "2",
    title: "문제 인식 및 현황 분석",
    content: `## 2.1 국내외 기술 현황

**국내 현황:**
정부지원사업 관련 정보 플랫폼(K-스타트업, 기업마당 등)이 존재하나, 단순 공고 나열에 그치며 기업 맞춤형 추천이나 자동 분석 기능은 제공하지 않습니다.

**해외 현황:**
미국의 Grants.gov, 영국의 Innovate UK 등에서는 기본적인 매칭 시스템을 운영하고 있으나, AI 기반 사업계획서 자동 작성까지 제공하는 서비스는 아직 초기 단계입니다.

## 2.2 기존 기술의 한계점

1. **정보 접근성**: 공고가 여러 기관에 분산되어 있어 통합 확인이 어려움
2. **전문성 장벽**: 사업계획서 작성에 높은 전문성과 경험이 요구됨
3. **비용 부담**: 전문 컨설팅 의뢰 시 건당 300~1,000만원 수준의 비용 발생
4. **시간 소요**: 평균 2~4주의 사업계획서 작성 기간

## 2.3 문제 해결의 시급성

2024년 기준 정부 R&D 예산은 약 31.1조원으로, 중소기업 지원 비중이 지속 증가하고 있습니다. 그러나 실제 지원율은 평균 20~30%에 불과하며, 이는 사업계획서 품질 격차에 기인하는 바가 큽니다.`,
  },
  {
    number: "3",
    title: "기술개발 내용",
    content: `## 3.1 핵심 기술 설명

**AI 문서 분석 엔진**
- 공고문 PDF를 자동 파싱하여 지원 자격, 평가 기준, 제출 서류 등 핵심 정보를 구조화
- OCR + NLP 기술을 결합한 비정형 문서 인식

**기업-사업 매칭 알고리즘**
- 기업 정보(업종, 업력, 매출, 기술역량 등)와 지원사업 요건을 다차원 매칭
- 적합도 점수 산출 및 부적합 사유 자동 분석

**사업계획서 자동 생성 엔진**
- LLM 기반의 섹션별 맞춤 작성
- RAG(Retrieval-Augmented Generation) 기술로 실제 시장 데이터, 기술 동향 반영
- 지원사업별 양식 구조를 자동 인식하여 맞춤형 목차 생성

## 3.2 기술적 차별성

| 구분 | 기존 방식 | 본 개발 기술 |
|------|-----------|-------------|
| 공고 분석 | 수동 확인 | AI 자동 파싱 및 구조화 |
| 적합성 판단 | 전문가 판단 | AI 다차원 매칭 |
| 계획서 작성 | 수동 작성 (2~4주) | AI 자동 생성 (30분) |
| 양식 대응 | 수동 포맷팅 | 자동 양식 인식 및 적용 |

## 3.3 기술개발 범위 및 세부내용

**1단계 (1~4개월):** 문서 분석 AI 엔진 개발
**2단계 (3~8개월):** 매칭 알고리즘 및 적합성 판단 모듈
**3단계 (6~12개월):** 사업계획서 자동 생성 엔진 및 통합 플랫폼`,
  },
  {
    number: "4",
    title: "시장성 분석",
    content: `## 4.1 목표시장 정의

**TAM (전체시장):** 국내 중소기업 약 780만개 중 정부지원사업 관심 기업
**SAM (유효시장):** 연간 정부지원사업 신청 기업 약 50만개
**SOM (획득시장):** 초기 3년 내 목표 사용 기업 5,000개

## 4.2 시장 규모 및 성장률

- 국내 GovTech 시장: 2024년 약 2.3조원 → 2027년 4.1조원 예상 (CAGR 21%)
- AI 문서 자동화 시장: 글로벌 연 35% 성장
- 정부지원사업 컨설팅 시장: 연간 약 3,000억원 규모

## 4.3 경쟁 현황 분석

현재 AI 기반 사업계획서 자동 작성에 특화된 직접 경쟁자는 없으며, 간접 경쟁 서비스와의 비교는 다음과 같습니다.

## 4.4 시장 진입 전략

1. **초기:** 스타트업/창업기업 대상 무료 체험 → 유료 전환
2. **성장:** 중소기업 대상 구독 모델 + 건별 과금 하이브리드
3. **확장:** 컨설팅 기관 파트너십, 창업지원기관 제휴`,
  },
  {
    number: "5",
    title: "추진 전략 및 체계",
    content: `## 5.1 추진 체계 (인력구성)

| 구분 | 성명 | 역할 | 참여율 |
|------|------|------|--------|
| 총괄책임자 | 김대표 | 프로젝트 총괄, AI 모델 설계 | 100% |
| 연구원 | 이연구원 | AI 엔진 개발, 데이터 처리 | 100% |
| 연구원 | 박개발 | 프론트엔드/백엔드 개발 | 100% |
| 연구보조원 | 최인턴 | 데이터 수집, QA | 50% |

## 5.2 추진 일정

| 단계 | 기간 | 주요 내용 |
|------|------|-----------|
| 1단계 | M1~M4 | 문서 분석 엔진 개발, 학습 데이터 구축 |
| 2단계 | M3~M8 | 매칭 알고리즘 개발, 적합성 판단 모듈 |
| 3단계 | M6~M10 | 사업계획서 생성 엔진, 프롬프트 엔지니어링 |
| 4단계 | M9~M12 | 통합 플랫폼 개발, 사용자 테스트, 고도화 |

## 5.3 외주/협력 계획

- UI/UX 디자인: 전문 디자인 에이전시 외주 (M2~M4)
- 보안 검수: 외부 보안 전문업체 점검 (M11)`,
  },
  {
    number: "6",
    title: "사업화 전략",
    content: `## 6.1 사업화 방안

**비즈니스 모델:** SaaS 구독형 + 건별 과금 하이브리드

| 요금제 | 월 요금 | 포함 내용 |
|--------|---------|-----------|
| Basic | 5만원 | 공고 분석 3건/월, 적합성 판단 |
| Pro | 15만원 | 공고 분석 무제한, 계획서 생성 5건/월 |
| Enterprise | 별도 협의 | 전용 인스턴스, API 연동, 컨설팅 |

## 6.2 마케팅 전략

1. 창업지원기관 제휴 (창업진흥원, 테크노파크 등)
2. 중소기업 커뮤니티 타겟 마케팅
3. 무료 분석 체험을 통한 바이럴 마케팅

## 6.3 매출 계획

| 연도 | 유료 기업 수 | 예상 매출 |
|------|-------------|-----------|
| 1차년도 | 200개 | 3.6억원 |
| 2차년도 | 1,000개 | 14.4억원 |
| 3차년도 | 3,000개 | 36억원 |

## 6.4 투자유치 계획

- 시드 투자: 개발 완료 후 5억원 규모 (2026 상반기)
- 시리즈A: 서비스 출시 1년 후 30억원 목표`,
  },
  {
    number: "7",
    title: "예산 계획",
    content: `## 7.1 총 사업비 구성

| 구분 | 금액 | 비율 |
|------|------|------|
| 정부출연금 | 200,000,000원 | 70% |
| 민간부담금 (현금) | 57,000,000원 | 20% |
| 민간부담금 (현물) | 28,500,000원 | 10% |
| **합계** | **285,500,000원** | **100%** |

## 7.2 세부 항목별 예산

| 비목 | 금액 | 내역 |
|------|------|------|
| 인건비 | 120,000,000원 | 참여연구원 4인 |
| 재료비 | 15,000,000원 | 클라우드 서버, API 비용 |
| 외주가공비 | 30,000,000원 | UI/UX 디자인, 보안 검수 |
| 시제품제작비 | 10,000,000원 | MVP 구축 비용 |
| 기술도입비 | 5,000,000원 | AI 모델 라이센스 |
| 인증시험비 | 8,000,000원 | 성능 테스트, 보안 인증 |
| 특허출원비 | 6,000,000원 | 국내 특허 2건 |
| 여비 | 3,000,000원 | 기술 조사, 전시회 참가 |
| 기타 | 3,000,000원 | 회의비, 인쇄비 등 |

## 7.3 연차별 투입 계획

- **상반기 (M1~M6):** 110,000,000원 (인건비, 재료비, 외주가공비 집중)
- **하반기 (M7~M12):** 90,000,000원 (시제품, 인증, 특허 집중)`,
  },
  {
    number: "8",
    title: "기대 효과",
    content: `## 8.1 기술적 기대효과

- AI 문서 분석 정확도 90% 이상 달성
- 사업계획서 자동 생성 기술 확보 (국내 최초)
- 관련 특허 2건 출원 예정
- AI/NLP 기반 문서 처리 핵심 기술 내재화

## 8.2 경제적 기대효과

| 항목 | 1차년도 | 2차년도 | 3차년도 |
|------|---------|---------|---------|
| 매출액 | 3.6억원 | 14.4억원 | 36억원 |
| 신규 고용 | 3명 | 8명 | 15명 |
| 수출액 | - | 1억원 | 5억원 |

- 중소기업 컨설팅 비용 절감: 기업당 연 300~500만원
- 사업계획서 작성 시간 단축: 평균 3주 → 1일

## 8.3 사회적 기대효과

- 중소기업의 정부지원사업 접근성 향상
- 정보 비대칭 해소를 통한 공정한 기회 제공
- 지방 소재 기업의 수도권 대비 정보 격차 해소
- 정부지원금의 효율적 배분에 기여`,
  },
];

export const dummyProposalProjects: ProposalProject[] = [
  {
    id: "prop-001",
    name: "AI 기반 사업계획서 자동작성 시스템",
    targetProgram: "2025 창업성장기술개발사업(디딤돌)",
    status: "계획서생성",
    currentStep: 7,
    createdAt: "2025-03-08",
    companyInfo: {
      name: "와이디랩",
      representative: "김대표",
      businessNumber: "123-45-67890",
      industry: "정보통신업",
      subIndustry: "소프트웨어 개발",
      yearsInBusiness: 3,
      employeeCount: 8,
      annualRevenue: 500000000,
      businessType: "법인",
      address: "서울특별시 강남구 테헤란로 123",
      capabilities: "AI/ML 개발, 웹/앱 서비스 개발, 데이터 분석",
      certifications: "벤처기업 인증, ISO 27001",
      founderTags: "",
      personnelDetails: "",
      directProductions: "",
      naraCodes: "",
      extraInfo: "",
      memo: "",
    },
    uploadedFiles: [
      { id: "f1", name: "2025_디딤돌_공고문.pdf", type: "공고문", size: "2.4MB", uploadedAt: "2025-03-08" },
      { id: "f2", name: "2025_디딤돌_모집요강.pdf", type: "모집요강", size: "5.1MB", uploadedAt: "2025-03-08" },
      { id: "f3", name: "사업계획서_양식.hwp", type: "사업계획서양식", size: "1.2MB", uploadedAt: "2025-03-08" },
    ],
    eligibilityAnalysis: mockEligibilityAnalysis,
    templateStructure: mockTemplateStructure,
    businessIdea: "중소기업이 정부지원사업에 지원할 때, AI가 공고문을 분석하고 기업 적합성을 자동 판단한 후, 해당 사업의 양식에 맞는 사업계획서 초안을 자동 생성해주는 SaaS 플랫폼을 개발하고자 합니다.\n\n핵심 문제: 중소기업은 전문 인력과 정보 부족으로 정부지원사업 지원에 어려움을 겪고 있으며, 컨설팅 비용(건당 300~1,000만원)이 부담됩니다.\n\n해결 방안: LLM과 RAG 기술을 활용하여 공고문 자동 분석, 기업-사업 매칭, 사업계획서 자동 생성 기능을 제공합니다.\n\n차별성: 지원사업별 양식을 자동 인식하여 맞춤형 사업계획서를 생성하는 것은 국내 최초이며, 기존 단순 공고 검색 서비스 대비 end-to-end 솔루션을 제공합니다.",
    generatedPlan: mockGeneratedPlan,
  },
  {
    id: "prop-002",
    name: "스마트 수출 지원 플랫폼",
    targetProgram: "2025 수출바우처사업",
    status: "작성중",
    currentStep: 3,
    createdAt: "2025-03-12",
    companyInfo: {
      name: "와이디랩",
      representative: "김대표",
      businessNumber: "123-45-67890",
      industry: "정보통신업",
      subIndustry: "소프트웨어 개발",
      yearsInBusiness: 3,
      employeeCount: 8,
      annualRevenue: 500000000,
      businessType: "법인",
      address: "서울특별시 강남구 테헤란로 123",
      capabilities: "AI/ML 개발, 웹/앱 서비스 개발, 데이터 분석",
      certifications: "벤처기업 인증, ISO 27001",
      founderTags: "",
      personnelDetails: "",
      directProductions: "",
      naraCodes: "",
      extraInfo: "",
      memo: "",
    },
    uploadedFiles: [],
    eligibilityAnalysis: null,
    templateStructure: [],
    businessIdea: "",
    generatedPlan: [],
  },
];
