// TODO: DB 연동 시 이 파일 삭제하고 Supabase로 교체

// ── 계약서류 파일 ──
export interface ContractFile {
  id: string;
  contract_id: string;
  contract_type: "hr" | "outsource" | "project";
  file_name: string;
  file_type: "계약서" | "견적서" | "발주서" | "변경계약서" | "검수확인서" | "NDA" | "기타";
  file_size: number; // bytes
  uploaded_at: string;
}

export const dummyContractFiles: ContractFile[] = [
  { id: "cf-01", contract_id: "hr-1", contract_type: "hr", file_name: "근로계약서_송유섭.pdf", file_type: "계약서", file_size: 245000, uploaded_at: "2024-03-25" },
  { id: "cf-02", contract_id: "hr-1", contract_type: "hr", file_name: "월임금명세서_송유섭_202503.pdf", file_type: "기타", file_size: 120000, uploaded_at: "2025-03-05" },
  { id: "cf-03", contract_id: "hr-2", contract_type: "hr", file_name: "근로계약서_김팀장.pdf", file_type: "계약서", file_size: 230000, uploaded_at: "2024-06-01" },
  { id: "cf-04", contract_id: "hr-2", contract_type: "hr", file_name: "월임금명세서_김팀장_202503.pdf", file_type: "기타", file_size: 115000, uploaded_at: "2025-03-05" },
  { id: "cf-05", contract_id: "out-1", contract_type: "outsource", file_name: "프리랜서계약서_박개발.pdf", file_type: "계약서", file_size: 310000, uploaded_at: "2025-01-02" },
  { id: "cf-06", contract_id: "out-1", contract_type: "outsource", file_name: "비밀보안서약서_박개발.pdf", file_type: "NDA", file_size: 95000, uploaded_at: "2025-01-02" },
  { id: "cf-07", contract_id: "out-2", contract_type: "outsource", file_name: "프리랜서계약서_이디자인.pdf", file_type: "계약서", file_size: 280000, uploaded_at: "2025-02-01" },
  { id: "cf-08", contract_id: "out-3", contract_type: "outsource", file_name: "협력사계약서_클라우드텍.pdf", file_type: "계약서", file_size: 420000, uploaded_at: "2024-06-03" },
  { id: "cf-09", contract_id: "proj-1", contract_type: "project", file_name: "용역계약서_에이컴퍼니_브랜딩.pdf", file_type: "계약서", file_size: 520000, uploaded_at: "2025-01-16" },
  { id: "cf-10", contract_id: "proj-1", contract_type: "project", file_name: "견적서_에이컴퍼니_브랜딩.pdf", file_type: "견적서", file_size: 180000, uploaded_at: "2025-01-10" },
  { id: "cf-11", contract_id: "proj-2", contract_type: "project", file_name: "용역계약서_B재단_홈페이지.pdf", file_type: "계약서", file_size: 490000, uploaded_at: "2024-11-02" },
  { id: "cf-12", contract_id: "proj-2", contract_type: "project", file_name: "검수확인서_B재단_홈페이지.pdf", file_type: "검수확인서", file_size: 150000, uploaded_at: "2025-02-28" },
  { id: "cf-13", contract_id: "proj-2", contract_type: "project", file_name: "견적서_B재단_홈페이지.pdf", file_type: "견적서", file_size: 175000, uploaded_at: "2024-10-25" },
  { id: "cf-14", contract_id: "proj-3", contract_type: "project", file_name: "용역계약서_씨테크_모바일앱.pdf", file_type: "계약서", file_size: 550000, uploaded_at: "2025-03-02" },
  { id: "cf-15", contract_id: "proj-3", contract_type: "project", file_name: "발주서_씨테크_모바일앱.pdf", file_type: "발주서", file_size: 210000, uploaded_at: "2025-03-01" },
];

// ── HR 계약관리 ──
export interface HrContract {
  id: string;
  name: string;
  position: string;
  type: "정규직" | "계약직" | "파트타임" | "인턴";
  start_date: string;
  end_date: string | null;
  status: "재직" | "퇴직" | "휴직";
  salary: string;
  docs: { name: string; uploaded: boolean }[];
}

export const dummyHrContracts: HrContract[] = [
  {
    id: "hr-1",
    name: "송유섭",
    position: "대표",
    type: "정규직",
    start_date: "2024-03-25",
    end_date: null,
    status: "재직",
    salary: "협의",
    docs: [
      { name: "근로계약서", uploaded: true },
      { name: "월임금명세서", uploaded: true },
    ],
  },
  {
    id: "hr-2",
    name: "김팀장",
    position: "팀장",
    type: "정규직",
    start_date: "2024-06-01",
    end_date: null,
    status: "재직",
    salary: "협의",
    docs: [
      { name: "근로계약서", uploaded: true },
      { name: "월임금명세서", uploaded: true },
      { name: "비밀유지서약서", uploaded: false },
    ],
  },
];

