import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import s from "@/styles/Contracts.module.css";
import d from "@/styles/Dashboard.module.css";
import fc from "@/styles/FixedCostDash.module.css";
import p from "@/styles/PaymentsDash.module.css";
import { type ProjectContract } from "@/data/dummy-contracts";
import { useProjects } from "@/contexts/ProjectContext";
import { useMonthlyClosing } from "@/hooks/useMonthlyClosing";
import ProjectEditModal from "@/components/ProjectEditModal";
import { buildProjectExcelDocument, createProjectDraft, importProjectsFromCsv } from "@/lib/project-contracts";

const fmtNum = (n: number) => n.toLocaleString();
const fmtMan = (n: number) => (n / 10000).toLocaleString() + "만원";
const fmtWon = (n: number) => {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString();
};

const TODAY = new Date().toISOString().slice(0, 10);

type PayStatus = "입금완료" | "미입금" | "지연";

interface PaymentRow {
  month: string;     // YYYY-MM
  amount: number;
  status: PayStatus;
  paid_date: string;
  due_date: string;
}

function derivePayStatus(paid: boolean, paidDate: string | null, dueDate: string): PayStatus {
  if (paid) return "입금완료";
  if (dueDate && dueDate < TODAY) return "지연";
  return "미입금";
}

function projectsToPayRows(projects: ProjectContract[]): PaymentRow[] {
  return projects.flatMap((proj) =>
    proj.payment_phases.map((phase) => ({
      month: "",
      amount: phase.amount,
      status: derivePayStatus(phase.paid, phase.paid_date, phase.due_date),
      paid_date: phase.paid_date ?? "",
      due_date: phase.due_date,
    }))
  );
}

