// TODO: DB 연동 시 이 파일 삭제

// ── 문의폼 ──
export interface Inquiry {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  type: "웹사이트" | "앱" | "브랜딩" | "기타";
  message: string;
  source: "홈페이지" | "나라장터" | "소개" | "SNS";
  status: "신규" | "확인" | "응답완료" | "의뢰전환";
  created_at: string;
}

export const dummyInquiries: Inquiry[] = [
  { id: "inq-01", name: "정유진", company: "그린에너지", email: "yj@green.kr", phone: "031-7777-8888", type: "웹사이트", message: "ESG 보고서 시스템 구축 문의합니다", source: "나라장터", status: "확인", created_at: "2025-03-11" },
  { id: "inq-02", name: "한승우", company: "블루오션마케팅", email: "sw@blue.kr", phone: "02-3333-4444", type: "브랜딩", message: "CI 리뉴얼 견적 요청합니다", source: "홈페이지", status: "신규", created_at: "2025-03-12" },
  { id: "inq-03", name: "오수빈", company: "에듀플러스", email: "sb@edu.com", phone: "02-1111-2222", type: "웹사이트", message: "LMS 플랫폼 개발 관련 상담 요청", source: "소개", status: "의뢰전환", created_at: "2025-03-03" },
  { id: "inq-04", name: "김민재", company: "넥스트핀테크", email: "mj@nextfin.kr", phone: "02-8888-9999", type: "앱", message: "핀테크 앱 UI/UX 디자인 의뢰", source: "SNS", status: "응답완료", created_at: "2025-03-08" },
  { id: "inq-05", name: "이서연", company: "헬스케어랩", email: "sy@hclab.kr", phone: "010-5555-6666", type: "기타", message: "건강관리 대시보드 컨설팅 문의", source: "홈페이지", status: "신규", created_at: "2025-03-12" },
];

// ── 의뢰 ──
export interface SalesRequest {
  id: string;
  title: string;
  client: string;
  contact_name: string;
  type: "웹사이트" | "앱" | "브랜딩" | "디자인시스템" | "컨설팅" | "기타";
  status: "접수" | "상담중" | "견적작성" | "견적발송" | "수주" | "실패";
  budget: string;
  deadline: string;
  created_at: string;
  memo: string;
}

export const dummyRequests: SalesRequest[] = [
  { id: "req-01", title: "ESG 보고서 시스템 구축", client: "그린에너지", contact_name: "정유진", type: "웹사이트", status: "상담중", budget: "5,000~7,000만원", deadline: "2025-06-30", created_at: "2025-03-11", memo: "공공기관 납품 경험 필요" },
  { id: "req-02", title: "LMS 플랫폼 개발", client: "에듀플러스", contact_name: "오수빈", type: "웹사이트", status: "견적발송", budget: "2,000~3,000만원", deadline: "2025-08-31", created_at: "2025-03-05", memo: "수강생 관리 + 결제 기능" },
  { id: "req-03", title: "핀테크 앱 UI/UX", client: "넥스트핀테크", contact_name: "김민재", type: "앱", status: "견적작성", budget: "3,000~4,000만원", deadline: "2025-07-31", created_at: "2025-03-09", memo: "iOS/Android 동시 진행" },
  { id: "req-04", title: "스타트업허브 웹/앱 리뉴얼", client: "스타트업허브", contact_name: "이민수", type: "웹사이트", status: "수주", budget: "3,000만원", deadline: "2025-09-30", created_at: "2025-03-01", memo: "계약 완료, 4월 착수" },
  { id: "req-05", title: "블루오션 CI 리뉴얼", client: "블루오션마케팅", contact_name: "한승우", type: "브랜딩", status: "접수", budget: "미정", deadline: "-", created_at: "2025-03-12", memo: "예산 협의 필요" },
];

// ── 고객 (기존 customers 데이터 이관) ──
export interface Client {
  id: string;
  company: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  grade: "VIP" | "일반" | "잠재";
  industry: string;
  total_revenue: number;
  project_count: number;
  last_contact_date: string;
  memo: string;
}

