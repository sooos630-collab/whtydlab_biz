// TODO: DB 연동 시 이 파일 삭제

export interface GovProject {
  id: string;
  name: string;
  agency: string;
  category: "R&D" | "사업화" | "인력" | "수출" | "기타";
  status: "공고확인" | "준비중" | "신청완료" | "선정" | "탈락" | "수행중" | "완료";
  announcement_date: string;
  deadline: string;
  amount: number;
  period: string;
  manager: string;
  memo: string;
}

export const dummyGovProjects: GovProject[] = [
  {
    id: "gov-001",
    name: "2025 디자인혁신역량강화사업",
    agency: "한국디자인진흥원",
    category: "사업화",
    status: "수행중",
    announcement_date: "2025-01-15",
    deadline: "2025-02-15",
    amount: 100000000,
    period: "2025.03 ~ 2025.12",
    manager: "김대표",
    memo: "1차 중간보고 4월 예정",
  },
  {
    id: "gov-002",
    name: "ICT 이노베이션 스퀘어",
    agency: "정보통신산업진흥원",
    category: "인력",
    status: "선정",
    announcement_date: "2025-02-01",
    deadline: "2025-03-01",
    amount: 50000000,
    period: "2025.04 ~ 2025.10",
    manager: "이팀장",
    memo: "협약 체결 진행중",
  },
  {
    id: "gov-003",
    name: "창업성장기술개발사업(디딤돌)",
    agency: "중소벤처기업부",
    category: "R&D",
    status: "준비중",
    announcement_date: "2025-03-10",
    deadline: "2025-04-10",
    amount: 200000000,
    period: "2025.06 ~ 2026.05",
    manager: "김대표",
    memo: "사업계획서 작성중",
  },
  {
    id: "gov-004",
    name: "수출바우처사업",
    agency: "KOTRA",
    category: "수출",
    status: "공고확인",
    announcement_date: "2025-03-05",
    deadline: "2025-04-05",
    amount: 30000000,
    period: "2025.05 ~ 2025.12",
    manager: "박매니저",
    memo: "해외 전시회 참가 용도",
  },
  {
    id: "gov-005",
    name: "2024 SW고성장클럽200",
    agency: "정보통신산업진흥원",
    category: "사업화",
    status: "완료",
    announcement_date: "2024-04-01",
    deadline: "2024-05-01",
    amount: 80000000,
    period: "2024.06 ~ 2024.12",
    manager: "김대표",
    memo: "최종보고 완료, 정산 마감",
  },
  {
    id: "gov-006",
    name: "2024 창업도약패키지",
    agency: "창업진흥원",
    category: "사업화",
    status: "탈락",
    announcement_date: "2024-06-01",
    deadline: "2024-07-01",
    amount: 150000000,
    period: "-",
    manager: "김대표",
    memo: "평가 점수 미달",
  },
];