// ── 외주 계약관리 ──
export interface OutsourceContract {
  id: string;
  name: string;
  company: string;
  type: "프리랜서" | "협력사";
  role: string;
  contract_start: string;
  contract_end: string;
  amount: string;
  status: "계약중" | "계약완료" | "계약해지";
  docs: { name: string; uploaded: boolean }[];
}

export const dummyOutsourceContracts: OutsourceContract[] = [
  {
    id: "out-1",
    name: "박개발",
    company: "",
    type: "프리랜서",
    role: "프론트엔드 개발",
    contract_start: "2025-01-01",
    contract_end: "2025-06-30",
    amount: "월 400만원",
    status: "계약중",
    docs: [
      { name: "프리랜서 계약서", uploaded: true },
      { name: "비밀보안서약서", uploaded: true },
    ],
  },
  {
    id: "out-2",
    name: "이디자인",
    company: "",
    type: "프리랜서",
    role: "UI/UX 디자인",
    contract_start: "2025-02-01",
    contract_end: "2025-04-30",
    amount: "건당 200만원",
    status: "계약완료",
    docs: [
      { name: "프리랜서 계약서", uploaded: true },
      { name: "비밀보안서약서", uploaded: false },
    ],
  },
  {
    id: "out-3",
    name: "담당자명",
    company: "(주)클라우드텍",
    type: "협력사",
    role: "서버 인프라 운영",
    contract_start: "2024-06-01",
    contract_end: "2025-05-31",
    amount: "월 150만원",
    status: "계약중",
    docs: [
      { name: "협력사 계약서", uploaded: true },
    ],
  },
];

// ── 프로젝트 계약관리 ──
export interface PaymentPhase {
  label: "착수금" | "중도금" | "잔금";
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string | null;
}

export interface ProjectContract {
  id: string;
  contract_number: string;                                          // 코드넘버
  project_name: string;
  client: string;                                                   // 회사명
  description: string;                                              // 세부내역
  progress: number;                                                 // 진척도 0~100
  acquisition_channel: "소개" | "입찰" | "직접영업" | "온라인" | "기타"; // 수주경로
  invoice_issued: boolean;                                          // 계산서발행 여부
  start_date: string;                                               // 시작
  end_date: string;                                                 // 종료
  supply_amount: number;                                            // 공급가액
  vat_amount: number;                                               // 부가세(VAT)
  total_amount_num: number;                                         // 총금액(VAT포함)
  // 청구
  billing_initial: number;                                          // 착수금 청구
  billing_interim: number;                                          // 중도금 청구
  billing_final: number;                                            // 잔금 청구
  // 수금
  collected_initial: number;                                        // 착수금 수금
  collected_interim: number;                                        // 중도금 수금
  collected_final: number;                                          // 잔금 수금
  // 수금 현황 (자동계산)
  collected_amount: number;                                         // 수금액
  remaining_amount: number;                                         // 잔여금
  collection_rate: number;                                          // 수금율 %
  // 수익
  input_cost: number;                                               // 투입원가
  net_profit: number;                                               // 순수익
  net_profit_rate: number;                                          // 순수익율 %
  // 인원
  team_members: string[];                                           // 투입인원
  // 기존 호환
  status: "제안" | "계약완료" | "진행중" | "납품완료" | "정산완료";
  manager: string;
  contract_date: string;
  total_amount: string;
  paid_amount: string;
  contract_amount: number;
  payment_phases: PaymentPhase[];
  total_settled: number;
  total_expense: number;
  profit_rate: number;
}

