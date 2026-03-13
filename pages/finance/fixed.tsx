import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import s from "@/styles/Contracts.module.css";
import d from "@/styles/Dashboard.module.css";
import f from "@/styles/FixedCostDash.module.css";
import { dummyFixedCosts, type FixedCost } from "@/data/dummy-finance";

const fmtNum = (n: number) => n.toLocaleString();
const fmtWon = (n: number) => {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}만`;
  return fmtNum(n);
};
const catBadge = (cat: string) => {
  switch (cat) {
    case "구독": return s.badgeBlue;
    case "임대료": return s.badgeOrange;
    case "운영비": return s.badgePurple ?? s.badgeGray;
    case "식대": return s.badgeGreen;
    case "보험": return s.badgeGray;
    default: return s.badgeGray;
  }
};

const CAT_COLORS: Record<string, string> = {
  "임대료": "#f97316",
  "구독": "#3182f6",
  "보험": "#8b5cf6",
  "식대": "#10b981",
  "운영비": "#6366f1",
  "기타": "#94a3b8",
};

const toMonthly = (c: FixedCost) => {
  if (c.billing_cycle === "월") return c.amount;
  if (c.billing_cycle === "분기") return Math.round(c.amount / 3);
  if (c.billing_cycle === "반기") return Math.round(c.amount / 6);
  if (c.billing_cycle === "연") return Math.round(c.amount / 12);
  return c.amount;
};

/* ── 컬럼 정의 ── */
type ColKey = "name" | "category" | "amount" | "billing_cycle" | "payment_date" | "monthly" | "memo" | "status";

interface ColDef {
  key: ColKey;
  label: string;
  group: "기본정보" | "결제" | "비고";
}

const ALL_COLUMNS: ColDef[] = [
  { key: "name", label: "항목명", group: "기본정보" },
  { key: "category", label: "분류", group: "기본정보" },
  { key: "amount", label: "금액", group: "결제" },
  { key: "billing_cycle", label: "결제주기", group: "결제" },
  { key: "payment_date", label: "결제일", group: "결제" },
  { key: "monthly", label: "월환산", group: "결제" },
  { key: "memo", label: "메모", group: "비고" },
  { key: "status", label: "상태", group: "비고" },
];

const PRESETS: Record<string, { label: string; cols: ColKey[] }> = {
  basic: {
    label: "기본",
    cols: ["name", "category", "amount", "billing_cycle", "payment_date", "monthly", "status"],
  },
  detail: {
    label: "상세",
    cols: ["name", "category", "amount", "billing_cycle", "payment_date", "monthly", "memo", "status"],
  },
};

type SortKey = "name" | "category" | "amount" | "monthly";
type SortDir = "asc" | "desc";

/* ── 분류별 비중 바 차트 ── */
function CategoryBarChart({ items }: { items: FixedCost[] }) {
  const active = items.filter((c) => c.status === "활성");
  const byCat = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of active) {
      const m = toMonthly(c);
      map.set(c.category, (map.get(c.category) ?? 0) + m);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [active]);

  const total = byCat.reduce((a, [, v]) => a + v, 0);
  if (total === 0) return null;

  const W = 460;
  const barH = 22;
  const gap = 8;
  const labelW = 52;
  const valueW = 72;
  const barW = W - labelW - valueW - 16;
  const H = byCat.length * (barH + gap) - gap + 8;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={f.chartSvg}>
      {byCat.map(([cat, val], i) => {
        const pct = val / total;
        const y = i * (barH + gap);
        return (
          <g key={cat}>
            <text x={0} y={y + barH / 2 + 1} dominantBaseline="middle" className={f.barLabel}>{cat}</text>
            <rect x={labelW} y={y + 2} width={barW * pct} height={barH - 4} rx={4} fill={CAT_COLORS[cat] ?? "#94a3b8"} opacity={0.82} />
            <text x={labelW + barW + 8} y={y + barH / 2 + 1} dominantBaseline="middle" className={f.barValue}>{fmtWon(val)}원 ({Math.round(pct * 100)}%)</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 결제주기 도넛 차트 ── */
function CycleDonutChart({ items }: { items: FixedCost[] }) {
  const active = items.filter((c) => c.status === "활성");
  const byCycle = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of active) map.set(c.billing_cycle, (map.get(c.billing_cycle) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [active]);

  const total = byCycle.reduce((a, [, v]) => a + v, 0);
  if (total === 0) return null;

  const cycleColors: Record<string, string> = { "월": "#3182f6", "분기": "#10b981", "반기": "#f59e0b", "연": "#8b5cf6" };
  const cx = 56, cy = 56, r = 44, r2 = 28;

  let accAngle = -Math.PI / 2;
  const arcs = byCycle.map(([cycle, count]) => {
    const pct = count / total;
    const startAngle = accAngle;
    const endAngle = accAngle + pct * 2 * Math.PI;
    accAngle = endAngle;
    const large = pct > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + r2 * Math.cos(endAngle), iy1 = cy + r2 * Math.sin(endAngle);
    const ix2 = cx + r2 * Math.cos(startAngle), iy2 = cy + r2 * Math.sin(startAngle);
    const path = `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${ix1},${iy1} A${r2},${r2} 0 ${large} 0 ${ix2},${iy2} Z`;
    return { cycle, count, pct, path, color: cycleColors[cycle] ?? "#94a3b8" };
  });

  return (
    <div className={f.donutWrap}>
      <svg viewBox={`0 0 ${cx * 2} ${cy * 2}`} className={f.donutSvg}>
        {arcs.map((a) => (
          <path key={a.cycle} d={a.path} fill={a.color} opacity={0.82} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className={f.donutCenter}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className={f.donutCenterSub}>항목</text>
      </svg>
      <div className={f.donutLegend}>
        {arcs.map((a) => (
          <div key={a.cycle} className={f.legendRow}>
            <span className={f.legendDot} style={{ background: a.color }} />
            <span className={f.legendLabel}>{a.cycle}</span>
            <span className={f.legendCount}>{a.count}건</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FixedCostsPage() {
  const [list, setList] = useState<FixedCost[]>(() => dummyFixedCosts.map((d) => ({ ...d })));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FixedCost["status"]>("all");
  const [catFilter, setCatFilter] = useState<"all" | FixedCost["category"]>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showDash, setShowDash] = useState(true);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setColPickerOpen(false);
    };
    if (colPickerOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colPickerOpen]);

  /* ── 그룹 헤더 colspan ── */
  const groupOrder = ["기본정보", "결제", "비고"] as const;
  const groupClsMap: Record<string, string | undefined> = {
    "결제": s.projGroupBilling,
  };
  const groupSpans = useMemo(() => {
    const spans: { group: string; span: number; cls?: string }[] = [];
    for (const g of groupOrder) {
      const count = ALL_COLUMNS.filter((c) => c.group === g && visibleCols.has(c.key)).length;
      if (count > 0) spans.push({ group: g, span: count, cls: groupClsMap[g] });
    }
    return spans;
  }, [visibleCols]);

  /* ── 정렬 ── */
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };
  const sortArrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  /* ── 필터 & 정렬 ── */
  const filtered = useMemo(() => {
    let result = list;
    if (statusFilter !== "all") result = result.filter((c) => c.status === statusFilter);
    if (catFilter !== "all") result = result.filter((c) => c.category === catFilter);
    if (search.trim()) {
      const t = search.trim().toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(t) || c.category.toLowerCase().includes(t) ||
        c.memo.toLowerCase().includes(t)
      );
    }
    return [...result].sort((a, b) => {
      let av: string | number, bv: string | number;
      if (sortKey === "monthly") { av = toMonthly(a); bv = toMonthly(b); }
      else { av = a[sortKey]; bv = b[sortKey]; }
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [list, statusFilter, catFilter, search, sortKey, sortDir]);

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((c) => c.id !== id));
  };

  /* ── 대시보드 통계 ── */
  const active = list.filter((c) => c.status === "활성");
  const totalMonthlyAll = active.reduce((a, c) => a + toMonthly(c), 0);
  const totalAnnual = totalMonthlyAll * 12;
  const subCount = active.filter((c) => c.category === "구독").length;
  const subMonthly = active.filter((c) => c.category === "구독").reduce((a, c) => a + toMonthly(c), 0);

  /* ── 테이블 합계 ── */
  const totalAmount = filtered.reduce((a, c) => a + c.amount, 0);
  const totalMonthly = filtered.reduce((a, c) => a + toMonthly(c), 0);

  const visibleColCount = visibleCols.size;

  const infoKeys: ColKey[] = ["name", "category"];
  const infoVisibleCount = infoKeys.filter((k) => visibleCols.has(k)).length;

  const TH = ({ k, children, align }: { k?: SortKey; children: React.ReactNode; align?: "right" | "center" }) => (
    <th style={{ textAlign: align, cursor: k ? "pointer" : undefined, userSelect: "none" }} onClick={k ? () => toggleSort(k) : undefined}>{children}{k ? sortArrow(k) : ""}</th>
  );

  const categories: FixedCost["category"][] = ["운영비", "구독", "임대료", "식대", "보험", "기타"];

  return (
    <>
      <Head><title>정기결제(고정비) - WHYDLAB BIZ</title></Head>
      <div className={s.projPage}>
        {/* ── 대시보드 ── */}
        <div className={f.dashToggle}>
          <button className={f.dashToggleBtn} onClick={() => setShowDash(!showDash)}>
            {showDash ? "대시보드 접기 ▲" : "대시보드 펼치기 ▼"}
          </button>
        </div>

        {showDash && (
          <div className={f.dashSection}>
            {/* 요약 카드 4개 */}
            <div className={f.statGrid}>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>월 고정비</div>
                <div className={d.cashStatValue}>{fmtWon(totalMonthlyAll)}원</div>
                <div className={d.cashStatMeta}>활성 {active.length}건 기준</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>연간 환산</div>
                <div className={d.cashStatValue} style={{ color: "var(--color-text)" }}>{fmtWon(totalAnnual)}원</div>
                <div className={d.cashStatMeta}>월 고정비 x 12개월</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>구독 서비스</div>
                <div className={d.cashStatValue} style={{ color: "#3182f6" }}>{subCount}건</div>
                <div className={d.cashStatMeta}>월 {fmtWon(subMonthly)}원</div>
              </div>
              <div className={d.cashStatCard}>
                <div className={d.cashStatLabel}>해지 항목</div>
                <div className={d.cashStatValue} style={{ color: "var(--color-text-tertiary)" }}>{list.filter((c) => c.status === "해지").length}건</div>
                <div className={d.cashStatMeta}>비활성 처리됨</div>
              </div>
            </div>

            {/* 차트 영역: 분류별 비중 + 결제주기 */}
            <div className={f.chartGrid}>
              <div className={d.chartPanel}>
                <div className={f.chartTitle}>분류별 월 고정비</div>
                <CategoryBarChart items={list} />
              </div>
              <div className={d.chartPanel}>
                <div className={f.chartTitle}>결제주기 분포</div>
                <CycleDonutChart items={list} />
              </div>
            </div>
          </div>
        )}

        {/* ── 1단: 상태 필터 탭 ── */}
        <div className={s.projLocalTabs}>
          {(["all", "활성", "해지"] as const).map((f) => {
            const c = f === "all" ? list.length : list.filter((item) => item.status === f).length;
            return (
              <button key={f} className={`${s.projLocalTab} ${statusFilter === f ? s.projLocalTabActive : ""}`} onClick={() => setStatusFilter(f)}>
                {f === "all" ? "전체" : f}
                <span className={s.projLocalTabCount}>{c}</span>
              </button>
            );
          })}
        </div>

        {/* ── 2단: 툴바 ── */}
        <div className={s.projToolbar}>
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
              <input className={s.projSearchInput} placeholder="항목명, 분류, 메모 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className={s.projSearchInput} style={{ width: "auto", minWidth: 90 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value as typeof catFilter)}>
              <option value="all">전체 분류</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className={s.projActions}>
              <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`}>+ 추가</button>
            </div>
          </div>
        </div>

        {/* ── 테이블 ── */}
        <div className={s.projTableSection}>
          <div className={s.projTableScrollArea}>
            <table className={s.projTable}>
              <thead>
                <tr className={s.projGroupRow}>
                  {groupSpans.map((gs) => (
                    <th key={gs.group} colSpan={gs.span} className={gs.cls}>{gs.group}</th>
                  ))}
                  <th style={{ width: 28 }} />
                </tr>
                <tr>
                  {show("name") && <TH k="name">항목명</TH>}
                  {show("category") && <TH k="category">분류</TH>}
                  {show("amount") && <TH k="amount" align="right">금액</TH>}
                  {show("billing_cycle") && <th>결제주기</th>}
                  {show("payment_date") && <th>결제일</th>}
                  {show("monthly") && <TH k="monthly" align="right">월환산</TH>}
                  {show("memo") && <th>메모</th>}
                  {show("status") && <th className={s.projThCenter}>상태</th>}
                  <th style={{ width: 28 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className={s.clickableRow}>
                    {show("name") && <td style={{ fontWeight: 600 }}>{c.name}</td>}
                    {show("category") && <td><span className={`${s.badge} ${catBadge(c.category)}`}>{c.category}</span></td>}
                    {show("amount") && <td className={s.projAmountBold}>{fmtNum(c.amount)}</td>}
                    {show("billing_cycle") && <td>{c.billing_cycle}</td>}
                    {show("payment_date") && <td>{c.payment_date}</td>}
                    {show("monthly") && <td className={s.projAmountPrimary}>{fmtNum(toMonthly(c))}</td>}
                    {show("memo") && <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.memo || "-"}</td>}
                    {show("status") && <td className={s.projInvoiceCell}>{c.status === "활성" ? <span className={s.projInvoiceYes}>활성</span> : <span className={s.projInvoiceNo}>해지</span>}</td>}
                    <td><button className={s.btnIcon} onClick={(e) => remove(c.id, e)}>🗑</button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={visibleColCount + 1} className={s.empty}>등록된 항목이 없습니다</td></tr>}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className={s.projTotalRow}>
                    {show("name") && <td className={s.projTotalLabel}>합계 ({filtered.length}건)</td>}
                    {(infoVisibleCount - (show("name") ? 1 : 0)) > 0 && <td colSpan={infoVisibleCount - (show("name") ? 1 : 0)} />}
                    {show("amount") && <td className={s.projAmountBold}>{fmtNum(totalAmount)}</td>}
                    {show("billing_cycle") && <td />}
                    {show("payment_date") && <td />}
                    {show("monthly") && <td className={s.projAmountPrimary}>{fmtNum(totalMonthly)}</td>}
                    {show("memo") && <td />}
                    {show("status") && <td />}
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
