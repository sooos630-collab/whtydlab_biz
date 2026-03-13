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

// ── 인건비 관리 ──

// 대표/임원 인건비
export interface ExecLaborCost {
  id: string;
  hr_contract_id: string;  // HR계약관리 연동
  name: string;
  role: "대표" | "임원";
  month: string;
  project: string;
  revenue: number;
  direct_cost: number;
  net_profit: number;
  reserve_rate: number;
  reserve_amount: number;
  distribution: number;
  tax: number;
  net_amount: number;
  pay_date: string;
  status: "지급완료" | "미지급" | "예정";
  memo: string;
}

export const dummyExecLabor: ExecLaborCost[] = [
  // 2025-03 에이컴퍼니 브랜딩 정산
  { id: "exec-01", hr_contract_id: "hr-1", name: "송유섭", role: "대표", month: "2025-03", project: "에이컴퍼니 브랜딩 리뉴얼", revenue: 25000000, direct_cost: 2200000, net_profit: 22800000, reserve_rate: 50, reserve_amount: 11400000, distribution: 5700000, tax: 188100, net_amount: 5511900, pay_date: "2025-03-10", status: "지급완료", memo: "배분 50%" },
  { id: "exec-02", hr_contract_id: "hr-2", name: "김팀장", role: "임원", month: "2025-03", project: "에이컴퍼니 브랜딩 리뉴얼", revenue: 25000000, direct_cost: 2200000, net_profit: 22800000, reserve_rate: 50, reserve_amount: 11400000, distribution: 5700000, tax: 188100, net_amount: 5511900, pay_date: "2025-03-10", status: "지급완료", memo: "배분 50%" },
  // 2025-02 B공익재단 잔금
  { id: "exec-03", hr_contract_id: "hr-1", name: "송유섭", role: "대표", month: "2025-02", project: "B공익재단 홈페이지 (잔금)", revenue: 11400000, direct_cost: 800000, net_profit: 10600000, reserve_rate: 40, reserve_amount: 4240000, distribution: 3180000, tax: 104940, net_amount: 3075060, pay_date: "2025-02-28", status: "지급완료", memo: "배분 50%" },
  { id: "exec-04", hr_contract_id: "hr-2", name: "김팀장", role: "임원", month: "2025-02", project: "B공익재단 홈페이지 (잔금)", revenue: 11400000, direct_cost: 800000, net_profit: 10600000, reserve_rate: 40, reserve_amount: 4240000, distribution: 3180000, tax: 104940, net_amount: 3075060, pay_date: "2025-02-28", status: "지급완료", memo: "배분 50%" },
  // 2025-01 E공공기관 디자인시스템
  { id: "exec-05", hr_contract_id: "hr-1", name: "송유섭", role: "대표", month: "2025-01", project: "E공공기관 디자인시스템 (잔금)", revenue: 22000000, direct_cost: 3500000, net_profit: 18500000, reserve_rate: 40, reserve_amount: 7400000, distribution: 5550000, tax: 183150, net_amount: 5366850, pay_date: "2025-01-31", status: "지급완료", memo: "배분 50%" },
  { id: "exec-06", hr_contract_id: "hr-2", name: "김팀장", role: "임원", month: "2025-01", project: "E공공기관 디자인시스템 (잔금)", revenue: 22000000, direct_cost: 3500000, net_profit: 18500000, reserve_rate: 40, reserve_amount: 7400000, distribution: 5550000, tax: 183150, net_amount: 5366850, pay_date: "2025-01-31", status: "지급완료", memo: "배분 50%" },
];

// 직원 인건비 (정규직/계약직 — 월 고정)
export interface EmployeeSalary {
  id: string;
  hr_contract_id: string;          // HR계약 연동 (정규직)
  outsource_contract_id: string;   // 외주계약 연동 (계약직)
  name: string;
  position: string;
  type: "정규직" | "계약직";
  month: string;
  base_salary: number;
  allowances: number;
  incentive: number;
  national_pension: number;
  health_insurance: number;
  employment_insurance: number;
  income_tax: number;
  resident_tax: number;
  net_salary: number;
  pay_date: string;
  status: "지급완료" | "미지급" | "예정";
  memo: string;
}

