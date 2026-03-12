// TODO: DB 연동 시 이 파일 삭제

export interface Customer {
  id: string;
  company: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  source: "홈페이지" | "소개" | "나라장터" | "SNS" | "기타";
  status: "상담중" | "견적발송" | "계약완료" | "보류" | "실패";
  first_contact_date: string;
  last_contact_date: string;
  expected_amount: number;
  memo: string;
}

export const dummyCustomers: Customer[] = [
  {
    id: "cust-001",
    company: "한국디자인진흥원",
    contact_name: "김지현",
    contact_email: "jhkim@kidp.or.kr",
    contact_phone: "02-1234-5678",
    source: "나라장터",
    status: "계약완료",
    first_contact_date: "2025-01-10",
    last_contact_date: "2025-02-15",
    expected_amount: 55000000,
    memo: "디자인 플랫폼 구축 프로젝트",
  },
  {
    id: "cust-002",
    company: "스타트업허브",
    contact_name: "이민수",
    contact_email: "mslee@startuphub.kr",
    contact_phone: "02-9876-5432",
    source: "소개",
    status: "상담중",
    first_contact_date: "2025-03-01",
    last_contact_date: "2025-03-10",
    expected_amount: 30000000,
    memo: "웹/앱 리뉴얼 상담 진행중",
  },
  {
    id: "cust-003",
    company: "푸드테크",
    contact_name: "박서연",
    contact_email: "sy@foodtech.io",
    contact_phone: "010-2222-3333",
    source: "홈페이지",
    status: "견적발송",
    first_contact_date: "2025-02-20",
    last_contact_date: "2025-03-05",
    expected_amount: 18000000,
    memo: "브랜딩 + 웹사이트 패키지",
  },
  {
    id: "cust-004",
    company: "메디컬AI",
    contact_name: "최동훈",
    contact_email: "dh@medicalai.co.kr",
    contact_phone: "02-5555-6666",
    source: "SNS",
    status: "보류",
    first_contact_date: "2024-12-05",
    last_contact_date: "2025-01-20",
    expected_amount: 45000000,
    memo: "예산 확보 후 재논의 예정",
  },
  {
    id: "cust-005",
    company: "그린에너지",
    contact_name: "정유진",
    contact_email: "yj@greenenergy.kr",
    contact_phone: "031-7777-8888",
    source: "나라장터",
    status: "상담중",
    first_contact_date: "2025-03-08",
    last_contact_date: "2025-03-11",
    expected_amount: 70000000,
    memo: "ESG 보고서 시스템 구축 문의",
  },
  {
    id: "cust-006",
    company: "블루오션마케팅",
    contact_name: "한승우",
    contact_email: "sw@blueocean.kr",
    contact_phone: "02-3333-4444",
    source: "소개",
    status: "실패",
    first_contact_date: "2025-01-15",
    last_contact_date: "2025-02-10",
    expected_amount: 12000000,
    memo: "예산 부족으로 무산",
  },
  {
    id: "cust-007",
    company: "에듀플러스",
    contact_name: "오수빈",
    contact_email: "sb@eduplus.com",
    contact_phone: "02-1111-2222",
    source: "홈페이지",
    status: "견적발송",
    first_contact_date: "2025-03-03",
    last_contact_date: "2025-03-09",
    expected_amount: 25000000,
    memo: "LMS 플랫폼 개발 견적 전달",
  },
];
