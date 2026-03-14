import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import type { HrContract, ContractFile } from "@/data/dummy-contracts";
import {
  type ContractTemplateType,
  fillTemplate,
  getTemplateByType,
  ndaTemplate,
} from "@/data/contract-templates";

type FormType = HrContract["type"];

interface AddForm {
  name: string;
  gender: "남" | "여";
  birth_date: string;
  address: string;
  phone: string;
  email: string;
  position: string;
  department: string;
  type: FormType;
  start_date: string;
  end_date: string;
  salary: string;
  bank_info: string;
  emergency_contact: string;
  contract_file: File | null;
  id_file: File | null;
  bank_file: File | null;
  etc_files: File[];
}

const emptyForm: AddForm = {
  name: "", gender: "남", birth_date: "", address: "",
  phone: "", email: "", position: "", department: "",
  type: "정규직", start_date: "", end_date: "",
  salary: "", bank_info: "", emergency_contact: "",
  contract_file: null, id_file: null, bank_file: null, etc_files: [],
};

const fmtSize = (b: number) =>
  b < 1024 * 1024 ? Math.round(b / 1024) + "KB" : (b / 1024 / 1024).toFixed(1) + "MB";

const typeDescriptions: Record<FormType, { icon: string; desc: string }> = {
  "정규직": { icon: "👔", desc: "무기한 근로계약 / 연봉제 / 퇴직금 적용" },
  "계약직": { icon: "📋", desc: "기간제 근로계약 / 월급제 / 갱신조건 포함" },
  "파트타임": { icon: "⏰", desc: "단시간 근로계약 / 시급 또는 월급 / 근무시간 명시" },
  "인턴": { icon: "🎓", desc: "수습 계약 / 평가 후 정규직 전환 가능" },
};

const steps = ["고용형태", "직원정보", "근로계약서", "비밀유지서약서", "완료"];

export interface TempSaveData {
  employee: HrContract;
  files: ContractFile[];
  step: number;
  contractHtml: string;
  ndaHtml: string;
}

interface Props {
  onClose: () => void;
  onSave: (employee: HrContract, files: ContractFile[]) => void;
  onTempSave: (data: TempSaveData) => void;
  resumeData?: TempSaveData | null;
}

