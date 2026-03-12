import Head from "next/head";
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import s from "@/styles/Contracts.module.css";
import k from "@/styles/Kanban.module.css";
import { type ProjectContract } from "@/data/dummy-contracts";
import { useProjects } from "@/contexts/ProjectContext";
import ProjectEditModal from "@/components/ProjectEditModal";

type ViewMode = "kanban" | "timeline";
type SettlementType = "milestone" | "recurring";
type VatOption = "별도" | "포함" | "면세";

interface PhaseRow {
  id: string;
  label: string;
  ratio: number; // %
  amount: number;
  due_date: string;
  condition: string;
  memo: string;
}

interface RecurringConfig {
  monthly_amount: number;
  cycle: "monthly" | "quarterly";
  billing_day: number;
  first_payment_date: string;
  termination: "auto_renewal" | "fixed_term";
  pro_rata: boolean;
}

interface ContractForm {
  title: string;
  client: string;
  manager: string;
  contract_amount: number;
  vat: VatOption;
  start_date: string;
  end_date: string;
  description: string;
  settlement_type: SettlementType;
  phases: PhaseRow[];
  recurring: RecurringConfig;
}

const PHASE_COLORS = ["#3182f6", "#00c471", "#f59e0b", "#f04452", "#8b5cf6", "#b0b8c1"];

function generateContractNumber(): string {
  const y = new Date().getFullYear();
  const n = String(Math.floor(Math.random() * 900) + 100);
  return `WDL-${y}-${n}`;
}

function createDefaultPhases(): PhaseRow[] {
  return [
    { id: "p1", label: "착수금", ratio: 30, amount: 0, due_date: "", condition: "", memo: "" },
    { id: "p2", label: "중도금", ratio: 40, amount: 0, due_date: "", condition: "", memo: "" },
    { id: "p3", label: "잔금", ratio: 30, amount: 0, due_date: "", condition: "", memo: "" },
  ];
}

function createDefaultForm(): ContractForm {
  return {
    title: "",
    client: "",
    manager: "",
    contract_amount: 0,
    vat: "별도",
    start_date: "",
    end_date: "",
    description: "",
    settlement_type: "milestone",
    phases: createDefaultPhases(),
    recurring: {
      monthly_amount: 0,
      cycle: "monthly",
      billing_day: 1,
      first_payment_date: "",
      termination: "auto_renewal",
      pro_rata: true,
    },
  };
}

const STAGES = [
  { id: "납품완료", label: "계약중단", color: "#f04452" },
  { id: "제안", label: "견적/계약준비", color: "#6b7684" },
  { id: "계약완료", label: "계약완료", color: "#f59e0b" },
  { id: "진행중", label: "진행중", color: "#3182f6" },
  { id: "정산완료", label: "정산완료", color: "#b0b8c1" },
] as const;

const fmt = (n: number) => n.toLocaleString() + "원";
const fmtMan = (n: number) => (n / 10000).toLocaleString() + "만원";

const statusBadge = (st: string) => {
  switch (st) {
    case "제안": return s.badgeGray;
    case "계약완료": return s.badgeOrange;
    case "진행중": return s.badgeBlue;
    case "납품완료": return s.badgeRed;
    case "정산완료": return s.badgeGray;
    default: return s.badgeGray;
  }
};

