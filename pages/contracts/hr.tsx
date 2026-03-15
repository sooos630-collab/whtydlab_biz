import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import {
  dummyHrContracts, type HrContract,
  dummyContractFiles, type ContractFile,
  dummyHrContractHistory, type HrContractHistory,
  dummyHrPayslips, type HrPayslip,
  type HrEducation, type HrCareer, type HrQualification, type HrAward,
} from "@/data/dummy-contracts";
import {
  type ContractTemplate,
  type ContractTemplateType,
  defaultContractTemplates,
  ndaTemplate,
  fillTemplate,
} from "@/data/contract-templates";
import HrContractModal, { type TempSaveData } from "@/components/HrContractModal";

const fmtSize = (b: number) => b < 1024 * 1024 ? Math.round(b / 1024) + "KB" : (b / 1024 / 1024).toFixed(1) + "MB";

const statusBadge = (st: string) => {
  switch (st) { case "재직": return s.badgeGreen; case "퇴직": return s.badgeGray; case "휴직": return s.badgeOrange; case "임시저장": return s.badgeOrange; default: return s.badgeGray; }
};
const typeBadge = (type: string) => {
  switch (type) { case "임원": return s.badgePurple ?? s.badgeGray; case "정규직": return s.badgeBlue; case "계약직": return s.badgeOrange; default: return s.badgeGray; }
};
const fileTypeBadge = (ft: string) => {
  switch (ft) { case "계약서": return s.badgeBlue; case "NDA": return s.badgeOrange; case "신분증": return s.badgePurple ?? s.badgeGray; case "통장사본": return s.badgeGreen; default: return s.badgeGray; }
};
const historyTypeBadge = (type: string) => {
  switch (type) { case "신규": return s.badgeBlue; case "갱신": return s.badgeGreen; case "변경": return s.badgeOrange; case "종료": return s.badgeRed; default: return s.badgeGray; }
};

// 필수서류: 근로계약서, 비밀유지서약서
const REQUIRED_DOCS = ["근로계약서", "비밀유지서약서"];
const isDocsMissing = (emp: HrContract): boolean => {
  return REQUIRED_DOCS.some((req) => {
    const doc = emp.docs.find((d) => d.name === req);
    return !doc || !doc.uploaded;
  });
};
const getMissingDocs = (emp: HrContract): string[] => {
  return REQUIRED_DOCS.filter((req) => {
    const doc = emp.docs.find((d) => d.name === req);
    return !doc || !doc.uploaded;
  });
};

type SubTab = "employees" | "templates" | "nda";
type DetailTab = "info" | "history" | "documents" | "payslips";

let nextId = 200;
const genId = (prefix: string) => `${prefix}-${nextId++}`;