export default function HrContractModal({ onClose, onSave, onTempSave, resumeData }: Props) {
  const [step, setStep] = useState(resumeData?.step ?? 1);
  const [form, setForm] = useState<AddForm>(() => {
    if (resumeData) {
      const e = resumeData.employee;
      return { ...emptyForm, name: e.name, gender: e.gender, birth_date: e.birth_date, address: e.address, phone: e.phone, email: e.email, position: e.position, department: e.department, type: e.type, start_date: e.start_date, end_date: e.end_date ?? "", salary: e.salary, bank_info: e.bank_info, emergency_contact: e.emergency_contact };
    }
    return { ...emptyForm };
  });
  const [employeeId] = useState(() => resumeData?.employee.id ?? `hr-${Date.now()}`);
  const [contractHtml, setContractHtml] = useState(resumeData?.contractHtml ?? "");
  const [ndaHtml, setNdaHtml] = useState(resumeData?.ndaHtml ?? "");
  const [contractPreviewMode, setContractPreviewMode] = useState<"preview" | "edit">("preview");
  const [ndaPreviewMode, setNdaPreviewMode] = useState<"preview" | "edit">("preview");
  const [tempSaved, setTempSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectType = (type: FormType) => {
    setForm({ ...form, type });
    setStep(2);
  };

  const getTemplateData = () => {
    const today = new Date();
    return {
      name: form.name,
      birth_date: form.birth_date,
      address: form.address,
      position: form.position,
      salary: form.salary,
      start_date: form.start_date,
      end_date: form.end_date || "정함이 없음",
      company_name: "와이디랩",
      company_address: "경기 화성시 동탄영천로 150 B동 12층 1210호",
      contract_date: `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`,
    };
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "이름을 입력하세요";
    if (!form.position.trim()) errs.position = "직책을 입력하세요";
    if (!form.start_date) errs.start_date = "입사일을 입력하세요";
    if (!form.salary.trim()) errs.salary = "급여를 입력하세요";
    if (form.type !== "정규직" && !form.end_date) errs.end_date = `${form.type}은 계약종료일 필수`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const FieldError = ({ field }: { field: string }) => errors[field]
    ? <span style={{ fontSize: 11, color: "var(--color-danger)", marginTop: 2 }}>{errors[field]}</span>
    : null;

  // Step 2 → Step 3
  const goToContract = () => {
    if (!validateStep2()) return;
    const template = getTemplateByType(form.type);
    const data = getTemplateData();
    setContractHtml(fillTemplate(template.content, data));
    setContractPreviewMode("preview");
    setStep(3);
  };

  // Step 3 → Step 4
  const goToNda = () => {
    const data = getTemplateData();
    setNdaHtml(fillTemplate(ndaTemplate, data));
    setNdaPreviewMode("preview");
    setStep(4);
  };

  const handlePrint = (html: string) => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) { alert("팝업이 차단되었습니다."); return; }
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  const buildEmployee = (status: HrContract["status"]): HrContract => ({
    id: employeeId,
    name: form.name.trim() || "(이름 미입력)",
    gender: form.gender,
    birth_date: form.birth_date,
    address: form.address.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    position: form.position.trim() || "(미정)",
    department: form.department.trim(),
    type: form.type,
    start_date: form.start_date,
    end_date: form.end_date || null,
    status,
    salary: form.salary.trim(),
    bank_info: form.bank_info.trim(),
    emergency_contact: form.emergency_contact.trim(),
    memo: "",
    educations: [],
    careers: [],
    qualifications: [],
    awards: [],
    docs: status === "임시저장" ? [] : [
      { name: "근로계약서", uploaded: true },
      { name: "비밀유지서약서", uploaded: true },
    ],
  });

  const handleTempSave = () => {
    const emp = buildEmployee("임시저장");
    onTempSave({ employee: emp, files: [], step, contractHtml, ndaHtml });
    setTempSaved(true);
    setTimeout(() => setTempSaved(false), 2000);
  };

  const handleSave = () => {
    const newId = employeeId;
    const newHr = buildEmployee("재직");

    const now = new Date().toISOString().slice(0, 10);
    const newFiles: ContractFile[] = [];
    let ts = Date.now();

    // 근로계약서 자동 생성
    newFiles.push({
      id: `cf-${ts++}`, contract_id: newId, contract_type: "hr",
      file_name: `근로계약서_${form.name.trim()}.html`, file_type: "계약서",
      file_size: new Blob([contractHtml]).size, uploaded_at: now,
    });
    // 비밀유지서약서 자동 생성
    newFiles.push({
      id: `cf-${ts++}`, contract_id: newId, contract_type: "hr",
      file_name: `비밀유지서약서_${form.name.trim()}.html`, file_type: "NDA",
      file_size: new Blob([ndaHtml]).size, uploaded_at: now,
    });

    const addFile = (file: File, fileType: ContractFile["file_type"], docName: string) => {
      newFiles.push({ id: `cf-${ts++}`, contract_id: newId, contract_type: "hr", file_name: file.name, file_type: fileType, file_size: file.size, uploaded_at: now });
      newHr.docs.push({ name: docName, uploaded: true });
    };

    if (form.contract_file) addFile(form.contract_file, "계약서", "근로계약서(첨부)");
    if (form.id_file) addFile(form.id_file, "신분증", "신분증 사본");
    if (form.bank_file) addFile(form.bank_file, "통장사본", "통장사본");
    form.etc_files.forEach((f) => addFile(f, "기타", f.name));

    onSave(newHr, newFiles);
  };

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={s.modalHeader}>
          <span>
            {step === 1 ? "직원 추가" : step === 2 ? "직원정보 입력" : step === 3 ? "근로계약서 확인" : step === 4 ? "비밀유지서약서 확인" : "완료"}
          </span>
          <button className={s.modalClose} onClick={onClose}>✕</button>
        </div>

        {/* Stepper */}
        <div className={s.modalStepper}>
          {steps.map((label, i) => {
            const n = i + 1;
            const isDone = step > n;
            const isActive = step === n;
            return (
              <div key={label} className={`${s.modalStepItem} ${isActive ? s.modalStepActive : ""} ${isDone ? s.modalStepDone : ""}`}>
                <span className={s.modalStepNum}>{isDone ? "✓" : n}</span>
                {label}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className={s.modalBody}>

          {/* ── Step 1: 고용형태 선택 ── */}
          {step === 1 && (
            <div className={s.typeGrid}>
              {(["정규직", "계약직", "파트타임", "인턴"] as FormType[]).map((type) => {
                const d = typeDescriptions[type];
                return (
                  <div key={type} className={`${s.typeCard} ${form.type === type ? s.typeCardActive : ""}`} onClick={() => selectType(type)}>
                    <div className={s.typeCardTitle}><span>{d.icon}</span> {type}</div>
                    <div className={s.typeCardDesc}>{d.desc}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Step 2: 직원정보 입력 ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>이름 <span style={{ color: "var(--color-danger)" }}>*</span></label>
                  <input className={s.formInput} value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors((p) => { const n = { ...p }; delete n.name; return n; }); }} placeholder="홍길동" style={errors.name ? { borderColor: "var(--color-danger)" } : undefined} />
                  <FieldError field="name" />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>성별</label>
                  <div style={{ display: "flex", gap: 10, paddingTop: 6 }}>
                    {(["남", "여"] as const).map((g) => (
                      <label key={g} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                        <input type="radio" checked={form.gender === g} onChange={() => setForm({ ...form, gender: g })} /> {g}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>생년월일</label><input className={s.formInput} type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
                <div className={s.formGroup}><label className={s.formLabel}>연락처</label><input className={s.formInput} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" /></div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>이메일</label><input className={s.formInput} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" /></div>
                <div className={s.formGroup}><label className={s.formLabel}>부서</label><input className={s.formInput} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="디자인, 개발 등" /></div>
              </div>
              <div className={s.formGroup}><label className={s.formLabel}>주소</label><input className={s.formInput} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="서울시 강남구..." /></div>

              <div className={s.formDivider} />

              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>고용형태</label><input className={s.formInput} value={form.type} disabled /></div>
                <div className={s.formGroup}><label className={s.formLabel}>직책 <span style={{ color: "var(--color-danger)" }}>*</span></label><input className={s.formInput} value={form.position} onChange={(e) => { setForm({ ...form, position: e.target.value }); setErrors((p) => { const n = { ...p }; delete n.position; return n; }); }} placeholder="팀장, 개발자 등" style={errors.position ? { borderColor: "var(--color-danger)" } : undefined} /><FieldError field="position" /></div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>{form.type === "정규직" ? "연봉" : "월 급여"} <span style={{ color: "var(--color-danger)" }}>*</span></label><input className={s.formInput} value={form.salary} onChange={(e) => { setForm({ ...form, salary: e.target.value }); setErrors((p) => { const n = { ...p }; delete n.salary; return n; }); }} placeholder={form.type === "정규직" ? "4,200만원" : "400만원"} style={errors.salary ? { borderColor: "var(--color-danger)" } : undefined} /><FieldError field="salary" /></div>
                <div className={s.formGroup}><label className={s.formLabel}>급여 계좌</label><input className={s.formInput} value={form.bank_info} onChange={(e) => setForm({ ...form, bank_info: e.target.value })} placeholder="은행명 계좌번호" /></div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>입사일 <span style={{ color: "var(--color-danger)" }}>*</span></label><input className={s.formInput} type="date" value={form.start_date} onChange={(e) => { setForm({ ...form, start_date: e.target.value }); setErrors((p) => { const n = { ...p }; delete n.start_date; return n; }); }} style={errors.start_date ? { borderColor: "var(--color-danger)" } : undefined} /><FieldError field="start_date" /></div>
                <div className={s.formGroup}><label className={s.formLabel}>계약종료일{form.type !== "정규직" && <span style={{ color: "var(--color-danger)" }}> *</span>}</label><input className={s.formInput} type="date" value={form.end_date} onChange={(e) => { setForm({ ...form, end_date: e.target.value }); setErrors((p) => { const n = { ...p }; delete n.end_date; return n; }); }} disabled={form.type === "정규직"} style={errors.end_date ? { borderColor: "var(--color-danger)" } : undefined} /><FieldError field="end_date" /></div>
              </div>
              <div className={s.formGroup}><label className={s.formLabel}>비상연락처</label><input className={s.formInput} value={form.emergency_contact} onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })} placeholder="관계 010-0000-0000" /></div>

              <div className={s.formDivider} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>첨부서류</div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>계약서</label><input type="file" accept=".pdf,.doc,.docx,.hwp,.jpg,.png" style={{ fontSize: 11 }} onChange={(e) => setForm({ ...form, contract_file: e.target.files?.[0] ?? null })} />{form.contract_file && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{form.contract_file.name} ({fmtSize(form.contract_file.size)})</span>}</div>
                <div className={s.formGroup}><label className={s.formLabel}>신분증 사본</label><input type="file" accept=".pdf,.jpg,.png,.jpeg" style={{ fontSize: 11 }} onChange={(e) => setForm({ ...form, id_file: e.target.files?.[0] ?? null })} />{form.id_file && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{form.id_file.name} ({fmtSize(form.id_file.size)})</span>}</div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>통장사본</label><input type="file" accept=".pdf,.jpg,.png,.jpeg" style={{ fontSize: 11 }} onChange={(e) => setForm({ ...form, bank_file: e.target.files?.[0] ?? null })} />{form.bank_file && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{form.bank_file.name} ({fmtSize(form.bank_file.size)})</span>}</div>
                <div className={s.formGroup}><label className={s.formLabel}>기타 첨부파일</label><input type="file" multiple accept=".pdf,.doc,.docx,.hwp,.jpg,.png,.xlsx,.zip" style={{ fontSize: 11 }} onChange={(e) => setForm({ ...form, etc_files: e.target.files ? Array.from(e.target.files) : [] })} />{form.etc_files.length > 0 && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{form.etc_files.length}개 파일</span>}</div>
              </div>
            </div>
          )}

          {/* ── Step 3: 근로계약서 확인 ── */}
          {step === 3 && (
            <div>
              <div className={s.previewToggle}>
                <button className={`${s.previewToggleBtn} ${contractPreviewMode === "preview" ? s.previewToggleBtnActive : ""}`} onClick={() => setContractPreviewMode("preview")}>미리보기</button>
                <button className={`${s.previewToggleBtn} ${contractPreviewMode === "edit" ? s.previewToggleBtnActive : ""}`} onClick={() => setContractPreviewMode("edit")}>직접편집</button>
              </div>
              {contractPreviewMode === "preview" ? (
                <div className={s.contractPreview}>
                  <iframe srcDoc={contractHtml} style={{ width: "100%", height: 440, border: "none" }} title="근로계약서 미리보기" />
                </div>
              ) : (
                <textarea className={s.contractEditor} value={contractHtml} onChange={(e) => setContractHtml(e.target.value)} />
              )}
            </div>
          )}

          {/* ── Step 4: 비밀유지서약서 확인 ── */}
          {step === 4 && (
            <div>
              <div className={s.previewToggle}>
                <button className={`${s.previewToggleBtn} ${ndaPreviewMode === "preview" ? s.previewToggleBtnActive : ""}`} onClick={() => setNdaPreviewMode("preview")}>미리보기</button>
                <button className={`${s.previewToggleBtn} ${ndaPreviewMode === "edit" ? s.previewToggleBtnActive : ""}`} onClick={() => setNdaPreviewMode("edit")}>직접편집</button>
              </div>
              {ndaPreviewMode === "preview" ? (
                <div className={s.contractPreview}>
                  <iframe srcDoc={ndaHtml} style={{ width: "100%", height: 440, border: "none" }} title="비밀유지서약서 미리보기" />
                </div>
              ) : (
                <textarea className={s.contractEditor} value={ndaHtml} onChange={(e) => setNdaHtml(e.target.value)} />
              )}
            </div>
          )}

          {/* ── Step 5: 완료 ── */}
          {step === 5 && (
            <div>
              <div style={{ textAlign: "center", padding: "10px 0 16px", fontSize: 32 }}>✅</div>
              <div style={{ textAlign: "center", fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
                근로계약서 및 비밀유지서약서가 준비되었습니다
              </div>

              <div className={s.summaryRow}>
                <div className={s.summaryItem}><span className={s.summaryLabel}>이름</span><span className={s.summaryValue}>{form.name}</span></div>
                <div className={s.summaryItem}><span className={s.summaryLabel}>고용형태</span><span className={s.summaryValue}>{form.type}</span></div>
                <div className={s.summaryItem}><span className={s.summaryLabel}>입사일</span><span className={s.summaryValue}>{form.start_date}</span></div>
                <div className={s.summaryItem}><span className={s.summaryLabel}>급여</span><span className={s.summaryValue}>{form.salary}</span></div>
              </div>

              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
                <button className={s.btn} onClick={() => handlePrint(contractHtml)}>🖨️ 근로계약서 인쇄</button>
                <button className={s.btn} onClick={() => handlePrint(ndaHtml)}>🖨️ 비밀유지서약서 인쇄</button>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={handleSave}>직원 추가 및 저장</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 5 && (
          <div className={s.modalFooter}>
            <div style={{ display: "flex", gap: 6 }}>
              {step > 1 && (
                <button className={s.btn} onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}>← 이전</button>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {tempSaved && <span style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 600 }}>임시저장 완료</span>}
              {step >= 2 && (
                <button className={s.btn} onClick={handleTempSave} style={{ color: "var(--color-text-secondary)" }}>
                  💾 임시저장
                </button>
              )}
              <button className={s.btn} onClick={onClose}>취소</button>
              {step === 2 && <button className={`${s.btn} ${s.btnPrimary}`} onClick={goToContract}>다음 →</button>}
              {step === 3 && <button className={`${s.btn} ${s.btnPrimary}`} onClick={goToNda}>다음 →</button>}
              {step === 4 && <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => setStep(5)}>다음 →</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