/* ── 계약서 AI 초안 HTML ── */
function generateContractDraftHTML(form: ContractForm, contractNumber: string, terms: ContractTerms): string {
  const vatAmount = form.vat === "별도" ? Math.round(form.contract_amount * 0.1) : 0;
  const totalWithVat = form.contract_amount + vatAmount;
  const today = new Date().toISOString().slice(0, 10);
  const phaseRows = form.phases.map((p) => `<tr><td>${p.label}</td><td style="text-align:right">${p.amount.toLocaleString()}원</td><td>${p.due_date || "-"}</td></tr>`).join("");

  return `<!DOCTYPE html><html><head><style>
body{font-family:'Pretendard',sans-serif;padding:48px;color:#191f28;font-size:13px;max-width:780px;margin:0 auto;line-height:1.8;background:#fff}
h1{font-size:26px;text-align:center;margin-bottom:8px;letter-spacing:-0.03em;font-weight:900}
.sub{text-align:center;color:#6b7684;margin-bottom:36px;font-size:12px}
h2{font-size:15px;font-weight:800;margin:28px 0 10px;padding-bottom:6px;border-bottom:2px solid #191f28;letter-spacing:-0.02em}
h3{font-size:13px;font-weight:700;margin:16px 0 6px;color:#3182f6}
.parties{display:flex;gap:32px;margin-bottom:24px}
.party{flex:1;background:#f9fafb;border-radius:8px;padding:14px 18px}
.party-title{font-size:12px;font-weight:700;color:#3182f6;margin-bottom:8px}
.party-row{font-size:12px;margin-bottom:3px}
.party-label{display:inline-block;width:60px;color:#6b7684}
.clause{margin-bottom:8px;text-align:justify}
.clause b{font-weight:700}
table{width:100%;border-collapse:collapse;margin:12px 0}
th{background:#f4f6f8;padding:8px 10px;text-align:left;border-bottom:2px solid #e5e8eb;font-size:11px;font-weight:700}
td{padding:8px 10px;border-bottom:1px solid #f2f4f6;font-size:12px}
.sign-area{display:flex;justify-content:space-between;margin-top:60px;padding-top:32px;border-top:1px solid #e5e8eb}
.sign-block{text-align:center;min-width:200px}
.sign-block .label{font-size:12px;color:#6b7684;margin-bottom:24px}
.sign-line{border-bottom:1px solid #191f28;height:40px;margin-bottom:4px}
.sign-name{font-size:13px;font-weight:700}
.footer{margin-top:40px;text-align:center;color:#b0b8c1;font-size:11px}
</style></head><body>
<h1>용 역 계 약 서</h1>
<div class="sub">${contractNumber} · 작성일: ${today}</div>

<div class="parties">
<div class="party">
  <div class="party-title">발주자 (이하 "갑")</div>
  <div class="party-row"><span class="party-label">회사명</span><b>${form.client || "(미입력)"}</b></div>
  <div class="party-row"><span class="party-label">대표자</span>${terms.client_rep || "(미입력)"}</div>
  <div class="party-row"><span class="party-label">주소</span>${terms.client_address || "(미입력)"}</div>
</div>
<div class="party">
  <div class="party-title">수급자 (이하 "을")</div>
  <div class="party-row"><span class="party-label">회사명</span><b>와이디랩</b></div>
  <div class="party-row"><span class="party-label">대표자</span>송유섭</div>
  <div class="party-row"><span class="party-label">주소</span>경기도 화성시 동탄대로 123, B동 1210호</div>
</div>
</div>

<h2>제1조 (목적)</h2>
<p class="clause">본 계약은 "갑"이 "을"에게 <b>${form.title || "(프로젝트명)"}</b>에 관한 용역을 위탁하고, "을"이 이를 수행함에 있어 필요한 사항을 정함을 목적으로 한다.</p>

<h2>제2조 (용역 범위)</h2>
<p class="clause">${terms.scope || '"을"은 다음 각 호의 업무를 성실히 수행한다.'}</p>
${terms.deliverables ? `<h3>납품물</h3><p class="clause">${terms.deliverables}</p>` : ""}

<h2>제3조 (계약 기간)</h2>
<p class="clause">본 계약의 기간은 <b>${form.start_date || "____년 __월 __일"}</b>부터 <b>${form.end_date || "____년 __월 __일"}</b>까지로 한다. 단, 양 당사자의 합의에 의해 기간을 연장할 수 있다.</p>

<h2>제4조 (계약 금액 및 지급)</h2>
<p class="clause">본 용역의 계약금액은 아래와 같다.</p>
<table>
<tr><td>공급가액</td><td style="text-align:right;font-weight:700">${form.contract_amount.toLocaleString()}원</td></tr>
${form.vat === "별도" ? `<tr><td>부가가치세 (10%)</td><td style="text-align:right">${vatAmount.toLocaleString()}원</td></tr>` : ""}
<tr style="border-top:2px solid #191f28"><td style="font-weight:800">합계 (VAT ${form.vat === "면세" ? "면세" : "포함"})</td><td style="text-align:right;font-weight:800;color:#3182f6">${totalWithVat.toLocaleString()}원</td></tr>
</table>
<p class="clause">대금은 아래 일정에 따라 지급한다.</p>
<table><thead><tr><th>구분</th><th style="text-align:right">금액</th><th>지급일</th></tr></thead><tbody>${phaseRows}</tbody></table>

<h2>제5조 (보증 및 하자보수)</h2>
<p class="clause">${terms.warranty || '"을"은 납품일로부터 3개월간 하자에 대해 무상으로 보수한다.'}</p>

<h2>제6조 (지체상금)</h2>
<p class="clause">${terms.penalty || '"을"이 정당한 사유 없이 납기를 지연하는 경우, 지연일수 1일당 계약금액의 0.1%에 해당하는 지체상금을 "갑"에게 지급한다.'}</p>

<h2>제7조 (비밀유지)</h2>
<p class="clause">양 당사자는 본 계약의 이행과정에서 알게 된 상대방의 영업비밀 및 기밀정보를 계약기간 및 계약종료 후 2년간 제3자에게 누설하거나 본 계약 이외의 목적으로 사용하지 아니한다.</p>

<h2>제8조 (지식재산권)</h2>
<p class="clause">${terms.ip_rights || '본 용역의 결과물에 대한 지식재산권은 대금 완납 시 "갑"에게 귀속된다. 단, "을"이 기 보유한 기술 및 범용적 성격의 소스코드는 "을"에게 귀속된다.'}</p>

${terms.special ? `<h2>제9조 (특약사항)</h2><p class="clause">${terms.special}</p>` : ""}

<h2>제${terms.special ? "10" : "9"}조 (기타)</h2>
<p class="clause">본 계약에 명시되지 않은 사항은 관계법령 및 일반관례에 따르며, 양 당사자 간 신의성실의 원칙에 의해 해결한다.</p>
<p class="clause">본 계약의 증거로서 계약서 2통을 작성하여 각각 기명날인한 후 각 1통씩 보관한다.</p>
<p class="clause" style="text-align:center;margin-top:24px;font-weight:700">${today}</p>

<div class="sign-area">
<div class="sign-block">
  <div class="label">"갑" (발주자)</div>
  <div class="sign-line"></div>
  <div class="sign-name">${form.client || "(회사명)"}</div>
</div>
<div class="sign-block">
  <div class="label">"을" (수급자)</div>
  <div class="sign-line"></div>
  <div class="sign-name">와이디랩 대표 송유섭</div>
</div>
</div>
<div class="footer">WHYDLAB BIZ · 본 계약서는 AI 초안이며, 법률 검토 후 사용하시기 바랍니다.</div>
</body></html>`;
}