export default function HrContractsPage() {
  const [activeTab, setActiveTab] = useState<SubTab>("employees");

  const [list, setList] = useState<HrContract[]>(() => dummyHrContracts.map((d) => ({ ...d, educations: d.educations.map(e => ({ ...e })), careers: d.careers.map(c => ({ ...c })), qualifications: d.qualifications.map(q => ({ ...q })), awards: d.awards.map(a => ({ ...a })), docs: d.docs.map(doc => ({ ...doc })) })));
  const [files, setFiles] = useState<ContractFile[]>(() => dummyContractFiles.filter((f) => f.contract_type === "hr").map((f) => ({ ...f })));
  const [history, setHistory] = useState<HrContractHistory[]>(() => dummyHrContractHistory.map((h) => ({ ...h })));
  const [payslips, setPayslips] = useState<HrPayslip[]>(() => dummyHrPayslips.map((p) => ({ ...p })));
  const [showAdd, setShowAdd] = useState(false);
  const [tempSaveMap, setTempSaveMap] = useState<Record<string, TempSaveData>>({});
  const [resumeId, setResumeId] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("info");
  const [detailEditing, setDetailEditing] = useState(false);
  const [editForm, setEditForm] = useState<HrContract | null>(null);
  const [payslipYear, setPayslipYear] = useState(2025);

  // 검색/필터
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("전체");

  // 계약갱신 모달
  const [showRenewal, setShowRenewal] = useState(false);
  const [renewalForm, setRenewalForm] = useState({ type: "정규직" as HrContract["type"], salary: "", start_date: "", end_date: "", memo: "" });

  // 명세서 추가 모달
  const [showPayslipAdd, setShowPayslipAdd] = useState(false);
  const [payslipForm, setPayslipForm] = useState({ month: 1, base_salary: "", deductions: "", net_pay: "", memo: "" });

  const [templates, setTemplates] = useState<ContractTemplate[]>(() => defaultContractTemplates.map((t) => ({ ...t })));
  const [editingType, setEditingType] = useState<ContractTemplateType | null>(null);
  const [editContent, setEditContent] = useState("");
  const [tplPreviewMode, setTplPreviewMode] = useState<"edit" | "preview">("edit");

  // NDA 관리
  const [ndaContent, setNdaContent] = useState(ndaTemplate);
  const [editingNda, setEditingNda] = useState(false);
  const [ndaEditContent, setNdaEditContent] = useState("");
  const [ndaPreviewMode, setNdaPreviewMode] = useState<"edit" | "preview">("edit");

  const activeCount = list.filter((h) => h.status === "재직").length;
  const tempCount = list.filter((h) => h.status === "임시저장").length;

  const filteredList = list.filter((h) => {
    if (statusFilter !== "전체" && h.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return h.name.toLowerCase().includes(q) || h.department.toLowerCase().includes(q) || h.position.toLowerCase().includes(q);
    }
    return true;
  });
  const getFiles = (id: string) => files.filter((f) => f.contract_id === id);
  const getHistory = (id: string) => history.filter((h) => h.employee_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const getPayslips = (id: string, year: number) => payslips.filter((p) => p.employee_id === id && p.year === year).sort((a, b) => a.month - b.month);
  const selectedEmployee = list.find((h) => h.id === selectedId) ?? null;

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((h) => h.id !== id));
    setFiles(files.filter((f) => f.contract_id !== id));
    setHistory(history.filter((h) => h.employee_id !== id));
    setPayslips(payslips.filter((p) => p.employee_id !== id));
    if (selectedId === id) closeDetail();
  };

  const removeFile = (fileId: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;
    setFiles(files.filter((f) => f.id !== fileId));
  };

  const handleSaveEmployee = (employee: HrContract, newFiles: ContractFile[]) => {
    // 임시저장 데이터가 있으면 기존 항목 교체, 아니면 추가
    setList((prev) => {
      const exists = prev.find((h) => h.id === employee.id);
      if (exists) return prev.map((h) => h.id === employee.id ? employee : h);
      return [...prev, employee];
    });
    if (newFiles.length > 0) setFiles((prev) => [...prev, ...newFiles]);
    setHistory((prev) => [...prev, {
      id: genId("hch"), employee_id: employee.id, type: "신규",
      contract_type: employee.type, start_date: employee.start_date,
      end_date: employee.end_date, salary: employee.salary,
      memo: `${employee.type} 신규 입사`, created_at: new Date().toISOString().slice(0, 10),
    }]);
    // 임시저장 데이터 정리
    setTempSaveMap((prev) => { const next = { ...prev }; delete next[employee.id]; return next; });
    setResumeId(null);
    setShowAdd(false);
  };

  const handleTempSaveEmployee = (data: TempSaveData) => {
    setTempSaveMap((prev) => ({ ...prev, [data.employee.id]: data }));
    setList((prev) => {
      const exists = prev.find((h) => h.id === data.employee.id);
      if (exists) return prev.map((h) => h.id === data.employee.id ? data.employee : h);
      return [...prev, data.employee];
    });
  };

  const resumeTempSave = (id: string) => {
    setResumeId(id);
    setShowAdd(true);
  };

  // ── Detail ──
  const deepClone = (emp: HrContract): HrContract => ({
    ...emp,
    educations: emp.educations.map(e => ({ ...e })),
    careers: emp.careers.map(c => ({ ...c })),
    qualifications: emp.qualifications.map(q => ({ ...q })),
    awards: emp.awards.map(a => ({ ...a })),
    docs: emp.docs.map(d => ({ ...d })),
  });

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailTab("info");
    setDetailEditing(false);
    const emp = list.find((h) => h.id === id);
    if (emp) setEditForm(deepClone(emp));
  };
  const closeDetail = () => { setSelectedId(null); setDetailEditing(false); setEditForm(null); };
  const startEdit = () => { if (selectedEmployee) setEditForm(deepClone(selectedEmployee)); setDetailEditing(true); };
  const cancelEdit = () => { if (selectedEmployee) setEditForm(deepClone(selectedEmployee)); setDetailEditing(false); };
  const saveDetail = () => {
    if (!editForm) return;
    const updated = deepClone(editForm);
    // 퇴사일 입력 시 자동 상태 변경
    if (updated.end_date && updated.status === "재직") {
      const endDate = new Date(updated.end_date);
      if (endDate <= new Date()) updated.status = "퇴직";
    }
    // 퇴사일 제거 시 재직으로 복원 (퇴직 상태였을 때)
    if (!updated.end_date && updated.status === "퇴직") {
      updated.status = "재직";
    }
    setList(list.map((h) => h.id === updated.id ? updated : h));
    setEditForm(updated);
    setDetailEditing(false);
  };

  // ── Education/Career/Qualification/Award helpers ──
  const addEducation = () => { if (!editForm) return; setEditForm({ ...editForm, educations: [...editForm.educations, { id: genId("edu"), school_name: "", major: "", degree: "", graduation_year: "", status: "졸업" }] }); };
  const removeEducation = (id: string) => { if (!editForm) return; setEditForm({ ...editForm, educations: editForm.educations.filter(e => e.id !== id) }); };
  const updateEducation = (id: string, field: keyof HrEducation, value: string) => { if (!editForm) return; setEditForm({ ...editForm, educations: editForm.educations.map(e => e.id === id ? { ...e, [field]: value } : e) }); };

  const addCareer = () => { if (!editForm) return; setEditForm({ ...editForm, careers: [...editForm.careers, { id: genId("car"), company_name: "", position: "", start_date: "", end_date: "", description: "" }] }); };
  const removeCareer = (id: string) => { if (!editForm) return; setEditForm({ ...editForm, careers: editForm.careers.filter(c => c.id !== id) }); };
  const updateCareer = (id: string, field: keyof HrCareer, value: string) => { if (!editForm) return; setEditForm({ ...editForm, careers: editForm.careers.map(c => c.id === id ? { ...c, [field]: value } : c) }); };

  const addQualification = () => { if (!editForm) return; setEditForm({ ...editForm, qualifications: [...editForm.qualifications, { id: genId("qual"), name: "", issuer: "", acquired_date: "", certificate_number: "" }] }); };
  const removeQualification = (id: string) => { if (!editForm) return; setEditForm({ ...editForm, qualifications: editForm.qualifications.filter(q => q.id !== id) }); };
  const updateQualification = (id: string, field: keyof HrQualification, value: string) => { if (!editForm) return; setEditForm({ ...editForm, qualifications: editForm.qualifications.map(q => q.id === id ? { ...q, [field]: value } : q) }); };

  const addAward = () => { if (!editForm) return; setEditForm({ ...editForm, awards: [...editForm.awards, { id: genId("awd"), title: "", issuer: "", date: "", description: "" }] }); };
  const removeAward = (id: string) => { if (!editForm) return; setEditForm({ ...editForm, awards: editForm.awards.filter(a => a.id !== id) }); };
  const updateAward = (id: string, field: keyof HrAward, value: string) => { if (!editForm) return; setEditForm({ ...editForm, awards: editForm.awards.map(a => a.id === id ? { ...a, [field]: value } : a) }); };

  // ── Contract renewal ──
  const openRenewal = () => {
    if (!selectedEmployee) return;
    setRenewalForm({ type: selectedEmployee.type, salary: selectedEmployee.salary, start_date: new Date().toISOString().slice(0, 10), end_date: "", memo: "" });
    setShowRenewal(true);
  };
  const submitRenewal = () => {
    if (!selectedEmployee || !renewalForm.start_date || !renewalForm.salary) return;
    setHistory((prev) => [...prev, { id: genId("hch"), employee_id: selectedEmployee.id, type: "갱신", contract_type: renewalForm.type, start_date: renewalForm.start_date, end_date: renewalForm.end_date || null, salary: renewalForm.salary, memo: renewalForm.memo, created_at: new Date().toISOString().slice(0, 10) }]);
    setList(list.map((h) => h.id === selectedEmployee.id ? { ...h, type: renewalForm.type, salary: renewalForm.salary, start_date: renewalForm.start_date, end_date: renewalForm.end_date || null } : h));
    if (editForm && editForm.id === selectedEmployee.id) setEditForm({ ...editForm, type: renewalForm.type, salary: renewalForm.salary, start_date: renewalForm.start_date, end_date: renewalForm.end_date || null });
    setShowRenewal(false);
  };

  const deleteHistory = (hId: string) => {
    if (!confirm("이력을 삭제하시겠습니까?")) return;
    setHistory(history.filter((h) => h.id !== hId));
  };

  // ── Payslip add ──
  const openPayslipAdd = () => {
    const existing = getPayslips(selectedId!, payslipYear);
    const nextMonth = existing.length > 0 ? Math.max(...existing.map(p => p.month)) + 1 : 1;
    setPayslipForm({ month: Math.min(nextMonth, 12), base_salary: "", deductions: "", net_pay: "", memo: "" });
    setShowPayslipAdd(true);
  };
  const submitPayslip = () => {
    if (!selectedId) return;
    const emp = list.find(h => h.id === selectedId);
    setPayslips((prev) => [...prev, {
      id: genId("ps"), employee_id: selectedId, year: payslipYear, month: payslipForm.month,
      base_salary: payslipForm.base_salary, deductions: payslipForm.deductions, net_pay: payslipForm.net_pay,
      file_name: `월임금명세서_${emp?.name ?? ""}_${payslipYear}${String(payslipForm.month).padStart(2, "0")}.pdf`,
      file_size: 115000, issued_at: new Date().toISOString().slice(0, 10), memo: payslipForm.memo,
    }]);
    setShowPayslipAdd(false);
  };
  const deletePayslip = (pId: string) => {
    if (!confirm("명세서를 삭제하시겠습니까?")) return;
    setPayslips(payslips.filter((p) => p.id !== pId));
  };

  // ── Template handlers ──
  const editingTemplate = templates.find((t) => t.type === editingType);
  const openTplEdit = (type: ContractTemplateType) => { const t = templates.find((tpl) => tpl.type === type)!; setEditContent(t.content); setTplPreviewMode("edit"); setEditingType(type); };
  const saveTplEdit = () => { if (!editingType) return; setTemplates(templates.map((t) => t.type === editingType ? { ...t, content: editContent, updatedAt: new Date().toISOString() } : t)); setEditingType(null); };
  const resetTplToDefault = (type: ContractTemplateType) => { if (!confirm("기본 양식으로 복원하시겠습니까?")) return; const original = defaultContractTemplates.find((t) => t.type === type)!; setTemplates(templates.map((t) => t.type === type ? { ...original, updatedAt: new Date().toISOString() } : t)); if (editingType === type) setEditContent(original.content); };
  const handleTplPreview = (content: string) => { const w = window.open("", "_blank", "width=900,height=700"); if (!w) { alert("팝업이 차단되었습니다."); return; } w.document.write(content); w.document.close(); };

  // ── Section header component ──
  const SectionHeader = ({ title, onAdd, editing: ed }: { title: string; onAdd: () => void; editing: boolean }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, marginBottom: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>{title}</span>
      {ed && <button className={`${s.btn} ${s.btnSmall}`} onClick={onAdd}>+ 추가</button>}
    </div>
  );

  return (
    <>
      <Head><title>HR 계약관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>HR 계약관리 <span className={s.count}>재직 {activeCount}명 / 전체 {list.length}명{tempCount > 0 && ` (임시저장 ${tempCount}건)`}</span></h1>
          {activeTab === "employees" && (
            <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={() => setShowAdd(true)}>+ 인원 추가</button>
          )}
        </div>

        <div className={s.modalStepper} style={{ marginBottom: 16 }}>
          <button className={`${s.modalStepItem} ${activeTab === "employees" ? s.modalStepActive : ""}`} style={{ cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }} onClick={() => setActiveTab("employees")}>구성원관리</button>
          <button className={`${s.modalStepItem} ${activeTab === "templates" ? s.modalStepActive : ""}`} style={{ cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }} onClick={() => setActiveTab("templates")}>근로계약관리</button>
          <button className={`${s.modalStepItem} ${activeTab === "nda" ? s.modalStepActive : ""}`} style={{ cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }} onClick={() => setActiveTab("nda")}>비밀유지서약서</button>
        </div>

        {/* ════════ 구성원관리 탭 ════════ */}
        {activeTab === "employees" && (
          <>
          {/* 검색/필터 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input className={s.formInput} value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="이름, 부서, 직책 검색..." style={{ width: 220, padding: "6px 12px", fontSize: 12.5 }} />
            <div style={{ display: "flex", gap: 4 }}>
              {["전체", "재직", "퇴직", "휴직", "임시저장"].map((st) => (
                <button key={st} className={`${s.btn} ${s.btnSmall}`}
                  style={statusFilter === st ? { background: "var(--color-primary)", color: "white", boxShadow: "none" } : undefined}
                  onClick={() => setStatusFilter(st)}>{st}</button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>{filteredList.length}명 표시</span>
          </div>

          <div className={s.section}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>부서</th>
                  <th>직책</th>
                  <th>고용형태</th>
                  <th>입사일</th>
                  <th>급여</th>
                  <th>상태</th>
                  <th>서류</th>
                  <th style={{ width: 28 }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((h) => {
                  const hFiles = getFiles(h.id);
                  const missing = isDocsMissing(h);
                  return (
                    <tr key={h.id} className={`${s.clickableRow} ${selectedId === h.id ? s.activeRow : ""}`}
                      onClick={() => h.status === "임시저장" ? resumeTempSave(h.id) : openDetail(h.id)}
                      style={h.status === "임시저장" ? { opacity: 0.7, background: "var(--color-warning-light)" } : undefined}>
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td style={{ fontSize: 12 }}>{h.department || "-"}</td>
                      <td>{h.position || "-"}</td>
                      <td><span className={`${s.badge} ${typeBadge(h.type)}`}>{h.type}</span></td>
                      <td style={{ fontSize: 12 }}>{h.start_date || "-"}</td>
                      <td>{h.salary || "-"}</td>
                      <td><span className={`${s.badge} ${statusBadge(h.status)}`}>{h.status}</span></td>
                      <td>
                        {h.status === "임시저장" ? (
                          <span className={`${s.badge} ${s.badgeOrange}`} style={{ fontSize: 10 }}>작성중</span>
                        ) : missing ? (
                          <span className={`${s.badge} ${s.badgeRed}`}>서류미비</span>
                        ) : (
                          <span className={s.fileCount}>📎 {hFiles.length}</span>
                        )}
                      </td>
                      <td>
                        <button className={s.btnIcon} onClick={(e) => { e.stopPropagation(); remove(h.id); }}>🗑</button>
                      </td>
                    </tr>
                  );
                })}
                {list.length === 0 && (
                  <tr><td colSpan={9} className={s.empty}>
                    {search || statusFilter !== "전체" ? "검색 결과가 없습니다" : "등록된 구성원이 없습니다"}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* ════════ 근로계약관리 탭 ════════ */}
        {activeTab === "templates" && (
          <>
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 14 }}>
              고용형태별 근로계약서 양식을 관리합니다. 인원 추가 시 해당 양식이 자동 적용됩니다.
            </div>
            <div className={s.templateGrid}>
              {templates.map((t) => (
                <div key={t.type} className={s.templateCard}>
                  <div className={s.templateCardHeader}>
                    <div>
                      <div className={s.templateCardTitle}>{t.title}</div>
                      <span className={`${s.badge} ${typeBadge(t.type)}`} style={{ marginTop: 4 }}>{t.type}</span>
                    </div>
                  </div>
                  <div className={s.templateCardDesc}>{t.description}</div>
                  <div className={s.templateCardMeta}>수정일: {new Date(t.updatedAt).toLocaleString("ko-KR")}</div>
                  <div className={s.templateCardActions}>
                    <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={() => openTplEdit(t.type)}>수정</button>
                    <button className={`${s.btn} ${s.btnSmall}`} onClick={() => handleTplPreview(t.content)}>미리보기</button>
                    <button className={`${s.btn} ${s.btnSmall}`} onClick={() => resetTplToDefault(t.type)}>기본값 복원</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ════════ 비밀유지서약서 관리 탭 ════════ */}
        {activeTab === "nda" && (
          <>
            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 14 }}>
              비밀유지서약서 양식을 관리합니다. 인원 추가 시 자동으로 적용됩니다.
            </div>

            <div className={s.section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>비밀유지서약서 양식</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {!editingNda ? (
                    <>
                      <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={() => { setNdaEditContent(ndaContent); setNdaPreviewMode("edit"); setEditingNda(true); }}>수정</button>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => handleTplPreview(ndaContent)}>미리보기</button>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => { if (confirm("기본 양식으로 복원하시겠습니까?")) setNdaContent(ndaTemplate); }}>기본값 복원</button>
                    </>
                  ) : (
                    <>
                      <button className={s.btn} onClick={() => setEditingNda(false)}>취소</button>
                      <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => { setNdaContent(ndaEditContent); setEditingNda(false); }}>저장</button>
                    </>
                  )}
                </div>
              </div>

              {editingNda ? (
                <>
                  <div className={s.previewToggle}>
                    <button className={`${s.previewToggleBtn} ${ndaPreviewMode === "edit" ? s.previewToggleBtnActive : ""}`} onClick={() => setNdaPreviewMode("edit")}>HTML 편집</button>
                    <button className={`${s.previewToggleBtn} ${ndaPreviewMode === "preview" ? s.previewToggleBtnActive : ""}`} onClick={() => setNdaPreviewMode("preview")}>미리보기</button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 8 }}>
                    사용 가능한 변수: {`{{name}}, {{birth_date}}, {{address}}, {{position}}, {{company_name}}, {{contract_date}}`}
                  </div>
                  {ndaPreviewMode === "edit" ? (
                    <textarea className={s.contractEditor} value={ndaEditContent} onChange={(e) => setNdaEditContent(e.target.value)} style={{ minHeight: 400 }} />
                  ) : (
                    <div className={s.contractPreview}><iframe srcDoc={ndaEditContent} style={{ width: "100%", height: 400, border: "none" }} title="NDA 미리보기" /></div>
                  )}
                </>
              ) : (
                <div className={s.contractPreview}>
                  <iframe srcDoc={ndaContent} style={{ width: "100%", height: 400, border: "none" }} title="비밀유지서약서" />
                </div>
              )}
            </div>

            {/* 구성원별 NDA 현황 */}
            <div className={s.section} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>구성원별 서약서 현황</div>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>부서</th>
                    <th>직책</th>
                    <th>서약서 상태</th>
                    <th>파일</th>
                  </tr>
                </thead>
                <tbody>
                  {list.filter(h => h.status === "재직").map((h) => {
                    const ndaDoc = h.docs.find(d => d.name === "비밀유지서약서");
                    const ndaFile = files.find(f => f.contract_id === h.id && f.file_type === "NDA");
                    const hasNda = ndaDoc?.uploaded ?? false;
                    return (
                      <tr key={h.id}>
                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                        <td style={{ fontSize: 12 }}>{h.department || "-"}</td>
                        <td>{h.position}</td>
                        <td>
                          {hasNda
                            ? <span className={`${s.badge} ${s.badgeGreen}`}>제출완료</span>
                            : <span className={`${s.badge} ${s.badgeRed}`}>미제출</span>
                          }
                        </td>
                        <td>
                          {ndaFile ? (
                            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>📄 {ndaFile.file_name}</span>
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ════════ 구성원 상세 모달 ════════ */}
      {selectedId && selectedEmployee && editForm && (
        <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && closeDetail()}>
          <div className={s.modal} style={{ maxWidth: 860 }} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedEmployee.name}
                <span className={`${s.badge} ${typeBadge(selectedEmployee.type)}`}>{selectedEmployee.type}</span>
                <span className={`${s.badge} ${statusBadge(selectedEmployee.status)}`}>{selectedEmployee.status}</span>
                {isDocsMissing(selectedEmployee) && <span className={`${s.badge} ${s.badgeRed}`}>서류미비</span>}
              </span>
              <button className={s.modalClose} onClick={closeDetail}>✕</button>
            </div>

            <div className={s.modalStepper}>
              {([["info", "기본정보"], ["history", "계약이력"], ["documents", "서류관리"], ["payslips", "월임금명세서"]] as [DetailTab, string][]).map(([key, label]) => (
                <button key={key} className={`${s.modalStepItem} ${detailTab === key ? s.modalStepActive : ""}`}
                  style={{ cursor: "pointer", border: "none", background: "none", fontFamily: "inherit" }}
                  onClick={() => setDetailTab(key)}>{label}</button>
              ))}
            </div>

            <div className={s.modalBody}>

              {/* ══ 기본정보 탭 ══ */}
              {detailTab === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* 인적사항 */}
                  <div className={s.formRow}>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>이름</label>
                      <input className={s.formInput} value={editForm.name} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    </div>
                    <div className={s.formGroup}>
                      <label className={s.formLabel}>성별</label>
                      {detailEditing ? (
                        <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
                          {(["남", "여"] as const).map((g) => (
                            <label key={g} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                              <input type="radio" checked={editForm.gender === g} onChange={() => setEditForm({ ...editForm, gender: g })} /> {g}
                            </label>
                          ))}
                        </div>
                      ) : (<input className={s.formInput} value={editForm.gender} disabled />)}
                    </div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>생년월일</label><input className={s.formInput} type="date" value={editForm.birth_date} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, birth_date: e.target.value })} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>연락처</label><input className={s.formInput} value={editForm.phone} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>이메일</label><input className={s.formInput} value={editForm.email} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>주소</label><input className={s.formInput} value={editForm.address} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div>
                  </div>

                  <div className={s.formDivider} />

                  {/* 근무정보 */}
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>부서</label><input className={s.formInput} value={editForm.department} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>직책</label><input className={s.formInput} value={editForm.position} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} /></div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>고용형태</label>{detailEditing ? (<select className={s.formInput} value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as HrContract["type"] })}><option value="임원">임원</option><option value="정규직">정규직</option><option value="계약직">계약직</option><option value="파트타임">파트타임</option><option value="인턴">인턴</option></select>) : (<input className={s.formInput} value={editForm.type} disabled />)}</div>
                    <div className={s.formGroup}><label className={s.formLabel}>상태</label>{detailEditing ? (<select className={s.formInput} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as HrContract["status"] })}><option value="재직">재직</option><option value="퇴직">퇴직</option><option value="휴직">휴직</option></select>) : (<input className={s.formInput} value={editForm.status} disabled />)}</div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>급여</label><input className={s.formInput} value={editForm.salary} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>급여 계좌</label><input className={s.formInput} value={editForm.bank_info} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, bank_info: e.target.value })} /></div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>입사일</label><input className={s.formInput} type="date" value={editForm.start_date} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>퇴사일/종료일</label><input className={s.formInput} type="date" value={editForm.end_date ?? ""} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value || null })} /></div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>비상연락처</label><input className={s.formInput} value={editForm.emergency_contact} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>메모</label><input className={s.formInput} value={editForm.memo} disabled={!detailEditing} onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })} /></div>
                  </div>

                  <div className={s.formDivider} />

                  {/* 학력사항 */}
                  <SectionHeader title="학력사항" onAdd={addEducation} editing={detailEditing} />
                  {editForm.educations.length > 0 ? (
                    <table className={s.table}>
                      <thead><tr><th>학교명</th><th>전공</th><th>학위</th><th>졸업년도</th><th>상태</th>{detailEditing && <th style={{ width: 28 }}></th>}</tr></thead>
                      <tbody>
                        {editForm.educations.map((edu) => (
                          <tr key={edu.id}>
                            <td><input className={s.tableInput} value={edu.school_name} disabled={!detailEditing} onChange={(e) => updateEducation(edu.id, "school_name", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={edu.major} disabled={!detailEditing} onChange={(e) => updateEducation(edu.id, "major", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={edu.degree} disabled={!detailEditing} onChange={(e) => updateEducation(edu.id, "degree", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={edu.graduation_year} disabled={!detailEditing} onChange={(e) => updateEducation(edu.id, "graduation_year", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={edu.status} disabled={!detailEditing} onChange={(e) => updateEducation(edu.id, "status", e.target.value)} /></td>
                            {detailEditing && <td><button className={s.btnIcon} onClick={() => removeEducation(edu.id)}>🗑</button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (<div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "4px 0" }}>등록된 학력이 없습니다</div>)}

                  <div className={s.formDivider} />

                  {/* 경력사항 */}
                  <SectionHeader title="경력사항" onAdd={addCareer} editing={detailEditing} />
                  {editForm.careers.length > 0 ? (
                    <table className={s.table}>
                      <thead><tr><th>회사명</th><th>직위</th><th>시작</th><th>종료</th><th>업무내용</th>{detailEditing && <th style={{ width: 28 }}></th>}</tr></thead>
                      <tbody>
                        {editForm.careers.map((car) => (
                          <tr key={car.id}>
                            <td><input className={s.tableInput} value={car.company_name} disabled={!detailEditing} onChange={(e) => updateCareer(car.id, "company_name", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={car.position} disabled={!detailEditing} onChange={(e) => updateCareer(car.id, "position", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={car.start_date} disabled={!detailEditing} placeholder="YYYY-MM" onChange={(e) => updateCareer(car.id, "start_date", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={car.end_date} disabled={!detailEditing} placeholder="재직중" onChange={(e) => updateCareer(car.id, "end_date", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={car.description} disabled={!detailEditing} onChange={(e) => updateCareer(car.id, "description", e.target.value)} /></td>
                            {detailEditing && <td><button className={s.btnIcon} onClick={() => removeCareer(car.id)}>🗑</button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (<div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "4px 0" }}>등록된 경력이 없습니다</div>)}

                  <div className={s.formDivider} />

                  {/* 자격정보 */}
                  <SectionHeader title="자격정보" onAdd={addQualification} editing={detailEditing} />
                  {editForm.qualifications.length > 0 ? (
                    <table className={s.table}>
                      <thead><tr><th>자격증명</th><th>발급기관</th><th>취득일</th><th>자격번호</th>{detailEditing && <th style={{ width: 28 }}></th>}</tr></thead>
                      <tbody>
                        {editForm.qualifications.map((q) => (
                          <tr key={q.id}>
                            <td><input className={s.tableInput} value={q.name} disabled={!detailEditing} onChange={(e) => updateQualification(q.id, "name", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={q.issuer} disabled={!detailEditing} onChange={(e) => updateQualification(q.id, "issuer", e.target.value)} /></td>
                            <td><input className={s.tableInput} type="date" value={q.acquired_date} disabled={!detailEditing} onChange={(e) => updateQualification(q.id, "acquired_date", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={q.certificate_number} disabled={!detailEditing} onChange={(e) => updateQualification(q.id, "certificate_number", e.target.value)} /></td>
                            {detailEditing && <td><button className={s.btnIcon} onClick={() => removeQualification(q.id)}>🗑</button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (<div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "4px 0" }}>등록된 자격이 없습니다</div>)}

                  <div className={s.formDivider} />

                  {/* 수상경력 */}
                  <SectionHeader title="수상경력" onAdd={addAward} editing={detailEditing} />
                  {editForm.awards.length > 0 ? (
                    <table className={s.table}>
                      <thead><tr><th>수상명</th><th>수여기관</th><th>수상일</th><th>설명</th>{detailEditing && <th style={{ width: 28 }}></th>}</tr></thead>
                      <tbody>
                        {editForm.awards.map((a) => (
                          <tr key={a.id}>
                            <td><input className={s.tableInput} value={a.title} disabled={!detailEditing} onChange={(e) => updateAward(a.id, "title", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={a.issuer} disabled={!detailEditing} onChange={(e) => updateAward(a.id, "issuer", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={a.date} disabled={!detailEditing} placeholder="YYYY-MM" onChange={(e) => updateAward(a.id, "date", e.target.value)} /></td>
                            <td><input className={s.tableInput} value={a.description} disabled={!detailEditing} onChange={(e) => updateAward(a.id, "description", e.target.value)} /></td>
                            {detailEditing && <td><button className={s.btnIcon} onClick={() => removeAward(a.id)}>🗑</button></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (<div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "4px 0" }}>등록된 수상경력이 없습니다</div>)}
                </div>
              )}

              {/* ══ 계약이력 탭 ══ */}
              {detailTab === "history" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                    <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={openRenewal}>+ 계약갱신</button>
                  </div>
                  <table className={s.table}>
                    <thead><tr><th>유형</th><th>고용형태</th><th>시작일</th><th>종료일</th><th>급여</th><th>메모</th><th>등록일</th><th style={{ width: 28 }}></th></tr></thead>
                    <tbody>
                      {getHistory(selectedId!).map((h) => (
                        <tr key={h.id}>
                          <td><span className={`${s.badge} ${historyTypeBadge(h.type)}`}>{h.type}</span></td>
                          <td><span className={`${s.badge} ${typeBadge(h.contract_type)}`}>{h.contract_type}</span></td>
                          <td style={{ fontSize: 12 }}>{h.start_date}</td>
                          <td style={{ fontSize: 12 }}>{h.end_date ?? <span style={{ color: "#ccc" }}>-</span>}</td>
                          <td>{h.salary}</td>
                          <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{h.memo || "-"}</td>
                          <td style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{h.created_at}</td>
                          <td><button className={s.btnIcon} onClick={() => deleteHistory(h.id)}>🗑</button></td>
                        </tr>
                      ))}
                      {getHistory(selectedId!).length === 0 && (<tr><td colSpan={8} className={s.empty}>계약 이력이 없습니다</td></tr>)}
                    </tbody>
                  </table>

                  {/* 계약갱신 인라인 모달 */}
                  {showRenewal && (
                    <div style={{ marginTop: 14, padding: 16, background: "var(--color-bg)", borderRadius: 10, border: "1px solid var(--color-border)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>계약갱신</div>
                      <div className={s.formRow}>
                        <div className={s.formGroup}>
                          <label className={s.formLabel}>고용형태</label>
                          <select className={s.formInput} value={renewalForm.type} onChange={(e) => setRenewalForm({ ...renewalForm, type: e.target.value as HrContract["type"] })}>
                            <option value="임원">임원</option><option value="정규직">정규직</option><option value="계약직">계약직</option><option value="파트타임">파트타임</option><option value="인턴">인턴</option>
                          </select>
                        </div>
                        <div className={s.formGroup}>
                          <label className={s.formLabel}>급여 *</label>
                          <input className={s.formInput} value={renewalForm.salary} onChange={(e) => setRenewalForm({ ...renewalForm, salary: e.target.value })} placeholder="4,200만원" />
                        </div>
                      </div>
                      <div className={s.formRow} style={{ marginTop: 8 }}>
                        <div className={s.formGroup}>
                          <label className={s.formLabel}>시작일 *</label>
                          <input className={s.formInput} type="date" value={renewalForm.start_date} onChange={(e) => setRenewalForm({ ...renewalForm, start_date: e.target.value })} />
                        </div>
                        <div className={s.formGroup}>
                          <label className={s.formLabel}>종료일</label>
                          <input className={s.formInput} type="date" value={renewalForm.end_date} onChange={(e) => setRenewalForm({ ...renewalForm, end_date: e.target.value })} />
                        </div>
                      </div>
                      <div className={s.formGroup} style={{ marginTop: 8 }}>
                        <label className={s.formLabel}>메모</label>
                        <input className={s.formInput} value={renewalForm.memo} onChange={(e) => setRenewalForm({ ...renewalForm, memo: e.target.value })} placeholder="정규직 전환, 연봉 인상 등" />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 12 }}>
                        <button className={s.btn} onClick={() => setShowRenewal(false)}>취소</button>
                        <button className={`${s.btn} ${s.btnPrimary}`} onClick={submitRenewal} disabled={!renewalForm.salary || !renewalForm.start_date}>갱신</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ 서류관리 탭 ══ */}
              {detailTab === "documents" && (
                <div>
                  {/* 필수서류 체크 */}
                  {isDocsMissing(selectedEmployee) && (
                    <div style={{ padding: "10px 14px", background: "var(--color-danger-light)", borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, color: "var(--color-danger)" }}>
                      <span>⚠️ 필수 서류 미비:</span>
                      {getMissingDocs(selectedEmployee).map((d, i) => (
                        <span key={i} className={`${s.badge} ${s.badgeRed}`}>{d}</span>
                      ))}
                    </div>
                  )}

                  {/* 서류 체크리스트 */}
                  <div style={{ padding: 14, background: "var(--color-bg)", borderRadius: 8, marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 8 }}>필수 서류 현황</div>
                    {REQUIRED_DOCS.map((docName, i) => {
                      const doc = selectedEmployee.docs.find((d) => d.name === docName);
                      const ok = doc?.uploaded ?? false;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12.5 }}>
                          <span style={{ color: ok ? "var(--color-success)" : "var(--color-danger)" }}>{ok ? "✅" : "❌"}</span>
                          <span style={{ color: ok ? "var(--color-text)" : "var(--color-danger)", fontWeight: ok ? 400 : 600 }}>
                            {docName} {!ok && "(미제출)"}
                          </span>
                          {ok && <span className={`${s.badge} ${s.badgeGreen}`} style={{ fontSize: 10 }}>완료</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* 전체 첨부파일 */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)" }}>첨부파일 목록</span>
                    <button className={`${s.btn} ${s.btnSmall}`}>+ 파일 업로드</button>
                  </div>
                  {getFiles(selectedId!).length > 0 ? (
                    <div className={s.fileList}>
                      {getFiles(selectedId!).map((f) => (
                        <div key={f.id} className={s.fileItem}>
                          <span className={s.fileIcon}>📄</span>
                          <span className={s.fileName}>{f.file_name}</span>
                          <span className={s.fileType}><span className={`${s.badge} ${fileTypeBadge(f.file_type)}`}>{f.file_type}</span></span>
                          <span className={s.fileMeta}>{fmtSize(f.file_size)}</span>
                          <span className={s.fileMeta}>{f.uploaded_at}</span>
                          <div className={s.fileActions}><button className={s.btnIcon} onClick={() => removeFile(f.id)}>🗑</button></div>
                        </div>
                      ))}
                    </div>
                  ) : (<div className={s.emptyFiles}>첨부된 서류가 없습니다</div>)}
                </div>
              )}

              {/* ══ 월임금명세서 탭 ══ */}
              {detailTab === "payslips" && (() => {
                const yearSlips = getPayslips(selectedId!, payslipYear);
                const parseNum = (v: string) => { const n = Number(v.replace(/[^0-9.-]/g, "")); return isNaN(n) ? 0 : n; };
                const totalBase = yearSlips.reduce((sum, p) => sum + parseNum(p.base_salary), 0);
                const totalDed = yearSlips.reduce((sum, p) => sum + parseNum(p.deductions), 0);
                const totalNet = yearSlips.reduce((sum, p) => sum + parseNum(p.net_pay), 0);
                const fmt = (n: number) => n ? n.toLocaleString() : "-";
                return (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setPayslipYear(payslipYear - 1)}>◀</button>
                      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 60, textAlign: "center" }}>{payslipYear}년</span>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setPayslipYear(payslipYear + 1)}>▶</button>
                    </div>
                    <button className={`${s.btn} ${s.btnSmall}`} onClick={openPayslipAdd}>+ 명세서 추가</button>
                  </div>

                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>월</th><th>기본급</th><th>공제액</th><th>실수령액</th><th>파일</th><th>발급일</th><th>메모</th><th style={{ width: 28 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const slip = yearSlips.find((p) => p.month === month);
                        return (
                          <tr key={month} style={{ opacity: slip ? 1 : 0.35 }}>
                            <td style={{ fontWeight: 600 }}>{month}월</td>
                            <td>{slip?.base_salary ?? "-"}</td>
                            <td>{slip?.deductions ?? "-"}</td>
                            <td style={{ fontWeight: slip ? 600 : 400 }}>{slip?.net_pay ?? "-"}</td>
                            <td>{slip ? <span style={{ fontSize: 11, color: "var(--color-primary)" }}>📄 {slip.file_name.split("_").pop()}</span> : "-"}</td>
                            <td style={{ fontSize: 11 }}>{slip?.issued_at ?? "-"}</td>
                            <td style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{slip?.memo || ""}</td>
                            <td>{slip && <button className={s.btnIcon} onClick={() => deletePayslip(slip.id)}>🗑</button>}</td>
                          </tr>
                        );
                      })}
                      {/* 연간 합계 */}
                      {yearSlips.length > 0 && (
                        <tr style={{ fontWeight: 700, background: "var(--color-bg)" }}>
                          <td>합계</td>
                          <td>{fmt(totalBase)}</td>
                          <td>{fmt(totalDed)}</td>
                          <td>{fmt(totalNet)}</td>
                          <td colSpan={4} style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                            {payslipYear}년 발급: {yearSlips.length}건 / 12개월
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* 명세서 추가 인라인 폼 */}
                  {showPayslipAdd && (
                    <div style={{ marginTop: 14, padding: 16, background: "var(--color-bg)", borderRadius: 10, border: "1px solid var(--color-border)" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{payslipYear}년 명세서 추가</div>
                      <div className={s.formRow}>
                        <div className={s.formGroup}>
                          <label className={s.formLabel}>월 *</label>
                          <select className={s.formInput} value={payslipForm.month} onChange={(e) => setPayslipForm({ ...payslipForm, month: Number(e.target.value) })}>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                              <option key={m} value={m} disabled={yearSlips.some(p => p.month === m)}>{m}월{yearSlips.some(p => p.month === m) ? " (등록됨)" : ""}</option>
                            ))}
                          </select>
                        </div>
                        <div className={s.formGroup}>
                          <label className={s.formLabel}>기본급 *</label>
                          <input className={s.formInput} value={payslipForm.base_salary} onChange={(e) => setPayslipForm({ ...payslipForm, base_salary: e.target.value })} placeholder="3,500,000" />
                        </div>
                      </div>
                      <div className={s.formRow} style={{ marginTop: 8 }}>
                        <div className={s.formGroup}>
                          <label className={s.formLabel}>공제액</label>
                          <input className={s.formInput} value={payslipForm.deductions} onChange={(e) => setPayslipForm({ ...payslipForm, deductions: e.target.value })} placeholder="490,000" />
                        </div>
                        <div className={s.formGroup}>
                          <label className={s.formLabel}>실수령액</label>
                          <input className={s.formInput} value={payslipForm.net_pay} onChange={(e) => setPayslipForm({ ...payslipForm, net_pay: e.target.value })} placeholder="3,010,000" />
                        </div>
                      </div>
                      <div className={s.formGroup} style={{ marginTop: 8 }}>
                        <label className={s.formLabel}>메모</label>
                        <input className={s.formInput} value={payslipForm.memo} onChange={(e) => setPayslipForm({ ...payslipForm, memo: e.target.value })} placeholder="특이사항" />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 12 }}>
                        <button className={s.btn} onClick={() => setShowPayslipAdd(false)}>취소</button>
                        <button className={`${s.btn} ${s.btnPrimary}`} onClick={submitPayslip} disabled={!payslipForm.base_salary}>추가</button>
                      </div>
                    </div>
                  )}
                </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className={s.modalFooter}>
              <div />
              <div style={{ display: "flex", gap: 6 }}>
                {detailTab === "info" && !detailEditing && (
                  <button className={`${s.btn} ${s.btnPrimary}`} onClick={startEdit}>수정</button>
                )}
                {detailTab === "info" && detailEditing && (
                  <>
                    <button className={s.btn} onClick={cancelEdit}>취소</button>
                    <button className={`${s.btn} ${s.btnPrimary}`} onClick={saveDetail}>저장</button>
                  </>
                )}
                {detailTab !== "info" && (
                  <button className={s.btn} onClick={closeDetail}>닫기</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && <HrContractModal
        onClose={() => { setShowAdd(false); setResumeId(null); }}
        onSave={handleSaveEmployee}
        onTempSave={handleTempSaveEmployee}
        resumeData={resumeId ? tempSaveMap[resumeId] ?? null : null}
      />}

      {/* 양식 편집 모달 */}
      {editingType && editingTemplate && (
        <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && setEditingType(null)}>
          <div className={s.modal} style={{ maxWidth: 820 }} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span>{editingTemplate.title} 편집</span>
              <button className={s.modalClose} onClick={() => setEditingType(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.previewToggle}>
                <button className={`${s.previewToggleBtn} ${tplPreviewMode === "edit" ? s.previewToggleBtnActive : ""}`} onClick={() => setTplPreviewMode("edit")}>HTML 편집</button>
                <button className={`${s.previewToggleBtn} ${tplPreviewMode === "preview" ? s.previewToggleBtnActive : ""}`} onClick={() => setTplPreviewMode("preview")}>미리보기</button>
              </div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 8 }}>
                사용 가능한 변수: {`{{name}}, {{birth_date}}, {{address}}, {{position}}, {{salary}}, {{start_date}}, {{end_date}}, {{company_name}}, {{company_address}}, {{contract_date}}`}
              </div>
              {tplPreviewMode === "edit" ? (
                <textarea className={s.contractEditor} value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ minHeight: 450 }} />
              ) : (
                <div className={s.contractPreview}><iframe srcDoc={editContent} style={{ width: "100%", height: 450, border: "none" }} title="양식 미리보기" /></div>
              )}
            </div>
            <div className={s.modalFooter}>
              <button className={s.btn} onClick={() => resetTplToDefault(editingType)}>기본값 복원</button>
              <div style={{ display: "flex", gap: 6 }}>
                <button className={s.btn} onClick={() => setEditingType(null)}>취소</button>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={saveTplEdit}>저장</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