export const dummyClients: Client[] = [
  { id: "cli-01", company: "(주)에이컴퍼니", contact_name: "김지현", contact_email: "jh@acompany.kr", contact_phone: "02-1234-5678", grade: "VIP", industry: "IT/소프트웨어", total_revenue: 25000000, project_count: 1, last_contact_date: "2025-03-10", memo: "브랜딩 프로젝트 진행중" },
  { id: "cli-02", company: "B공익재단", contact_name: "박재원", contact_email: "jw@bfound.or.kr", contact_phone: "02-2222-3333", grade: "VIP", industry: "비영리/공공", total_revenue: 38000000, project_count: 1, last_contact_date: "2025-02-28", memo: "정산완료, 추가 프로젝트 논의" },
  { id: "cli-03", company: "(주)씨테크", contact_name: "이동현", contact_email: "dh@ctech.kr", contact_phone: "02-4444-5555", grade: "일반", industry: "IT/소프트웨어", total_revenue: 0, project_count: 1, last_contact_date: "2025-03-05", memo: "모바일앱 계약완료" },
  { id: "cli-04", company: "(주)디포커스", contact_name: "최서윤", contact_email: "sy@dfocus.kr", contact_phone: "02-6666-7777", grade: "일반", industry: "마케팅", total_revenue: 9600000, project_count: 1, last_contact_date: "2025-03-12", memo: "대시보드 프로젝트 진행중" },
  { id: "cli-05", company: "E공공기관", contact_name: "정민호", contact_email: "mh@egov.go.kr", contact_phone: "02-8888-0000", grade: "VIP", industry: "공공기관", total_revenue: 55000000, project_count: 1, last_contact_date: "2025-01-06", memo: "디자인시스템 정산완료" },
  { id: "cli-06", company: "그린에너지", contact_name: "정유진", contact_email: "yj@green.kr", contact_phone: "031-7777-8888", grade: "잠재", industry: "에너지", total_revenue: 0, project_count: 0, last_contact_date: "2025-03-11", memo: "ESG 시스템 상담중" },
  { id: "cli-07", company: "에듀플러스", contact_name: "오수빈", contact_email: "sb@edu.com", contact_phone: "02-1111-2222", grade: "잠재", industry: "교육", total_revenue: 0, project_count: 0, last_contact_date: "2025-03-09", memo: "LMS 견적 발송" },
];

// ── 견적서 ──

/** 세부내역 (하위 항목) — 세부견적에서 QuoteItem 아래 들어감 */
export interface CostItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

/**
 * 견적 항목
 * - 통합견적: quantity, unit_price, amount 직접 사용 (cost_items 비어있음)
 * - 세부견적: cost_items에 세부내역, amount = sum(cost_items.amount)
 */
export interface QuoteItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
  cost_items: CostItem[];
}

export interface CompanyInfo {
  company_name: string;
  biz_number: string;
  representative: string;
  email: string;
  address: string;
}

export type VatOption = "별도" | "포함" | "제외";
export type QuoteType = "통합" | "세부";