export const dummyProjectContracts: ProjectContract[] = [
  {
    // ── 정산완료: 2025-11 ~ 2026-02, 잔금 2월 수금완료 ──
    id: "proj-1",
    contract_number: "WDL-2026-001",
    project_name: "A사 브랜딩 리뉴얼",
    client: "(주)에이컴퍼니",
    description: "CI/BI 리뉴얼 + 홈페이지 디자인",
    progress: 100,
    acquisition_channel: "소개",
    invoice_issued: true,
    start_date: "2025-11-01",
    end_date: "2026-02-28",
    supply_amount: 22727273,
    vat_amount: 2272727,
    total_amount_num: 25000000,
    billing_initial: 7500000, billing_interim: 10000000, billing_final: 7500000,
    collected_initial: 7500000, collected_interim: 10000000, collected_final: 7500000,
    collected_amount: 25000000, remaining_amount: 0, collection_rate: 100,
    input_cost: 9800000, net_profit: 15200000, net_profit_rate: 61,
    team_members: ["김대표", "박개발", "이디자인"],
    status: "정산완료", manager: "김대표", contract_date: "2025-10-20",
    total_amount: "2,500만원", paid_amount: "2,500만원", contract_amount: 25000000,
    payment_phases: [
      { label: "착수금", amount: 7500000, due_date: "2025-11-01", paid: true, paid_date: "2025-11-01" },
      { label: "중도금", amount: 10000000, due_date: "2026-01-15", paid: true, paid_date: "2026-01-16" },
      { label: "잔금", amount: 7500000, due_date: "2026-02-28", paid: true, paid_date: "2026-02-28" },
    ],
    total_settled: 25000000, total_expense: 9800000, profit_rate: 60.8,
  },
  {
    // ── 정산완료: 2025-10 ~ 2026-01, 잔금 1월 수금 ──
    id: "proj-2",
    contract_number: "WDL-2025-003",
    project_name: "B재단 홈페이지 구축",
    client: "B공익재단",
    description: "반응형 웹사이트 기획/디자인/개발",
    progress: 100,
    acquisition_channel: "입찰",
    invoice_issued: true,
    start_date: "2025-10-01",
    end_date: "2026-01-31",
    supply_amount: 34545455,
    vat_amount: 3454545,
    total_amount_num: 38000000,
    billing_initial: 11400000, billing_interim: 15200000, billing_final: 11400000,
    collected_initial: 11400000, collected_interim: 15200000, collected_final: 11400000,
    collected_amount: 38000000, remaining_amount: 0, collection_rate: 100,
    input_cost: 18200000, net_profit: 19800000, net_profit_rate: 52,
    team_members: ["이팀장", "박개발"],
    status: "정산완료", manager: "이팀장", contract_date: "2025-09-15",
    total_amount: "3,800만원", paid_amount: "3,800만원", contract_amount: 38000000,
    payment_phases: [
      { label: "착수금", amount: 11400000, due_date: "2025-10-01", paid: true, paid_date: "2025-10-01" },
      { label: "중도금", amount: 15200000, due_date: "2025-12-15", paid: true, paid_date: "2025-12-16" },
      { label: "잔금", amount: 11400000, due_date: "2026-01-31", paid: true, paid_date: "2026-01-30" },
    ],
    total_settled: 38000000, total_expense: 18200000, profit_rate: 52.1,
  },
  {
    // ── 진행중: 2026-01 ~ 2026-06, 착수금 1월 수금, 중도금 3월(이번달!), 잔금 6월 ──
    id: "proj-3",
    contract_number: "WDL-2026-002",
    project_name: "C사 모바일앱 UI",
    client: "(주)씨테크",
    description: "iOS/Android 앱 UI/UX 디자인",
    progress: 40,
    acquisition_channel: "직접영업",
    invoice_issued: true,
    start_date: "2026-01-05",
    end_date: "2026-06-30",
    supply_amount: 38181818,
    vat_amount: 3818182,
    total_amount_num: 42000000,
    billing_initial: 12600000, billing_interim: 16800000, billing_final: 12600000,
    collected_initial: 12600000, collected_interim: 0, collected_final: 0,
    collected_amount: 12600000, remaining_amount: 29400000, collection_rate: 30,
    input_cost: 8500000, net_profit: 4100000, net_profit_rate: 33,
    team_members: ["김대표", "박개발"],
    status: "진행중", manager: "김대표", contract_date: "2025-12-20",
    total_amount: "4,200만원", paid_amount: "1,260만원", contract_amount: 42000000,
    payment_phases: [
      { label: "착수금", amount: 12600000, due_date: "2026-01-05", paid: true, paid_date: "2026-01-05" },
      { label: "중도금", amount: 16800000, due_date: "2026-03-20", paid: false, paid_date: null },
      { label: "잔금", amount: 12600000, due_date: "2026-06-30", paid: false, paid_date: null },
    ],
    total_settled: 12600000, total_expense: 8500000, profit_rate: 32.5,
  },
  {
    // ── 진행중: 2026-02 ~ 2026-05, 착수금 2월 수금, 중도금 3월(이번달!), 잔금 5월 ──
    id: "proj-4",
    contract_number: "WDL-2026-003",
    project_name: "D사 관리자 대시보드",
    client: "(주)디포커스",
    description: "어드민 대시보드 기획/디자인/퍼블리싱",
    progress: 35,
    acquisition_channel: "소개",
    invoice_issued: true,
    start_date: "2026-02-01",
    end_date: "2026-05-31",
    supply_amount: 29090909,
    vat_amount: 2909091,
    total_amount_num: 32000000,
    billing_initial: 9600000, billing_interim: 12800000, billing_final: 9600000,
    collected_initial: 9600000, collected_interim: 0, collected_final: 0,
    collected_amount: 9600000, remaining_amount: 22400000, collection_rate: 30,
    input_cost: 5400000, net_profit: 4200000, net_profit_rate: 44,
    team_members: ["이팀장", "이디자인"],
    status: "진행중", manager: "이팀장", contract_date: "2026-01-10",
    total_amount: "3,200만원", paid_amount: "960만원", contract_amount: 32000000,
    payment_phases: [
      { label: "착수금", amount: 9600000, due_date: "2026-02-01", paid: true, paid_date: "2026-02-02" },
      { label: "중도금", amount: 12800000, due_date: "2026-03-25", paid: false, paid_date: null },
      { label: "잔금", amount: 9600000, due_date: "2026-05-31", paid: false, paid_date: null },
    ],
    total_settled: 9600000, total_expense: 5400000, profit_rate: 43.8,
  },
  {
    // ── 정산완료: 2025-09 ~ 2025-12, 잔금 2026-01 수금 ──
    id: "proj-5",
    contract_number: "WDL-2025-002",
    project_name: "E기관 디자인시스템",
    client: "E공공기관",
    description: "디자인시스템 + 컴포넌트 라이브러리 구축",
    progress: 100,
    acquisition_channel: "입찰",
    invoice_issued: true,
    start_date: "2025-09-01",
    end_date: "2025-12-31",
    supply_amount: 50000000,
    vat_amount: 5000000,
    total_amount_num: 55000000,
    billing_initial: 16500000, billing_interim: 22000000, billing_final: 16500000,
    collected_initial: 16500000, collected_interim: 22000000, collected_final: 16500000,
    collected_amount: 55000000, remaining_amount: 0, collection_rate: 100,
    input_cost: 24000000, net_profit: 31000000, net_profit_rate: 56,
    team_members: ["김대표", "박개발", "이디자인", "최PM"],
    status: "정산완료", manager: "김대표", contract_date: "2025-08-20",
    total_amount: "5,500만원", paid_amount: "5,500만원", contract_amount: 55000000,
    payment_phases: [
      { label: "착수금", amount: 16500000, due_date: "2025-09-01", paid: true, paid_date: "2025-09-01" },
      { label: "중도금", amount: 22000000, due_date: "2025-11-15", paid: true, paid_date: "2025-11-14" },
      { label: "잔금", amount: 16500000, due_date: "2025-12-31", paid: true, paid_date: "2026-01-06" },
    ],
    total_settled: 55000000, total_expense: 24000000, profit_rate: 56.4,
  },
  {
    // ── 계약완료: 2026-04 ~ 2026-09, 미래 프로젝트 ──
    id: "proj-6",
    contract_number: "WDL-2026-004",
    project_name: "F사 이커머스 리뉴얼",
    client: "(주)에프커머스",
    description: "이커머스 플랫폼 전면 리뉴얼",
    progress: 0,
    acquisition_channel: "온라인",
    invoice_issued: false,
    start_date: "2026-04-01",
    end_date: "2026-09-30",
    supply_amount: 61818182,
    vat_amount: 6181818,
    total_amount_num: 68000000,
    billing_initial: 20400000, billing_interim: 27200000, billing_final: 20400000,
    collected_initial: 0, collected_interim: 0, collected_final: 0,
    collected_amount: 0, remaining_amount: 68000000, collection_rate: 0,
    input_cost: 0, net_profit: 0, net_profit_rate: 0,
    team_members: ["김대표"],
    status: "계약완료", manager: "김대표", contract_date: "2026-03-05",
    total_amount: "6,800만원", paid_amount: "0원", contract_amount: 68000000,
    payment_phases: [
      { label: "착수금", amount: 20400000, due_date: "2026-04-01", paid: false, paid_date: null },
      { label: "중도금", amount: 27200000, due_date: "2026-07-15", paid: false, paid_date: null },
      { label: "잔금", amount: 20400000, due_date: "2026-09-30", paid: false, paid_date: null },
    ],
    total_settled: 0, total_expense: 0, profit_rate: 0,
  },
];
