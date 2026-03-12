// TODO: DB 연동 시 이 파일 삭제하고 Supabase로 교체

// ── 정기결제(고정비) ──
export interface FixedCost {
  id: string;
  name: string;
  category: "운영비" | "구독" | "임대료" | "식대" | "보험" | "기타";
  amount: number;
  billing_cycle: "월" | "분기" | "반기" | "연";
  payment_date: string;
  memo: string;
  status: "활성" | "해지";
}

export const dummyFixedCosts: FixedCost[] = [
  { id: "fc-1", name: "사무실 임대료", category: "임대료", amount: 800000, billing_cycle: "월", payment_date: "매월 25일", memo: "동탄 B동 1210호", status: "활성" },
  { id: "fc-2", name: "Figma Business", category: "구독", amount: 75000, billing_cycle: "월", payment_date: "매월 1일", memo: "디자인 팀 2명", status: "활성" },
  { id: "fc-3", name: "AWS 서버비", category: "구독", amount: 120000, billing_cycle: "월", payment_date: "매월 3일", memo: "EC2 + S3", status: "활성" },
  { id: "fc-4", name: "Notion Team", category: "구독", amount: 32000, billing_cycle: "월", payment_date: "매월 15일", memo: "", status: "활성" },
  { id: "fc-5", name: "4대보험 사업자 부담분", category: "보험", amount: 350000, billing_cycle: "월", payment_date: "매월 10일", memo: "2명분", status: "활성" },
  { id: "fc-6", name: "점심 식대", category: "식대", amount: 400000, billing_cycle: "월", payment_date: "-", memo: "1인 1만원 x 20일", status: "활성" },
  { id: "fc-7", name: "Adobe CC", category: "구독", amount: 770000, billing_cycle: "연", payment_date: "매년 3월", memo: "올인원 플랜", status: "활성" },
  { id: "fc-8", name: "Slack Pro", category: "구독", amount: 0, billing_cycle: "월", payment_date: "-", memo: "무료 플랜 사용 중", status: "해지" },
];

// ── 프로젝트 수금 ──
export interface ProjectPayment {
  id: string;
  project_name: string;
  client: string;
  total_amount: number;
  payments: {
    label: string;
    amount: number;
    due_date: string;
    paid_date: string | null;
    status: "입금완료" | "미입금" | "지연";
  }[];
}

export const dummyProjectPayments: ProjectPayment[] = [
  {
    id: "pp-1",
    project_name: "A사 브랜딩 리뉴얼",
    client: "(주)에이컴퍼니",
    total_amount: 25000000,
    payments: [
      { label: "계약금 (50%)", amount: 12500000, due_date: "2025-02-01", paid_date: "2025-02-01", status: "입금완료" },
      { label: "잔금 (50%)", amount: 12500000, due_date: "2025-04-30", paid_date: null, status: "미입금" },
    ],
  },
  {
    id: "pp-2",
    project_name: "B재단 홈페이지 구축",
    client: "B공익재단",
    total_amount: 38000000,
    payments: [
      { label: "계약금 (30%)", amount: 11400000, due_date: "2024-11-15", paid_date: "2024-11-15", status: "입금완료" },
      { label: "중도금 (40%)", amount: 15200000, due_date: "2025-01-15", paid_date: "2025-01-20", status: "입금완료" },
      { label: "잔금 (30%)", amount: 11400000, due_date: "2025-02-28", paid_date: "2025-03-05", status: "입금완료" },
    ],
  },
  {
    id: "pp-3",
    project_name: "C사 모바일앱 UI",
    client: "(주)씨테크",
    total_amount: 42000000,
    payments: [
      { label: "계약금 (30%)", amount: 12600000, due_date: "2025-03-10", paid_date: null, status: "지연" },
      { label: "중도금 (40%)", amount: 16800000, due_date: "2025-05-31", paid_date: null, status: "미입금" },
      { label: "잔금 (30%)", amount: 12600000, due_date: "2025-07-31", paid_date: null, status: "미입금" },
    ],
  },
];

// ── 월 급여관리 ──
export interface SalaryRecord {
  id: string;
  name: string;
  type: "정규직" | "프리랜서";
  position: string;
  base_salary: number;
  deductions: number;
  net_salary: number;
  pay_date: string;
  status: "지급완료" | "미지급" | "예정";
  month: string;
}

export const dummySalaryRecords: SalaryRecord[] = [
  { id: "sal-1", name: "송유섭", type: "정규직", position: "대표", base_salary: 4000000, deductions: 420000, net_salary: 3580000, pay_date: "2025-03-10", status: "지급완료", month: "2025-03" },
  { id: "sal-2", name: "김팀장", type: "정규직", position: "팀장", base_salary: 3500000, deductions: 370000, net_salary: 3130000, pay_date: "2025-03-10", status: "지급완료", month: "2025-03" },
  { id: "sal-3", name: "박개발", type: "프리랜서", position: "프론트엔드 개발", base_salary: 4000000, deductions: 132000, net_salary: 3868000, pay_date: "2025-03-15", status: "지급완료", month: "2025-03" },
  { id: "sal-4", name: "송유섭", type: "정규직", position: "대표", base_salary: 4000000, deductions: 420000, net_salary: 3580000, pay_date: "2025-04-10", status: "예정", month: "2025-04" },
  { id: "sal-5", name: "김팀장", type: "정규직", position: "팀장", base_salary: 3500000, deductions: 370000, net_salary: 3130000, pay_date: "2025-04-10", status: "예정", month: "2025-04" },
  { id: "sal-6", name: "박개발", type: "프리랜서", position: "프론트엔드 개발", base_salary: 4000000, deductions: 132000, net_salary: 3868000, pay_date: "2025-04-15", status: "예정", month: "2025-04" },
];

// ── 세금계산서 ──
export interface TaxInvoice {
  id: string;
  type: "발행" | "수취";
  date: string;
  partner: string;
  description: string;
  supply_amount: number;
  tax_amount: number;
  total_amount: number;
  status: "발행완료" | "미발행" | "수취완료";
}

export const dummyTaxInvoices: TaxInvoice[] = [
  { id: "tax-1", type: "발행", date: "2025-02-28", partner: "(주)에이컴퍼니", description: "브랜딩 리뉴얼 계약금", supply_amount: 11363636, tax_amount: 1136364, total_amount: 12500000, status: "발행완료" },
  { id: "tax-2", type: "발행", date: "2025-03-05", partner: "B공익재단", description: "홈페이지 구축 잔금", supply_amount: 10363636, tax_amount: 1036364, total_amount: 11400000, status: "발행완료" },
  { id: "tax-3", type: "수취", date: "2025-03-01", partner: "AWS", description: "3월 서버 이용료", supply_amount: 109091, tax_amount: 10909, total_amount: 120000, status: "수취완료" },
  { id: "tax-4", type: "발행", date: "2025-03-10", partner: "(주)씨테크", description: "모바일앱 UI 계약금", supply_amount: 11454545, tax_amount: 1145455, total_amount: 12600000, status: "미발행" },
];