/* ── 월별 수금 차트 ── */
function MonthlyCollectionChart({ projects }: { projects: ProjectContract[] }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [year, setYear] = useState(currentYear);

  const payRows = useMemo(() => projectsToPayRows(projects), [projects]);

  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, "0")}`
  );

  const monthData = useMemo(() => {
    return months.map((ym) => {
      let collected = 0;
      let scheduled = 0;
      for (const r of payRows) {
        if (r.status === "입금완료" && r.paid_date && r.paid_date.slice(0, 7) === ym) collected += r.amount;
        if (r.status !== "입금완료" && r.due_date && r.due_date.slice(0, 7) === ym) scheduled += r.amount;
      }
      return { month: ym, collected, scheduled, total: collected + scheduled };
    });
  }, [payRows, months]);

  const maxVal = Math.max(...monthData.map((m) => m.total), 1);
  const yearTotal = monthData.reduce((a, m) => a + m.collected + m.scheduled, 0);
  const yearCollected = monthData.reduce((a, m) => a + m.collected, 0);

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    for (const r of payRows) {
      if (r.paid_date) set.add(Number(r.paid_date.slice(0, 4)));
      if (r.due_date) set.add(Number(r.due_date.slice(0, 4)));
    }
    return [...set].filter((y) => y > 2000).sort();
  }, [payRows, currentYear]);

  const W = 720, H = 220, padL = 60, padR = 16, padT = 8, padB = 28;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const barGroupW = chartW / 12, barW = barGroupW * 0.6;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={p.chartContainer}>
      <div className={p.chartHeader}>
        <div className={p.chartTitleRow}>
          <span className={fc.chartTitle} style={{ marginBottom: 0 }}>월별 수금 현황</span>
          <div className={p.yearNav}>
            <button className={p.yearBtn} onClick={() => setYear(year - 1)} disabled={!years.includes(year - 1)}>&lt;</button>
            <span className={p.yearLabel}>{year}년</span>
            <button className={p.yearBtn} onClick={() => setYear(year + 1)} disabled={!years.includes(year + 1)}>&gt;</button>
          </div>
        </div>
        <div className={p.chartLegend}>
          <span className={p.legendItem}><span className={p.legendDotCollected} /> 수금완료 {fmtWon(yearCollected)}원</span>
          <span className={p.legendItem}><span className={p.legendDotScheduled} /> 예정 {fmtWon(yearTotal - yearCollected)}원</span>
          <span className={p.legendSep}>|</span>
          <span className={p.legendTotal}>연간 합계 {fmtWon(yearTotal)}원</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={p.chartSvg}>
        {gridLines.map((pct) => {
          const y = padT + chartH * (1 - pct);
          return (
            <g key={pct}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--color-border)" strokeWidth={0.5} strokeDasharray={pct > 0 ? "3,3" : "0"} />
              {pct > 0 && <text x={padL - 6} y={y + 1} textAnchor="end" dominantBaseline="middle" className={p.axisLabel}>{fmtWon(maxVal * pct)}</text>}
            </g>
          );
        })}
        <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="var(--color-border)" strokeWidth={1} />
        {monthData.map((md, i) => {
          const x = padL + i * barGroupW + (barGroupW - barW) / 2;
          const collectedH = (md.collected / maxVal) * chartH;
          const scheduledH = (md.scheduled / maxVal) * chartH;
          const totalH = collectedH + scheduledH;
          const barY = padT + chartH - totalH;
          const isCurrentMonth = md.month === today.toISOString().slice(0, 7);
          return (
            <g key={md.month}>
              {scheduledH > 0 && <rect x={x} y={barY} width={barW} height={scheduledH} rx={scheduledH > 4 ? 3 : 1} fill="#c7d2fe" opacity={0.7} />}
              {collectedH > 0 && <rect x={x} y={barY + scheduledH} width={barW} height={collectedH} rx={collectedH > 4 ? 3 : 1} fill="#3182f6" opacity={0.85} />}
              {totalH > 0 && <text x={x + barW / 2} y={barY - 4} textAnchor="middle" className={p.barValueLabel}>{fmtWon(md.total)}</text>}
              <text x={x + barW / 2} y={padT + chartH + 16} textAnchor="middle" className={`${p.monthLabel} ${isCurrentMonth ? p.monthLabelCurrent : ""}`}>{md.month.slice(5)}월</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
const channelBadge = (ch: string) => {
  switch (ch) {
    case "소개": return s.badgeBlue;
    case "입찰": return s.badgeGreen;
    case "직접영업": return s.badgeOrange;
    case "온라인": return s.badgeGray;
    default: return s.badgeGray;
  }
};

const rateColor = (rate: number) => rate >= 50 ? "var(--color-success)" : rate >= 30 ? "var(--color-primary)" : rate > 0 ? "#b45309" : "var(--color-text-tertiary)";

/* ── 컬럼 정의 ── */
type ColKey =
  | "code" | "client" | "desc" | "progress_stage" | "channel" | "invoice"
  | "start" | "end"
  | "supply" | "vat" | "total"
  | "bill_init" | "bill_mid" | "bill_final"
  | "coll_init" | "coll_mid" | "coll_final"
  | "collected" | "remaining" | "coll_rate"
  | "input_cost" | "profit_rate" | "net_profit"
  | "members";

interface ColDef {
  key: ColKey;
  label: string;
  group: "기본정보" | "기간" | "금액" | "정산 비율" | "수금" | "수금현황" | "수익" | "인원";
}

const ALL_COLUMNS: ColDef[] = [
  { key: "code", label: "코드넘버", group: "기본정보" },
  { key: "client", label: "회사명", group: "기본정보" },
  { key: "desc", label: "세부내역", group: "기본정보" },
  { key: "progress_stage", label: "진척도", group: "기본정보" },
  { key: "channel", label: "수주경로", group: "기본정보" },
  { key: "invoice", label: "세금계산서", group: "기본정보" },
  { key: "start", label: "시작", group: "기간" },
  { key: "end", label: "종료", group: "기간" },
  { key: "supply", label: "공급가액", group: "금액" },
  { key: "vat", label: "부가세", group: "금액" },
  { key: "total", label: "총금액", group: "금액" },
  { key: "bill_init", label: "착수금", group: "정산 비율" },
  { key: "bill_mid", label: "중도금", group: "정산 비율" },
  { key: "bill_final", label: "잔금", group: "정산 비율" },
  { key: "coll_init", label: "착수금", group: "수금" },
  { key: "coll_mid", label: "중도금", group: "수금" },
  { key: "coll_final", label: "잔금", group: "수금" },
  { key: "collected", label: "수금액", group: "수금현황" },
  { key: "remaining", label: "잔여금", group: "수금현황" },
  { key: "coll_rate", label: "수금율", group: "수금현황" },
  { key: "input_cost", label: "투입원가", group: "수익" },
  { key: "profit_rate", label: "이익률", group: "수익" },
  { key: "net_profit", label: "순이익금", group: "수익" },
  { key: "members", label: "투입인원", group: "인원" },
];

const progressStageBadge = (stage: string) => {
  switch (stage) {
    case "시작전": return s.badgeGray;
    case "진행중": return s.badgeBlue;
    case "홀딩": return s.badgeOrange;
    case "완료": return s.badgeGreen;
    default: return s.badgeGray;
  }
};

const PRESETS: Record<string, { label: string; cols: ColKey[] }> = {
  basic: {
    label: "기본",
    cols: ["code", "client", "desc", "progress_stage", "channel", "start", "end", "total", "collected", "remaining", "coll_rate", "members"],
  },
  amount: {
    label: "금액상세",
    cols: ["code", "client", "progress_stage", "start", "end", "supply", "vat", "total", "bill_init", "bill_mid", "bill_final", "coll_init", "coll_mid", "coll_final", "collected", "remaining", "coll_rate"],
  },
  profit: {
    label: "수익분석",
    cols: ["code", "client", "progress_stage", "total", "collected", "remaining", "coll_rate", "input_cost", "profit_rate", "net_profit", "members"],
  },
  all: {
    label: "전체",
    cols: ALL_COLUMNS.map((c) => c.key),
  },
};

type ProjSortKey = "contract_number" | "client" | "start_date" | "total_amount_num" | "collection_rate" | "net_profit_rate";
type ProjSortDir = "asc" | "desc";

type ImportNotice = {
  tone: "success" | "error";
  text: string;
};

export default function ProjectContractsPage() {
  const { projects: projList, files: projFiles, updateProject, addProject, upsertProjects, deleteFile } = useProjects();
  const [showDash, setShowDash] = useState(true);
  const [projSearch, setProjSearch] = useState("");
  const [projStatusFilter, setProjStatusFilter] = useState<"all" | ProjectContract["status"]>("all");
  const [projSortKey, setProjSortKey] = useState<ProjSortKey>("contract_number");
  const [projSortDir, setProjSortDir] = useState<ProjSortDir>("desc");
  const [projEditId, setProjEditId] = useState<string | null>(null);
  const [projCreateDraft, setProjCreateDraft] = useState<ProjectContract | null>(null);
  const [projImportNotice, setProjImportNotice] = useState<ImportNotice | null>(null);
  const projCsvInputRef = useRef<HTMLInputElement | null>(null);

  /* ── 컬럼 가시성 ── */
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(() => new Set(PRESETS.basic.cols));
  const [activePreset, setActivePreset] = useState<string>("basic");
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const colPickerRef = useRef<HTMLDivElement>(null);

  const applyPreset = (key: string) => {
    setVisibleCols(new Set(PRESETS[key].cols));
    setActivePreset(key);
  };

  const toggleCol = (key: ColKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setActivePreset("");
  };

  const show = useCallback((key: ColKey) => visibleCols.has(key), [visibleCols]);

  // close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setColPickerOpen(false);
    };
    if (colPickerOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colPickerOpen]);

  /* ── 그룹 헤더 colspan 계산 ── */
  const groupOrder = ["기본정보", "기간", "금액", "정산 비율", "수금", "수금현황", "수익", "인원"] as const;
  const groupSpans = useMemo(() => {
    const spans: { group: string; span: number; cls?: string }[] = [];
    const groupClsMap: Record<string, string | undefined> = {
      "정산 비율": s.projGroupBilling,
      "수금": s.projGroupCollect,
      "수금현황": s.projGroupStatus,
      "수익": s.projGroupProfit,
    };
    for (const g of groupOrder) {
      const count = ALL_COLUMNS.filter((c) => c.group === g && visibleCols.has(c.key)).length;
      if (count > 0) spans.push({ group: g, span: count, cls: groupClsMap[g] });
    }
    return spans;
  }, [visibleCols]);

  const projToggleSort = (key: ProjSortKey) => {
    if (projSortKey === key) setProjSortDir(projSortDir === "asc" ? "desc" : "asc");
    else { setProjSortKey(key); setProjSortDir("desc"); }
  };
  const projSortArrow = (key: ProjSortKey) => projSortKey === key ? (projSortDir === "asc" ? " ▲" : " ▼") : "";

  const projFiltered = useMemo(() => {
    let result = projList;
    if (projStatusFilter !== "all") result = result.filter((p) => p.status === projStatusFilter);
    if (projSearch.trim()) {
      const t = projSearch.trim().toLowerCase();
      result = result.filter((p) =>
        p.contract_number.toLowerCase().includes(t) || p.client.toLowerCase().includes(t) ||
        p.project_name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t) ||
        p.team_members.some((m) => m.toLowerCase().includes(t))
      );
    }
    return [...result].sort((a, b) => {
      const av = a[projSortKey]; const bv = b[projSortKey];
      if (typeof av === "string" && typeof bv === "string") return projSortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return projSortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [projList, projStatusFilter, projSearch, projSortKey, projSortDir]);

  const projEditProject = projCreateDraft ?? projList.find((p) => p.id === projEditId) ?? null;
  const projEditFiles = projCreateDraft ? [] : projEditId ? projFiles.filter((f) => f.contract_id === projEditId) : [];
  const closeProjModal = () => { setProjEditId(null); setProjCreateDraft(null); };
  const handleProjSave = (updated: ProjectContract) => {
    if (projCreateDraft) addProject(updated);
    else updateProject(updated);
    closeProjModal();
  };
  const handleProjDeleteFile = (fileId: string) => { if (!confirm("파일을 삭제하시겠습니까?")) return; deleteFile(fileId); };
  const handleProjAdd = () => { setProjImportNotice(null); setProjEditId(null); setProjCreateDraft(createProjectDraft(projList)); };
  const handleProjExportExcel = () => {
    const html = buildProjectExcelDocument(projList);
    const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `project-contracts-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleProjCsvChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const csvText = await file.text();
      const result = importProjectsFromCsv(csvText, projList);
      if (result.projects.length === 0) {
        setProjImportNotice({ tone: "error", text: result.warnings[0] ?? "반영할 프로젝트를 찾지 못했습니다." });
        return;
      }
      upsertProjects(result.projects);
      const warningText = result.warnings.length > 0 ? ` 경고 ${result.warnings.length}건.` : "";
      setProjImportNotice({ tone: "success", text: `CSV 반영 완료: 신규 ${result.added}건, 업데이트 ${result.updated}건, 건너뜀 ${result.skipped}건.${warningText}` });
    } catch {
      setProjImportNotice({ tone: "error", text: "CSV 파일을 읽지 못했습니다. UTF-8 형식과 헤더명을 확인해 주세요." });
    } finally {
      event.target.value = "";
    }
  };

  const ProjTH = ({ k, children, align }: { k?: ProjSortKey; children: React.ReactNode; align?: "right" | "center" }) => (
    <th style={{ textAlign: align, cursor: k ? "pointer" : undefined, userSelect: "none" }} onClick={k ? () => projToggleSort(k) : undefined}>{children}{k ? projSortArrow(k) : ""}</th>
  );

  const visibleColCount = visibleCols.size;

  const filteredTotalSupply = projFiltered.reduce((a, p) => a + p.supply_amount, 0);
  const filteredTotalVat = projFiltered.reduce((a, p) => a + p.vat_amount, 0);
  const filteredTotalAmount = projFiltered.reduce((a, p) => a + p.total_amount_num, 0);
  const filteredTotalCollected = projFiltered.reduce((a, p) => a + p.collected_amount, 0);
  const filteredTotalRemaining = projFiltered.reduce((a, p) => a + p.remaining_amount, 0);
  const filteredTotalInputCost = projFiltered.reduce((a, p) => a + p.input_cost, 0);
  const filteredTotalProfit = projFiltered.reduce((a, p) => a + p.net_profit, 0);
  const filteredCollectionRate = filteredTotalAmount > 0 ? Math.round(filteredTotalCollected / filteredTotalAmount * 100) : 0;
  const filteredProfitRate = filteredTotalAmount > 0 ? (filteredTotalProfit / filteredTotalAmount * 100).toFixed(1) : "-";

  /* 합계행에서 기본정보+기간 영역의 빈 colspan 계산 */
  const infoGroupKeys: ColKey[] = ["code", "client", "desc", "progress_stage", "channel", "invoice", "start", "end"];
  const infoVisibleCount = infoGroupKeys.filter((k) => visibleCols.has(k)).length;

  /* ── 월말결산 연동 ── */
  const closingYear = new Date().getFullYear();
  const { yearTotals: closing } = useMonthlyClosing(closingYear);

  /* ── 대시보드 요약 ── */
  const dashTotalContract = projList.reduce((a, proj) => a + proj.total_amount_num, 0);
  const dashTotalCollected = projList.reduce((a, proj) => a + proj.collected_amount, 0);
  const dashTotalRemaining = projList.reduce((a, proj) => a + proj.remaining_amount, 0);
  const dashCollectionRate = dashTotalContract > 0 ? Math.round(dashTotalCollected / dashTotalContract * 100) : 0;
  const dashActiveCount = projList.filter((proj) => proj.status === "진행중").length;
  const dashDelayPayRows = useMemo(() => {
    let count = 0;
    let amount = 0;
    for (const proj of projList) {
      for (const phase of proj.payment_phases) {
        if (!phase.paid && phase.due_date && phase.due_date < TODAY) {
          count++;
          amount += phase.amount;
        }
      }
    }
    return { count, amount };
  }, [projList]);

  return (
    <>
      <Head><title>프로젝트 관리 - WHYDLAB BIZ</title></Head>
      <div className={s.projPage}>
        {/* ── 대시보드 ── */}
        <div className={fc.dashToggle}>
          <button className={fc.dashToggleBtn} onClick={() => setShowDash(!showDash)}>
            {showDash ? "대시보드 접기 ▲" : "대시보드 펼치기 ▼"}
          </button>
        </div>

        {showDash && (
          <div className={fc.dashSection}>
            <div className={fc.statGrid}>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>총 계약금액</div>
                <div className={d.cashStatValue}>{fmtMan(dashTotalContract)}</div>
                <div className={d.cashStatMeta}>전체 {projList.length}건</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>수금 완료</div>
                <div className={d.cashStatValue} style={{ color: "var(--color-success)" }}>{fmtMan(dashTotalCollected)}</div>
                <div className={d.cashStatMeta}>{dashCollectionRate}% 수금율</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>미수금</div>
                <div className={d.cashStatValue} style={{ color: "var(--color-primary)" }}>{fmtMan(dashTotalRemaining)}</div>
                <div className={d.cashStatMeta}>진행중 {dashActiveCount}건</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>수금 지연</div>
                <div className={d.cashStatValue} style={{ color: dashDelayPayRows.count > 0 ? "var(--color-danger)" : "var(--color-text-tertiary)" }}>{dashDelayPayRows.count}건</div>
                <div className={d.cashStatMeta}>{dashDelayPayRows.count > 0 ? `${fmtMan(dashDelayPayRows.amount)} 지연중` : "없음"}</div>
              </div>
            </div>
            {/* 월말결산 연동 요약 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>{closingYear}년 총 지출</div>
                <div className={d.cashStatValue} style={{ color: "#f97316" }}>{fmtMan(closing.totalExpense)}</div>
                <div className={d.cashStatMeta}>고정비 {fmtMan(closing.fixed)} + 인건비 {fmtMan(closing.salary)} + 기타 {fmtMan(closing.etc)}</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>{closingYear}년 순이익</div>
                <div className={d.cashStatValue} style={{ color: closing.net >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                  {closing.net >= 0 ? "+" : ""}{fmtMan(closing.net)}
                </div>
                <div className={d.cashStatMeta}>공급가액 {fmtMan(closing.supply)} - 지출</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>부가세(별도)</div>
                <div className={d.cashStatValue} style={{ color: "var(--color-text-secondary)" }}>{fmtMan(closing.vat)}</div>
                <div className={d.cashStatMeta}>순이익 계산 미포함</div>
              </div>
            </div>
            <div className={d.chartPanel}>
              <MonthlyCollectionChart projects={projList} />
            </div>
          </div>
        )}

        {/* ── 1단: 로컬 탭 ── */}
        <div className={s.projLocalTabs}>
          {(["all", "제안", "계약완료", "진행중", "납품완료", "정산완료"] as const).map((f) => {
            const c = f === "all" ? projList.length : projList.filter((p) => p.status === f).length;
            return (
              <button key={f} className={`${s.projLocalTab} ${projStatusFilter === f ? s.projLocalTabActive : ""}`} onClick={() => setProjStatusFilter(f)}>
                {f === "all" ? "전체" : f}
                <span className={s.projLocalTabCount}>{c}</span>
              </button>
            );
          })}
        </div>

        {/* ── 2단: 툴바 ── */}
        <div className={s.projToolbar}>
          {/* 프리셋 + 컬럼 선택 */}
          <div className={s.projViewSwitcher}>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button key={key} className={`${s.projViewBtn} ${activePreset === key ? s.projViewBtnActive : ""}`} onClick={() => applyPreset(key)}>
                {preset.label}
              </button>
            ))}
            <div className={s.projColPickerWrap} ref={colPickerRef}>
              <button className={`${s.projViewBtn} ${colPickerOpen ? s.projViewBtnActive : ""}`} onClick={() => setColPickerOpen(!colPickerOpen)}>
                컬럼 선택
              </button>
              {colPickerOpen && (
                <div className={s.projColPickerDropdown}>
                  {groupOrder.map((g) => {
                    const cols = ALL_COLUMNS.filter((c) => c.group === g);
                    return (
                      <div key={g} className={s.projColPickerGroup}>
                        <div className={s.projColPickerGroupLabel}>{g}</div>
                        {cols.map((c) => (
                          <label key={c.key} className={s.projColPickerItem}>
                            <input type="checkbox" checked={visibleCols.has(c.key)} onChange={() => toggleCol(c.key)} />
                            <span>{c.label}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className={s.projToolbarRight}>
            <div className={s.projSearchWrap}>
              <input className={s.projSearchInput} placeholder="코드, 회사명, 프로젝트명, 인원 검색" value={projSearch} onChange={(e) => setProjSearch(e.target.value)} />
            </div>
            <div className={s.projActions}>
              <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={handleProjAdd}>+ 추가</button>
              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => projCsvInputRef.current?.click()}>CSV 반영</button>
              <button className={`${s.btn} ${s.btnSmall}`} onClick={handleProjExportExcel}>엑셀 다운</button>
              <input ref={projCsvInputRef} type="file" accept=".csv,text/csv" className={s.fileInputHidden} onChange={handleProjCsvChange} />
            </div>
          </div>
        </div>

        {projImportNotice && (
          <div className={`${s.projectImportNotice} ${projImportNotice.tone === "success" ? s.projectImportNoticeSuccess : s.projectImportNoticeError}`}>
            {projImportNotice.text}
          </div>
        )}

        {/* ── 테이블 ── */}
        <div className={s.projTableSection}>
          <div className={s.projTableScrollArea}>
            <table className={s.projTable}>
              <thead>
                <tr className={s.projGroupRow}>
                  {groupSpans.map((gs) => (
                    <th key={gs.group} colSpan={gs.span} className={gs.cls}>{gs.group}</th>
                  ))}
                </tr>
                <tr>
                  {show("code") && <ProjTH k="contract_number">코드넘버</ProjTH>}
                  {show("client") && <th>회사명</th>}
                  {show("desc") && <th>세부내역</th>}
                  {show("progress_stage") && <th>진척도</th>}
                  {show("channel") && <th>수주경로</th>}
                  {show("invoice") && <th className={s.projThCenter}>세금계산서</th>}
                  {show("start") && <ProjTH k="start_date">시작</ProjTH>}
                  {show("end") && <th>종료</th>}
                  {show("supply") && <ProjTH k="total_amount_num" align="right">공급가액</ProjTH>}
                  {show("vat") && <th className={s.projThRight}>부가세</th>}
                  {show("total") && <th className={s.projThRight}>총금액</th>}
                  {show("bill_init") && <th className={`${s.projThRight} ${s.projThBilling}`}>착수금</th>}
                  {show("bill_mid") && <th className={`${s.projThRight} ${s.projThBilling}`}>중도금</th>}
                  {show("bill_final") && <th className={`${s.projThRight} ${s.projThBilling}`}>잔금</th>}
                  {show("coll_init") && <th className={`${s.projThRight} ${s.projThCollect}`}>착수금</th>}
                  {show("coll_mid") && <th className={`${s.projThRight} ${s.projThCollect}`}>중도금</th>}
                  {show("coll_final") && <th className={`${s.projThRight} ${s.projThCollect}`}>잔금</th>}
                  {show("collected") && <th className={s.projThRight}>수금액</th>}
                  {show("remaining") && <th className={s.projThRight}>잔여금</th>}
                  {show("coll_rate") && <ProjTH k="collection_rate" align="right">수금율</ProjTH>}
                  {show("input_cost") && <th className={s.projThRight}>투입원가</th>}
                  {show("profit_rate") && <ProjTH k="net_profit_rate" align="right">이익률</ProjTH>}
                  {show("net_profit") && <th className={s.projThRight}>순이익금</th>}
                  {show("members") && <th>투입인원</th>}
                </tr>
              </thead>
              <tbody>
                {projFiltered.map((p) => (
                  <tr key={p.id} className={s.clickableRow} onClick={() => setProjEditId(p.id)}>
                    {show("code") && <td className={s.projCode}>{p.contract_number}</td>}
                    {show("client") && <td className={s.projClient}>{p.client}</td>}
                    {show("desc") && <td className={s.projDesc}>{p.description}</td>}
                    {show("progress_stage") && <td><span className={`${s.badge} ${progressStageBadge(p.progress_stage)}`}>{p.progress_stage}</span></td>}
                    {show("channel") && <td><span className={`${s.badge} ${channelBadge(p.acquisition_channel)}`}>{p.acquisition_channel}</span></td>}
                    {show("invoice") && <td className={s.projInvoiceCell}>{p.invoice_issued ? <span className={s.projInvoiceYes}>발행</span> : <span className={s.projInvoiceNo}>미발행</span>}</td>}
                    {show("start") && <td className={s.projDate}>{p.start_date}</td>}
                    {show("end") && <td className={s.projDate}>{p.end_date}</td>}
                    {show("supply") && <td className={s.projAmountBold}>{fmtNum(p.supply_amount)}</td>}
                    {show("vat") && <td className={s.projAmount}>{fmtNum(p.vat_amount)}</td>}
                    {show("total") && <td className={s.projAmountPrimary}>{fmtNum(p.total_amount_num)}</td>}
                    {show("bill_init") && <td className={s.projAmountBilling}>{p.billing_initial}%</td>}
                    {show("bill_mid") && <td className={s.projAmountBilling}>{p.billing_interim}%</td>}
                    {show("bill_final") && <td className={s.projAmountBilling}>{p.billing_final}%</td>}
                    {show("coll_init") && <td className={s.projAmountCollected}>{p.collected_initial > 0 ? fmtNum(p.collected_initial) : "-"}</td>}
                    {show("coll_mid") && <td className={s.projAmountCollected}>{p.collected_interim > 0 ? fmtNum(p.collected_interim) : "-"}</td>}
                    {show("coll_final") && <td className={s.projAmountCollected}>{p.collected_final > 0 ? fmtNum(p.collected_final) : "-"}</td>}
                    {show("collected") && <td className={s.projAmountBold}>{p.collected_amount > 0 ? fmtNum(p.collected_amount) : "-"}</td>}
                    {show("remaining") && <td className={`${s.projAmountBold} ${p.remaining_amount > 0 ? s.projWarnText : s.projMutedText}`}>{p.remaining_amount > 0 ? fmtNum(p.remaining_amount) : "-"}</td>}
                    {show("coll_rate") && <td className={`${s.projAmountBold} ${p.collection_rate >= 100 ? s.projSuccessText : ""}`}>{p.collection_rate > 0 ? `${p.collection_rate}%` : "-"}</td>}
                    {show("input_cost") && <td className={s.projAmount}>{p.input_cost > 0 ? fmtNum(p.input_cost) : "-"}</td>}
                    {show("profit_rate") && <td className={s.projAmountBold} style={{ color: rateColor(p.net_profit_rate) }}>{p.net_profit_rate !== 0 ? `${p.net_profit_rate}%` : "-"}</td>}
                    {show("net_profit") && <td className={`${s.projAmountBold} ${p.net_profit > 0 ? s.projSuccessText : p.net_profit < 0 ? s.projDangerText : s.projMutedText}`}>{p.net_profit !== 0 ? fmtNum(p.net_profit) : "-"}</td>}
                    {show("members") && <td className={s.projMembers}>{p.team_members.map((m) => <span key={m} className={s.projMemberChip}>{m}</span>)}</td>}
                  </tr>
                ))}
                {projFiltered.length === 0 && <tr><td colSpan={visibleColCount} className={s.empty}>등록된 프로젝트가 없습니다</td></tr>}
              </tbody>
              {projFiltered.length > 0 && (
                <tfoot>
                  <tr className={s.projTotalRow}>
                    {show("code") && <td className={s.projTotalLabel}>합계 ({projFiltered.length}건)</td>}
                    {/* 기본정보+기간 나머지 빈 셀 */}
                    {(infoVisibleCount - (show("code") ? 1 : 0)) > 0 && <td colSpan={infoVisibleCount - (show("code") ? 1 : 0)} />}
                    {show("supply") && <td className={s.projAmountBold}>{fmtNum(filteredTotalSupply)}</td>}
                    {show("vat") && <td className={s.projAmount}>{fmtNum(filteredTotalVat)}</td>}
                    {show("total") && <td className={s.projAmountPrimary}>{fmtNum(filteredTotalAmount)}</td>}
                    {show("bill_init") && <td className={s.projAmountBilling}>-</td>}
                    {show("bill_mid") && <td className={s.projAmountBilling}>-</td>}
                    {show("bill_final") && <td className={s.projAmountBilling}>-</td>}
                    {show("coll_init") && <td className={s.projAmountCollected}>{fmtNum(projFiltered.reduce((a, p) => a + p.collected_initial, 0))}</td>}
                    {show("coll_mid") && <td className={s.projAmountCollected}>{fmtNum(projFiltered.reduce((a, p) => a + p.collected_interim, 0))}</td>}
                    {show("coll_final") && <td className={s.projAmountCollected}>{fmtNum(projFiltered.reduce((a, p) => a + p.collected_final, 0))}</td>}
                    {show("collected") && <td className={s.projAmountBold}>{fmtNum(filteredTotalCollected)}</td>}
                    {show("remaining") && <td className={`${s.projAmountBold} ${s.projWarnText}`}>{fmtNum(filteredTotalRemaining)}</td>}
                    {show("coll_rate") && <td className={s.projAmountBold}>{filteredCollectionRate > 0 ? `${filteredCollectionRate}%` : "-"}</td>}
                    {show("input_cost") && <td className={s.projAmount}>{fmtNum(filteredTotalInputCost)}</td>}
                    {show("profit_rate") && <td className={s.projAmountBold}>{filteredProfitRate !== "-" ? `${filteredProfitRate}%` : "-"}</td>}
                    {show("net_profit") && <td className={`${s.projAmountBold} ${s.projSuccessText}`}>{fmtNum(filteredTotalProfit)}</td>}
                    {show("members") && <td />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {projEditProject && (
          <ProjectEditModal
            project={projEditProject}
            onClose={closeProjModal}
            onSave={handleProjSave}
            files={projEditFiles}
            onDeleteFile={handleProjDeleteFile}
            mode={projCreateDraft ? "create" : "edit"}
          />
        )}
      </div>
    </>
  );
}
