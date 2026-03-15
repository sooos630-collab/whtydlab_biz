// TODO: DB 연동 시 이 파일 삭제

export interface AccountGroup {
  id: string;
  name: string;
  order: number;
}

export interface AccountInfo {
  id: string;
  group_id: string;
  platform: string;
  category: "이메일" | "클라우드" | "디자인" | "개발" | "마케팅" | "정부" | "금융" | "기타";
  login_id: string;
  password: string;
  url: string;
  memo: string;
}

export const dummyGroups: AccountGroup[] = [
  { id: "grp-01", name: "와이디랩", order: 0 },
  { id: "grp-02", name: "파인웍스", order: 1 },
  { id: "grp-03", name: "파인웍스팀", order: 2 },
  { id: "grp-04", name: "파인웍스협력사", order: 3 },
];

export const dummyAccounts: AccountInfo[] = [
  // ── 와이디랩 ──
  {
    id: "acc-001",
    group_id: "grp-01",
    platform: "나라장터",
    category: "정부",
    login_id: "whydlab",
    password: "••••••••",
    url: "https://www.g2b.go.kr",
    memo: "공인인증서 필요",
  },
  {
    id: "acc-002",
    group_id: "grp-01",
    platform: "Google Workspace",
    category: "이메일",
    login_id: "admin@whydlab.com",
    password: "••••••••",
    url: "https://admin.google.com",
    memo: "Business Standard 플랜",
  },
  {
    id: "acc-003",
    group_id: "grp-01",
    platform: "AWS",
    category: "클라우드",
    login_id: "whydlab-root",
    password: "••••••••",
    url: "https://aws.amazon.com",
    memo: "루트 계정, MFA 설정됨",
  },
  {
    id: "acc-004",
    group_id: "grp-01",
    platform: "Figma",
    category: "디자인",
    login_id: "design@whydlab.com",
    password: "••••••••",
    url: "https://www.figma.com",
    memo: "Organization 플랜",
  },
  {
    id: "acc-005",
    group_id: "grp-01",
    platform: "GitHub",
    category: "개발",
    login_id: "whydlab-org",
    password: "••••••••",
    url: "https://github.com",
    memo: "Team 플랜, SSO 연동",
  },
  {
    id: "acc-006",
    group_id: "grp-01",
    platform: "홈택스",
    category: "금융",
    login_id: "whydlab",
    password: "••••••••",
    url: "https://www.hometax.go.kr",
    memo: "세무사 연동 계정",
  },
  {
    id: "acc-007",
    group_id: "grp-01",
    platform: "국민은행 기업뱅킹",
    category: "금융",
    login_id: "whydlab_biz",
    password: "••••••••",
    url: "https://biz.kbstar.com",
    memo: "법인 계좌",
  },
  {
    id: "acc-008",
    group_id: "grp-01",
    platform: "Vercel",
    category: "개발",
    login_id: "whydlab",
    password: "••••••••",
    url: "https://vercel.com",
    memo: "Pro 플랜",
  },
  {
    id: "acc-009",
    group_id: "grp-01",
    platform: "Slack",
    category: "기타",
    login_id: "admin@whydlab.com",
    password: "••••••••",
    url: "https://whydlab.slack.com",
    memo: "Pro 플랜",
  },
  {
    id: "acc-010",
    group_id: "grp-01",
    platform: "Instagram (비즈니스)",
    category: "마케팅",
    login_id: "whydlab_official",
    password: "••••••••",
    url: "https://www.instagram.com",
    memo: "비즈니스 계정",
  },
  // ── 파인웍스 ──
  {
    id: "acc-011",
    group_id: "grp-02",
    platform: "Google Workspace",
    category: "이메일",
    login_id: "admin@fineworks.co.kr",
    password: "••••••••",
    url: "https://admin.google.com",
    memo: "법인 대표 메일",
  },
  {
    id: "acc-012",
    group_id: "grp-02",
    platform: "홈택스",
    category: "금융",
    login_id: "fineworks",
    password: "••••••••",
    url: "https://www.hometax.go.kr",
    memo: "법인 세무",
  },
  {
    id: "acc-013",
    group_id: "grp-02",
    platform: "나라장터",
    category: "정부",
    login_id: "fineworks",
    password: "••••••••",
    url: "https://www.g2b.go.kr",
    memo: "",
  },
  // ── 파인웍스팀 ──
  {
    id: "acc-014",
    group_id: "grp-03",
    platform: "Jira",
    category: "개발",
    login_id: "team@fineworks.co.kr",
    password: "••••••••",
    url: "https://fineworks.atlassian.net",
    memo: "팀 프로젝트 관리",
  },
  {
    id: "acc-015",
    group_id: "grp-03",
    platform: "Notion",
    category: "기타",
    login_id: "team@fineworks.co.kr",
    password: "••••••••",
    url: "https://www.notion.so",
    memo: "팀 위키",
  },
  // ── 파인웍스협력사 ──
  {
    id: "acc-016",
    group_id: "grp-04",
    platform: "AWS (협력사)",
    category: "클라우드",
    login_id: "partner-admin",
    password: "••••••••",
    url: "https://aws.amazon.com",
    memo: "협력사 전용 계정",
  },
  {
    id: "acc-017",
    group_id: "grp-04",
    platform: "GitHub (협력사)",
    category: "개발",
    login_id: "fineworks-partner",
    password: "••••••••",
    url: "https://github.com",
    memo: "외부 협력 레포",
  },
];
