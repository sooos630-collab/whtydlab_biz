import Head from "next/head";
import { useState, useCallback, useRef } from "react";
import s from "@/styles/Contracts.module.css";
import g from "@/styles/GovernmentProposal.module.css";
import {
  type CompanyInfo,
  type UploadedFile,
  type EligibilityAnalysis,
  type TemplateSection,
  type GeneratedSection,
  type ProposalProject,
  defaultCompanyInfo,
  dummyProposalProjects,
  mockEligibilityAnalysis,
} from "@/data/dummy-government-proposal";
import {
  dummyBusinessInfo,
  dummyBusinessTypes,
  dummyCertificates,
  dummyDirectProductions,
  dummyPersonnel,
  dummyExtraInfo,
  dummyNaraCodes,
} from "@/data/dummy-business";

// 사업자 기본정보 → CompanyInfo 변환 (비고 포함 전체 불러오기)
function loadCompanyFromBusiness(): CompanyInfo {
  const biz = dummyBusinessInfo;
  const types = dummyBusinessTypes;
  const certs = dummyCertificates;
  const personnel = dummyPersonnel;

  const openDate = new Date(biz.opening_date);
  const years = Math.max(0, new Date().getFullYear() - openDate.getFullYear());
  const industry = types.length > 0 ? types[0].category : "";
  const subIndustry = types.map((t) => `${t.category}: ${t.item}`).join(", ");
  const certNames = certs.map((c) => `${c.certificate_name} (${c.issuer}, ${c.details})`).join(", ");
  const activeCount = personnel.filter((p) => p.status === "active").length;
  const capabilities = [
    ...types.map((t) => t.item),
    ...dummyDirectProductions.map((d) => d.certificate_name),
  ].filter(Boolean).join(", ");

  // 인력 상세 (직급, 역할, 자격 등)
  const personnelDetails = personnel
    .map((p) => `${p.title} - ${p.description} (${p.status === "active" ? "재직" : "예정"})`)
    .join("; ");

  // 직접생산업체 증명
  const directProductions = dummyDirectProductions
    .map((d) => [d.certificate_name, d.major_category, d.minor_category, d.detail_item].filter(Boolean).join(" > "))
    .join("; ");

  // 나라장터 업종코드
  const naraCodes = dummyNaraCodes
    .map((n) => `${n.name} (${n.code})`)
    .join(", ");

  // 기타 정보 (연락처, 홈페이지, 거래은행 등)
  const extraInfo = dummyExtraInfo
    .map((e) => `${e.label}: ${e.value}`)
    .join(", ");

  return {
    name: biz.company_name,
    representative: "", // TODO: 사업자 기본정보에 대표자명 필드 추가 필요
    businessNumber: biz.registration_number,
    industry,
    subIndustry,
    yearsInBusiness: years,
    employeeCount: activeCount,
    annualRevenue: 0, // TODO: 재무정보에서 불러오기
    businessType: biz.business_scale.includes("법인") ? "법인" : "개인",
    address: biz.address,
    capabilities,
    certifications: certNames,
    founderTags: biz.founder_tags.join(", "),
    personnelDetails,
    directProductions,
    naraCodes,
    extraInfo,
    memo: biz.memo || "",
  };
}

const proposalStatusBadge = (status: ProposalProject["status"]) => {
  switch (status) {
    case "작성중": return s.badgeBlue;
    case "분석완료": return s.badgeOrange;
    case "계획서생성": return s.badgeGreen;
    case "제출완료": return s.badgeGray;
    default: return s.badgeGray;
  }
};

const STEPS = [
  { num: 1, label: "프로젝트 생성" },
  { num: 2, label: "기업 정보" },
  { num: 3, label: "자료 업로드" },
  { num: 4, label: "지원 가능성 분석" },
  { num: 5, label: "양식 구조 분석" },
  { num: 6, label: "사업 아이디어" },
  { num: 7, label: "사업계획서 생성" },
];

type ViewMode = "list" | "wizard";

