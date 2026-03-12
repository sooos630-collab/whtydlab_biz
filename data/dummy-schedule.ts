// TODO: DB 연동 시 이 파일 삭제

export interface ScheduleEvent {
  id: string;
  title: string;
  date: string;
  category: "계약" | "수금" | "급여" | "세금" | "정부사업" | "고객" | "고정비" | "기타";
  source: string;
  memo: string;
  done: boolean;
}

export const dummyScheduleEvents: ScheduleEvent[] = [
  // 3월
  { id: "ev-01", title: "A사 브랜딩 리뉴얼 착수", date: "2025-03-10", category: "계약", source: "프로젝트 계약", memo: "C사 모바일앱 UI 프로젝트 시작", done: true },
  { id: "ev-02", title: "ESG 보고서 시스템 상담", date: "2025-03-11", category: "고객", source: "CRM", memo: "그린에너지 - 시스템 구축 문의", done: true },
  { id: "ev-03", title: "3월 급여 지급", date: "2025-03-25", category: "급여", source: "월 급여관리", memo: "전 직원 3월 급여", done: false },
  { id: "ev-04", title: "AWS 결제", date: "2025-03-15", category: "고정비", source: "정기결제", memo: "월 89,000원", done: false },
  { id: "ev-05", title: "Figma 결제", date: "2025-03-15", category: "고정비", source: "정기결제", memo: "월 45,000원", done: false },
  { id: "ev-06", title: "사무실 임대료", date: "2025-03-01", category: "고정비", source: "정기결제", memo: "월 1,200,000원", done: true },
  { id: "ev-07", title: "에이컴퍼니 중도금 수금", date: "2025-03-31", category: "수금", source: "프로젝트 수금", memo: "A사 브랜딩 중도금 750만원", done: false },
  { id: "ev-08", title: "세금계산서 발행 - 에이컴퍼니", date: "2025-03-15", category: "세금", source: "세금계산서", memo: "공급가액 12,500,000원", done: true },
  { id: "ev-09", title: "디자인혁신역량강화사업 중간보고", date: "2025-03-30", category: "정부사업", source: "정부지원사업", memo: "1차 중간보고서 제출", done: false },
  { id: "ev-10", title: "창업성장기술개발사업 마감", date: "2025-04-10", category: "정부사업", source: "정부지원사업", memo: "사업계획서 제출 마감", done: false },
  // 4월
  { id: "ev-11", title: "ICT 이노베이션 협약 체결", date: "2025-04-01", category: "정부사업", source: "정부지원사업", memo: "정보통신산업진흥원 협약", done: false },
  { id: "ev-12", title: "4월 급여 지급", date: "2025-04-25", category: "급여", source: "월 급여관리", memo: "전 직원 4월 급여", done: false },
  { id: "ev-13", title: "박개발 외주계약 종료", date: "2025-06-30", category: "계약", source: "외주 계약", memo: "프론트엔드 개발 계약 만료", done: false },
  { id: "ev-14", title: "수출바우처사업 마감", date: "2025-04-05", category: "정부사업", source: "정부지원사업", memo: "KOTRA 수출바우처 신청 마감", done: false },
  { id: "ev-15", title: "B재단 잔금 수금 완료", date: "2025-02-28", category: "수금", source: "프로젝트 수금", memo: "B재단 홈페이지 잔금 1,140만원", done: true },
  { id: "ev-16", title: "에듀플러스 견적 회신 예정", date: "2025-03-20", category: "고객", source: "CRM", memo: "LMS 플랫폼 견적 피드백 대기", done: false },
  { id: "ev-17", title: "A사 브랜딩 납품", date: "2025-04-30", category: "계약", source: "프로젝트 계약", memo: "CI/BI + 홈페이지 최종 납품", done: false },
  { id: "ev-18", title: "사무실 임대료", date: "2025-04-01", category: "고정비", source: "정기결제", memo: "월 1,200,000원", done: false },
];