/* ── 계약 주요 내용 인터페이스 ── */
interface ContractTerms {
  client_rep: string;
  client_address: string;
  scope: string;
  deliverables: string;
  warranty: string;
  penalty: string;
  ip_rights: string;
  special: string;
}

function createDefaultTerms(): ContractTerms {
  return { client_rep: "", client_address: "", scope: "", deliverables: "", warranty: "", penalty: "", ip_rights: "", special: "" };
}

/* ── 계약서 작성 모달 (Split-pane) ── */
function ContractFormModal({ onClose, onSave }: { onClose: () => void; onSave: (form: ContractForm, contractNumber: string) => void }) {
  const [contractNumber] = useState(generateContractNumber);
  const [form, setForm] = useState<ContractForm>(createDefaultForm);
  const [terms, setTerms] = useState<ContractTerms>(createDefaultTerms);
  const [draftHTML, setDraftHTML] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const update = useCallback(<K extends keyof ContractForm>(key: K, val: ContractForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const updateTerm = useCallback(<K extends keyof ContractTerms>(key: K, val: string) => {
    setTerms((prev) => ({ ...prev, [key]: val }));
  }, []);

  const updatePhase = useCallback((id: string, patch: Partial<PhaseRow>) => {
    setForm((prev) => ({
      ...prev,
      phases: prev.phases.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const addPhase = useCallback(() => {
    const midCount = form.phases.filter((p) => p.label.startsWith("중도금")).length;
    setForm((prev) => ({
      ...prev,
      phases: [
        ...prev.phases,
        { id: `p${Date.now()}`, label: `중도금 ${midCount + 1}차`, ratio: 0, amount: 0, due_date: "", condition: "", memo: "" },
      ],
    }));
  }, [form.phases]);

  const removePhase = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, phases: prev.phases.filter((p) => p.id !== id) }));
  }, []);

  const syncAmounts = useCallback((amt: number, phases: PhaseRow[]) => {
    return phases.map((p) => ({ ...p, amount: Math.round(amt * p.ratio / 100) }));
  }, []);

  const handleAmountChange = (val: number) => {
    update("contract_amount", val);
    setForm((prev) => ({ ...prev, contract_amount: val, phases: syncAmounts(val, prev.phases) }));
  };

  const handleRatioChange = (id: string, ratio: number) => {
    setForm((prev) => {
      const phases = prev.phases.map((p) => (p.id === id ? { ...p, ratio, amount: Math.round(prev.contract_amount * ratio / 100) } : p));
      return { ...prev, phases };
    });
  };

  const handlePhaseAmountChange = (id: string, amount: number) => {
    setForm((prev) => {
      const ratio = prev.contract_amount > 0 ? Math.round(amount / prev.contract_amount * 10000) / 100 : 0;
      const phases = prev.phases.map((p) => (p.id === id ? { ...p, amount, ratio } : p));
      return { ...prev, phases };
    });
  };

  const totalRatio = form.phases.reduce((a, p) => a + p.ratio, 0);
  const isValid = totalRatio === 100;
  const vatAmount = form.vat === "별도" ? Math.round(form.contract_amount * 0.1) : 0;
  const totalWithVat = form.contract_amount + vatAmount;

  const recurringMonths = form.start_date && form.end_date
    ? Math.max(1, Math.ceil((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;
  const recurringTotal = form.recurring.cycle === "monthly"
    ? form.recurring.monthly_amount * recurringMonths
    : form.recurring.monthly_amount * Math.ceil(recurringMonths / 3);

  const generateDraft = () => {
    setAiLoading(true);
    // 실제로는 AI API 호출. 여기서는 즉시 생성 시뮬레이션 (약간의 딜레이)
    setTimeout(() => {
      setDraftHTML(generateContractDraftHTML(form, contractNumber, terms));
      setAiLoading(false);
    }, 800);
  };

  const printDraft = () => {
    if (!draftHTML) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(draftHTML);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.contractEditorModal}>
        {/* 헤더 */}
        <div className={s.contractEditorHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 className={s.modalTitle}>계약서 작성</h2>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--color-text-tertiary)" }}>{contractNumber}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {draftHTML && <button className={`${s.btn} ${s.btnSmall}`} onClick={printDraft}>PDF 인쇄</button>}
            <button className={s.btnIcon} onClick={onClose} style={{ fontSize: 18 }}>✕</button>
          </div>
        </div>

        {/* 본문 — 2단 split */}
        <div className={s.contractEditorBody}>
          {/* ====== 왼쪽: 입력 폼 ====== */}
          <div className={s.contractEditorLeft}>
            <div className={s.contractEditorScroll}>

              {/* 기본 정보 */}
              <div className={s.editorBlockTitle}>기본 정보</div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>계약 제목 *</label><input className={s.formInput} placeholder="프로젝트명" value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
                <div className={s.formGroup}><label className={s.formLabel}>고객사 *</label><input className={s.formInput} placeholder="고객사명" value={form.client} onChange={(e) => update("client", e.target.value)} /></div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>담당자</label><input className={s.formInput} placeholder="내부 담당자" value={form.manager} onChange={(e) => update("manager", e.target.value)} /></div>
                <div className={s.formGroup}><label className={s.formLabel}>비고</label><input className={s.formInput} placeholder="간단 메모" value={form.description} onChange={(e) => update("description", e.target.value)} /></div>
              </div>

              <div className={s.formDivider} />

              {/* 금액 + 기간 */}
              <div className={s.editorBlockTitle}>계약 금액 / 기간</div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>계약금액 (VAT 별도) *</label>
                <input className={s.formInput} type="number" placeholder="0" value={form.contract_amount || ""} onChange={(e) => handleAmountChange(Number(e.target.value))} style={{ fontSize: 15, fontWeight: 700 }} />
                <div className={s.quickBtnRow}>
                  {[1000000, 5000000, 10000000, 50000000].map((v) => (<button key={v} className={s.quickBtn} onClick={() => handleAmountChange(form.contract_amount + v)}>+{(v / 10000).toLocaleString()}만</button>))}
                  <button className={s.quickBtn} onClick={() => handleAmountChange(0)} style={{ background: "var(--color-divider)", color: "var(--color-text-secondary)" }}>초기화</button>
                </div>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>부가세</label>
                <div className={s.radioGroup}>{(["별도", "포함", "면세"] as const).map((opt) => (<label key={opt} className={s.radioLabel}><input type="radio" name="vat" checked={form.vat === opt} onChange={() => update("vat", opt)} />{opt}</label>))}</div>
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>착수일 *</label><input className={s.formInput} type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} /></div>
                <div className={s.formGroup}><label className={s.formLabel}>종료일 *</label><input className={s.formInput} type="date" value={form.end_date} onChange={(e) => update("end_date", e.target.value)} /></div>
              </div>

              <div className={s.formDivider} />

              {/* 정산 */}
              <div className={s.editorBlockTitle}>정산 방법</div>
              <div className={s.tabBar}>
                <button className={`${s.tab} ${form.settlement_type === "milestone" ? s.tabActive : ""}`} onClick={() => update("settlement_type", "milestone")}>회차 정산형</button>
                <button className={`${s.tab} ${form.settlement_type === "recurring" ? s.tabActive : ""}`} onClick={() => update("settlement_type", "recurring")}>정기 결제형</button>
              </div>

              {form.settlement_type === "milestone" && (
                <>
                  {form.contract_amount > 0 && (
                    <div className={s.phaseBar}>{form.phases.map((p, i) => (<div key={p.id} className={s.phaseBarSegment} style={{ width: `${p.ratio}%`, background: PHASE_COLORS[i % PHASE_COLORS.length] }} />))}</div>
                  )}
                  <div className={s.phaseList}>
                    {form.phases.map((p) => (
                      <div key={p.id} className={s.phaseItem}>
                        <input className={s.formInput} value={p.label} onChange={(e) => updatePhase(p.id, { label: e.target.value })} style={{ fontWeight: 600, padding: "6px 8px", fontSize: 13 }} />
                        <input className={s.formInput} type="number" placeholder="금액" value={p.amount || ""} onChange={(e) => handlePhaseAmountChange(p.id, Number(e.target.value))} style={{ padding: "6px 8px", fontSize: 13 }} />
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}><input className={s.formInput} type="number" min={0} max={100} value={p.ratio || ""} onChange={(e) => handleRatioChange(p.id, Number(e.target.value))} style={{ padding: "6px 4px", fontSize: 12, textAlign: "center", width: "100%" }} /><span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>%</span></div>
                        <input className={s.formInput} type="date" value={p.due_date} onChange={(e) => updatePhase(p.id, { due_date: e.target.value })} style={{ padding: "6px 8px", fontSize: 12 }} />
                        <button className={s.phaseRemoveBtn} onClick={() => removePhase(p.id)} title="삭제">✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button className={`${s.btn} ${s.btnSmall}`} onClick={addPhase}>+ 회차 추가</button>
                    <span className={isValid ? s.validOk : s.validError}>합계 {totalRatio}% {isValid ? "✓" : `(${totalRatio > 100 ? "초과" : "부족"})`}</span>
                  </div>
                </>
              )}

              {form.settlement_type === "recurring" && (
                <>
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>결제 금액</label><input className={s.formInput} type="number" placeholder="0" value={form.recurring.monthly_amount || ""} onChange={(e) => setForm((prev) => ({ ...prev, recurring: { ...prev.recurring, monthly_amount: Number(e.target.value) } }))} style={{ fontWeight: 700 }} /></div>
                    <div className={s.formGroup}><label className={s.formLabel}>결제 주기</label><select className={s.formSelect} value={form.recurring.cycle} onChange={(e) => setForm((prev) => ({ ...prev, recurring: { ...prev.recurring, cycle: e.target.value as "monthly" | "quarterly" } }))}><option value="monthly">매월</option><option value="quarterly">분기</option></select></div>
                  </div>
                  <div className={s.formRow}>
                    <div className={s.formGroup}><label className={s.formLabel}>결제일</label><select className={s.formSelect} value={form.recurring.billing_day} onChange={(e) => setForm((prev) => ({ ...prev, recurring: { ...prev.recurring, billing_day: Number(e.target.value) } }))}>{Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (<option key={d} value={d}>매월 {d}일</option>))}</select></div>
                    <div className={s.formGroup}><label className={s.formLabel}>첫 결제일</label><input className={s.formInput} type="date" value={form.recurring.first_payment_date} onChange={(e) => setForm((prev) => ({ ...prev, recurring: { ...prev.recurring, first_payment_date: e.target.value } }))} /></div>
                  </div>
                </>
              )}

              {/* 정산 미리보기 */}
              <div className={s.previewBox}>
                <div className={s.previewTitle}>정산 미리보기</div>
                <div className={s.previewRow}><span className={s.previewLabel}>계약금액</span><span className={s.previewValue}>{form.contract_amount.toLocaleString()}원</span></div>
                {form.vat === "별도" && <div className={s.previewRow}><span className={s.previewLabel}>VAT (10%)</span><span className={s.previewValue}>{vatAmount.toLocaleString()}원</span></div>}
                {form.settlement_type === "milestone" && form.phases.map((p, i) => (
                  <div key={p.id} className={s.previewRow}><span className={s.previewLabel} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 4, background: PHASE_COLORS[i % PHASE_COLORS.length], display: "inline-block" }} />{p.label} ({p.ratio}%)</span><span className={s.previewValue}>{p.amount.toLocaleString()}원</span></div>
                ))}
                {form.settlement_type === "recurring" && (<><div className={s.previewRow}><span className={s.previewLabel}>{form.recurring.cycle === "monthly" ? "월" : "분기"} 결제</span><span className={s.previewValue}>{form.recurring.monthly_amount.toLocaleString()}원</span></div><div className={s.previewRow}><span className={s.previewLabel}>예상 {recurringMonths}개월</span><span className={s.previewValue}>{recurringTotal.toLocaleString()}원</span></div></>)}
                <div className={s.previewTotal}><span className={s.previewTotalLabel}>합계 (VAT포함)</span><span className={s.previewTotalValue}>{totalWithVat.toLocaleString()}원</span></div>
              </div>

              <div className={s.formDivider} />

              {/* ====== 계약서 주요 내용 입력 ====== */}
              <div className={s.editorBlockTitle}>계약서 주요 내용</div>
              <div className={s.formRow}>
                <div className={s.formGroup}><label className={s.formLabel}>고객사 대표자명</label><input className={s.formInput} placeholder="홍길동" value={terms.client_rep} onChange={(e) => updateTerm("client_rep", e.target.value)} /></div>
                <div className={s.formGroup}><label className={s.formLabel}>고객사 주소</label><input className={s.formInput} placeholder="서울시 강남구..." value={terms.client_address} onChange={(e) => updateTerm("client_address", e.target.value)} /></div>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>용역 범위 (업무 내용)</label>
                <textarea className={s.notesArea} placeholder="예: 웹사이트 기획, UI/UX 디자인, 프론트엔드 개발, 관리자 페이지 구축 등" value={terms.scope} onChange={(e) => updateTerm("scope", e.target.value)} style={{ minHeight: 60 }} />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>납품물</label>
                <textarea className={s.notesArea} placeholder="예: 디자인 시안(Figma), 소스코드, 산출물 문서 일체" value={terms.deliverables} onChange={(e) => updateTerm("deliverables", e.target.value)} style={{ minHeight: 48 }} />
              </div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>보증 / 하자보수</label>
                  <textarea className={s.notesArea} placeholder="예: 납품일로부터 3개월간 무상 하자보수" value={terms.warranty} onChange={(e) => updateTerm("warranty", e.target.value)} style={{ minHeight: 48 }} />
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>지체상금</label>
                  <textarea className={s.notesArea} placeholder="예: 지연일수 1일당 계약금의 0.1%" value={terms.penalty} onChange={(e) => updateTerm("penalty", e.target.value)} style={{ minHeight: 48 }} />
                </div>
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>지식재산권 귀속</label>
                <textarea className={s.notesArea} placeholder="예: 대금 완납 시 갑에게 귀속, 을의 기존 기술은 을에게 귀속" value={terms.ip_rights} onChange={(e) => updateTerm("ip_rights", e.target.value)} style={{ minHeight: 48 }} />
              </div>
              <div className={s.formGroup}>
                <label className={s.formLabel}>특약사항 (선택)</label>
                <textarea className={s.notesArea} placeholder="추가 특약이 있으면 입력하세요" value={terms.special} onChange={(e) => updateTerm("special", e.target.value)} style={{ minHeight: 48 }} />
              </div>

              {/* AI 초안 작성 버튼 */}
              <button className={s.aiContractBtn} onClick={generateDraft} disabled={aiLoading}>
                <span className={s.aiContractBtnIcon}>AI</span>
                {aiLoading ? "초안 작성중..." : "계약서 초안 작성"}
              </button>
            </div>

            {/* 하단 버튼 */}
            <div className={s.contractEditorFooter}>
              <button className={`${s.btn} ${s.btnSmall}`} onClick={onClose}>취소</button>
              <div style={{ flex: 1 }} />
              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => { alert("임시저장되었습니다."); }}>임시저장</button>
              <button
                className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`}
                disabled={!form.title || !form.client || form.contract_amount <= 0 || !form.start_date || !form.end_date || (form.settlement_type === "milestone" && !isValid)}
                style={{ opacity: (!form.title || !form.client || form.contract_amount <= 0 || !form.start_date || !form.end_date || (form.settlement_type === "milestone" && totalRatio !== 100)) ? 0.5 : 1 }}
                onClick={() => {
                  if (form.settlement_type === "milestone" && totalRatio !== 100) { alert("정산 비율 합이 100%가 되어야 합니다."); return; }
                  onSave(form, contractNumber);
                }}
              >저장</button>
            </div>
          </div>

          {/* ====== 오른쪽: 계약서 초안 미리보기 ====== */}
          <div className={s.contractEditorRight}>
            {draftHTML ? (
              <>
                <div className={s.contractDraftHeader}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>계약서 초안 미리보기</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className={`${s.btn} ${s.btnSmall}`} onClick={generateDraft} disabled={aiLoading}>{aiLoading ? "생성중..." : "다시 생성"}</button>
                    <button className={`${s.btn} ${s.btnSmall}`} onClick={printDraft}>PDF 인쇄</button>
                  </div>
                </div>
                <div className={s.contractDraftBody}>
                  <iframe srcDoc={draftHTML} title="계약서 초안" className={s.contractDraftIframe} />
                </div>
              </>
            ) : (
              <div className={s.contractDraftEmpty}>
                <div style={{ fontSize: 48, opacity: 0.15, marginBottom: 16 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>계약서 초안</div>
                <div style={{ fontSize: 12.5, color: "var(--color-text-tertiary)", lineHeight: 1.6, maxWidth: 260, marginBottom: 20 }}>
                  왼쪽에서 계약 정보와 주요 내용을 입력한 뒤<br />"AI 계약서 초안 작성" 버튼을 눌러주세요.
                </div>
                <button className={s.aiContractBtn} onClick={generateDraft} disabled={aiLoading || !form.title}>
                  <span className={s.aiContractBtnIcon}>AI</span>
                  {aiLoading ? "초안 작성중..." : "계약서 초안 작성"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContractsOverviewPage() {
  const { projects: proj, files: projFiles, updateProject, deleteFile } = useProjects();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const activeCount = proj.filter((p) => p.status === "진행중" || p.status === "계약완료").length;
  const totalSupply = proj.reduce((a, p) => a + p.contract_amount, 0);
  const totalSettled = proj.reduce((a, p) => a + p.total_settled, 0);
  const totalUnsettled = totalSupply - totalSettled;
  const avgProfit = proj.length > 0 ? Math.round(proj.reduce((a, p) => a + p.profit_rate, 0) / proj.length) : 0;

  const editProject = proj.find((p) => p.id === editId) ?? null;
  const editFiles = editId ? projFiles.filter((f) => f.contract_id === editId) : [];
  const handleEditSave = (updated: ProjectContract) => { updateProject(updated); setEditId(null); };
  const handleEditDeleteFile = (fileId: string) => { if (!confirm("파일을 삭제하시겠습니까?")) return; deleteFile(fileId); };

  const today = new Date().toISOString().slice(0, 10);

  /* ── 타임라인 계산 ── */
  const timelineRange = useMemo(() => {
    const active = proj.filter((p) => p.status !== "정산완료");
    if (active.length === 0) return { start: new Date(), end: new Date(), months: [] as string[] };
    const dates = active.flatMap((p) => [new Date(p.start_date), new Date(p.end_date)]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    min.setDate(1);
    max.setMonth(max.getMonth() + 1, 0);
    const months: string[] = [];
    const cur = new Date(min);
    while (cur <= max) {
      months.push(`${cur.getFullYear()}.${String(cur.getMonth() + 1).padStart(2, "0")}`);
      cur.setMonth(cur.getMonth() + 1);
    }
    return { start: min, end: max, months };
  }, []);

  const getBarPosition = (startStr: string, endStr: string) => {
    const totalMs = timelineRange.end.getTime() - timelineRange.start.getTime();
    if (totalMs === 0) return { left: 0, width: 100 };
    const s = new Date(startStr).getTime() - timelineRange.start.getTime();
    const e = new Date(endStr).getTime() - timelineRange.start.getTime();
    return { left: (s / totalMs) * 100, width: Math.max(((e - s) / totalMs) * 100, 2) };
  };

  const getDotPosition = (dateStr: string) => {
    const totalMs = timelineRange.end.getTime() - timelineRange.start.getTime();
    if (totalMs === 0) return 0;
    return ((new Date(dateStr).getTime() - timelineRange.start.getTime()) / totalMs) * 100;
  };

  return (
    <>
      <Head><title>계약현황관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page} style={{ maxWidth: "100%" }}>
        {/* 헤더 */}
        <div className={s.pageHeader} style={{ flexWrap: "wrap", gap: 10 }}>
          <h1>계약현황관리 <span className={s.count}>진행 {activeCount}건 / 전체 {proj.length}건</span></h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={() => setShowForm(true)}>+ 계약서 작성</button>
            <div style={{ width: 1, height: 20, background: "var(--color-border)", margin: "0 2px" }} />
            <div style={{ display: "flex", background: "var(--color-divider)", borderRadius: 8, padding: 2 }}>
              {(["kanban", "timeline"] as const).map((m) => (
                <button key={m} className={`${s.btn} ${s.btnSmall}`} style={{
                  background: viewMode === m ? "var(--color-white)" : "transparent",
                  boxShadow: viewMode === m ? "var(--shadow-xs)" : "none", border: "none",
                }} onClick={() => setViewMode(m)}>
                  {m === "kanban" ? "칸반" : "타임라인"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
          <div className={s.summaryCard}><div className={s.summaryLabel}>진행중 프로젝트</div><div className={s.summaryValue}>{activeCount}<span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", marginLeft: 2 }}>건</span></div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>총 계약금액</div><div className={s.summaryValue}>{fmtMan(totalSupply)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>정산완료</div><div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmtMan(totalSettled)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>미정산</div><div className={s.summaryValue} style={{ color: totalUnsettled > 0 ? "#b45309" : "var(--color-text)" }}>{fmtMan(totalUnsettled)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>평균 이익률</div><div className={s.summaryValue}>{avgProfit}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 1 }}>%</span></div></div>
        </div>

        {/* ══════ 칸반 뷰 ══════ */}
        {viewMode === "kanban" && (
          <div className={k.board}>
            {STAGES.map((stage) => {
              const cards = proj.filter((p) => p.status === stage.id);
              return (
                <div key={stage.id} className={k.column}>
                  <div className={k.columnHeader}>
                    <div className={k.columnDot} style={{ background: stage.color }} />
                    <span className={k.columnLabel}>{stage.label}</span>
                    <span className={k.columnCount}>{cards.length}</span>
                  </div>
                  <div className={k.columnBody}>
                    {cards.map((p) => {
                      const pct = Math.round((p.total_settled / p.contract_amount) * 100);
                      const paidPhases = p.payment_phases.filter((ph) => ph.paid).length;
                      return (
                        <div key={p.id} className={k.card} onClick={() => setEditId(p.id)}>
                          <div className={k.cardTop}>
                            <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{p.contract_number}</span>
                            <span className={k.cardDate}>{p.manager}</span>
                          </div>
                          <div className={k.cardTitle}>{p.project_name}</div>
                          <div className={k.cardSub}>{p.client}</div>
                          {/* 진행률 바 */}
                          <div style={{ height: 3, background: "var(--color-divider)", borderRadius: 2, marginBottom: 8 }}>
                            <div style={{ height: 3, width: `${p.progress}%`, background: stage.color, borderRadius: 2, transition: "width 0.3s" }} />
                          </div>
                          {/* 정산 dots */}
                          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                            {p.payment_phases.map((ph, i) => (
                              <div key={i} style={{
                                display: "flex", alignItems: "center", gap: 3,
                                fontSize: 10, color: ph.paid ? "var(--color-success)" : "var(--color-text-tertiary)",
                              }}>
                                <div style={{
                                  width: 6, height: 6, borderRadius: 3,
                                  background: ph.paid ? "var(--color-success)" : "var(--color-border)",
                                }} />
                                {ph.label}
                              </div>
                            ))}
                          </div>
                          <div className={k.cardBottom}>
                            <span className={k.cardAmount}>{fmtMan(p.contract_amount)}</span>
                            <span className={k.cardFiles} style={{ fontWeight: 700, color: pct === 100 ? "var(--color-success)" : "var(--color-primary)" }}>
                              {pct}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {cards.length === 0 && <div className={k.emptyCol}>프로젝트 없음</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════ 타임라인 뷰 ══════ */}
        {viewMode === "timeline" && (
          <div className={s.section}>
            {/* 월 헤더 */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: 4 }}>
              <div style={{ width: 200, flexShrink: 0, padding: "8px 12px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)" }}>프로젝트</div>
              <div style={{ flex: 1, display: "flex", position: "relative" }}>
                {timelineRange.months.map((m, i) => (
                  <div key={m} style={{
                    flex: 1, textAlign: "center", fontSize: 11, fontWeight: 600,
                    color: "var(--color-text-tertiary)", padding: "8px 0",
                    borderLeft: i > 0 ? "1px solid var(--color-divider)" : "none",
                  }}>{m}</div>
                ))}
              </div>
            </div>
            {/* 프로젝트 행 */}
            {proj.filter((p) => p.status !== "정산완료").map((p) => {
              const bar = getBarPosition(p.start_date, p.end_date);
              const stageColor = STAGES.find((st) => st.id === p.status)?.color || "#b0b8c1";
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", minHeight: 56,
                  borderBottom: "1px solid var(--color-divider)",
                  cursor: "pointer", background: editId === p.id ? "var(--color-primary-light)" : "transparent",
                  transition: "background 0.15s",
                }} onClick={() => setEditId(p.id)}>
                  {/* 왼쪽 이름 */}
                  <div style={{ width: 200, flexShrink: 0, padding: "8px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{p.project_name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{p.client}</div>
                  </div>
                  {/* 바 영역 */}
                  <div style={{ flex: 1, position: "relative", height: 56, padding: "12px 0" }}>
                    {/* 월 구분선 */}
                    {timelineRange.months.map((_, i) => i > 0 && (
                      <div key={i} style={{
                        position: "absolute", left: `${(i / timelineRange.months.length) * 100}%`,
                        top: 0, bottom: 0, width: 1, background: "var(--color-divider)",
                      }} />
                    ))}
                    {/* 오늘 선 */}
                    {(() => {
                      const todayPos = getDotPosition(today);
                      if (todayPos < 0 || todayPos > 100) return null;
                      return <div style={{ position: "absolute", left: `${todayPos}%`, top: 0, bottom: 0, width: 1.5, background: "var(--color-danger)", opacity: 0.4, zIndex: 1 }} />;
                    })()}
                    {/* 프로젝트 바 */}
                    <div style={{
                      position: "absolute", left: `${bar.left}%`, width: `${bar.width}%`,
                      top: "50%", transform: "translateY(-50%)",
                      height: 24, borderRadius: 6, background: stageColor, opacity: 0.15,
                    }} />
                    <div style={{
                      position: "absolute", left: `${bar.left}%`,
                      width: `${bar.width * (p.progress / 100)}%`,
                      top: "50%", transform: "translateY(-50%)",
                      height: 24, borderRadius: 6, background: stageColor, opacity: 0.5,
                    }} />
                    {/* 정산 마커 */}
                    {p.payment_phases.map((ph, i) => {
                      const pos = getDotPosition(ph.due_date);
                      if (pos < 0 || pos > 100) return null;
                      return (
                        <div key={i} title={`${ph.label} ${fmtMan(ph.amount)} (${ph.due_date})`} style={{
                          position: "absolute", left: `${pos}%`, top: "50%", transform: "translate(-50%, -50%)",
                          width: 10, height: 10, borderRadius: 5, zIndex: 2,
                          background: ph.paid ? "var(--color-success)" : "var(--color-white)",
                          border: `2px solid ${ph.paid ? "var(--color-success)" : stageColor}`,
                        }} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {/* 범례 */}
            <div style={{ display: "flex", gap: 16, padding: "12px 12px 4px", fontSize: 11, color: "var(--color-text-tertiary)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: "var(--color-success)" }} /> 정산 완료
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, border: "2px solid var(--color-primary)", background: "white" }} /> 정산 예정
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 12, height: 1.5, background: "var(--color-danger)", opacity: 0.5 }} /> 오늘
              </span>
            </div>
          </div>
        )}

        {/* 프로젝트 관리 바로가기 */}
        <div style={{ marginTop: 20, padding: "14px 18px", background: "var(--color-bg)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>프로젝트 상세 관리</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>전체 프로젝트 계약정보, 수금현황, 서류를 관리합니다</div>
          </div>
          <Link href="/contracts/projects" className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`}>프로젝트 관리 바로가기</Link>
        </div>

        {/* ══════ 프로젝트 수정 모달 ══════ */}
        {editProject && (
          <ProjectEditModal project={editProject} onClose={() => setEditId(null)} onSave={handleEditSave} files={editFiles} onDeleteFile={handleEditDeleteFile} />
        )}

        {/* ══════ 계약서 작성 모달 ══════ */}
        {showForm && (
          <ContractFormModal
            onClose={() => setShowForm(false)}
            onSave={(form, contractNumber) => {
              // TODO: DB 연동 시 Supabase insert
              alert(`계약서 "${form.title}" (${contractNumber})가 등록되었습니다.`);
              setShowForm(false);
            }}
          />
        )}
      </div>
    </>
  );
}
