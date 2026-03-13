import Head from "next/head";
import { useState, useCallback } from "react";
import s from "@/styles/Contracts.module.css";
import d from "@/styles/Dashboard.module.css";
import fc from "@/styles/FixedCostDash.module.css";
import p from "@/styles/PaymentsDash.module.css";
import { dummyFixedCosts, dummyExecLabor, dummyEmployeeSalaries } from "@/data/dummy-finance";
import { useMonthlyClosing, type MonthlyClosing } from "@/hooks/useMonthlyClosing";

const fmtNum = (n: number) => n.toLocaleString();
const fmtMan = (n: number) => {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  return (n / 10000).toLocaleString() + "만원";
};
const fmtWon = (n: number) => {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(0)}만`;
  return n.toLocaleString();
};

const toMonthly = (c: typeof dummyFixedCosts[number]) => {
  if (c.billing_cycle === "월") return c.amount;
  if (c.billing_cycle === "분기") return Math.round(c.amount / 3);
  if (c.billing_cycle === "반기") return Math.round(c.amount / 6);
  if (c.billing_cycle === "연") return Math.round(c.amount / 12);
  return c.amount;
};

/* ── 월별 결산 데이터 ── */

/* ── 월별 순이익 차트 (라인 only) ── */
function PnLChart({ data }: { data: MonthlyClosing[] }) {
  const W = 720, H = 200, padL = 60, padR = 60, padT = 16, padB = 28;
  const chartW = W - padL - padR, chartH = H - padT - padB;
  const colW = chartW / 12;

  const yearNet = data.reduce((a, m) => a + m.netProfit, 0);
  const yearVat = data.reduce((a, m) => a + m.vatIncome, 0);

  const netValues = data.map((m) => m.netProfit);
  const netMax = Math.max(...netValues, 0);
  const netMin = Math.min(...netValues, 0);
  // 양쪽 대칭 여유
  const absMax = Math.max(Math.abs(netMax), Math.abs(netMin), 1);
  const rangeTop = absMax * 1.15;
  const rangeBottom = -absMax * 1.15;
  const range = rangeTop - rangeBottom;

  const valToY = (v: number) => padT + ((rangeTop - v) / range) * chartH;
  const zeroY = valToY(0);

  const today = new Date();
  const curMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // 포인트 좌표
  const points = data.map((md, i) => ({
    x: padL + i * colW + colW / 2,
    y: valToY(md.netProfit),
    val: md.netProfit,
    hasData: md.supplyIncome > 0 || md.totalExpense > 0,
  }));

  // 영역 fill path
  const activePoints = points.filter((pt) => pt.hasData);
  const areaPath = activePoints.length > 1
    ? `M${activePoints[0].x},${zeroY} ` +
      activePoints.map((pt) => `L${pt.x},${pt.y}`).join(" ") +
      ` L${activePoints[activePoints.length - 1].x},${zeroY} Z`
    : "";

  const linePath = activePoints.length > 1
    ? `M${activePoints[0].x},${activePoints[0].y} ` +
      activePoints.slice(1).map((pt) => `L${pt.x},${pt.y}`).join(" ")
    : "";

  // grid lines
  const gridValues: number[] = [];
  const step = absMax > 0 ? Math.ceil(absMax / 2 / 1000000) * 1000000 : 1000000;
  for (let v = step; v <= rangeTop; v += step) gridValues.push(v);
  for (let v = -step; v >= rangeBottom; v -= step) gridValues.push(v);

  return (
    <div className={p.chartContainer}>
      <div className={p.chartHeader}>
        <div className={p.chartTitleRow}>
          <span className={fc.chartTitle} style={{ marginBottom: 0 }}>월별 순이익</span>
        </div>
        <div className={p.chartLegend} style={{ flexWrap: "wrap" }}>
          <span className={p.legendItem}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981", opacity: 0.85, display: "inline-block" }} />
            흑자
          </span>
          <span className={p.legendItem}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444", opacity: 0.7, display: "inline-block" }} />
            적자
          </span>
          <span className={p.legendSep}>|</span>
          <span className={p.legendTotal} style={{ color: yearNet >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
            연간 {yearNet >= 0 ? "+" : ""}{fmtWon(yearNet)}원
          </span>
          <span className={p.legendSep}>|</span>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>부가세(별도) {fmtWon(yearVat)}원</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={p.chartSvg}>
        {/* grid lines */}
        {gridValues.map((val) => {
          const y = valToY(val);
          if (y < padT - 2 || y > H - padB + 2) return null;
          return (
            <g key={`g-${val}`}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--color-border)" strokeWidth={0.4} strokeDasharray="3,3" />
              <text x={W - padR + 4} y={y + 1} textAnchor="start" dominantBaseline="middle" className={p.axisLabel}
                style={{ fill: val > 0 ? "#10b981" : "#ef4444" }}>
                {val > 0 ? "+" : ""}{fmtWon(val)}
              </text>
            </g>
          );
        })}

        {/* 0선 (기준선) */}
        <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="var(--color-text-secondary)" strokeWidth={1} opacity={0.3} />
        <text x={padL - 6} y={zeroY + 1} textAnchor="end" dominantBaseline="middle" className={p.axisLabel} style={{ fontWeight: 700 }}>0</text>

        {/* 영역 채우기 */}
        <clipPath id="clip-pos"><rect x={padL} y={padT} width={chartW} height={zeroY - padT} /></clipPath>
        <clipPath id="clip-neg"><rect x={padL} y={zeroY} width={chartW} height={H - padB - zeroY} /></clipPath>
        {areaPath && (
          <>
            <path d={areaPath} fill="#10b981" opacity={0.1} clipPath="url(#clip-pos)" />
            <path d={areaPath} fill="#ef4444" opacity={0.1} clipPath="url(#clip-neg)" />
          </>
        )}

        {/* 라인 */}
        {linePath && <path d={linePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}

        {/* 점 + 값 */}
        {points.map((pt, i) => {
          if (!pt.hasData) return null;
          const isNeg = pt.val < 0;
          const labelY = isNeg ? pt.y + 14 : pt.y - 10;
          return (
            <g key={`dot-${i}`}>
              <circle cx={pt.x} cy={pt.y} r={4} fill={isNeg ? "#ef4444" : "#10b981"} stroke="white" strokeWidth={2} />
              <text x={pt.x} y={labelY} textAnchor="middle" dominantBaseline={isNeg ? "hanging" : "auto"}
                style={{ fontSize: "9px", fontWeight: 700, fill: isNeg ? "#ef4444" : "#10b981" }}>
                {pt.val >= 0 ? "+" : ""}{fmtWon(pt.val)}
              </text>
            </g>
          );
        })}

        {/* 월 라벨 */}
        {data.map((md, i) => {
          const cx = padL + i * colW + colW / 2;
          const isCurrentMonth = md.month === curMonthStr;
          return (
            <text key={`ml-${md.month}`} x={cx} y={H - 4} textAnchor="middle"
              className={`${p.monthLabel} ${isCurrentMonth ? p.monthLabelCurrent : ""}`}>
              {md.month.slice(5)}월
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ── 기타지출 입력 모달 ── */
function EtcExpenseModal({
  month, current, memo, onSave, onClose,
}: {
  month: string; current: number; memo: string;
  onSave: (amount: number, memo: string) => void; onClose: () => void;
}) {
  const [amount, setAmount] = useState(current);
  const [memoVal, setMemoVal] = useState(memo);

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ maxWidth: 420 }}>
        <div className={s.modalHeader}>
          <h3 className={s.modalTitle}>{month} 기타지출 입력</h3>
          <button className={s.btnIcon} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label className={s.formLabel}>총 기타지출 금액</label>
            <input className={s.formInput} type="number" placeholder="0" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} style={{ fontSize: 16, fontWeight: 700 }} />
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {[100000, 500000, 1000000, 5000000].map((v) => (
                <button key={v} className={`${s.btn} ${s.btnSmall}`} onClick={() => setAmount(amount + v)} style={{ fontSize: 11 }}>
                  +{(v / 10000).toLocaleString()}만
                </button>
              ))}
              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setAmount(0)} style={{ fontSize: 11, background: "var(--color-divider)" }}>초기화</button>
            </div>
          </div>
          <div>
            <label className={s.formLabel}>메모 (지출 내역 요약)</label>
            <textarea className={s.formInput} placeholder="예: 카드지출 320만 + 현금이체 180만" value={memoVal} onChange={(e) => setMemoVal(e.target.value)} style={{ minHeight: 60, resize: "vertical" }} />
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
            카드/현금/이체 등 고정비·급여 외 모든 지출을 합산하여 입력하세요.<br />
            세부 항목은 메모에 간단히 정리해두면 됩니다.
          </div>
        </div>
        <div className={s.modalFooter}>
          <button className={`${s.btn} ${s.btnSmall}`} onClick={onClose}>취소</button>
          <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={() => onSave(amount, memoVal)}>저장</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════ */
export default function MonthlyClosingPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const [year, setYear] = useState(currentYear);

  // 기타지출 저장 (localStorage)
  const [etcData, setEtcData] = useState<Record<string, { amount: number; memo: string }>>(() => {
    try {
      const raw = localStorage.getItem("whydlab_etc_expense");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  // 확정 상태 저장
  const [confirmedMonths, setConfirmedMonths] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("whydlab_closing_confirmed");
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const saveEtc = useCallback((month: string, amount: number, memo: string) => {
    setEtcData((prev) => {
      const next = { ...prev, [month]: { amount, memo } };
      localStorage.setItem("whydlab_etc_expense", JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleConfirm = useCallback((month: string) => {
    setConfirmedMonths((prev) => {
      const next = { ...prev, [month]: !prev[month] };
      localStorage.setItem("whydlab_closing_confirmed", JSON.stringify(next));
      return next;
    });
  }, []);

  // 공유 훅으로 데이터 계산
  const { monthlyData, yearTotals } = useMonthlyClosing(year, etcData, confirmedMonths);

  // 월 고정비 합계 (현재 활성)
  const monthlyFixedTotal = dummyFixedCosts.filter((c) => c.status === "활성").reduce((a, c) => a + toMonthly(c), 0);
  const curMonth = `${year}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthlySalaryTotal =
    dummyExecLabor.filter((e) => e.month === curMonth).reduce((a, e) => a + e.net_amount, 0) +
    dummyEmployeeSalaries.filter((e) => e.month === curMonth).reduce((a, e) => a + e.net_salary, 0);

  const [editMonth, setEditMonth] = useState<string | null>(null);

  const years = [currentYear - 1, currentYear, currentYear + 1];

  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  return (
    <>
      <Head><title>월말결산 - WHYDLAB BIZ</title></Head>
      <div className={s.page} style={{ maxWidth: "100%" }}>
        <div className={s.pageHeader}>
          <h1>월말결산</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className={p.yearNav}>
              <button className={p.yearBtn} onClick={() => setYear(year - 1)} disabled={!years.includes(year - 1)}>&lt;</button>
              <span className={p.yearLabel}>{year}년</span>
              <button className={p.yearBtn} onClick={() => setYear(year + 1)} disabled={!years.includes(year + 1)}>&gt;</button>
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className={fc.statGrid} style={{ marginBottom: 16 }}>
          <div className={d.cashStatCard}>
            <div className={d.cashStatLabel}>연간 공급가액</div>
            <div className={d.cashStatValue} style={{ color: "var(--color-primary)" }}>{fmtMan(yearTotals.supply)}</div>
            <div className={d.cashStatMeta}>부가세(별도) +{fmtMan(yearTotals.vat)}</div>
          </div>
          <div className={d.cashStatCard}>
            <div className={d.cashStatLabel}>연간 총지출</div>
            <div className={d.cashStatValue} style={{ color: "#f97316" }}>{fmtMan(yearTotals.totalExpense)}</div>
            <div className={d.cashStatMeta}>고정비 {fmtMan(yearTotals.fixed)} + 급여 {fmtMan(yearTotals.salary)} + 기타 {fmtMan(yearTotals.etc)}</div>
          </div>
          <div className={d.cashStatCard}>
            <div className={d.cashStatLabel}>연간 순이익</div>
            <div className={d.cashStatValue} style={{ color: yearTotals.net >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
              {yearTotals.net >= 0 ? "+" : ""}{fmtMan(yearTotals.net)}
            </div>
            <div className={d.cashStatMeta}>공급가액 - 총지출</div>
          </div>
          <div className={d.cashStatCard}>
            <div className={d.cashStatLabel}>월 고정지출</div>
            <div className={d.cashStatValue} style={{ color: "var(--color-text)" }}>{fmtMan(monthlyFixedTotal + monthlySalaryTotal)}</div>
            <div className={d.cashStatMeta}>고정비 {fmtMan(monthlyFixedTotal)} + 급여 {fmtMan(monthlySalaryTotal)}</div>
          </div>
        </div>

        {/* 차트 */}
        <div className={d.chartPanel} style={{ marginBottom: 16 }}>
          <PnLChart data={monthlyData} />
        </div>

        {/* 월별 결산 테이블 */}
        <div className={s.section} style={{ overflowX: "auto", padding: 0 }}>
          <table className={s.table} style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 16 }}>월</th>
                <th colSpan={3} style={{ textAlign: "center", background: "rgba(49,130,246,0.04)" }}>수입</th>
                <th colSpan={3} style={{ textAlign: "center", background: "rgba(249,115,22,0.04)" }}>지출</th>
                <th style={{ textAlign: "right" }}>순이익</th>
                <th style={{ textAlign: "center", width: 80 }}>상태</th>
                <th style={{ width: 100 }} />
              </tr>
              <tr>
                <th style={{ paddingLeft: 16, fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600 }} />
                <th style={{ textAlign: "right", fontSize: 11, color: "#3182f6", fontWeight: 600 }}>공급가액</th>
                <th style={{ textAlign: "right", fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 600 }}>부가세(별도)</th>
                <th style={{ textAlign: "right", fontSize: 11, color: "#3182f6", fontWeight: 600 }}>총 수입</th>
                <th style={{ textAlign: "right", fontSize: 11, color: "#f97316", fontWeight: 600 }}>고정비+급여</th>
                <th style={{ textAlign: "right", fontSize: 11, color: "#f97316", fontWeight: 600 }}>기타지출</th>
                <th style={{ textAlign: "right", fontSize: 11, color: "#f97316", fontWeight: 600 }}>총 지출</th>
                <th style={{ textAlign: "right", fontSize: 11 }} />
                <th />
                <th />
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => {
                const isCurrent = m.month === currentMonthStr;
                const isPast = m.month < currentMonthStr;
                const hasData = m.supplyIncome > 0 || m.totalExpense > 0;
                return (
                  <tr key={m.month} style={{
                    background: isCurrent ? "rgba(49,130,246,0.03)" : undefined,
                    opacity: !hasData && !isCurrent && m.month > currentMonthStr ? 0.4 : 1,
                  }}>
                    <td style={{ paddingLeft: 16, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {m.month.slice(5)}월
                      {isCurrent && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--color-primary)", fontWeight: 800 }}>이번달</span>}
                    </td>
                    {/* 수입 */}
                    <td style={{ textAlign: "right", fontWeight: 600, color: m.supplyIncome > 0 ? "var(--color-primary)" : "var(--color-text-tertiary)" }}>
                      {m.supplyIncome > 0 ? fmtNum(m.supplyIncome) : "-"}
                    </td>
                    <td style={{ textAlign: "right", fontSize: 12, color: "var(--color-text-tertiary)" }}>
                      {m.vatIncome > 0 ? `+${fmtNum(m.vatIncome)}` : "-"}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: m.totalIncome > 0 ? "var(--color-primary)" : "var(--color-text-tertiary)" }}>
                      {m.totalIncome > 0 ? fmtNum(m.totalIncome) : "-"}
                    </td>
                    {/* 지출 */}
                    <td style={{ textAlign: "right", fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {m.fixedCost + m.salary > 0 ? fmtNum(m.fixedCost + m.salary) : "-"}
                    </td>
                    <td style={{ textAlign: "right", cursor: "pointer" }} onClick={() => setEditMonth(m.month)}>
                      {m.etcExpense > 0 ? (
                        <span style={{ fontWeight: 600, color: "#f97316" }}>{fmtNum(m.etcExpense)}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", textDecoration: "underline", textDecorationStyle: "dashed" as const }}>
                          {isPast || isCurrent ? "입력" : "-"}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: m.totalExpense > 0 ? "#f97316" : "var(--color-text-tertiary)" }}>
                      {m.totalExpense > 0 ? fmtNum(m.totalExpense) : "-"}
                    </td>
                    {/* 순이익 */}
                    <td style={{
                      textAlign: "right", fontWeight: 800,
                      color: !hasData ? "var(--color-text-tertiary)" : m.netProfit >= 0 ? "var(--color-success)" : "var(--color-danger)",
                    }}>
                      {hasData ? `${m.netProfit >= 0 ? "+" : ""}${fmtNum(m.netProfit)}` : "-"}
                    </td>
                    {/* 상태 */}
                    <td style={{ textAlign: "center" }}>
                      {m.confirmed ? (
                        <span className={`${s.badge} ${s.badgeGreen}`}>확정</span>
                      ) : isPast ? (
                        <span className={`${s.badge} ${s.badgeOrange}`}>미확정</span>
                      ) : isCurrent ? (
                        <span className={`${s.badge} ${s.badgeBlue}`}>진행중</span>
                      ) : (
                        <span className={`${s.badge} ${s.badgeGray}`}>예정</span>
                      )}
                    </td>
                    {/* 액션 */}
                    <td>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button className={`${s.btn} ${s.btnSmall}`} style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => setEditMonth(m.month)}>
                          기타지출
                        </button>
                        {(isPast || isCurrent) && hasData && (
                          <button
                            className={`${s.btn} ${s.btnSmall}`}
                            style={{ fontSize: 10, padding: "2px 8px", color: m.confirmed ? "var(--color-danger)" : "var(--color-success)" }}
                            onClick={() => toggleConfirm(m.month)}
                          >
                            {m.confirmed ? "취소" : "확정"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* 연간 합계 */}
              <tr style={{ background: "var(--color-bg)", fontWeight: 800 }}>
                <td style={{ paddingLeft: 16 }}>합계</td>
                <td style={{ textAlign: "right", color: "var(--color-primary)" }}>{fmtNum(yearTotals.supply)}</td>
                <td style={{ textAlign: "right", fontSize: 12, color: "var(--color-text-tertiary)" }}>+{fmtNum(yearTotals.vat)}</td>
                <td style={{ textAlign: "right", color: "var(--color-primary)" }}>{fmtNum(yearTotals.totalIncome)}</td>
                <td style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>{fmtNum(yearTotals.fixed + yearTotals.salary)}</td>
                <td style={{ textAlign: "right", color: "#f97316" }}>{fmtNum(yearTotals.etc)}</td>
                <td style={{ textAlign: "right", color: "#f97316" }}>{fmtNum(yearTotals.totalExpense)}</td>
                <td style={{ textAlign: "right", color: yearTotals.net >= 0 ? "var(--color-success)" : "var(--color-danger)" }}>
                  {yearTotals.net >= 0 ? "+" : ""}{fmtNum(yearTotals.net)}
                </td>
                <td />
                <td />
              </tr>
            </tbody>
          </table>
        </div>

        {/* 부가세 안내 */}
        <div style={{ marginTop: 12, padding: "12px 16px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--color-text-secondary)" }}>부가세 별도 관리</strong><br />
          수입의 부가세(10%)는 순이익 계산에 포함되지 않습니다. 부가세는 별도 납부 대상이므로 공급가액 기준으로 손익을 계산합니다.<br />
          <strong style={{ color: "var(--color-text-secondary)" }}>기타지출</strong> — 매월 말 카드/현금/이체 지출 총액을 한번에 입력하세요. 고정비와 급여는 시스템에서 자동 합산됩니다.
        </div>

        {/* 기타지출 입력 모달 */}
        {editMonth && (
          <EtcExpenseModal
            month={editMonth}
            current={etcData[editMonth]?.amount ?? 0}
            memo={etcData[editMonth]?.memo ?? ""}
            onSave={(amount, memo) => { saveEtc(editMonth, amount, memo); setEditMonth(null); }}
            onClose={() => setEditMonth(null)}
          />
        )}
      </div>
    </>
  );
}
