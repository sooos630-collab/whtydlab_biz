import Head from "next/head";
import { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import s from "@/styles/Contracts.module.css";
import k from "@/styles/Kanban.module.css";
import { type ProjectContract, type PaymentPhase } from "@/data/dummy-contracts";
import { useProjects } from "@/contexts/ProjectContext";
import { recalculateProjectContract } from "@/lib/project-contracts";
import ProjectEditModal from "@/components/ProjectEditModal";

type ViewMode = "kanban" | "timeline" | "table" | "client";
type ClientDetailTab = "history" | "files" | "collection";
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
  { id: "제안", label: "견적/계약준비", color: "#6b7684" },
  { id: "계약완료", label: "계약완료", color: "#f59e0b" },
  { id: "진행중", label: "진행중", color: "#3182f6" },
  { id: "납품완료", label: "납품완료", color: "#00c471" },
  { id: "정산완료", label: "정산완료", color: "#b0b8c1" },
] as const;

const fmt = (n: number) => n.toLocaleString() + "원";
const fmtMan = (n: number) => (n / 10000).toLocaleString() + "만원";

const statusBadge = (st: string) => {
  switch (st) {
    case "제안": return s.badgeGray;
    case "계약완료": return s.badgeOrange;
    case "진행중": return s.badgeBlue;
    case "납품완료": return s.badgeGreen;
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
  const [form, setForm] = useState<ContractForm>(() => {
    const base = createDefaultForm();
    // 의뢰에서 전환된 경우 pre-fill
    try {
      const raw = localStorage.getItem("whydlab_prefill_contract");
      if (raw) {
        const data = JSON.parse(raw);
        localStorage.removeItem("whydlab_prefill_contract");
        return {
          ...base,
          title: data.title ?? "",
          client: data.client ?? "",
          contract_amount: data.amount ? Number(data.amount) : 0,
          manager: data.contact_name ?? "",
          description: data.quote_number ? `견적서: ${data.quote_number}` : "",
          phases: base.phases.map((p) => ({ ...p, amount: data.amount ? Math.round(Number(data.amount) * p.ratio / 100) : 0 })),
        };
      }
    } catch { /* ignore */ }
    return base;
  });
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
  const { projects: proj, files: projFiles, updateProject, addProject, deleteFile } = useProjects();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterClient, setFilterClient] = useState("");
  const [searchText, setSearchText] = useState("");

  const clientList = useMemo(() => [...new Set(proj.map((p) => p.client).filter(Boolean))].sort(), [proj]);
  const filteredProj = useMemo(() => {
    let result = proj;
    if (filterClient) result = result.filter((p) => p.client === filterClient);
    if (searchText.trim()) {
      const t = searchText.trim().toLowerCase();
      result = result.filter((p) => p.project_name.toLowerCase().includes(t) || p.client.toLowerCase().includes(t) || p.contract_number.toLowerCase().includes(t) || p.manager.toLowerCase().includes(t));
    }
    return result;
  }, [proj, filterClient, searchText]);

  // TODO: DB 연동 시 localStorage 대신 Supabase로 교체
  // 의뢰 페이지에서 계약 상태 전환 시 자동으로 계약서 작성 폼 열기
  useEffect(() => {
    try {
      const pending = localStorage.getItem("whydlab_pending_contract");
      if (pending) {
        localStorage.removeItem("whydlab_pending_contract");
        setShowForm(true);
      }
    } catch { /* ignore */ }
  }, []);

  const activeCount = filteredProj.filter((p) => p.status === "진행중" || p.status === "계약완료").length;
  const totalSupply = filteredProj.reduce((a, p) => a + p.contract_amount, 0);
  const totalSettled = filteredProj.reduce((a, p) => a + p.total_settled, 0);
  const totalUnsettled = totalSupply - totalSettled;
  const avgProfit = filteredProj.length > 0 ? Math.round(filteredProj.reduce((a, p) => a + p.profit_rate, 0) / filteredProj.length) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  // 이번 달 수금 예정
  const upcomingThisMonth = filteredProj.flatMap((p) => p.payment_phases.filter((ph) => !ph.paid && ph.due_date.startsWith(thisMonth)));
  const upcomingAmount = upcomingThisMonth.reduce((a, ph) => a + ph.amount, 0);

  // 연체 건수 (미수금 + 예정일 지남)
  const overduePhases = filteredProj.flatMap((p) => p.payment_phases.filter((ph) => !ph.paid && ph.due_date < today));
  const overdueCount = overduePhases.length;
  const overdueAmount = overduePhases.reduce((a, ph) => a + ph.amount, 0);

  // 평균 수금율
  const avgCollectionRate = filteredProj.length > 0 ? Math.round(filteredProj.reduce((a, p) => a + p.collection_rate, 0) / filteredProj.length) : 0;

  const [showCompleted, setShowCompleted] = useState(false);
  const [clientDetailName, setClientDetailName] = useState<string | null>(null);
  const [clientDetailTab, setClientDetailTab] = useState<ClientDetailTab>("history");

  // 기업별 데이터 집계
  const clientGroups = useMemo(() => {
    const map = new Map<string, { projects: typeof proj; files: typeof projFiles; totalAmount: number; totalSettled: number; latestDate: string }>();
    proj.forEach((p) => {
      const key = p.client;
      if (!key) return;
      const g = map.get(key) || { projects: [], files: [], totalAmount: 0, totalSettled: 0, latestDate: "" };
      g.projects.push(p);
      g.totalAmount += p.contract_amount;
      g.totalSettled += p.total_settled;
      if (p.contract_date > g.latestDate) g.latestDate = p.contract_date;
      map.set(key, g);
    });
    projFiles.forEach((f) => {
      const p = proj.find((pr) => pr.id === f.contract_id);
      if (!p) return;
      const g = map.get(p.client);
      if (g) g.files.push(f);
    });
    return map;
  }, [proj, projFiles]);

  const clientDetailData = clientDetailName ? clientGroups.get(clientDetailName) : null;

  const editProject = proj.find((p) => p.id === editId) ?? null;
  const editFiles = editId ? projFiles.filter((f) => f.contract_id === editId) : [];
  const handleEditSave = (updated: ProjectContract) => { updateProject(updated); setEditId(null); };
  const handleEditDeleteFile = (fileId: string) => { if (!confirm("파일을 삭제하시겠습니까?")) return; deleteFile(fileId); };

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
  }, [proj]);

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
          <h1>계약현황관리 <span className={s.count}>진행 {activeCount}건 / 전체 {filteredProj.length}건{filterClient || searchText ? " (필터)" : ""}</span></h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={() => setShowForm(true)}>+ 계약서 작성</button>
            <div style={{ width: 1, height: 20, background: "var(--color-border)", margin: "0 2px" }} />
            <div style={{ display: "flex", background: "var(--color-divider)", borderRadius: 8, padding: 2 }}>
              {([{ id: "kanban" as ViewMode, label: "칸반" }, { id: "table" as ViewMode, label: "리스트" }, { id: "client" as ViewMode, label: "기업별" }, { id: "timeline" as ViewMode, label: "타임라인" }]).map((m) => (
                <button key={m.id} className={`${s.btn} ${s.btnSmall}`} style={{
                  background: viewMode === m.id ? "var(--color-white)" : "transparent",
                  boxShadow: viewMode === m.id ? "var(--shadow-xs)" : "none", border: "none",
                }} onClick={() => setViewMode(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 16 }}>
          <div className={s.summaryCard}><div className={s.summaryLabel}>진행중</div><div className={s.summaryValue}>{activeCount}<span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", marginLeft: 2 }}>건</span></div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>총 계약금액</div><div className={s.summaryValue}>{fmtMan(totalSupply)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>수금완료</div><div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmtMan(totalSettled)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>미수금</div><div className={s.summaryValue} style={{ color: totalUnsettled > 0 ? "#b45309" : "var(--color-text)" }}>{fmtMan(totalUnsettled)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>이번달 수금예정</div><div className={s.summaryValue} style={{ color: upcomingAmount > 0 ? "var(--color-primary)" : "var(--color-text-tertiary)" }}>{upcomingThisMonth.length > 0 ? fmtMan(upcomingAmount) : "-"}</div></div>
          {overdueCount > 0 && <div className={s.summaryCard} style={{ borderLeft: "3px solid var(--color-danger)" }}><div className={s.summaryLabel}>연체</div><div className={s.summaryValue} style={{ color: "var(--color-danger)" }}>{overdueCount}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>건</span><span style={{ fontSize: 11, fontWeight: 500, marginLeft: 4, color: "var(--color-text-secondary)" }}>{fmtMan(overdueAmount)}</span></div></div>}
          <div className={s.summaryCard}><div className={s.summaryLabel}>평균 수금율</div><div className={s.summaryValue}>{avgCollectionRate}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 1 }}>%</span></div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>평균 이익률</div><div className={s.summaryValue}>{avgProfit}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 1 }}>%</span></div></div>
        </div>

        {/* 고객사 필터 + 검색 */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <select className={s.formSelect} value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={{ padding: "6px 10px", fontSize: 12, minWidth: 140, borderRadius: 6 }}>
            <option value="">전체 고객사</option>
            {clientList.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ position: "relative", flex: "0 1 240px" }}>
            <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13, opacity: 0.4 }}>🔍</span>
            <input className={s.formInput} placeholder="프로젝트명, 고객사, 계약번호 검색..." value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ padding: "6px 10px 6px 28px", fontSize: 12, borderRadius: 6 }} />
          </div>
          {(filterClient || searchText) && (
            <button className={`${s.btn} ${s.btnSmall}`} onClick={() => { setFilterClient(""); setSearchText(""); }} style={{ fontSize: 11 }}>초기화</button>
          )}
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginLeft: "auto" }}>{filteredProj.length}건</span>
        </div>

        {/* ══════ 칸반 뷰 ══════ */}
        {viewMode === "kanban" && (
          <div className={k.board}>
            {STAGES.map((stage) => {
              const cards = filteredProj.filter((p) => p.status === stage.id);
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
                      const nextPhase = p.payment_phases.find((ph) => !ph.paid);
                      const isOverdue = nextPhase && nextPhase.due_date < today;
                      return (
                        <div key={p.id} className={k.card} onClick={() => setEditId(p.id)} style={isOverdue ? { borderLeft: "3px solid var(--color-danger)" } : undefined}>
                          <div className={k.cardTop}>
                            <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", fontFamily: "monospace" }}>{p.contract_number}</span>
                            <span className={k.cardDate}>{p.manager}</span>
                          </div>
                          <div className={k.cardTitle}>{p.project_name}</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span className={k.cardSub}>{p.client}</span>
                            <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{p.start_date.slice(5)} ~ {p.end_date.slice(5)}</span>
                          </div>
                          {/* 진행률 바 */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <div style={{ flex: 1, height: 3, background: "var(--color-divider)", borderRadius: 2 }}>
                              <div style={{ height: 3, width: `${p.progress}%`, background: stage.color, borderRadius: 2, transition: "width 0.3s" }} />
                            </div>
                            <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", fontWeight: 600, flexShrink: 0 }}>{p.progress}%</span>
                          </div>
                          {/* 정산 dots */}
                          <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
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
                          {/* 다음 수금 예정 */}
                          {nextPhase && (
                            <div style={{ fontSize: 10, padding: "3px 6px", borderRadius: 4, marginBottom: 6, background: isOverdue ? "var(--color-danger-light, #fff5f5)" : "var(--color-bg)", color: isOverdue ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
                              {isOverdue ? "연체" : "예정"} {nextPhase.label} {fmtMan(nextPhase.amount)} · {nextPhase.due_date.slice(5)}
                            </div>
                          )}
                          <div className={k.cardBottom}>
                            <span className={k.cardAmount}>{fmtMan(p.contract_amount)}</span>
                            <span className={k.cardFiles} style={{ fontWeight: 700, color: pct === 100 ? "var(--color-success)" : "var(--color-primary)" }}>
                              수금 {pct}%
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

        {/* ══════ 리스트(테이블) 뷰 ══════ */}
        {viewMode === "table" && (
          <div className={s.section} style={{ padding: 0, overflow: "auto" }}>
            <table className={s.table}>
              <thead><tr>
                <th>코드넘버</th><th>프로젝트명</th><th>고객사</th><th>상태</th><th>기간</th>
                <th style={{ textAlign: "right" }}>계약금액</th>
                <th style={{ textAlign: "right" }}>수금액</th>
                <th style={{ textAlign: "center" }}>수금율</th>
                <th style={{ textAlign: "center" }}>진행률</th>
                <th style={{ textAlign: "center" }}>이익률</th>
                <th>담당</th>
              </tr></thead>
              <tbody>
                {filteredProj.map((p) => {
                  const nextPhase = p.payment_phases.find((ph) => !ph.paid);
                  const isOverdue = nextPhase && nextPhase.due_date < today;
                  return (
                    <tr key={p.id} className={s.clickableRow} onClick={() => setEditId(p.id)} style={isOverdue ? { borderLeft: "3px solid var(--color-danger)" } : undefined}>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{p.contract_number}</td>
                      <td style={{ fontWeight: 600, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.project_name}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{p.client}</td>
                      <td><span className={`${s.badge} ${statusBadge(p.status)}`}>{p.status}</span></td>
                      <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{p.start_date.slice(2)} ~ {p.end_date.slice(2)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap", fontWeight: 700 }}>{fmtMan(p.contract_amount)}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{fmtMan(p.total_settled)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 700, color: p.collection_rate === 100 ? "var(--color-success)" : p.collection_rate > 0 ? "var(--color-primary)" : "var(--color-text-tertiary)" }}>{p.collection_rate}%</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                          <div style={{ width: 40, height: 4, background: "var(--color-divider)", borderRadius: 2 }}>
                            <div style={{ width: `${p.progress}%`, height: 4, background: "var(--color-primary)", borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11 }}>{p.progress}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontWeight: 600, color: p.profit_rate > 50 ? "var(--color-success)" : p.profit_rate > 0 ? "var(--color-text)" : "var(--color-text-tertiary)" }}>{p.profit_rate > 0 ? `${p.profit_rate}%` : "-"}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{p.manager || "-"}</td>
                    </tr>
                  );
                })}
                {filteredProj.length === 0 && <tr><td colSpan={11} style={{ textAlign: "center", padding: 40, color: "var(--color-text-tertiary)" }}>프로젝트가 없습니다</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ══════ 기업별 뷰 ══════ */}
        {viewMode === "client" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {(filterClient ? [filterClient] : [...clientGroups.keys()].sort()).map((name) => {
              const g = clientGroups.get(name);
              if (!g) return null;
              const activeProj = g.projects.filter((p) => p.status === "진행중" || p.status === "계약완료").length;
              const collectionRate = g.totalAmount > 0 ? Math.round((g.totalSettled / g.totalAmount) * 100) : 0;
              const overdueCount = g.projects.flatMap((p) => p.payment_phases.filter((ph) => !ph.paid && ph.due_date < today)).length;
              return (
                <div key={name} className={s.section} style={{ padding: 16, cursor: "pointer", transition: "box-shadow 0.15s" }} onClick={() => { setClientDetailName(name); setClientDetailTab("history"); }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")} onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>프로젝트 {g.projects.length}건 · 진행중 {activeProj}건</div>
                    </div>
                    {overdueCount > 0 && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 100, background: "var(--color-danger-light, #fff5f5)", color: "var(--color-danger)", fontWeight: 700 }}>연체 {overdueCount}</span>}
                  </div>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, marginBottom: 10 }}>
                    <div><span style={{ color: "var(--color-text-tertiary)" }}>누적계약</span> <span style={{ fontWeight: 700 }}>{fmtMan(g.totalAmount)}</span></div>
                    <div><span style={{ color: "var(--color-text-tertiary)" }}>수금</span> <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>{fmtMan(g.totalSettled)}</span></div>
                  </div>
                  {/* 수금율 바 */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "var(--color-divider)", borderRadius: 3 }}>
                      <div style={{ height: 6, width: `${collectionRate}%`, background: collectionRate === 100 ? "var(--color-success)" : "var(--color-primary)", borderRadius: 3, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: collectionRate === 100 ? "var(--color-success)" : "var(--color-primary)", flexShrink: 0 }}>{collectionRate}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 8 }}>최근 계약: {g.latestDate || "-"} · 서류 {g.files.length}건</div>
                </div>
              );
            })}
            {clientGroups.size === 0 && <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-tertiary)", gridColumn: "1/-1" }}>등록된 기업이 없습니다</div>}
          </div>
        )}

        {/* ══════ 기업별 상세 모달 ══════ */}
        {clientDetailName && clientDetailData && (
          <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && setClientDetailName(null)}>
            <div className={s.modal} style={{ maxWidth: 900, width: "95vw" }}>
              <div className={s.modalHeader}>
                <h2 className={s.modalTitle}>{clientDetailName}</h2>
                <button className={s.btnIcon} onClick={() => setClientDetailName(null)} style={{ fontSize: 18 }}>✕</button>
              </div>

              {/* 요약 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, padding: "12px 20px" }}>
                <div className={s.summaryCard} style={{ padding: "10px 14px" }}><div className={s.summaryLabel}>총 프로젝트</div><div className={s.summaryValue} style={{ fontSize: 18 }}>{clientDetailData.projects.length}<span style={{ fontSize: 12, marginLeft: 2 }}>건</span></div></div>
                <div className={s.summaryCard} style={{ padding: "10px 14px" }}><div className={s.summaryLabel}>누적계약금액</div><div className={s.summaryValue} style={{ fontSize: 18 }}>{fmtMan(clientDetailData.totalAmount)}</div></div>
                <div className={s.summaryCard} style={{ padding: "10px 14px" }}><div className={s.summaryLabel}>총 수금액</div><div className={s.summaryValue} style={{ fontSize: 18, color: "var(--color-primary)" }}>{fmtMan(clientDetailData.totalSettled)}</div></div>
                <div className={s.summaryCard} style={{ padding: "10px 14px" }}><div className={s.summaryLabel}>수금율</div><div className={s.summaryValue} style={{ fontSize: 18 }}>{clientDetailData.totalAmount > 0 ? Math.round((clientDetailData.totalSettled / clientDetailData.totalAmount) * 100) : 0}<span style={{ fontSize: 12, marginLeft: 1 }}>%</span></div></div>
                <div className={s.summaryCard} style={{ padding: "10px 14px" }}><div className={s.summaryLabel}>계약서류</div><div className={s.summaryValue} style={{ fontSize: 18 }}>{clientDetailData.files.length}<span style={{ fontSize: 12, marginLeft: 2 }}>건</span></div></div>
              </div>

              {/* 탭 */}
              <div style={{ display: "flex", gap: 2, padding: "0 20px", borderBottom: "1px solid var(--color-border)" }}>
                {([{ id: "history" as ClientDetailTab, label: "계약이력" }, { id: "files" as ClientDetailTab, label: "계약서류" }, { id: "collection" as ClientDetailTab, label: "수금현황" }]).map((t) => (
                  <button key={t.id} className={`${s.btn} ${s.btnSmall}`} style={{
                    borderRadius: "6px 6px 0 0", border: "none", fontWeight: clientDetailTab === t.id ? 700 : 400,
                    background: clientDetailTab === t.id ? "var(--color-white)" : "transparent",
                    borderBottom: clientDetailTab === t.id ? "2px solid var(--color-primary)" : "2px solid transparent",
                  }} onClick={() => setClientDetailTab(t.id)}>{t.label}</button>
                ))}
              </div>

              <div className={s.modalBody} style={{ maxHeight: "calc(100vh - 360px)", overflowY: "auto", padding: "16px 20px" }}>

                {/* 탭1: 계약이력 */}
                {clientDetailTab === "history" && (
                  <table className={s.table}>
                    <thead><tr>
                      <th>코드넘버</th><th>프로젝트명</th><th>상태</th><th>기간</th>
                      <th style={{ textAlign: "right" }}>계약금액</th>
                      <th style={{ textAlign: "right" }}>수금액</th>
                      <th style={{ textAlign: "center" }}>수금율</th>
                      <th style={{ textAlign: "center" }}>진행률</th>
                      <th>담당</th>
                    </tr></thead>
                    <tbody>
                      {clientDetailData.projects.sort((a, b) => b.contract_date.localeCompare(a.contract_date)).map((p) => (
                        <tr key={p.id} className={s.clickableRow} onClick={() => { setClientDetailName(null); setEditId(p.id); }}>
                          <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{p.contract_number}</td>
                          <td style={{ fontWeight: 600 }}>{p.project_name}</td>
                          <td><span className={`${s.badge} ${statusBadge(p.status)}`}>{p.status}</span></td>
                          <td style={{ whiteSpace: "nowrap", fontSize: 11 }}>{p.start_date.slice(2)} ~ {p.end_date.slice(2)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}>{fmtMan(p.contract_amount)}</td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{fmtMan(p.total_settled)}</td>
                          <td style={{ textAlign: "center" }}><span style={{ fontWeight: 700, color: p.collection_rate === 100 ? "var(--color-success)" : "var(--color-primary)" }}>{p.collection_rate}%</span></td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                              <div style={{ width: 36, height: 4, background: "var(--color-divider)", borderRadius: 2 }}><div style={{ width: `${p.progress}%`, height: 4, background: "var(--color-primary)", borderRadius: 2 }} /></div>
                              <span style={{ fontSize: 11 }}>{p.progress}%</span>
                            </div>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>{p.manager || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 700, borderTop: "2px solid var(--color-border)" }}>
                        <td colSpan={4}>합계 ({clientDetailData.projects.length}건)</td>
                        <td style={{ textAlign: "right" }}>{fmtMan(clientDetailData.totalAmount)}</td>
                        <td style={{ textAlign: "right", color: "var(--color-primary)" }}>{fmtMan(clientDetailData.totalSettled)}</td>
                        <td style={{ textAlign: "center" }}>{clientDetailData.totalAmount > 0 ? Math.round((clientDetailData.totalSettled / clientDetailData.totalAmount) * 100) : 0}%</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                )}

                {/* 탭2: 계약서류 — 프로젝트별 그룹, 초안/최종 분류 */}
                {clientDetailTab === "files" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {clientDetailData.projects.sort((a, b) => b.contract_date.localeCompare(a.contract_date)).map((p) => {
                      const pFiles = clientDetailData.files.filter((f) => f.contract_id === p.id);
                      const drafts = pFiles.filter((f) => f.file_type === "계약서초안");
                      const finals = pFiles.filter((f) => f.file_type === "최종계약서");
                      const others = pFiles.filter((f) => f.file_type !== "계약서초안" && f.file_type !== "최종계약서");
                      return (
                        <div key={p.id} className={s.section} style={{ padding: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{p.project_name}</span>
                              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: 8 }}>{p.contract_number}</span>
                            </div>
                            <span className={`${s.badge} ${statusBadge(p.status)}`}>{p.status}</span>
                          </div>
                          {pFiles.length === 0 ? (
                            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", padding: "12px 0", textAlign: "center" }}>등록된 서류가 없습니다</div>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                              {/* 계약서 초안 */}
                              {drafts.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: "#f59e0b", display: "inline-block" }} /> 계약서 초안
                                  </div>
                                  {drafts.map((f) => (
                                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0 4px 12px", fontSize: 12 }}>
                                      <span style={{ color: "var(--color-text-secondary)" }}>{f.file_name}</span>
                                      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{f.uploaded_at}</span>
                                      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{f.file_size < 1024 * 1024 ? Math.round(f.file_size / 1024) + "KB" : (f.file_size / 1024 / 1024).toFixed(1) + "MB"}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* 최종 계약서 */}
                              {finals.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 4, background: "#3182f6", display: "inline-block" }} /> 최종 계약서
                                  </div>
                                  {finals.map((f) => (
                                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0 4px 12px", fontSize: 12 }}>
                                      <span style={{ fontWeight: 600 }}>{f.file_name}</span>
                                      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{f.uploaded_at}</span>
                                      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{f.file_size < 1024 * 1024 ? Math.round(f.file_size / 1024) + "KB" : (f.file_size / 1024 / 1024).toFixed(1) + "MB"}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {/* 기타 서류 */}
                              {others.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-tertiary)", marginBottom: 4 }}>기타 서류</div>
                                  {others.map((f) => (
                                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0 4px 12px", fontSize: 12 }}>
                                      <span className={`${s.badge} ${f.file_type === "견적서" || f.file_type === "검수확인서" ? s.badgeGreen : f.file_type === "발주서" ? s.badgeOrange : s.badgeGray}`} style={{ fontSize: 10 }}>{f.file_type}</span>
                                      <span>{f.file_name}</span>
                                      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{f.uploaded_at}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 탭3: 수금현황 */}
                {clientDetailTab === "collection" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {clientDetailData.projects.sort((a, b) => b.contract_date.localeCompare(a.contract_date)).map((p) => (
                      <div key={p.id} className={s.section} style={{ padding: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 700 }}>{p.project_name}</span>
                            <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginLeft: 8 }}>{fmtMan(p.contract_amount)}</span>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: 13, color: p.collection_rate === 100 ? "var(--color-success)" : "var(--color-primary)" }}>수금 {p.collection_rate}%</span>
                        </div>
                        {/* 수금 바 */}
                        <div style={{ height: 6, background: "var(--color-divider)", borderRadius: 3, marginBottom: 10 }}>
                          <div style={{ height: 6, width: `${p.collection_rate}%`, background: p.collection_rate === 100 ? "var(--color-success)" : "var(--color-primary)", borderRadius: 3 }} />
                        </div>
                        {/* 정산 단계 */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                          {p.payment_phases.map((ph, i) => {
                            const isOverdue = !ph.paid && ph.due_date < today;
                            return (
                              <div key={i} style={{ padding: "8px 10px", borderRadius: 8, background: ph.paid ? "var(--color-success-light, #f0fdf4)" : isOverdue ? "var(--color-danger-light, #fff5f5)" : "var(--color-bg)", border: `1px solid ${ph.paid ? "var(--color-success)" : isOverdue ? "var(--color-danger)" : "var(--color-border)"}` }}>
                                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: ph.paid ? "var(--color-success)" : isOverdue ? "var(--color-danger)" : "var(--color-text-secondary)" }}>
                                  {ph.label} {ph.paid ? "완료" : isOverdue ? "연체" : "예정"}
                                </div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtMan(ph.amount)}</div>
                                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                                  {ph.paid ? `수금일: ${ph.paid_date}` : `예정일: ${ph.due_date}`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {/* 전체 합계 */}
                    <div style={{ padding: "12px 16px", background: "var(--color-bg)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>전체 합계</span>
                      <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                        <span>계약 <strong>{fmtMan(clientDetailData.totalAmount)}</strong></span>
                        <span>수금 <strong style={{ color: "var(--color-primary)" }}>{fmtMan(clientDetailData.totalSettled)}</strong></span>
                        <span>미수금 <strong style={{ color: clientDetailData.totalAmount - clientDetailData.totalSettled > 0 ? "#b45309" : "var(--color-success)" }}>{fmtMan(clientDetailData.totalAmount - clientDetailData.totalSettled)}</strong></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════ 타임라인 뷰 ══════ */}
        {viewMode === "timeline" && (
          <div className={s.section}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4px 12px 0" }}>
              <label style={{ fontSize: 11, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} /> 정산완료 포함
              </label>
            </div>
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
            {filteredProj.filter((p) => showCompleted || p.status !== "정산완료").map((p) => {
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
              const today = new Date().toISOString().slice(0, 10);
              const vatAmount = form.vat === "별도" ? Math.round(form.contract_amount * 0.1) : 0;
              const totalAmountNum = form.contract_amount + vatAmount;
              const phases: PaymentPhase[] = form.settlement_type === "milestone"
                ? form.phases.map((p) => ({
                    label: p.label as PaymentPhase["label"],
                    amount: p.amount,
                    due_date: p.due_date || today,
                    paid: false,
                    paid_date: null,
                  }))
                : [
                    { label: "착수금", amount: Math.round(totalAmountNum * 0.3), due_date: form.start_date || today, paid: false, paid_date: null },
                    { label: "중도금", amount: Math.round(totalAmountNum * 0.4), due_date: form.end_date || today, paid: false, paid_date: null },
                    { label: "잔금", amount: totalAmountNum - Math.round(totalAmountNum * 0.3) - Math.round(totalAmountNum * 0.4), due_date: form.end_date || today, paid: false, paid_date: null },
                  ];
              const newProject: ProjectContract = {
                id: `proj-${Date.now()}`,
                contract_number: contractNumber,
                project_name: form.title,
                client: form.client,
                description: form.description,
                progress: 0,
                acquisition_channel: "직접영업",
                invoice_issued: false,
                start_date: form.start_date || today,
                end_date: form.end_date || today,
                supply_amount: form.contract_amount,
                vat_amount: vatAmount,
                total_amount_num: totalAmountNum,
                billing_initial: phases[0]?.amount || 0,
                billing_interim: phases[1]?.amount || 0,
                billing_final: phases[2]?.amount || 0,
                collected_initial: 0, collected_interim: 0, collected_final: 0,
                collected_amount: 0, remaining_amount: totalAmountNum, collection_rate: 0,
                input_cost: 0, net_profit: 0, net_profit_rate: 0,
                team_members: form.manager ? [form.manager] : [],
                status: "계약완료",
                manager: form.manager,
                contract_date: today,
                total_amount: "",
                paid_amount: "",
                contract_amount: totalAmountNum,
                payment_phases: phases,
                total_settled: 0, total_expense: 0, profit_rate: 0,
              };
              addProject(recalculateProjectContract(newProject));
              setShowForm(false);
            }}
          />
        )}
      </div>
    </>
  );
}
