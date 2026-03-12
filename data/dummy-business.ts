// TODO: DB 연동 시 이 파일 삭제하고 Supabase로 교체

export const dummyBusinessInfo = {
  id: "dummy-1",
  company_name: "와이디랩",
  registration_number: "546-09-02884",
  address: "경기 화성시 동탄영천로 150 B동 12층 1210호",
  zipcode: "18462",
  opening_date: "2024-03-25",
  birth_date: "1994-06-30",
  founder_tags: ["7년 이내 스타트업", "청년 창업자"],
  business_scale: "5인 미만 소규모 사업장",
  updated_at: new Date().toISOString(),
};

export const dummyBusinessTypes = [
  { id: "bt-1", category: "서비스업", item: "광고대행업", sort_order: 1 },
  { id: "bt-2", category: "건설업", item: "도배,실내장식 및 내장 목공사업", sort_order: 2 },
  { id: "bt-3", category: "도소매", item: "전자상거래", sort_order: 3 },
  { id: "bt-4", category: "도소매", item: "구매대행업", sort_order: 4 },
  { id: "bt-5", category: "정보통신업", item: "응용소프트웨어 개발 및 공급업", sort_order: 5 },
  { id: "bt-6", category: "정보통신업", item: "컴퓨터 프로그래밍 서비스업", sort_order: 6 },
  { id: "bt-7", category: "전문, 과학 및 기술 서비스업", item: "시각디자인업", sort_order: 7 },
];

export const dummyPersonnel = [
  { id: "p-1", title: "대표자 1인", description: "한국디자인진흥원 : 멀티미디어 디자인 전문인력", status: "active", sort_order: 1 },
  { id: "p-2", title: "팀장 1인", description: "한국디자인진흥원 : 시각디자인 전문인력", status: "active", sort_order: 2 },
  { id: "p-3", title: "추가 1명", description: "곧 입사 예정", status: "planned", sort_order: 3 },
];

export const dummyCertificates = [
  { id: "c-1", issuer: "한국디자인진흥원", certificate_name: "산업디자인전문회사", details: "업종: 산업디자인 / 전문분야: 시각디자인", sort_order: 1 },
  { id: "c-2", issuer: "중소벤처기업부", certificate_name: "중소기업 확인서", details: "소기업(소상공인)", sort_order: 2 },
];

export const dummyDirectProductions = [
  { id: "dp-1", certificate_name: "직접생산업체 증명서", major_category: "편집디자인 그래픽 및 예술관련 서비스", minor_category: "아트디자인서비스", detail_item: "디자인 서비스", sort_order: 1 },
  { id: "dp-2", certificate_name: "직접생산업체 증명서", major_category: "공학연구 및 기술 기반 서비스", minor_category: "소프트웨어 유지 및 지원", detail_item: "소프트웨어 유지 및 지원 서비스", sort_order: 2 },
  { id: "dp-3", certificate_name: "영상 제작 직접생산업체", major_category: "", minor_category: "", detail_item: "", sort_order: 3 },
  { id: "dp-4", certificate_name: "기타행사대행업 직접생산업체", major_category: "", minor_category: "", detail_item: "", sort_order: 4 },
];

export const dummyNaraCodes = [
  { id: "n-1", name: "산업디자인전문회사", code: "4440", sort_order: 1 },
  { id: "n-2", name: "소프트웨어사업자", code: "1468", sort_order: 2 },
  { id: "n-3", name: "소프트웨어사업자", code: "1469", sort_order: 3 },
  { id: "n-4", name: "기타자유업(광고대행사)", code: "9902", sort_order: 4 },
];