export interface Quote {
  id: string;
  quote_number: string;
  quote_name: string;
  title: string;
  client: string;
  receiver_company: string;
  contact_name: string;
  manager: string;
  status: "작성중" | "발송완료" | "수주" | "실패" | "만료";
  quote_type: QuoteType;
  quote_date: string;
  valid_until: string;
  items: QuoteItem[];
  items_total: number;
  discount_rate: number;
  discount_amount: number;
  supply_amount: number;
  vat_option: VatOption;
  vat_amount: number;
  total_amount: number;
  supplier: CompanyInfo;
  receiver: CompanyInfo;
  notes: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SUPPLIER: CompanyInfo = {
  company_name: "와이디랩",
  biz_number: "123-45-67890",
  representative: "송유섭",
  email: "biz@whydlab.com",
  address: "경기도 화성시 동탄대로 123, B동 1210호",
};

/** 통합견적용 항목 (cost_items 없음) */
function qi(name: string, qty: number, price: number, desc = "", unit = "건"): QuoteItem {
  return { id: `qi-${Math.random().toString(36).slice(2, 8)}`, name, description: desc, quantity: qty, unit, unit_price: price, amount: qty * price, cost_items: [] };
}

/** 세부내역 */
function ci(name: string, qty: number, price: number, desc = "", unit = "건"): CostItem {
  return { id: `ci-${Math.random().toString(36).slice(2, 8)}`, name, description: desc, quantity: qty, unit, unit_price: price, amount: qty * price };
}

/** 세부견적용 대항목 (cost_items으로 금액 합산) */
function qiGroup(name: string, costItems: CostItem[]): QuoteItem {
  const amount = costItems.reduce((a, c) => a + c.amount, 0);
  return { id: `qi-${Math.random().toString(36).slice(2, 8)}`, name, description: "", quantity: 1, unit: "식", unit_price: amount, amount, cost_items: costItems };
}

function makeQuote(
  id: string, quote_number: string, quote_name: string, title: string,
  client: string, receiver_company: string, contact_name: string, manager: string,
  status: Quote["status"], quote_date: string, valid_until: string,
  items: QuoteItem[], discountRate: number, created_at: string, updated_at: string,
  receiverEmail = "", receiverAddr = "", receiverBiz = "", notes = "",
  quoteType: QuoteType = "통합"
): Quote {
  const items_total = items.reduce((a, i) => a + i.amount, 0);
  const discount_amount = Math.round(items_total * discountRate / 100);
  const supply_amount = items_total - discount_amount;
  const vat_amount = Math.round(supply_amount * 0.1);
  return {
    id, quote_number, quote_name, title, client, receiver_company, contact_name, manager,
    status, quote_type: quoteType, quote_date, valid_until, items, items_total, discount_rate: discountRate,
    discount_amount, supply_amount, vat_option: "별도", vat_amount, total_amount: supply_amount + vat_amount,
    supplier: { ...DEFAULT_SUPPLIER },
    receiver: { company_name: receiver_company, biz_number: receiverBiz, representative: contact_name, email: receiverEmail, address: receiverAddr },
    notes, created_at, updated_at,
  };
}

export const dummyQuotes: Quote[] = [
  // 세부견적: QuoteItem(대항목) → CostItem(세부내역)
  makeQuote("qt-01", "QT-2025-001", "그린에너지 ESG 견적", "ESG 보고서 시스템 구축", "그린에너지", "그린에너지(주)", "정유진", "김대표", "작성중", "2025-03-11", "2025-04-11",
    [
      qiGroup("기획/설계", [ci("요구사항 분석", 1, 5000000, "현행 시스템 분석 및 요구사항 정의"), ci("IA 설계", 1, 7000000, "정보 구조 설계 및 화면 흐름")]),
      qiGroup("디자인", [ci("UI 디자인", 1, 12000000, "메인/서브 페이지 시안"), ci("UX 디자인", 1, 6000000, "사용성 테스트 및 개선")]),
      qiGroup("개발", [ci("프론트엔드", 1, 15000000, "React 기반 SPA"), ci("백엔드", 1, 13000000, "API 서버 및 DB 구축")]),
      qiGroup("QA/배포", [ci("통합 테스트", 1, 4000000, "기능 및 성능 테스트"), ci("배포/인프라", 1, 3000000, "AWS 인프라 세팅")]),
    ],
    0, "2025-03-11 09:30", "2025-03-11 14:20", "yj@green.kr", "서울시 강남구", "234-56-78901", "견적 유효기간 30일", "세부"),
  // 통합견적
  makeQuote("qt-02", "QT-2025-002", "에듀플러스 LMS 견적", "LMS 플랫폼 개발", "에듀플러스", "에듀플러스(주)", "오수빈", "이팀장", "발송완료", "2025-03-05", "2025-04-05",
    [qi("기획", 1, 5000000, "서비스 기획"), qi("디자인", 1, 8000000, "UI 디자인"), qi("개발", 1, 10000000, "웹 개발"), qi("테스트", 1, 2000000, "QA")],
    0, "2025-03-05 10:00", "2025-03-06 11:30", "sb@edu.com"),
  // 세부견적
  makeQuote("qt-03", "QT-2025-003", "넥스트핀테크 앱 견적", "핀테크 앱 UI/UX", "넥스트핀테크", "(주)넥스트핀테크", "김민재", "김대표", "작성중", "2025-03-09", "2025-04-09",
    [
      qiGroup("리서치", [ci("사용자 조사", 1, 3000000, "인터뷰 및 설문"), ci("경쟁사 분석", 1, 2000000, "벤치마킹 리포트")]),
      qiGroup("UI/UX 디자인", [ci("iOS 디자인", 1, 7500000, "iOS 네이티브 UI", "세트"), ci("Android 디자인", 1, 7500000, "Android 네이티브 UI", "세트")]),
      qiGroup("프로토타입", [ci("인터랙션 프로토타입", 1, 8000000, "Figma 프로토타입")]),
      qiGroup("산출물", [ci("디자인 시스템 문서", 1, 7000000, "컴포넌트 가이드", "식")]),
    ],
    0, "2025-03-09 15:00", "2025-03-10 09:45", "", "", "", "", "세부"),
  makeQuote("qt-04", "QT-2025-004", "스타트업허브 리뉴얼 견적", "스타트업허브 웹/앱 리뉴얼", "스타트업허브", "스타트업허브(주)", "이민수", "이팀장", "수주", "2025-03-01", "2025-03-31",
    [qi("기획", 1, 5000000), qi("디자인", 1, 10000000), qi("프론트엔드", 1, 10000000), qi("백엔드", 1, 5000000)],
    6.67, "2025-03-01 11:00", "2025-03-02 16:00", "", "", "", "장기 파트너 할인 적용"),
  makeQuote("qt-05", "QT-2024-010", "블루오션 브랜딩 견적", "블루오션 브랜딩 패키지", "블루오션마케팅", "블루오션마케팅(주)", "한승우", "김대표", "실패", "2025-01-15", "2025-02-28",
    [qi("CI 디자인", 1, 5000000, "로고 및 컬러 시스템"), qi("웹사이트", 1, 7000000, "반응형 웹")],
    0, "2025-01-15 14:00", "2025-01-15 14:00"),
  makeQuote("qt-06", "QT-2025-005", "디포커스 대시보드 견적", "관리자 대시보드 구축", "디포커스", "(주)디포커스", "최서윤", "이팀장", "발송완료", "2025-02-20", "2025-03-22",
    [qi("기획/설계", 1, 6000000), qi("UI 디자인", 1, 10000000), qi("퍼블리싱", 1, 8000000), qi("백엔드 연동", 1, 8000000)],
    0, "2025-02-20 09:00", "2025-02-21 10:30"),
  makeQuote("qt-07", "QT-2025-006", "에프커머스 리뉴얼 견적", "이커머스 플랫폼 리뉴얼", "에프커머스", "(주)에프커머스", "박성호", "김대표", "만료", "2025-01-20", "2025-02-20",
    [qi("UX 기획", 1, 10000000), qi("디자인", 1, 20000000), qi("프론트엔드", 1, 22000000), qi("백엔드", 1, 16000000)],
    4.41, "2025-01-20 11:30", "2025-01-22 15:00"),
];

// ── 메일 템플릿 ──
export interface MailTemplate {
  id: string;
  name: string;
  category: "문의응답" | "견적발송" | "계약안내" | "프로젝트" | "기타";
  subject: string;
  body: string;
  updated_at: string;
}

export const dummyMailTemplates: MailTemplate[] = [
  { id: "tpl-01", name: "문의 접수 확인", category: "문의응답", subject: "[와이디랩] 문의가 접수되었습니다", body: "안녕하세요, {{name}}님.\n\n와이디랩에 문의해 주셔서 감사합니다.\n문의하신 내용을 확인 후 영업일 1~2일 이내에 담당자가 연락드리겠습니다.\n\n감사합니다.\n와이디랩 드림", updated_at: "2025-02-10" },
  { id: "tpl-02", name: "견적서 발송", category: "견적발송", subject: "[와이디랩] {{project}} 견적서를 보내드립니다", body: "안녕하세요, {{name}}님.\n\n요청하신 {{project}} 건에 대한 견적서를 첨부하여 보내드립니다.\n견적 유효기간은 발행일로부터 30일입니다.\n\n궁금하신 점이 있으시면 편하게 연락 주세요.\n\n감사합니다.\n와이디랩 드림", updated_at: "2025-03-01" },
  { id: "tpl-03", name: "계약 안내", category: "계약안내", subject: "[와이디랩] {{project}} 계약 안내드립니다", body: "안녕하세요, {{name}}님.\n\n{{project}} 프로젝트 계약서를 첨부합니다.\n확인 후 서명하여 회신 부탁드립니다.\n\n착수금 입금 확인 후 프로젝트를 시작하겠습니다.\n\n감사합니다.\n와이디랩 드림", updated_at: "2025-03-05" },
  { id: "tpl-04", name: "프로젝트 킥오프 안내", category: "프로젝트", subject: "[와이디랩] {{project}} 킥오프 미팅 안내", body: "안녕하세요, {{name}}님.\n\n{{project}} 프로젝트 킥오프 미팅을 아래와 같이 진행합니다.\n\n- 일시: {{date}}\n- 장소: {{location}}\n- 안건: 프로젝트 범위 확인, 일정 협의\n\n참석 확인 부탁드립니다.\n\n감사합니다.\n와이디랩 드림", updated_at: "2025-03-08" },
  { id: "tpl-05", name: "중간보고 안내", category: "프로젝트", subject: "[와이디랩] {{project}} 중간보고 안내", body: "안녕하세요, {{name}}님.\n\n{{project}} 중간 결과물을 공유드립니다.\n첨부 파일 확인 후 피드백 부탁드립니다.\n\n감사합니다.\n와이디랩 드림", updated_at: "2025-03-10" },
];
