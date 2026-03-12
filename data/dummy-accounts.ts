// TODO: DB 연동 시 이 파일 삭제

export interface AccountInfo {
  id: string;
  platform: string;
  category: "이메일" | "클라우드" | "디자인" | "개발" | "마케팅" | "정부" | "금융" | "기타";
  login_id: string;
  password: string;
  url: string;
  manager: string;
  memo: string;
}

export const dummyAccounts: AccountInfo[] = [
  {
    id: "acc-001",
    platform: "나라장터",
    category: "정부",
    login_id: "whydlab",
    password: "••••••••",
    url: "https://www.g2b.go.kr",
    manager: "김대표",
    memo: "공인인증서 필요",
  },
  {
    id: "acc-002",
    platform: "Google Workspace",
    category: "이메일",
    login_id: "admin@whydlab.com",
    password: "••••••••",
    url: "https://admin.google.com",
    manager: "김대표",
    memo: "Business Standard 플랜",
  },
  {
    id: "acc-003",
    platform: "AWS",
    category: "클라우드",
    login_id: "whydlab-root",
    password: "••••••••",
    url: "https://aws.amazon.com",
    manager: "이팀장",
    memo: "루트 계정, MFA 설정됨",
  },
  {
    id: "acc-004",
    platform: "Figma",
    category: "디자인",
    login_id: "design@whydlab.com",
    password: "••••••••",
    url: "https://www.figma.com",
    manager: "박디자이너",
    memo: "Organization 플랜",
  },
  {
    id: "acc-005",
    platform: "GitHub",
    category: "개발",
    login_id: "whydlab-org",
    password: "••••••••",
    url: "https://github.com",
    manager: "이팀장",
    memo: "Team 플랜, SSO 연동",
  },
  {
    id: "acc-006",
    platform: "Slack",
    category: "기타",
    login_id: "admin@whydlab.com",
    password: "••••••••",
    url: "https://whydlab.slack.com",
    manager: "김대표",
    memo: "Pro 플랜",
  },
  {
    id: "acc-007",
    platform: "홈택스",
    category: "금융",
    login_id: "whydlab",
    password: "••••••••",
    url: "https://www.hometax.go.kr",
    manager: "김대표",
    memo: "세무사 연동 계정",
  },
  {
    id: "acc-008",
    platform: "국민은행 기업뱅킹",
    category: "금융",
    login_id: "whydlab_biz",
    password: "••••••••",
    url: "https://biz.kbstar.com",
    manager: "김대표",
    memo: "법인 계좌",
  },
  {
    id: "acc-009",
    platform: "Vercel",
    category: "개발",
    login_id: "whydlab",
    password: "••••••••",
    url: "https://vercel.com",
    manager: "이팀장",
    memo: "Pro 플랜",
  },
  {
    id: "acc-010",
    platform: "Instagram (비즈니스)",
    category: "마케팅",
    login_id: "whydlab_official",
    password: "••••••••",
    url: "https://www.instagram.com",
    manager: "박매니저",
    memo: "비즈니스 계정",
  },
];