export const dummyEmployeeSalaries: EmployeeSalary[] = [
  // 2025-01
  { id: "es-01", hr_contract_id: "hr-2", outsource_contract_id: "", name: "김팀장", position: "팀장", type: "정규직", month: "2025-01", base_salary: 3500000, allowances: 300000, incentive: 0, national_pension: 171000, health_insurance: 131950, employment_insurance: 34200, income_tax: 89520, resident_tax: 8950, net_salary: 3364380, pay_date: "2025-01-10", status: "지급완료", memo: "" },
  { id: "es-02", hr_contract_id: "", outsource_contract_id: "out-1", name: "박개발", position: "프론트엔드", type: "계약직", month: "2025-01", base_salary: 4000000, allowances: 0, incentive: 0, national_pension: 0, health_insurance: 0, employment_insurance: 0, income_tax: 132000, resident_tax: 0, net_salary: 3868000, pay_date: "2025-01-15", status: "지급완료", memo: "3.3% 원천징수" },
  // 2025-02
  { id: "es-03", hr_contract_id: "hr-2", outsource_contract_id: "", name: "김팀장", position: "팀장", type: "정규직", month: "2025-02", base_salary: 3500000, allowances: 300000, incentive: 0, national_pension: 171000, health_insurance: 131950, employment_insurance: 34200, income_tax: 89520, resident_tax: 8950, net_salary: 3364380, pay_date: "2025-02-10", status: "지급완료", memo: "" },
  { id: "es-04", hr_contract_id: "", outsource_contract_id: "out-1", name: "박개발", position: "프론트엔드", type: "계약직", month: "2025-02", base_salary: 4000000, allowances: 0, incentive: 0, national_pension: 0, health_insurance: 0, employment_insurance: 0, income_tax: 132000, resident_tax: 0, net_salary: 3868000, pay_date: "2025-02-15", status: "지급완료", memo: "3.3% 원천징수" },
  // 2025-03
  { id: "es-05", hr_contract_id: "hr-2", outsource_contract_id: "", name: "김팀장", position: "팀장", type: "정규직", month: "2025-03", base_salary: 3500000, allowances: 300000, incentive: 0, national_pension: 171000, health_insurance: 131950, employment_insurance: 34200, income_tax: 89520, resident_tax: 8950, net_salary: 3364380, pay_date: "2025-03-10", status: "지급완료", memo: "" },
  { id: "es-06", hr_contract_id: "", outsource_contract_id: "out-1", name: "박개발", position: "프론트엔드", type: "계약직", month: "2025-03", base_salary: 4000000, allowances: 0, incentive: 0, national_pension: 0, health_insurance: 0, employment_insurance: 0, income_tax: 132000, resident_tax: 0, net_salary: 3868000, pay_date: "2025-03-15", status: "지급완료", memo: "3.3% 원천징수" },
  // 2025-04 예정
  { id: "es-07", hr_contract_id: "hr-2", outsource_contract_id: "", name: "김팀장", position: "팀장", type: "정규직", month: "2025-04", base_salary: 3500000, allowances: 300000, incentive: 500000, national_pension: 171000, health_insurance: 131950, employment_insurance: 34200, income_tax: 112520, resident_tax: 11250, net_salary: 3839080, pay_date: "2025-04-10", status: "예정", memo: "1분기 성과급" },
  { id: "es-08", hr_contract_id: "", outsource_contract_id: "out-1", name: "박개발", position: "프론트엔드", type: "계약직", month: "2025-04", base_salary: 4000000, allowances: 0, incentive: 0, national_pension: 0, health_insurance: 0, employment_insurance: 0, income_tax: 132000, resident_tax: 0, net_salary: 3868000, pay_date: "2025-04-15", status: "예정", memo: "3.3% 원천징수" },
];

// 외주 인건비 (프로젝트 단건 계약)
export interface OutsourceLaborCost {
  id: string;
  outsource_contract_id: string; // 외주계약관리 연동
  name: string;
  company: string;
  project: string;
  role: string;
  contract_amount: number;
  paid_amount: number;
  remaining: number;
  tax: number;
  start_date: string;
  end_date: string;
  pay_date: string;
  status: "진행중" | "완료" | "예정";
  memo: string;
}

export const dummyOutsourceLabor: OutsourceLaborCost[] = [
  { id: "ol-01", outsource_contract_id: "", name: "이백엔드", company: "프리랜서", project: "에이컴퍼니 브랜딩 리뉴얼", role: "백엔드 개발", contract_amount: 8000000, paid_amount: 8000000, remaining: 0, tax: 264000, start_date: "2024-11-01", end_date: "2025-02-28", pay_date: "2025-02-28", status: "완료", memo: "3.3% 원천징수, 2회 분할" },
  { id: "ol-02", outsource_contract_id: "out-2", name: "이디자인", company: "프리랜서", project: "B공익재단 홈페이지", role: "UI 디자인", contract_amount: 5000000, paid_amount: 5000000, remaining: 0, tax: 165000, start_date: "2024-10-15", end_date: "2025-01-31", pay_date: "2025-01-31", status: "완료", memo: "세금계산서 발행" },
  { id: "ol-03", outsource_contract_id: "", name: "정기획", company: "프리랜서", project: "씨테크 모바일앱", role: "서비스 기획", contract_amount: 6000000, paid_amount: 3000000, remaining: 3000000, tax: 99000, start_date: "2025-02-01", end_date: "2025-05-31", pay_date: "2025-03-01", status: "진행중", memo: "착수금 50% 지급완료" },
  { id: "ol-04", outsource_contract_id: "", name: "한퍼블", company: "프리랜서", project: "디포커스 대시보드", role: "퍼블리싱", contract_amount: 4000000, paid_amount: 0, remaining: 4000000, tax: 0, start_date: "2025-04-01", end_date: "2025-05-15", pay_date: "-", status: "예정", memo: "4월 착수 예정" },
  { id: "ol-05", outsource_contract_id: "", name: "윤영상", company: "모션랩", project: "에이컴퍼니 브랜딩 리뉴얼", role: "모션 그래픽", contract_amount: 3000000, paid_amount: 3000000, remaining: 0, tax: 99000, start_date: "2025-01-10", end_date: "2025-02-10", pay_date: "2025-02-10", status: "완료", memo: "일괄 지급" },
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