export default function ProposalPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [proposals, setProposals] = useState<ProposalProject[]>(() => {
    if (typeof window === "undefined") return dummyProposalProjects;
    const saved = localStorage.getItem("proposal_projects");
    return saved ? JSON.parse(saved) : dummyProposalProjects;
  });
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Wizard state
  const [step, setStep] = useState(1);

  // Step 1: URL로 공고 정보 자동 분석
  const [announcementUrl, setAnnouncementUrl] = useState("");
  const [urlAnalyzing, setUrlAnalyzing] = useState(false);
  const [urlAnalyzed, setUrlAnalyzed] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [targetProgram, setTargetProgram] = useState("");
  interface UrlAnalysisResult {
    agency: string;
    category: string;
    deadline: string;
    amount: string;
    period: string;
    overview: string;
    eligibility: string[];
    ineligibility: string[];
    supportDetails: { category: string; items: string[] }[];
    requiredDocs: string[];
    schedule: { date: string; content: string }[];
    evaluationCriteria: { item: string; weight: string }[];
    contactInfo: string;
  }
  const [urlMeta, setUrlMeta] = useState<UrlAnalysisResult | null>(null);

  // Step 2: 사업자 기본정보에서 자동 불러오기
  const [company, setCompany] = useState<CompanyInfo>(() => loadCompanyFromBusiness());
  const [companyLoaded, setCompanyLoaded] = useState(true);

  const reloadCompany = () => {
    setCompany(loadCompanyFromBusiness());
    setCompanyLoaded(true);
  };

  // Step 3
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [fileObjects, setFileObjects] = useState<Map<string, File>>(new Map()); // 실제 File 객체 보관

  // Step 4
  const [analysis, setAnalysis] = useState<EligibilityAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Step 5
  const [template, setTemplate] = useState<TemplateSection[]>([]);
  const [analyzingTemplate, setAnalyzingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [templateSkipped, setTemplateSkipped] = useState<string[]>([]);

  // Step 6
  const [businessIdea, setBusinessIdea] = useState("");

  // Step 6: 기존 사업계획서 참고자료
  interface RefDocument {
    id: string;
    name: string;
    size: string;
    analyzedAt: string | null;
    fullContent: string | null;
  }
  const [refDocs, setRefDocs] = useState<RefDocument[]>([]);
  const [analyzingRef, setAnalyzingRef] = useState<string | null>(null);
  const [refDocError, setRefDocError] = useState<string | null>(null);
  const [refDocFileObjects] = useState<Map<string, File>>(() => new Map());
  const refDocInputRef = useRef<HTMLInputElement>(null);

  // Step 6: 우수사례 레퍼런스
  interface BestPractice {
    id: string;
    name: string;
    size: string;
    analyzedAt: string | null;
    fullContent: string | null;
    analysis: {
      strengths: string[];
      structure: string;
      expressions: string[];
      score: string;
    } | null;
  }
  const [bestPractices, setBestPractices] = useState<BestPractice[]>([]);
  const [analyzingBP, setAnalyzingBP] = useState<string | null>(null);
  const [bpError, setBpError] = useState<string | null>(null);
  const [bpFileObjects] = useState<Map<string, File>>(() => new Map());
  const bpInputRef = useRef<HTMLInputElement>(null);

  // Step 7
  const [plan, setPlan] = useState<GeneratedSection[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState<{ current: number; total: number; sectionTitle: string } | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const cancelRef = useRef(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);

  // 버전 관리
  interface PlanVersion {
    id: string;
    label: string;
    createdAt: string;
    sectionCount: number;
    sections: GeneratedSection[];
  }
  const [planVersions, setPlanVersions] = useState<PlanVersion[]>([]);
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  // 임시저장
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const SAVE_KEY = "proposal_draft";

  const MAX_SAVE_CONTENT = 50000;
  const trimForSave = (text: string | null) => text && text.length > MAX_SAVE_CONTENT ? text.slice(0, MAX_SAVE_CONTENT) : text;

  const saveDraft = () => {
    // fullContent 트림하여 localStorage 용량 초과 방지
    const savedRefDocs = refDocs.map(d => ({ ...d, fullContent: trimForSave(d.fullContent) }));
    const savedBP = bestPractices.map(d => ({ ...d, fullContent: trimForSave(d.fullContent) }));

    const draft = {
      step,
      announcementUrl,
      urlAnalyzed,
      projectName,
      targetProgram,
      urlMeta,
      company,
      companyLoaded,
      files, // 메타만 저장 (File 객체는 직렬화 불가)
      analysis,
      template,
      businessIdea,
      refDocs: savedRefDocs,
      bestPractices: savedBP,
      plan,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(draft));

    // 프로젝트 리스트에 upsert
    const id = currentProjectId || "proj-" + Date.now();
    if (!currentProjectId) setCurrentProjectId(id);

    const proj: ProposalProject = {
      id,
      name: projectName || "새 사업계획서",
      targetProgram: targetProgram || "",
      status: plan.length > 0 ? "계획서생성" : "작성중",
      currentStep: step,
      createdAt: new Date().toISOString().split("T")[0],
      companyInfo: company,
      uploadedFiles: files,
      eligibilityAnalysis: analysis,
      templateStructure: template,
      businessIdea,
      generatedPlan: plan,
    };

    setProposals(prev => {
      const idx = prev.findIndex(p => p.id === id);
      const next = idx >= 0 ? [...prev.slice(0, idx), proj, ...prev.slice(idx + 1)] : [proj, ...prev];
      localStorage.setItem("proposal_projects", JSON.stringify(next));
      return next;
    });

    setSaveMessage("임시저장 완료 (" + new Date().toLocaleTimeString("ko-KR") + ")");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const loadDraft = () => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const draft = JSON.parse(raw);
      setStep(draft.step || 1);
      setAnnouncementUrl(draft.announcementUrl || "");
      setUrlAnalyzed(draft.urlAnalyzed || false);
      setProjectName(draft.projectName || "");
      setTargetProgram(draft.targetProgram || "");
      setUrlMeta(draft.urlMeta || null);
      setCompany(draft.company || loadCompanyFromBusiness());
      setCompanyLoaded(draft.companyLoaded ?? true);
      setFiles(draft.files || []);
      setAnalysis(draft.analysis || null);
      setTemplate(draft.template || []);
      setBusinessIdea(draft.businessIdea || "");
      setRefDocs(draft.refDocs || []);
      setBestPractices(draft.bestPractices || []);
      setPlan(draft.plan || []);
      if (draft.plan?.length > 0) setOpenSections(new Set(["1"]));
      setView("wizard");
      return true;
    } catch {
      return false;
    }
  };

  const hasDraft = typeof window !== "undefined" && !!localStorage.getItem(SAVE_KEY);

  const clearDraft = () => {
    localStorage.removeItem(SAVE_KEY);
  };

  const startNewProposal = () => {
    clearDraft();
    setCurrentProjectId(null);
    setStep(1);
    setAnnouncementUrl("");
    setUrlAnalyzing(false);
    setUrlAnalyzed(false);
    setProjectName("");
    setTargetProgram("");
    setUrlMeta(null);
    setCompany(loadCompanyFromBusiness());
    setCompanyLoaded(true);
    setFiles([]);
    setFileObjects(new Map());
    setAnalysis(null);
    setTemplate([]);
    setBusinessIdea("");
    setRefDocs([]);
    setBestPractices([]);
    setPlan([]);
    setView("wizard");
  };

  const openProposal = (p: ProposalProject) => {
    setCurrentProjectId(p.id);
    setStep(p.currentStep);
    setProjectName(p.name);
    setTargetProgram(p.targetProgram);
    setCompany(p.companyInfo);
    setCompanyLoaded(true);
    setFiles(p.uploadedFiles);
    setAnalysis(p.eligibilityAnalysis);
    setTemplate(p.templateStructure);
    setBusinessIdea(p.businessIdea);
    setPlan(p.generatedPlan);
    if (p.generatedPlan.length > 0) setOpenSections(new Set(["1"]));
    setView("wizard");
  };

  const updateCompany = useCallback((field: keyof CompanyInfo, value: string | number) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFileType, setPendingFileType] = useState<UploadedFile["type"]>("기타");

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + "B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
    return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  };

  const triggerFileInput = (type: UploadedFile["type"]) => {
    setPendingFileType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    const newEntries: { meta: UploadedFile; file: File }[] = Array.from(selectedFiles).map((file) => {
      const id = "f-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      return {
        meta: { id, name: file.name, type: pendingFileType, size: formatFileSize(file.size), uploadedAt: new Date().toISOString().split("T")[0] },
        file,
      };
    });
    setFiles((prev) => [...prev, ...newEntries.map((e) => e.meta)]);
    setFileObjects((prev) => {
      const next = new Map(prev);
      newEntries.forEach((e) => next.set(e.meta.id, e.file));
      return next;
    });
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles.length) return;
    const newEntries: { meta: UploadedFile; file: File }[] = Array.from(droppedFiles).map((file) => {
      const id = "f-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      return {
        meta: { id, name: file.name, type: "기타" as const, size: formatFileSize(file.size), uploadedAt: new Date().toISOString().split("T")[0] },
        file,
      };
    });
    setFiles((prev) => [...prev, ...newEntries.map((e) => e.meta)]);
    setFileObjects((prev) => {
      const next = new Map(prev);
      newEntries.forEach((e) => next.set(e.meta.id, e.file));
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const [urlError, setUrlError] = useState<string | null>(null);

  const analyzeUrl = async () => {
    if (!announcementUrl.trim()) return;
    setUrlAnalyzing(true);
    setUrlError(null);

    try {
      const res = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: announcementUrl.trim() }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`서버 오류 (${res.status})`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "분석에 실패했습니다");
      }

      const d = json.data;

      setProjectName(d.programName || "");
      setTargetProgram(d.programName || "");
      setUrlMeta({
        agency: d.agency || "",
        category: d.category || "기타",
        deadline: d.deadline || "",
        amount: d.amount || "",
        period: d.period || "",
        overview: d.overview || "",
        eligibility: d.eligibility || [],
        ineligibility: d.ineligibility || [],
        supportDetails: d.supportDetails || [],
        requiredDocs: d.requiredDocs || [],
        schedule: d.schedule || [],
        evaluationCriteria: d.evaluationCriteria || [],
        contactInfo: d.contactInfo || "",
      });
      setUrlAnalyzed(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";
      setUrlError(message);
    } finally {
      setUrlAnalyzing(false);
    }
  };

  const resetUrl = () => {
    setAnnouncementUrl("");
    setUrlAnalyzed(false);
    setUrlError(null);
    setProjectName("");
    setTargetProgram("");
    setUrlMeta(null);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setFileObjects((prev) => { const next = new Map(prev); next.delete(id); return next; });
  };

  const addRefDoc = () => {
    refDocInputRef.current?.click();
  };

  const handleRefDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = "ref-" + Date.now() + "-" + i;
      refDocFileObjects.set(id, file);
      setRefDocs((prev) => [...prev, {
        id,
        name: file.name,
        size: formatFileSize(file.size),
        analyzedAt: null,
        fullContent: null,
      }]);
    }
    e.target.value = "";
  };

  const analyzeRefDoc = async (id: string) => {
    const file = refDocFileObjects.get(id);
    if (!file) {
      setRefDocError("파일을 찾을 수 없습니다. 다시 첨부해주세요.");
      return;
    }
    setAnalyzingRef(id);
    setRefDocError(null);
    try {
      const fd = new FormData();
      fd.append("mode", "refDoc");
      fd.append("files", file, file.name);
      const res = await fetch("/api/analyze-document", { method: "POST", body: fd });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`서버 오류 (${res.status}). 개발 서버를 재시작해주세요.`);
      }
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "분석 실패");
      setRefDocs((prev) => prev.map((d) =>
        d.id === id ? {
          ...d,
          analyzedAt: new Date().toISOString().split("T")[0],
          fullContent: json.data.fullContent || null,
        } : d
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setRefDocError(msg);
    } finally {
      setAnalyzingRef(null);
    }
  };

  const removeRefDoc = (id: string) => {
    refDocFileObjects.delete(id);
    setRefDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const addBestPractice = () => {
    bpInputRef.current?.click();
  };

  const handleBPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const id = "bp-" + Date.now() + "-" + i;
      bpFileObjects.set(id, file);
      setBestPractices((prev) => [...prev, {
        id,
        name: file.name,
        size: formatFileSize(file.size),
        analyzedAt: null,
        fullContent: null,
        analysis: null,
      }]);
    }
    e.target.value = "";
  };

  const analyzeBestPractice = async (id: string) => {
    const file = bpFileObjects.get(id);
    if (!file) {
      setBpError("파일을 찾을 수 없습니다. 다시 첨부해주세요.");
      return;
    }
    setAnalyzingBP(id);
    setBpError(null);
    try {
      const fd = new FormData();
      fd.append("mode", "bestPractice");
      fd.append("files", file, file.name);
      const res = await fetch("/api/analyze-document", { method: "POST", body: fd });
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`서버 오류 (${res.status}). 개발 서버를 재시작해주세요.`);
      }
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "분석 실패");
      setBestPractices((prev) => prev.map((d) =>
        d.id === id ? {
          ...d,
          analyzedAt: new Date().toISOString().split("T")[0],
          fullContent: json.data.fullContent || null,
          analysis: {
            strengths: json.data.strengths || [],
            structure: json.data.structure || "",
            expressions: json.data.expressions || [],
            score: json.data.score || "",
          },
        } : d
      ));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setBpError(msg);
    } finally {
      setAnalyzingBP(null);
    }
  };

  const removeBestPractice = (id: string) => {
    bpFileObjects.delete(id);
    setBestPractices((prev) => prev.filter((d) => d.id !== id));
  };

  // 업로드된 파일들을 FormData에 추가하는 헬퍼
  const appendFilesToFormData = (fd: FormData) => {
    for (const [id, file] of fileObjects.entries()) {
      // 파일 메타에서 유형 확인
      const meta = files.find((f) => f.id === id);
      fd.append("files", file, meta?.name || file.name);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("company", JSON.stringify(company));
      fd.append("urlMeta", JSON.stringify(urlMeta));
      appendFilesToFormData(fd);

      const res = await fetch("/api/analyze-eligibility", { method: "POST", body: fd });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`서버 오류 (${res.status})`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "분석 실패");
      setAnalysis(json.data);
    } catch {
      setAnalysis(mockEligibilityAnalysis);
    } finally {
      setAnalyzing(false);
    }
  };

  // 사업계획서양식 파일만 필터
  const templateFiles = files.filter((f) => f.type === "사업계획서양식");
  const hasTemplateFiles = templateFiles.some((f) => fileObjects.has(f.id));

  const runTemplateAnalysis = async () => {
    if (!hasTemplateFiles) return;
    setAnalyzingTemplate(true);
    setTemplateError(null);
    setTemplateSkipped([]);
    try {
      const fd = new FormData();
      fd.append("programName", targetProgram);
      fd.append("category", urlMeta?.category || "");
      fd.append("urlMeta", JSON.stringify(urlMeta));
      // 사업계획서양식 파일만 전송
      for (const tf of templateFiles) {
        const file = fileObjects.get(tf.id);
        if (file) fd.append("files", file, tf.name);
      }

      const res = await fetch("/api/analyze-template", { method: "POST", body: fd });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error(`서버 오류 (${res.status})`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "분석 실패");
      setTemplate(json.data);
      if (json.skippedFiles) setTemplateSkipped(json.skippedFiles);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setTemplateError(msg);
    } finally {
      setAnalyzingTemplate(false);
    }
  };

  const callGenerateSection = async (
    section: typeof template[0],
    allSecs: { number: string; title: string }[],
    prevResults: GeneratedSection[],
    refContents: { fullContent: string | null }[],
    bpContents: Record<string, unknown>[],
  ): Promise<GeneratedSection> => {
    const fd = new FormData();
    fd.append("company", JSON.stringify(company));
    fd.append("urlMeta", JSON.stringify(urlMeta));
    fd.append("businessIdea", businessIdea);
    fd.append("refDocsContents", JSON.stringify(refContents));
    fd.append("bestPracticeContents", JSON.stringify(bpContents));
    fd.append("currentSection", JSON.stringify(section));
    fd.append("allSections", JSON.stringify(allSecs));
    fd.append("previousSections", JSON.stringify(prevResults.map(r => ({ number: r.number, title: r.title, content: r.content }))));
    appendFilesToFormData(fd);

    const res = await fetch("/api/generate-plan", { method: "POST", body: fd });
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`서버 오류 (${res.status})`);
    }
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || "생성 실패");
    return {
      number: json.data.number || section.number,
      title: json.data.title || section.title,
      content: json.data.content || "",
    };
  };

  const saveVersion = (sections: GeneratedSection[]) => {
    const versionNum = planVersions.length + 1;
    const newVersion: PlanVersion = {
      id: "v-" + Date.now(),
      label: `v${versionNum}`,
      createdAt: new Date().toLocaleString("ko-KR"),
      sectionCount: sections.length,
      sections: JSON.parse(JSON.stringify(sections)),
    };
    setPlanVersions(prev => [newVersion, ...prev]);
    setActiveVersionId(newVersion.id);
  };

  const loadVersion = (versionId: string) => {
    const version = planVersions.find(v => v.id === versionId);
    if (version) {
      setPlan(JSON.parse(JSON.stringify(version.sections)));
      setActiveVersionId(versionId);
      setOpenSections(new Set());
    }
  };

  const generatePlan = async () => {
    cancelRef.current = false;
    setGenerating(true);
    setGenerateError(null);
    setPlan([]);
    setGeneratingProgress(null);

    const refContents = refDocs.filter(d => d.fullContent).map(d => ({
      fullContent: d.fullContent,
    }));
    const bpContents = bestPractices.filter(d => d.fullContent).map(d => ({
      fullContent: d.fullContent,
      ...(d.analysis || {}),
    }));

    const allSecs = template.map(t => ({ number: t.number, title: t.title }));
    const results: GeneratedSection[] = [];

    for (let i = 0; i < template.length; i++) {
      if (cancelRef.current) break;

      const section = template[i];
      setGeneratingProgress({ current: i + 1, total: template.length, sectionTitle: `${section.number}. ${section.title}` });

      try {
        const generated = await callGenerateSection(section, allSecs, results, refContents, bpContents);
        if (cancelRef.current) break;
        results.push(generated);
        setPlan([...results]);
        setOpenSections(prev => new Set([...prev, generated.number]));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "알 수 없는 오류";
        results.push({
          number: section.number,
          title: section.title,
          content: `⚠️ 이 섹션 생성에 실패했습니다: ${msg}\n\n섹션 재생성 버튼을 눌러 다시 시도해주세요.`,
        });
        setPlan([...results]);
      }
    }

    if (results.length > 0) {
      saveVersion(results);
    }

    setGeneratingProgress(null);
    setGenerating(false);
    cancelRef.current = false;
  };

  const cancelGeneration = () => {
    cancelRef.current = true;
  };

  const regenerateSection = async (sectionNumber: string) => {
    const sectionTemplate = template.find(t => t.number === sectionNumber);
    if (!sectionTemplate) return;

    setRegeneratingSection(sectionNumber);
    const refContents = refDocs.filter(d => d.fullContent).map(d => ({ fullContent: d.fullContent }));
    const bpContents = bestPractices.filter(d => d.fullContent).map(d => ({ fullContent: d.fullContent, ...(d.analysis || {}) }));
    const allSecs = template.map(t => ({ number: t.number, title: t.title }));
    const prevResults = plan.filter(p => {
      const pIdx = template.findIndex(t => t.number === p.number);
      const curIdx = template.findIndex(t => t.number === sectionNumber);
      return pIdx < curIdx;
    });

    try {
      const generated = await callGenerateSection(sectionTemplate, allSecs, prevResults, refContents, bpContents);
      setPlan(prev => prev.map(sec => sec.number === sectionNumber ? generated : sec));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setGenerateError(`섹션 ${sectionNumber} 재생성 실패: ${msg}`);
    } finally {
      setRegeneratingSection(null);
    }
  };

  const saveEdit = (sectionNumber: string) => {
    setPlan(prev => prev.map(sec =>
      sec.number === sectionNumber ? { ...sec, content: editContent } : sec
    ));
    setEditingSection(null);
  };

  const toggleSection = (num: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const canNext = () => {
    switch (step) {
      case 1: return urlAnalyzed && projectName.trim().length > 0;
      case 2: return company.name.trim().length > 0;
      case 3: return files.length > 0;
      case 4: return analysis !== null;
      case 5: return template.length > 0;
      case 6: return businessIdea.trim().length > 0;
      default: return true;
    }
  };

  const goStep = (target: number) => {
    if (target >= 1 && target <= 7 && target <= step + 1) setStep(target);
  };

  // Simple markdown-to-HTML (tables, bold, headers, lists)
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const html: string[] = [];
    let inTable = false;
    let inList = false;
    let listType = "";

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Table
      if (line.startsWith("|")) {
        if (!inTable) { html.push("<table>"); inTable = true; }
        if (line.includes("---")) continue;
        const cells = line.split("|").filter(Boolean).map((c) => c.trim());
        const tag = !html.join("").includes("</tr>") ? "th" : "td";
        html.push("<tr>" + cells.map((c) => `<${tag}>${c}</${tag}>`).join("") + "</tr>");
        continue;
      } else if (inTable) {
        html.push("</table>");
        inTable = false;
      }

      // List
      if (line.match(/^- /)) {
        if (!inList || listType !== "ul") {
          if (inList) html.push(`</${listType}>`);
          html.push("<ul>"); inList = true; listType = "ul";
        }
        html.push(`<li>${line.slice(2).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</li>`);
        continue;
      } else if (line.match(/^\d+\. /)) {
        if (!inList || listType !== "ol") {
          if (inList) html.push(`</${listType}>`);
          html.push("<ol>"); inList = true; listType = "ol";
        }
        html.push(`<li>${line.replace(/^\d+\. /, "").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")}</li>`);
        continue;
      } else if (inList) {
        html.push(`</${listType}>`);
        inList = false;
      }

      // Headers
      if (line.startsWith("## ")) {
        html.push(`<h2>${line.slice(3)}</h2>`);
        continue;
      }

      // Bold + paragraph
      if (line.trim()) {
        line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        html.push(`<p>${line}</p>`);
      }
    }
    if (inTable) html.push("</table>");
    if (inList) html.push(`</${listType}>`);

    return html.join("\n");
  };

  return (
    <>
      <Head><title>사업계획서작성 - WHYDLAB BIZ</title></Head>

      {/* ===== List View ===== */}
      {view === "list" && (
        <div className={s.page}>
          <div className={s.pageHeader}>
            <h1>사업계획서작성</h1>
            <div style={{ display: "flex", gap: 6 }}>
              {hasDraft && (
                <button className={`${s.btn} ${s.btnSmall}`} onClick={loadDraft}>
                  임시저장 불러오기
                </button>
              )}
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={startNewProposal}>
                + 새로 작성
              </button>
            </div>
          </div>

          <div className={s.section}>
            {proposals.length === 0 ? (
              <div className={g.emptyState}>
                <div className={g.emptyIcon}>📋</div>
                <div className={g.emptyTitle}>아직 작성중인 사업계획서가 없습니다</div>
                <div className={g.emptyDesc}>새로 작성 버튼을 눌러 AI 사업계획서 프로젝트를 시작하세요</div>
                <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={startNewProposal}>
                  + 새로 작성
                </button>
              </div>
            ) : (
              <div className={g.proposalGrid}>
                {proposals.map((p) => (
                  <div key={p.id} className={g.proposalCard} onClick={() => openProposal(p)}>
                    <div className={g.proposalCardHeader}>
                      <span className={`${s.badge} ${proposalStatusBadge(p.status)}`}>{p.status}</span>
                      <span className={g.proposalDate}>{p.createdAt}</span>
                    </div>
                    <div className={g.proposalCardTitle}>{p.name}</div>
                    <div className={g.proposalCardDesc}>{p.targetProgram}</div>
                    <div className={g.proposalCardMeta}>
                      <span>Step {p.currentStep}/7</span>
                      <span>{p.companyInfo.name}</span>
                    </div>
                    <div className={g.progressBar}>
                      <div className={g.progressFill} style={{ width: `${(p.currentStep / 7) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== Wizard View ===== */}
      {view === "wizard" && (
      <div className={g.wizardPage}>
        {/* Header */}
        <div className={g.wizardHeader}>
          <button className={g.backBtn} onClick={() => setView("list")}>
            ← 목록
          </button>
          <div className={g.wizardTitle}>AI 사업계획서 작성</div>
        </div>

        {/* Stepper */}
        <div className={g.stepper}>
          {STEPS.map((st, i) => (
            <span key={st.num} style={{ display: "flex", alignItems: "center" }}>
              <button
                className={`${g.stepItem} ${step === st.num ? g.stepActive : ""} ${step > st.num ? g.stepDone : ""}`}
                onClick={() => goStep(st.num)}
              >
                <span className={g.stepNumber}>
                  {step > st.num ? "✓" : st.num}
                </span>
                {st.label}
              </button>
              {i < STEPS.length - 1 && <span className={g.stepArrow}>›</span>}
            </span>
          ))}
        </div>

        {/* Step 1: 공고 URL로 프로젝트 자동 생성 */}
        {step === 1 && (
          <div className={g.stepContent}>
            <div className={g.stepContentTitle}>프로젝트 생성</div>
            <div className={g.stepContentDesc}>정부지원사업 공고 페이지 URL을 입력하면 AI가 자동으로 사업 정보를 분석합니다.</div>

            {/* URL 입력 */}
            <div className={g.urlInputRow}>
              <input
                className={g.urlInput}
                value={announcementUrl}
                onChange={(e) => { setAnnouncementUrl(e.target.value); if (urlAnalyzed) resetUrl(); }}
                placeholder="예: https://www.k-startup.go.kr/..."
                disabled={urlAnalyzing}
              />
              <button
                className={`${s.btn} ${s.btnPrimary}`}
                onClick={analyzeUrl}
                disabled={!announcementUrl.trim() || urlAnalyzing}
                style={{ opacity: !announcementUrl.trim() || urlAnalyzing ? 0.5 : 1, whiteSpace: "nowrap" }}
              >
                {urlAnalyzing ? "분석중..." : "URL 분석"}
              </button>
            </div>

            {urlError && (
              <div className={g.urlError}>
                {urlError}
              </div>
            )}

            {urlAnalyzing && (
              <div className={g.aiLoading}>
                <div className={g.aiLoadingSpinner} />
                <div className={g.aiLoadingText}>공고 페이지를 분석하고 있습니다...</div>
                <div className={g.aiLoadingHint}>페이지 크롤링 → Gemini AI 분석 → 공고 정보 구조화</div>
              </div>
            )}

            {urlAnalyzed && urlMeta && (
              <>
                <div className={g.loadedBanner}>
                  공고 페이지에서 사업 정보를 자동으로 추출했습니다
                </div>

                {/* 기본 정보 요약 */}
                <div className={g.urlResultCard}>
                  <div className={g.urlResultGrid}>
                    <div className={g.urlResultItem}>
                      <span className={g.urlResultLabel}>사업명</span>
                      <span className={g.urlResultValue} style={{ fontWeight: 600 }}>{targetProgram}</span>
                    </div>
                    <div className={g.urlResultItem}>
                      <span className={g.urlResultLabel}>주관기관</span>
                      <span className={g.urlResultValue}>{urlMeta.agency}</span>
                    </div>
                    <div className={g.urlResultItem}>
                      <span className={g.urlResultLabel}>분류</span>
                      <span className={g.urlResultValue}>{urlMeta.category}</span>
                    </div>
                    <div className={g.urlResultItem}>
                      <span className={g.urlResultLabel}>지원금액</span>
                      <span className={g.urlResultValue} style={{ color: "var(--color-primary)", fontWeight: 600 }}>{urlMeta.amount}</span>
                    </div>
                    <div className={g.urlResultItem}>
                      <span className={g.urlResultLabel}>접수마감</span>
                      <span className={g.urlResultValue} style={{ color: "var(--color-danger)", fontWeight: 600 }}>{urlMeta.deadline}</span>
                    </div>
                    <div className={g.urlResultItem}>
                      <span className={g.urlResultLabel}>수행기간</span>
                      <span className={g.urlResultValue}>{urlMeta.period}</span>
                    </div>
                  </div>
                  {urlMeta.overview && (
                    <div className={g.urlOverview}>{urlMeta.overview}</div>
                  )}
                </div>

                {/* 상세 분석 결과 */}
                <div className={g.urlDetailSections}>

                  {/* 지원자격 / 신청제외 */}
                  <div className={g.urlDetailRow}>
                    <div className={g.urlDetailBlock}>
                      <div className={g.urlDetailBlockTitle}>지원자격</div>
                      <div className={g.urlDetailList}>
                        {urlMeta.eligibility.map((item, i) => (
                          <div key={i} className={`${g.urlDetailListItem} ${g.urlDetailCheck}`}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className={g.urlDetailBlock}>
                      <div className={g.urlDetailBlockTitle}>신청제외 대상</div>
                      <div className={g.urlDetailList}>
                        {urlMeta.ineligibility.map((item, i) => (
                          <div key={i} className={`${g.urlDetailListItem} ${g.urlDetailCross}`}>{item}</div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 지원내용 */}
                  <div className={g.urlDetailBlock}>
                    <div className={g.urlDetailBlockTitle}>지원내용 (사용 가능 항목)</div>
                    <div className={g.supportGrid}>
                      {urlMeta.supportDetails.map((group, i) => (
                        <div key={i} className={g.supportGroup}>
                          <div className={g.supportGroupTitle}>{group.category}</div>
                          <div className={g.urlDetailList}>
                            {group.items.map((item, j) => (
                              <div key={j} className={g.urlDetailListItemPlain}>{item}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 평가기준 / 일정 */}
                  <div className={g.urlDetailRow}>
                    <div className={g.urlDetailBlock}>
                      <div className={g.urlDetailBlockTitle}>평가기준</div>
                      <div className={g.evalTable}>
                        {urlMeta.evaluationCriteria.map((c, i) => (
                          <div key={i} className={g.evalRow}>
                            <span className={g.evalItem}>{c.item}</span>
                            <span className={g.evalWeight}>{c.weight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={g.urlDetailBlock}>
                      <div className={g.urlDetailBlockTitle}>추진일정</div>
                      <div className={g.scheduleList}>
                        {urlMeta.schedule.map((s_item, i) => (
                          <div key={i} className={g.scheduleRow}>
                            <span className={g.scheduleDate}>{s_item.date}</span>
                            <span className={g.scheduleContent}>{s_item.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 제출서류 */}
                  <div className={g.urlDetailBlock}>
                    <div className={g.urlDetailBlockTitle}>제출서류</div>
                    <div className={g.docGrid}>
                      {urlMeta.requiredDocs.map((doc, i) => (
                        <div key={i} className={g.docGridItem}>
                          <span className={g.docGridNum}>{i + 1}</span>
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 문의처 */}
                  {urlMeta.contactInfo && (
                    <div className={g.contactInfo}>{urlMeta.contactInfo}</div>
                  )}
                </div>

                {/* 프로젝트명 수정 */}
                <div className={g.formGrid} style={{ marginTop: 16 }}>
                  <div className={g.formFull}>
                    <label className={g.fieldLabel}>프로젝트명 (자동생성, 수정가능)</label>
                    <input
                      className={g.fieldInput}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                  <div className={g.formFull}>
                    <label className={g.fieldLabel}>지원 대상 사업명 (자동생성, 수정가능)</label>
                    <input
                      className={g.fieldInput}
                      value={targetProgram}
                      onChange={(e) => setTargetProgram(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {!urlAnalyzing && !urlAnalyzed && (
              <div className={g.urlHintBox}>
                <div className={g.urlHintTitle}>지원 가능한 URL 예시</div>
                <div className={g.urlHintList}>
                  <span>K-스타트업 (k-startup.go.kr)</span>
                  <span>기업마당 (bizinfo.go.kr)</span>
                  <span>중소기업기술개발사업 (smtech.go.kr)</span>
                  <span>IRIS (iris.go.kr)</span>
                  <span>각 부처/기관 공고 페이지</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 기업 정보 (사업자 기본정보에서 불러오기) */}
        {step === 2 && (
          <div className={g.stepContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className={g.stepContentTitle}>기업 정보</div>
                <div className={g.stepContentDesc}>사업자 기본정보 탭에서 자동으로 불러온 데이터입니다. 필요시 수정할 수 있습니다.</div>
              </div>
              <button className={`${s.btn} ${s.btnSmall}`} onClick={reloadCompany}>
                다시 불러오기
              </button>
            </div>
            {companyLoaded && (
              <div className={g.loadedBanner}>
                사업자 기본정보에서 불러옴 — {company.name} ({company.businessNumber})
              </div>
            )}
            <div className={g.formGrid4}>
              <div>
                <label className={g.fieldLabel}>기업명 *</label>
                <input className={g.fieldInput} value={company.name} onChange={(e) => updateCompany("name", e.target.value)} />
              </div>
              <div>
                <label className={g.fieldLabel}>대표자명 *</label>
                <input className={g.fieldInput} value={company.representative} onChange={(e) => updateCompany("representative", e.target.value)} />
              </div>
              <div>
                <label className={g.fieldLabel}>사업자등록번호</label>
                <input className={g.fieldInput} value={company.businessNumber} onChange={(e) => updateCompany("businessNumber", e.target.value)} placeholder="000-00-00000" />
              </div>
              <div>
                <label className={g.fieldLabel}>사업자 유형</label>
                <select className={g.fieldSelect} value={company.businessType} onChange={(e) => updateCompany("businessType", e.target.value)}>
                  <option value="">선택</option>
                  <option value="법인">법인</option>
                  <option value="개인">개인사업자</option>
                  <option value="비영리">비영리법인</option>
                </select>
              </div>
              <div>
                <label className={g.fieldLabel}>업종</label>
                <input className={g.fieldInput} value={company.industry} onChange={(e) => updateCompany("industry", e.target.value)} placeholder="예: 정보통신업" />
              </div>
              <div>
                <label className={g.fieldLabel}>세부 업종</label>
                <input className={g.fieldInput} value={company.subIndustry} onChange={(e) => updateCompany("subIndustry", e.target.value)} placeholder="예: 소프트웨어 개발" />
              </div>
              <div>
                <label className={g.fieldLabel}>업력 (년)</label>
                <input className={g.fieldInput} type="number" value={company.yearsInBusiness || ""} onChange={(e) => updateCompany("yearsInBusiness", Number(e.target.value))} />
              </div>
              <div>
                <label className={g.fieldLabel}>직원수</label>
                <input className={g.fieldInput} type="number" value={company.employeeCount || ""} onChange={(e) => updateCompany("employeeCount", Number(e.target.value))} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label className={g.fieldLabel}>연 매출액 (원)</label>
                <input className={g.fieldInput} type="number" value={company.annualRevenue || ""} onChange={(e) => updateCompany("annualRevenue", Number(e.target.value))} placeholder="500000000" />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label className={g.fieldLabel}>소재지</label>
                <input className={g.fieldInput} value={company.address} onChange={(e) => updateCompany("address", e.target.value)} placeholder="서울특별시 강남구..." />
              </div>
              <div className={g.formFull}>
                <label className={g.fieldLabel}>보유 역량</label>
                <textarea className={g.fieldTextarea} value={company.capabilities} onChange={(e) => updateCompany("capabilities", e.target.value)} placeholder="예: AI/ML 개발, 웹서비스 운영, 특허 보유 현황 등" />
              </div>
              <div className={g.formFull}>
                <label className={g.fieldLabel}>인증 현황</label>
                <input className={g.fieldInput} value={company.certifications} onChange={(e) => updateCompany("certifications", e.target.value)} placeholder="예: 벤처기업 인증, ISO 27001, 기업부설연구소 등" />
              </div>
              <div className={g.formFull}>
                <label className={g.fieldLabel}>대표자 특성</label>
                <input className={g.fieldInput} value={company.founderTags} onChange={(e) => updateCompany("founderTags", e.target.value)} placeholder="예: 7년 이내 스타트업, 청년 창업자" />
              </div>
              <div className={g.formFull}>
                <label className={g.fieldLabel}>인력 현황</label>
                <textarea className={g.fieldTextarea} value={company.personnelDetails} onChange={(e) => updateCompany("personnelDetails", e.target.value)} placeholder="직급, 자격, 전문분야 등" />
              </div>
              <div className={g.formFull}>
                <label className={g.fieldLabel}>직접생산업체 증명</label>
                <textarea className={g.fieldTextarea} value={company.directProductions} onChange={(e) => updateCompany("directProductions", e.target.value)} placeholder="직접생산업체 증명 내용" />
              </div>
              <div className={g.formFull}>
                <label className={g.fieldLabel}>나라장터 업종코드</label>
                <input className={g.fieldInput} value={company.naraCodes} onChange={(e) => updateCompany("naraCodes", e.target.value)} placeholder="예: 산업디자인전문회사 (4440)" />
              </div>
              <div className={g.formFull}>
                <label className={g.fieldLabel}>기타 정보 (연락처, 홈페이지, 거래은행 등)</label>
                <textarea className={g.fieldTextarea} value={company.extraInfo} onChange={(e) => updateCompany("extraInfo", e.target.value)} placeholder="회사 이메일, 대표 연락처, 홈페이지 등" />
              </div>
              <div className={g.formFull}>
                <label className={g.fieldLabel}>비고 / 메모</label>
                <textarea className={g.fieldTextarea} value={company.memo} onChange={(e) => updateCompany("memo", e.target.value)} placeholder="추가 참고사항" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 자료 업로드 */}
        {step === 3 && (
          <div className={g.stepContent}>
            <div className={g.stepContentTitle}>정부지원사업 자료 업로드</div>
            <div className={g.stepContentDesc}>공고문, 모집요강, 사업계획서 양식 등 관련 자료를 업로드합니다.</div>

            {/* 숨겨진 파일 input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.hwp,.hwpx,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {/* 드래그 앤 드롭 영역 */}
            <div
              className={g.uploadArea}
              onClick={() => triggerFileInput("기타")}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className={g.uploadIcon}>📄</div>
              <div className={g.uploadText}>클릭하거나 파일을 드래그하여 업로드하세요</div>
              <div className={g.uploadHint}>PDF, HWP, DOCX, XLSX, PPT, ZIP, 이미지 지원</div>
            </div>

            {/* 유형별 업로드 버튼 */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {(["공고문", "모집요강", "제출양식", "사업계획서양식", "기타"] as const).map((type) => (
                <button key={type} className={`${s.btn} ${s.btnSmall}`} onClick={() => triggerFileInput(type)}>
                  + {type}
                </button>
              ))}
            </div>

            {files.length > 0 && (
              <div className={g.fileList}>
                {files.map((f) => (
                  <div key={f.id} className={g.fileItem}>
                    <span className={`${s.badge} ${s.badgeBlue}`}>{f.type}</span>
                    <span className={g.fileName}>{f.name}</span>
                    <span className={g.fileSize}>{f.size}</span>
                    <button className={g.fileRemoveBtn} onClick={() => removeFile(f.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: AI 지원 가능성 분석 */}
        {step === 4 && (
          <div className={g.stepContent}>
            <div className={g.stepContentTitle}>AI 지원 가능성 분석</div>
            <div className={g.stepContentDesc}>업로드된 공고문과 기업 정보를 바탕으로 AI가 지원 가능성을 분석합니다.</div>

            {!analysis && !analyzing && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={runAnalysis}>
                  AI 분석 시작
                </button>
              </div>
            )}

            {analyzing && (
              <div className={g.aiLoading}>
                <div className={g.aiLoadingSpinner} />
                <div className={g.aiLoadingText}>AI가 공고문과 기업 정보를 분석하고 있습니다...</div>
                <div className={g.aiLoadingHint}>공고문 파싱 → 지원 자격 매칭 → 결과 정리</div>
              </div>
            )}

            {analysis && (
              <>
                {/* 사업 요약 */}
                <div className={g.analysisSection}>
                  <div className={g.analysisSectionTitle}>지원사업 핵심 정보</div>
                  <div className={g.analysisGrid}>
                    <div className={g.analysisItem}>
                      <span className={g.analysisItemLabel}>사업명</span>
                      <span>{analysis.programSummary.programName}</span>
                    </div>
                    <div className={g.analysisItem}>
                      <span className={g.analysisItemLabel}>주관기관</span>
                      <span>{analysis.programSummary.agency}</span>
                    </div>
                    <div className={g.analysisItem}>
                      <span className={g.analysisItemLabel}>접수기간</span>
                      <span>{analysis.programSummary.applicationPeriod}</span>
                    </div>
                    <div className={g.analysisItem}>
                      <span className={g.analysisItemLabel}>수행기간</span>
                      <span>{analysis.programSummary.operationPeriod}</span>
                    </div>
                    <div className={g.analysisItem}>
                      <span className={g.analysisItemLabel}>지원금액</span>
                      <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>{analysis.programSummary.supportAmount}</span>
                    </div>
                  </div>
                  <div className={g.analysisSectionTitle}>지원 자격 요건</div>
                  <ul className={g.analysisList}>
                    {analysis.programSummary.eligibility.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* 적합성 판단 */}
                <div className={g.analysisSection}>
                  <div className={g.analysisSectionTitle}>기업 지원 적합성 판단</div>
                  <div className={`${g.eligibilityCard} ${analysis.eligibilityResult.isEligible ? g.eligibilityPass : g.eligibilityFail}`}>
                    <div className={g.eligibilityTitle}>
                      {analysis.eligibilityResult.isEligible ? "✅ 지원 가능" : "❌ 지원 부적합"}
                    </div>
                    <div className={g.eligibilityItems}>
                      {analysis.eligibilityResult.matchedCriteria.map((item, i) => (
                        <div key={i} className={`${g.eligibilityItem} ${g.checkItem}`}>{item}</div>
                      ))}
                      {analysis.eligibilityResult.unmatchedCriteria.map((item, i) => (
                        <div key={i} className={`${g.eligibilityItem} ${g.crossItem}`}>{item}</div>
                      ))}
                    </div>
                  </div>
                  {analysis.eligibilityResult.warnings.length > 0 && (
                    <div className={g.warningBox}>
                      <h4>유의사항</h4>
                      {analysis.eligibilityResult.warnings.map((w, i) => (
                        <div key={i} className={`${g.eligibilityItem} ${g.warnItem}`}>{w}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 제출 서류 */}
                <div className={g.analysisSection}>
                  <div className={g.analysisSectionTitle}>제출 필요 서류</div>
                  <div className={g.docChecklist}>
                    <div className={g.docChecklistCol}>
                      <h4>필수 서류</h4>
                      <ul className={g.analysisList}>
                        {analysis.requiredDocuments.mandatory.map((doc, i) => <li key={i}>{doc}</li>)}
                      </ul>
                    </div>
                    <div className={g.docChecklistCol}>
                      <h4>선택 서류</h4>
                      <ul className={g.analysisList}>
                        {analysis.requiredDocuments.optional.map((doc, i) => <li key={i}>{doc}</li>)}
                      </ul>
                    </div>
                    <div className={g.docChecklistCol}>
                      <h4>추가 준비 필요</h4>
                      <ul className={g.analysisList}>
                        {analysis.requiredDocuments.additionalPrep.map((doc, i) => <li key={i}>{doc}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 5: 사업계획서 양식 구조 분석 */}
        {step === 5 && (
          <div className={g.stepContent}>
            <div className={g.stepContentTitle}>사업계획서 양식 구조 분석</div>
            <div className={g.stepContentDesc}>업로드된 사업계획서 양식(신청서) 파일을 AI가 분석하여 목차와 작성 구조를 파악합니다.</div>

            {/* 사업계획서양식 파일이 없는 경우 경고 */}
            {!hasTemplateFiles && template.length === 0 && !analyzingTemplate && (
              <div className={g.warningBox}>
                <h4>분석할 사업계획서 양식 파일이 없습니다</h4>
                <div className={`${g.eligibilityItem} ${g.warnItem}`}>
                  3단계(자료 업로드)에서 &quot;사업계획서양식&quot; 유형으로 파일을 업로드해주세요.
                </div>
                <div className={`${g.eligibilityItem} ${g.warnItem}`}>
                  양식 구조 분석은 사업계획서양식(신청서) 파일만을 대상으로 진행됩니다.
                </div>
                <button
                  className={`${s.btn} ${s.btnSmall}`}
                  style={{ marginTop: 10 }}
                  onClick={() => setStep(3)}
                >
                  ← 자료 업로드로 돌아가기
                </button>
              </div>
            )}

            {/* 사업계획서양식 파일이 있는 경우 분석 시작 */}
            {hasTemplateFiles && template.length === 0 && !analyzingTemplate && (
              <div>
                <div className={g.loadedBanner}>
                  사업계획서양식 파일 {templateFiles.length}건 감지됨: {templateFiles.map((f) => f.name).join(", ")}
                </div>
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <button className={`${s.btn} ${s.btnPrimary}`} onClick={runTemplateAnalysis}>
                    양식 구조 분석 시작
                  </button>
                </div>
              </div>
            )}

            {analyzingTemplate && (
              <div className={g.aiLoading}>
                <div className={g.aiLoadingSpinner} />
                <div className={g.aiLoadingText}>AI가 사업계획서 양식을 분석하고 있습니다...</div>
                <div className={g.aiLoadingHint}>목차 추출 → 섹션 분류 → 작성 가이드 생성</div>
              </div>
            )}

            {templateError && !analyzingTemplate && (
              <div className={g.warningBox}>
                <h4>양식 분석 실패</h4>
                <div className={`${g.eligibilityItem} ${g.warnItem}`}>{templateError}</div>
                <button
                  className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
                  style={{ marginTop: 10 }}
                  onClick={() => { setTemplateError(null); runTemplateAnalysis(); }}
                >
                  다시 시도
                </button>
              </div>
            )}

            {templateSkipped.length > 0 && template.length > 0 && (
              <div className={g.warningBox} style={{ marginBottom: 12 }}>
                <h4>일부 파일이 분석에서 제외되었습니다</h4>
                {templateSkipped.map((f, i) => (
                  <div key={i} className={`${g.eligibilityItem} ${g.warnItem}`}>{f}</div>
                ))}
              </div>
            )}

            {template.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                  <button
                    className={`${s.btn} ${s.btnSmall}`}
                    onClick={() => { setTemplate([]); }}
                    disabled={analyzingTemplate}
                  >
                    AI 다시 분석하기
                  </button>
                </div>
                <div className={g.templateList}>
                  {template.map((sec) => (
                    <div key={sec.number} className={g.templateItem}>
                      <div className={g.templateItemHeader}>
                        <span className={g.templateItemNumber}>{sec.number}.</span>
                        <span className={g.templateItemTitle}>{sec.title}</span>
                        {sec.maxPages && (
                          <span className={g.templateItemPages}>최대 {sec.maxPages}p</span>
                        )}
                      </div>
                      {sec.description && <div className={g.templateItemDesc}>{sec.description}</div>}
                      {sec.subSections?.length > 0 && (
                        <div className={g.templateSubSections}>
                          {sec.subSections.map((sub, i) => (
                            <span key={i} className={g.templateSubTag}>{sub}</span>
                          ))}
                        </div>
                      )}
                      {sec.items?.length > 0 && (
                        <div className={g.templateItemDetails}>
                          {sec.items.map((item, i) => (
                            <div key={i} className={g.templateDetailRow}>
                              <span className={g.templateDetailLabel}>{item.label}</span>
                              {item.detail && <span className={g.templateDetailValue}>{item.detail}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 6: 사업 아이디어 + 기존 사업계획서 참고 */}
        {step === 6 && (
          <div className={g.stepContent}>
            <input type="file" ref={refDocInputRef} hidden accept=".pdf,.txt,.jpg,.jpeg,.png" onChange={handleRefDocChange} multiple />
            <input type="file" ref={bpInputRef} hidden accept=".pdf,.txt,.jpg,.jpeg,.png" onChange={handleBPChange} multiple />

            <div className={g.stepContentTitle}>사업 아이디어 입력</div>
            <div className={g.stepContentDesc}>기존 사업계획서와 우수사례를 첨부하면 AI가 전체 내용을 분석하여 새 사업계획서에 반영합니다. 추가 아이디어가 있으면 아래에 입력하세요.</div>

            {/* 기존 사업계획서 참고 */}
            <div className={g.refSection}>
              <div className={g.refSectionHeader}>
                <div>
                  <div className={g.refSectionTitle}>기존 사업계획서 참고 (선택)</div>
                  <div className={g.refSectionDesc}>이전에 작성했던 사업계획서를 첨부하면 AI가 전체 내용을 추출하여 새 사업계획서에 반영합니다. (PDF, TXT, JPG, PNG 지원)</div>
                </div>
                <button className={`${s.btn} ${s.btnSmall}`} onClick={addRefDoc}>
                  + 기존 계획서 첨부
                </button>
              </div>

              {refDocError && (
                <div className={g.warningBox} style={{ marginBottom: 8 }}>
                  <div className={`${g.eligibilityItem} ${g.warnItem}`}>{refDocError}</div>
                </div>
              )}

              {refDocs.length > 0 && (
                <div className={g.refDocList}>
                  {refDocs.map((doc) => (
                    <div key={doc.id} className={g.refDocItem}>
                      <div className={g.refDocHeader}>
                        <div className={g.refDocInfo}>
                          <span className={g.refDocIcon}>📄</span>
                          <span className={g.refDocName}>{doc.name}</span>
                          <span className={g.refDocSize}>{doc.size}</span>
                        </div>
                        <div className={g.refDocActions}>
                          {!doc.analyzedAt && analyzingRef !== doc.id && (
                            <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={() => analyzeRefDoc(doc.id)}>
                              AI 분석
                            </button>
                          )}
                          {analyzingRef === doc.id && (
                            <span className={g.refDocAnalyzing}>
                              <span className={g.miniSpinner} /> 분석중...
                            </span>
                          )}
                          {doc.analyzedAt && (
                            <span className={`${s.badge} ${s.badgeGreen}`}>분석완료</span>
                          )}
                          <button className={g.fileRemoveBtn} onClick={() => removeRefDoc(doc.id)}>✕</button>
                        </div>
                      </div>
                      {doc.fullContent && (
                        <div className={g.refDocFullContent}>
                          <div className={g.refDocFullContentTitle}>추출된 전체 내용</div>
                          <div className={g.refDocFullContentBody}>
                            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, lineHeight: 1.6, margin: 0, maxHeight: 400, overflow: "auto" }}>{doc.fullContent}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {refDocs.length === 0 && (
                <div className={g.refDocEmpty} onClick={addRefDoc}>
                  <span>📎</span> 기존 사업계획서를 첨부하면 AI가 문체, 사업내용, 기술역량 등을 학습하여 새 계획서에 반영합니다
                </div>
              )}
            </div>

            {/* 구분선 */}
            <div className={g.ideaDivider} />

            {/* 우수사례 레퍼런스 */}
            <div className={g.refSection}>
              <div className={g.refSectionHeader}>
                <div>
                  <div className={g.refSectionTitle}>우수사례 레퍼런스 (선택)</div>
                  <div className={g.refSectionDesc}>선정된 우수 사업계획서를 첨부하면 AI가 전체 내용을 추출하고 논리 구조, 표현 방식을 분석합니다. (PDF, TXT, JPG, PNG 지원)</div>
                </div>
                <button className={`${s.btn} ${s.btnSmall}`} onClick={addBestPractice}>
                  + 우수사례 첨부
                </button>
              </div>

              {bpError && (
                <div className={g.warningBox} style={{ marginBottom: 8 }}>
                  <div className={`${g.eligibilityItem} ${g.warnItem}`}>{bpError}</div>
                </div>
              )}

              {bestPractices.length > 0 && (
                <div className={g.refDocList}>
                  {bestPractices.map((bp) => (
                    <div key={bp.id} className={g.refDocItem}>
                      <div className={g.refDocHeader}>
                        <div className={g.refDocInfo}>
                          <span className={g.refDocIcon}>🏆</span>
                          <span className={g.refDocName}>{bp.name}</span>
                          <span className={g.refDocSize}>{bp.size}</span>
                        </div>
                        <div className={g.refDocActions}>
                          {!bp.analyzedAt && analyzingBP !== bp.id && (
                            <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={() => analyzeBestPractice(bp.id)}>
                              AI 분석
                            </button>
                          )}
                          {analyzingBP === bp.id && (
                            <span className={g.refDocAnalyzing}>
                              <span className={g.miniSpinner} /> 분석중...
                            </span>
                          )}
                          {bp.analyzedAt && (
                            <span className={`${s.badge} ${s.badgeGreen}`}>분석완료</span>
                          )}
                          <button className={g.fileRemoveBtn} onClick={() => removeBestPractice(bp.id)}>✕</button>
                        </div>
                      </div>
                      {bp.analysis && (
                        <div className={g.bpAnalysis}>
                          {bp.analysis.score && (
                            <div className={g.bpScore}>{bp.analysis.score}</div>
                          )}

                          <div className={g.bpBlock}>
                            <div className={g.bpBlockTitle}>선정 요인 분석</div>
                            <div className={g.bpStrengths}>
                              {bp.analysis.strengths.map((str, i) => (
                                <div key={i} className={g.bpStrengthItem}>{str}</div>
                              ))}
                            </div>
                          </div>

                          <div className={g.bpBlock}>
                            <div className={g.bpBlockTitle}>논리 전개 구조</div>
                            <div className={g.bpStructure}>{bp.analysis.structure}</div>
                          </div>

                          <div className={g.bpBlock}>
                            <div className={g.bpBlockTitle}>참고할 표현/문구</div>
                            <div className={g.bpExpressions}>
                              {bp.analysis.expressions.map((expr, i) => (
                                <div key={i} className={g.bpExpressionItem}>{expr}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {bestPractices.length === 0 && (
                <div className={g.refDocEmpty} onClick={addBestPractice}>
                  <span>🏆</span> 우수사례 사업계획서를 첨부하면 AI가 구조, 논리전개, 표현방식을 학습하여 품질을 높입니다
                </div>
              )}
            </div>

            {/* 구분선 */}
            <div className={g.ideaDivider} />

            {/* 사업 아이디어 입력 */}
            <div className={g.refSectionTitle} style={{ marginBottom: 8 }}>사업 아이디어</div>
            <textarea
              className={g.ideaTextarea}
              value={businessIdea}
              onChange={(e) => setBusinessIdea(e.target.value)}
              placeholder="어떤 문제를 해결하는 사업인지, 어떤 제품/서비스인지, 누구를 위한 사업인지, 어떤 차별성이 있는지 등을 자유롭게 작성해주세요..."
            />

            {/* 참고자료 반영 안내 */}
            {(refDocs.some((d) => d.analyzedAt) || bestPractices.some((d) => d.analyzedAt)) && (
              <div className={g.refAppliedBanner}>
                {[
                  refDocs.some((d) => d.analyzedAt) && `기존 계획서 ${refDocs.filter((d) => d.analyzedAt).length}건 (문체/내용 반영)`,
                  bestPractices.some((d) => d.analyzedAt) && `우수사례 ${bestPractices.filter((d) => d.analyzedAt).length}건 (구조/표현 반영)`,
                ].filter(Boolean).join(" + ")}
                이 사업계획서 생성에 반영됩니다.
              </div>
            )}

            <div className={g.ideaGuide}>
              <h4>작성 가이드</h4>
              <ul>
                <li>어떤 문제를 해결하려는 사업인가요?</li>
                <li>개발하려는 제품/서비스는 무엇인가요?</li>
                <li>주요 타겟 고객은 누구인가요?</li>
                <li>기존 솔루션 대비 어떤 차별성이 있나요?</li>
                <li>핵심 기술이나 접근 방법은 무엇인가요?</li>
                <li>예상 매출이나 사업화 계획이 있나요?</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 7: AI 사업계획서 생성 */}
        {step === 7 && (
          <div className={g.stepContent}>
            <div className={g.stepContentTitle}>AI 사업계획서 자동 생성</div>
            <div className={g.stepContentDesc}>
              사업 아이디어를 바탕으로 {template.length > 0 ? `${template.length}개 섹션` : "사업계획서 양식"}에 맞춰 초안을 생성합니다.
            </div>

            {/* 버전 관리 리스트 */}
            {planVersions.length > 0 && (
              <div style={{ marginBottom: 16, border: "1px solid var(--color-border)", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>생성 이력 ({planVersions.length}건)</div>
                </div>
                <div style={{ maxHeight: 160, overflow: "auto" }}>
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                        <th style={{ padding: "4px 12px", textAlign: "left", fontWeight: 600 }}>버전</th>
                        <th style={{ padding: "4px 12px", textAlign: "left", fontWeight: 600 }}>생성일시</th>
                        <th style={{ padding: "4px 12px", textAlign: "center", fontWeight: 600 }}>섹션</th>
                        <th style={{ padding: "4px 12px", textAlign: "center", fontWeight: 600 }}>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planVersions.map((ver) => (
                        <tr
                          key={ver.id}
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                            background: activeVersionId === ver.id ? "var(--color-primary-light, #e8f0fe)" : "transparent",
                            cursor: "pointer",
                          }}
                          onClick={() => loadVersion(ver.id)}
                        >
                          <td style={{ padding: "5px 12px" }}>
                            <span style={{ fontWeight: 600, color: activeVersionId === ver.id ? "var(--color-primary)" : "inherit" }}>
                              {ver.label}
                            </span>
                            {activeVersionId === ver.id && (
                              <span style={{ fontSize: 10, marginLeft: 6, color: "var(--color-primary)", fontWeight: 600 }}>현재</span>
                            )}
                          </td>
                          <td style={{ padding: "5px 12px", color: "var(--color-text-secondary)" }}>{ver.createdAt}</td>
                          <td style={{ padding: "5px 12px", textAlign: "center" }}>{ver.sectionCount}개</td>
                          <td style={{ padding: "5px 12px", textAlign: "center" }}>
                            <button
                              className={`${s.btn} ${s.btnSmall}`}
                              style={{ fontSize: 10, padding: "1px 6px" }}
                              onClick={(e) => { e.stopPropagation(); loadVersion(ver.id); }}
                            >
                              불러오기
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {plan.length === 0 && !generating && !generateError && (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={generatePlan} style={{ padding: "10px 32px", fontSize: 14 }}>
                  사업계획서 생성 시작
                </button>
                <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 8 }}>
                  AI가 각 섹션별 내용을 자동으로 작성합니다
                  {refDocs.some(d => d.fullContent) && " (기존 계획서 참고)"}
                  {bestPractices.some(d => d.fullContent) && " (우수사례 참고)"}
                </div>
              </div>
            )}

            {generating && (
              <div className={g.aiLoading}>
                <div className={g.aiLoadingSpinner} />
                <div className={g.aiLoadingText}>
                  {generatingProgress
                    ? `섹션 ${generatingProgress.current} / ${generatingProgress.total} 작성 중...`
                    : "AI가 사업계획서를 준비하고 있습니다..."}
                </div>
                {generatingProgress && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-primary)", marginTop: 4 }}>
                      {generatingProgress.sectionTitle}
                    </div>
                    <div style={{ width: "100%", maxWidth: 400, height: 6, background: "var(--color-border)", borderRadius: 3, marginTop: 10 }}>
                      <div style={{
                        width: `${(generatingProgress.current / generatingProgress.total) * 100}%`,
                        height: "100%",
                        background: "var(--color-primary)",
                        borderRadius: 3,
                        transition: "width 0.3s ease",
                      }} />
                    </div>
                  </>
                )}
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 6 }}>
                  gemini-3.1-pro-preview | 섹션별 개별 생성 (섹션당 최대 토큰 집중 사용)
                </div>
                <button
                  className={`${s.btn} ${s.btnSmall}`}
                  style={{ marginTop: 12, color: "var(--color-danger, #e53e3e)" }}
                  onClick={cancelGeneration}
                >
                  생성 취소
                </button>
              </div>
            )}

            {generateError && !generating && (
              <div className={g.warningBox}>
                <h4>사업계획서 생성 오류</h4>
                <div className={`${g.eligibilityItem} ${g.warnItem}`}>{generateError}</div>
                <button
                  className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
                  style={{ marginTop: 10 }}
                  onClick={() => { setGenerateError(null); }}
                >
                  확인
                </button>
              </div>
            )}

            {plan.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                    {activeVersionId && planVersions.find(v => v.id === activeVersionId)
                      ? `${planVersions.find(v => v.id === activeVersionId)!.label} | ${plan.length}개 섹션`
                      : `${plan.length}개 섹션`}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
                      onClick={() => { setGenerateError(null); generatePlan(); }}
                      disabled={generating || regeneratingSection !== null}
                    >
                      전체 재생성
                    </button>
                    <button
                      className={`${s.btn} ${s.btnSmall}`}
                      onClick={() => setOpenSections(new Set(plan.map((p) => p.number)))}
                    >
                      전체 펼치기
                    </button>
                    <button
                      className={`${s.btn} ${s.btnSmall}`}
                      onClick={() => setOpenSections(new Set())}
                    >
                      전체 접기
                    </button>
                  </div>
                </div>

                <div className={g.planSections}>
                  {plan.map((sec) => (
                    <div key={sec.number} className={g.planSection}>
                      <div className={g.planSectionHeader} onClick={() => toggleSection(sec.number)}>
                        <div className={g.planSectionTitle}>
                          <span className={g.planSectionNumber}>{sec.number}</span>
                          {sec.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {regeneratingSection === sec.number && (
                            <span style={{ fontSize: 11, color: "var(--color-primary)" }}>
                              <span className={g.miniSpinner} /> 재생성중...
                            </span>
                          )}
                          {openSections.has(sec.number) && editingSection !== sec.number && regeneratingSection !== sec.number && (
                            <>
                              <button
                                className={`${s.btn} ${s.btnSmall}`}
                                onClick={(e) => { e.stopPropagation(); regenerateSection(sec.number); }}
                                style={{ fontSize: 10, padding: "2px 6px", color: "var(--color-primary)" }}
                                disabled={generating || regeneratingSection !== null}
                              >
                                섹션 재생성
                              </button>
                              <button
                                className={`${s.btn} ${s.btnSmall}`}
                                onClick={(e) => { e.stopPropagation(); setEditingSection(sec.number); setEditContent(sec.content); }}
                                style={{ fontSize: 10, padding: "2px 6px" }}
                              >
                                수정
                              </button>
                            </>
                          )}
                          <span className={`${g.planSectionToggle} ${openSections.has(sec.number) ? g.planSectionToggleOpen : ""}`}>
                            ▼
                          </span>
                        </div>
                      </div>
                      {openSections.has(sec.number) && (
                        editingSection === sec.number ? (
                          <div className={g.planSectionBody} style={{ padding: 12 }}>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              style={{
                                width: "100%",
                                minHeight: 300,
                                fontFamily: "monospace",
                                fontSize: 13,
                                lineHeight: 1.6,
                                border: "1px solid var(--color-border)",
                                borderRadius: 4,
                                padding: 10,
                                resize: "vertical",
                              }}
                            />
                            <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
                              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setEditingSection(null)}>
                                취소
                              </button>
                              <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={() => saveEdit(sec.number)}>
                                저장
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={g.planSectionBody}
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(sec.content) }}
                          />
                        )
                      )}
                    </div>
                  ))}
                </div>

                <div className={g.exportBar}>
                  <button
                    className={`${s.btn} ${s.btnSmall}`}
                    onClick={() => {
                      const text = plan.map(sec => `# ${sec.number}. ${sec.title}\n\n${sec.content}`).join('\n\n---\n\n');
                      navigator.clipboard.writeText(text).then(() => {
                        setSaveMessage("클립보드에 복사 완료");
                        setTimeout(() => setSaveMessage(null), 3000);
                      });
                    }}
                  >
                    전체 복사
                  </button>
                  <button
                    className={`${s.btn} ${s.btnSmall}`}
                    onClick={() => {
                      const html = plan.map(sec =>
                        `<h1>${sec.number}. ${sec.title}</h1>${renderMarkdown(sec.content)}`
                      ).join('<hr/>');
                      const blob = new Blob([
                        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>' + html + '</body></html>'
                      ], { type: 'application/msword' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${projectName || '사업계획서'}.doc`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    HWP/DOC 다운로드
                  </button>
                  <button
                    className={`${s.btn} ${s.btnSmall}`}
                    onClick={() => window.print()}
                  >
                    PDF 인쇄
                  </button>
                  <button
                    className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
                    style={{ marginLeft: "auto" }}
                    onClick={() => {
                      saveDraft();
                      setSaveMessage("최종 저장 완료 (" + new Date().toLocaleTimeString("ko-KR") + ")");
                      setTimeout(() => setSaveMessage(null), 3000);
                    }}
                  >
                    최종 저장하기
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className={g.wizardActions}>
          <div>
            {step > 1 && (
              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setStep(step - 1)}>
                ← 이전
              </button>
            )}
          </div>
          <div className={g.wizardActionsRight}>
            {saveMessage && (
              <span style={{ fontSize: 12, color: "var(--color-success)", alignSelf: "center" }}>{saveMessage}</span>
            )}
            <button className={`${s.btn} ${s.btnSmall}`} onClick={saveDraft}>
              임시저장
            </button>
            {step < 7 && (
              <button
                className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
                disabled={!canNext()}
                onClick={() => setStep(step + 1)}
                style={{ opacity: canNext() ? 1 : 0.5 }}
              >
                다음 →
              </button>
            )}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
