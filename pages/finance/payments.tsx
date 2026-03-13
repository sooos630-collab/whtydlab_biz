import Head from "next/head";
import { useMemo, useState } from "react";
import s from "@/styles/Contracts.module.css";
import d from "@/styles/Dashboard.module.css";
import fc from "@/styles/FixedCostDash.module.css";
import p from "@/styles/PaymentsDash.module.css";
import { useProjects } from "@/contexts/ProjectContext";
import { dummyFixedCosts, dummyEmployeeSalaries } from "@/data/dummy-finance";
import type { ProjectContract } from "@/data/dummy-contracts";

const fmtNum = (n: number) => n.toLocaleString();
const fmtMan = (n: number) => (n / 10000).toLocaleString() + "만원";
const fmtWon = (n: number) => {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString();
};

const TODAY = new Date().toISOString().slice(0, 10);

/* ── 입출금 행 통합 타입 ── */
interface CashFlowRow {
  id: string;
  date: string;       // YYYY-MM-DD
  type: "입금" | "출금";
  category: string;    // 프로젝트수금 / 고정비 / 급여
  description: string;
  partner: string;
  amount: number;
  status: "완료" | "예정" | "지연";
}

function buildCashFlowRows(projects: ProjectContract[]): CashFlowRow[] {
  const rows: CashFlowRow[] = [];

  // 1) 프로젝트 수금 → 입금
  for (const proj of projects) {
    for (const phase of proj.payment_phases) {
      const paid = phase.paid;
      const isDelay = !paid && phase.due_date && phase.due_date < TODAY;
      rows.push({
        id: `proj-${proj.id}-${phase.label}`,
        date: paid ? (phase.paid_date ?? phase.due_date) : phase.due_date,
        type: "입금",
        category: "프로젝트수금",
        description: `${proj.project_name} - ${phase.label}`,
        partner: proj.client,
        amount: phase.amount,
        status: paid ? "완료" : isDelay ? "지연" : "예정",
      });
    }
  }

  // 2) 고정비 → 출금 (이번달 + 다음달)
  const now = new Date();
  for (let offset = 0; offset <= 1; offset++) {
    const d2 = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const ym = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, "0")}`;
    for (const cost of dummyFixedCosts) {
      if (cost.status !== "활성") continue;
      if (cost.billing_cycle === "월" || (cost.billing_cycle === "분기" && d2.getMonth() % 3 === 0) ||
          (cost.billing_cycle === "반기" && d2.getMonth() % 6 === 0) || (cost.billing_cycle === "연" && d2.getMonth() === 2)) {
        const day = cost.payment_date.match(/\d+/)?.[0] ?? "01";
        const dateStr = `${ym}-${day.padStart(2, "0")}`;
        rows.push({
          id: `fixed-${cost.id}-${ym}`,
          date: dateStr,
          type: "출금",
          category: "고정비",
          description: cost.name,
          partner: cost.category,
          amount: cost.amount,
          status: dateStr <= TODAY ? "완료" : "예정",
        });
      }
    }
  }

  // 3) 급여 → 출금
  for (const sal of dummyEmployeeSalaries) {
    rows.push({
      id: `sal-${sal.id}`,
      date: sal.pay_date,
      type: "출금",
      category: "급여",
      description: `${sal.name} (${sal.position})`,
      partner: sal.type,
      amount: sal.net_salary,
      status: sal.status === "지급완료" ? "완료" : "예정",
    });
  }

  return rows;
}

/* ── 월별 입출금 차트 ── */
function CashFlowChart({ rows }: { rows: CashFlowRow[] }) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [year, setYear] = useState(currentYear);

  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, "0")}`
  );

  const monthData = useMemo(() => {
    return months.map((ym) => {
      let income = 0;
      let expense = 0;
      for (const r of rows) {
        if (r.date && r.date.slice(0, 7) === ym) {
          if (r.type === "입금") income += r.amount;
          else expense += r.amount;
        }
      }
      return { month: ym, income, expense, net: income - expense };
    });
  }, [rows, months]);

  const maxVal = Math.max(...monthData.map((m) => Math.max(m.income, m.expense)), 1);
  const yearIncome = monthData.reduce((a, m) => a + m.income, 0);
  const yearExpense = monthData.reduce((a, m) => a + m.expense, 0);

  const years = useMemo(() => {
    const set = new Set<number>();
    set.add(currentYear);
    for (const r of rows) {
      if (r.date) set.add(Number(r.date.slice(0, 4)));
    }
    return [...set].filter((y) => y > 2000).sort();
  }, [rows, currentYear]);

  const W = 720, H = 220, padL = 60, padR = 16, padT = 8, padB = 28;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const barGroupW = chartW / 12;
  const barW = barGroupW * 0.28;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className={p.chartContainer}>
      <div className={p.chartHeader}>
        <div className={p.chartTitleRow}>
          <span className={fc.chartTitle} style={{ marginBottom: 0 }}>월별 입출금 현황</span>
          <div className={p.yearNav}>
            <button className={p.yearBtn} onClick={() => setYear(year - 1)} disabled={!years.includes(year - 1)}>&lt;</button>
            <span className={p.yearLabel}>{year}년</span>
            <button className={p.yearBtn} onClick={() => setYear(year + 1)} disabled={!years.includes(year + 1)}>&gt;</button>
          </div>
        </div>
        <div className={p.chartLegend}>
          <span className={p.legendItem}><span className={p.legendDotCollected} /> 입금 {fmtWon(yearIncome)}원</span>
          <span className={p.legendItem}><span className={p.legendDotExpense} /> 출금 {fmtWon(yearExpense)}원</span>
          <span className={p.legendSep}>|</span>
          <span className={p.legendTotal} style={{ color: yearIncome - yearExpense >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
            순이익 {yearIncome - yearExpense >= 0 ? "+" : ""}{fmtWon(yearIncome - yearExpense)}원
          </span>
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
          const cx = padL + i * barGroupW + barGroupW / 2;
          const incomeH = (md.income / maxVal) * chartH;
          const expenseH = (md.expense / maxVal) * chartH;
          const isCurrentMonth = md.month === today.toISOString().slice(0, 7);
          return (
            <g key={md.month}>
              {/* 입금 바 (왼쪽) */}
              {incomeH > 0 && <rect x={cx - barW - 1} y={padT + chartH - incomeH} width={barW} height={incomeH} rx={2} fill="#3182f6" opacity={0.85} />}
              {/* 출금 바 (오른쪽) */}
              {expenseH > 0 && <rect x={cx + 1} y={padT + chartH - expenseH} width={barW} height={expenseH} rx={2} fill="#f97316" opacity={0.7} />}
              <text x={cx} y={padT + chartH + 16} textAnchor="middle" className={`${p.monthLabel} ${isCurrentMonth ? p.monthLabelCurrent : ""}`}>{md.month.slice(5)}월</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════ */
type TypeFilter = "all" | "입금" | "출금";
type StatusFilter = "all" | "완료" | "예정" | "지연";

const statusBadge = (status: string) => {
  switch (status) {
    case "완료": return s.badgeGreen;
    case "예정": return s.badgeGray;
    case "지연": return s.badgeRed;
    default: return s.badgeGray;
  }
};

const typeBadge = (type: string) => type === "입금" ? s.badgeBlue : s.badgeOrange;

export default function CashFlowPage() {
  const { projects } = useProjects();
  const allRows = useMemo(() => buildCashFlowRows(projects), [projects]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showDash, setShowDash] = useState(true);

  const filtered = useMemo(() => {
    let result = [...allRows].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (typeFilter !== "all") result = result.filter((r) => r.type === typeFilter);
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) =>
        r.description.toLowerCase().includes(q) ||
        r.partner.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allRows, typeFilter, statusFilter, search]);

  const totalIncome = allRows.filter((r) => r.type === "입금").reduce((a, r) => a + r.amount, 0);
  const totalExpense = allRows.filter((r) => r.type === "출금").reduce((a, r) => a + r.amount, 0);
  const completedIncome = allRows.filter((r) => r.type === "입금" && r.status === "완료").reduce((a, r) => a + r.amount, 0);
  const completedExpense = allRows.filter((r) => r.type === "출금" && r.status === "완료").reduce((a, r) => a + r.amount, 0);
  const delayCount = allRows.filter((r) => r.status === "지연").length;

  return (
    <>
      <Head><title>입출금 현황 - WHYDLAB BIZ</title></Head>
      <div className={s.page} style={{ maxWidth: "100%" }}>
        <div className={s.pageHeader}>
          <h1>입출금 현황</h1>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>프로젝트 수금 + 고정비 + 급여 통합</span>
        </div>

        {/* 대시보드 */}
        <div className={fc.dashToggle}>
          <button className={fc.dashToggleBtn} onClick={() => setShowDash(!showDash)}>
            {showDash ? "대시보드 접기 ▲" : "대시보드 펼치기 ▼"}
          </button>
        </div>

        {showDash && (
          <div className={fc.dashSection}>
            <div className={fc.statGrid}>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>총 입금</div>
                <div className={d.cashStatValue} style={{ color: "var(--color-primary)" }}>{fmtMan(totalIncome)}</div>
                <div className={d.cashStatMeta}>실입금 {fmtMan(completedIncome)}</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>총 출금</div>
                <div className={d.cashStatValue} style={{ color: "#f97316" }}>{fmtMan(totalExpense)}</div>
                <div className={d.cashStatMeta}>실출금 {fmtMan(completedExpense)}</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>순이익</div>
                <div className={d.cashStatValue} style={{ color: totalIncome - totalExpense >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                  {totalIncome - totalExpense >= 0 ? "+" : ""}{fmtMan(totalIncome - totalExpense)}
                </div>
                <div className={d.cashStatMeta}>입금 - 출금</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>지연</div>
                <div className={d.cashStatValue} style={{ color: delayCount > 0 ? "var(--color-danger)" : "var(--color-text-tertiary)" }}>{delayCount}건</div>
                <div className={d.cashStatMeta}>{delayCount > 0 ? `${fmtMan(allRows.filter((r) => r.status === "지연").reduce((a, r) => a + r.amount, 0))}` : "없음"}</div>
              </div>
            </div>
            <div className={d.chartPanel}>
              <CashFlowChart rows={allRows} />
            </div>
          </div>
        )}

        {/* 필터 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
          {(["all", "입금", "출금"] as const).map((f) => {
            const cnt = f === "all" ? allRows.length : allRows.filter((r) => r.type === f).length;
            return (
              <button key={f} className={`${s.btn} ${s.btnSmall} ${typeFilter === f ? s.btnPrimary : ""}`} onClick={() => setTypeFilter(f)}>
                {f === "all" ? "전체" : f}
                <span style={{ marginLeft: 3, fontSize: 11, opacity: 0.7 }}>{cnt}</span>
              </button>
            );
          })}
          <div style={{ width: 1, height: 24, background: "var(--color-border)", margin: "0 4px" }} />
          {(["all", "완료", "예정", "지연"] as const).map((f) => {
            const cnt = f === "all" ? allRows.length : allRows.filter((r) => r.status === f).length;
            return (
              <button key={f} className={`${s.btn} ${s.btnSmall} ${statusFilter === f ? s.btnPrimary : ""}`} onClick={() => setStatusFilter(f)}>
                {f === "all" ? "전체상태" : f}
                <span style={{ marginLeft: 3, fontSize: 11, opacity: 0.7 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        <div className={s.toolbar}>
          <div className={s.toolbarSearch}>
            <span className={s.toolbarSearchIcon}>🔍</span>
            <input className={s.toolbarSearchInput} placeholder="내역, 거래처, 분류 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{filtered.length}건</span>
        </div>

        {/* 테이블 */}
        <div className={s.section} style={{ overflowX: "auto", padding: 0 }}>
          <table className={s.table} style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>날짜</th>
                <th>구분</th>
                <th>분류</th>
                <th>내역</th>
                <th>거래처</th>
                <th style={{ textAlign: "right" }}>금액</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ paddingLeft: 20, whiteSpace: "nowrap" }}>{r.date || "-"}</td>
                  <td><span className={`${s.badge} ${typeBadge(r.type)}`}>{r.type}</span></td>
                  <td><span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{r.description}</td>
                  <td>{r.partner}</td>
                  <td style={{ textAlign: "right", fontWeight: 700, whiteSpace: "nowrap", color: r.type === "입금" ? "var(--color-primary)" : "#f97316" }}>
                    {r.type === "입금" ? "+" : "-"}{fmtNum(r.amount)}원
                  </td>
                  <td><span className={`${s.badge} ${statusBadge(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={s.empty}>데이터가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, padding: "12px 16px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--color-text-secondary)" }}>데이터 출처</strong><br />
          <strong>입금</strong>: 계약관리 &gt; 프로젝트 관리의 수금 데이터 | <strong>출금</strong>: 정기결제(고정비) + 월 급여관리
        </div>
      </div>
    </>
  );
}
