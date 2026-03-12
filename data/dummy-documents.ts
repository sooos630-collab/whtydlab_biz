// TODO: DB 연동 시 이 파일 삭제하고 Supabase로 교체

export const docCategories = [
  { key: "all", label: "전체" },
  { key: "registration", label: "사업자등록" },
  { key: "certification", label: "인증/확인서" },
  { key: "tax", label: "세무/회계" },
  { key: "insurance", label: "보험/4대보험" },
  { key: "finance", label: "통장/금융" },
  { key: "etc", label: "기타" },
];

export interface DocFile {
  id: string;
  name: string;
  category: string;
  file_type: "pdf" | "jpg" | "png";
  file_url: string;
  uploaded_at: string;
  expiry_date: string | null;
}

export const dummyDocuments: DocFile[] = [
  { id: "doc-7", name: "부가세 신고서 (2025 1기)", category: "tax", file_type: "pdf", file_url: "", uploaded_at: "2025-07-20", expiry_date: null },
  { id: "doc-10", name: "인감증명서", category: "etc", file_type: "pdf", file_url: "", uploaded_at: "2025-02-01", expiry_date: null },
  { id: "doc-8", name: "4대보험 가입증명서", category: "insurance", file_type: "pdf", file_url: "", uploaded_at: "2025-01-10", expiry_date: null },
  { id: "doc-5", name: "직접생산업체 증명서 (디자인)", category: "certification", file_type: "pdf", file_url: "", uploaded_at: "2024-06-01", expiry_date: null },
  { id: "doc-6", name: "직접생산업체 증명서 (SW)", category: "certification", file_type: "pdf", file_url: "", uploaded_at: "2024-06-01", expiry_date: null },
  { id: "doc-3", name: "중소기업 확인서", category: "certification", file_type: "pdf", file_url: "", uploaded_at: "2024-05-15", expiry_date: null },
  { id: "doc-2", name: "사업자등록증명원", category: "registration", file_type: "pdf", file_url: "", uploaded_at: "2024-04-10", expiry_date: null },
  { id: "doc-4", name: "산업디자인전문회사 등록증", category: "certification", file_type: "jpg", file_url: "", uploaded_at: "2024-03-28", expiry_date: null },
  { id: "doc-1", name: "사업자등록증", category: "registration", file_type: "pdf", file_url: "", uploaded_at: "2024-03-25", expiry_date: null },
  { id: "doc-9", name: "사업자 통장사본", category: "finance", file_type: "jpg", file_url: "", uploaded_at: "2024-03-25", expiry_date: null },
];
