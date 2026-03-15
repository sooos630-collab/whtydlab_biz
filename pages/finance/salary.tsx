import Head from "next/head";
import { useState, useMemo } from "react";
import s from "@/styles/Contracts.module.css";
import {
  dummyExecLabor, dummyEmployeeSalaries, dummyOutsourceLabor,
  type ExecLaborCost, type EmployeeSalary, type OutsourceLaborCost,
} from "@/data/dummy-finance";
import { dummyHrContracts, dummyOutsourceContracts } from "@/data/dummy-contracts";

const fmt = (n: number) => n.toLocaleString() + "원";
const fmtShort = (n: number) => {
  if (n >= 10000000) return (n / 10000000).toFixed(1).replace(/\.0$/, "") + "천만";
  if (n >= 10000) return (n / 10000).toFixed(0) + "만";
  return n.toLocaleString();
};

const statusBadge = (status: string) => {
  switch (status) {
    case "지급완료": case "완료": return s.badgeGreen;
    case "예정": return s.badgeBlue;
    case "미지급": return s.badgeRed;
    case "진행중": return s.badgeOrange;
    default: return s.badgeGray;
  }
};

const getHr = (id: string) => dummyHrContracts.find((h) => h.id === id);
const getOut = (id: string) => dummyOutsourceContracts.find((o) => o.id === id);

function ContractLink({ hrId, outId }: { hrId?: string; outId?: string }) {
  const hr = hrId ? getHr(hrId) : null;
  const out = outId ? getOut(outId) : null;

  if (hr) {
    return (
      <span className={`${s.badge} ${s.badgeGreen}`} style={{ fontSize: 10, cursor: "help" }}
        title={`[HR계약] ${hr.type} · 입사 ${hr.start_date} · 급여 ${hr.salary}${hr.end_date ? ` · 종료 ${hr.end_date}` : ""}`}>
        HR:{hr.type}
      </span>
    );
  }
  if (out) {
    return (
      <span className={`${s.badge} ${s.badgeOrange}`} style={{ fontSize: 10, cursor: "help" }}
        title={`[외주계약] ${out.type} · ${out.contract_start}~${out.contract_end} · ${out.amount} · ${out.status}`}>
        외주:{out.type}
      </span>
    );
  }
  return <span className={`${s.badge} ${s.badgeGray}`} style={{ fontSize: 10 }}>미연동</span>;
}

/* ── 간단 바 차트 컴포넌트 ── */
function MiniBar({ data, maxVal }: { data: { label: string; exec: number; emp: number; out: number }[]; maxVal: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, padding: "0 4px" }}>
      {data.map((d) => {
        const total = d.exec + d.emp + d.out;
        const h = maxVal > 0 ? (total / maxVal) * 80 : 0;
        const execH = total > 0 ? (d.exec / total) * h : 0;
        const empH = total > 0 ? (d.emp / total) * h : 0;
        const outH = total > 0 ? (d.out / total) * h : 0;
        return (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{fmtShort(total)}</div>
            <div style={{ width: "100%", maxWidth: 32, display: "flex", flexDirection: "column" }} title={`대표/임원: ${fmt(d.exec)}\n직원: ${fmt(d.emp)}\n외주: ${fmt(d.out)}`}>
              <div style={{ height: outH, background: "var(--color-warning)", borderRadius: "3px 3px 0 0" }} />
              <div style={{ height: empH, background: "var(--color-primary)" }} />
              <div style={{ height: execH, background: "var(--color-success)", borderRadius: "0 0 3px 3px" }} />
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 2 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── 기간 프리셋 ── */
type PeriodPreset = "month" | "quarter" | "half" | "year" | "custom";

function getPresetRange(preset: PeriodPreset, baseYear: number, baseMonth: number): [string, string] {
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (preset) {
    case "month":
      return [`${baseYear}-${pad(baseMonth)}`, `${baseYear}-${pad(baseMonth)}`];
    case "quarter": {
      const qStart = Math.floor((baseMonth - 1) / 3) * 3 + 1;
      const qEnd = qStart + 2;
      return [`${baseYear}-${pad(qStart)}`, `${baseYear}-${pad(qEnd)}`];
    }
    case "half": {
      return baseMonth <= 6
        ? [`${baseYear}-01`, `${baseYear}-06`]
        : [`${baseYear}-07`, `${baseYear}-12`];
    }
    case "year":
      return [`${baseYear}-01`, `${baseYear}-12`];
    default:
      return [`${baseYear}-01`, `${baseYear}-12`];
  }
}

function monthInRange(month: string, from: string, to: string) {
  return month >= from && month <= to;
}

function dateInRange(date: string, from: string, to: string) {
  if (!date || date === "-") return false;
  const ym = date.slice(0, 7); // "2025-03-10" → "2025-03"
  return ym >= from && ym <= to;
}

/* ── 월 선택지 생성 ── */
function getMonthOptions(year: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return { value: `${year}-${m}`, label: `${i + 1}월` };
  });
}

export default function SalaryPage() {
  const [activeTab, setActiveTab] = useState<"exec" | "employee" | "outsource">("exec");

  const [execAll] = useState<ExecLaborCost[]>(() => dummyExecLabor.map((d) => ({ ...d })));
  const [empAll] = useState<EmployeeSalary[]>(() => dummyEmployeeSalaries.map((d) => ({ ...d })));
  const [outAll] = useState<OutsourceLaborCost[]>(() => dummyOutsourceLabor.map((d) => ({ ...d })));

  // ── 날짜 필터 상태 ──
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [preset, setPreset] = useState<PeriodPreset>("year");
  const [fromMonth, setFromMonth] = useState(`${now.getFullYear()}-01`);
  const [toMonth, setToMonth] = useState(`${now.getFullYear()}-12`);

  // 프리셋 변경 시 범위 자동 계산
  const handlePreset = (p: PeriodPreset) => {
    setPreset(p);
    if (p !== "custom") {
      const [f, t] = getPresetRange(p, year, now.getMonth() + 1);
      setFromMonth(f);
      setToMonth(t);
    }
  };

  const handleYear = (y: number) => {
    setYear(y);
    if (preset !== "custom") {
      const [f, t] = getPresetRange(preset, y, now.getMonth() + 1);
      setFromMonth(f);
      setToMonth(t);
    } else {
      // custom: 연도만 바꿔줌
      setFromMonth(`${y}-${fromMonth.slice(5)}`);
      setToMonth(`${y}-${toMonth.slice(5)}`);
    }
  };

  // ── 필터링된 데이터 ──
  const execList = useMemo(
    () => execAll.filter((r) => monthInRange(r.month, fromMonth, toMonth)),
    [execAll, fromMonth, toMonth]
  );
  const empList = useMemo(
    () => empAll.filter((r) => monthInRange(r.month, fromMonth, toMonth)),
    [empAll, fromMonth, toMonth]
  );
  const outList = useMemo(
    () => outAll.filter((r) => dateInRange(r.pay_date, fromMonth, toMonth) || dateInRange(r.start_date, fromMonth, toMonth)),
    [outAll, fromMonth, toMonth]
  );

  // ── 대시보드 집계 (필터 적용) ──
  const execTotal = execList.reduce((a, r) => a + r.net_amount, 0);
  const empTotal = empList.reduce((a, r) => a + r.net_salary, 0);
  const outTotalContract = outList.reduce((a, r) => a + r.contract_amount, 0);
  const outTotalPaid = outList.reduce((a, r) => a + r.paid_amount, 0);
  const outRemaining = outTotalContract - outTotalPaid;
  const grandTotal = execTotal + empTotal + outTotalPaid;

  const paidCount = execList.filter((r) => r.status === "지급완료").length
    + empList.filter((r) => r.status === "지급완료").length
    + outList.filter((r) => r.status === "완료").length;
  const pendingCount = execList.filter((r) => r.status === "예정" || r.status === "미지급").length
    + empList.filter((r) => r.status === "예정" || r.status === "미지급").length
    + outList.filter((r) => r.status === "진행중" || r.status === "예정").length;

  // 월별 차트 데이터 (필터 범위 내)
  const monthlyData = useMemo(() => {
    const months = new Set<string>();
    execList.forEach((r) => months.add(r.month));
    empList.forEach((r) => months.add(r.month));
    const sorted = [...months].sort();
    return sorted.map((m) => ({
      label: m.slice(5),
      exec: execList.filter((r) => r.month === m).reduce((a, r) => a + r.net_amount, 0),
      emp: empList.filter((r) => r.month === m).reduce((a, r) => a + r.net_salary, 0),
      out: 0,
    }));
  }, [execList, empList]);

  const maxMonthly = useMemo(
    () => Math.max(...monthlyData.map((d) => d.exec + d.emp + d.out), 1),
    [monthlyData]
  );

  // 범위 라벨
  const rangeLabel = fromMonth === toMonth
    ? `${fromMonth.replace("-", "년 ")}월`
    : `${fromMonth.replace("-", ".")} ~ ${toMonth.replace("-", ".")}`;

  return (
    <>
      <Head><title>인건비 관리 - WHYDLAB BIZ</title></Head>
      <div className={s.projPage}>

        {/* ═══════ 날짜 필터 바 ═══════ */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
          padding: "10px 14px", background: "var(--color-white)",
          borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-xs)",
        }}>
          {/* 연도 */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={() => handleYear(year - 1)} style={arrowBtnStyle}>&lt;</button>
            <span style={{ fontSize: 15, fontWeight: 700, minWidth: 48, textAlign: "center" }}>{year}년</span>
            <button onClick={() => handleYear(year + 1)} style={arrowBtnStyle}>&gt;</button>
          </div>

          <div style={{ width: 1, height: 24, background: "var(--color-border)" }} />

          {/* 프리셋 버튼 */}
          {([
            ["month", "이번달"],
            ["quarter", "분기"],
            ["half", "반기"],
            ["year", "연간"],
            ["custom", "직접선택"],
          ] as [PeriodPreset, string][]).map(([p, label]) => (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              style={{
                padding: "5px 12px", fontSize: 12, fontWeight: preset === p ? 700 : 500,
                color: preset === p ? "var(--color-white)" : "var(--color-text-secondary)",
                background: preset === p ? "var(--color-primary)" : "transparent",
                border: preset === p ? "none" : "1px solid var(--color-border)",
                borderRadius: "var(--radius-xs)", cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {label}
            </button>
          ))}

          {/* 커스텀 날짜 범위 */}
          {preset === "custom" && (
            <>
              <div style={{ width: 1, height: 24, background: "var(--color-border)" }} />
              <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} style={selectStyle}>
                {getMonthOptions(year).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>~</span>
              <select value={toMonth} onChange={(e) => setToMonth(e.target.value)} style={selectStyle}>
                {getMonthOptions(year).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </>
          )}

          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{rangeLabel}</span>
        </div>

        {/* ═══════ 대시보드 ═══════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1.2fr", gap: 10, marginBottom: 16 }}>
          <div style={cardStyle}>
            <div style={cardLabelStyle}>총 지급액</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.03em" }}>{fmtShort(grandTotal)}원</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>
              지급완료 <b style={{ color: "var(--color-success)" }}>{paidCount}건</b> · 예정 <b style={{ color: "var(--color-warning)" }}>{pendingCount}건</b>
            </div>
          </div>

          <div style={cardStyle}>
            <div style={cardLabelStyle}>대표/임원</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-success)" }}>{fmtShort(execTotal)}원</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>{execList.length}건</div>
          </div>

          <div style={cardStyle}>
            <div style={cardLabelStyle}>직원 급여</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-primary)" }}>{fmtShort(empTotal)}원</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>{empList.length}건</div>
          </div>

          <div style={cardStyle}>
            <div style={cardLabelStyle}>외주 인건비</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--color-warning)" }}>{fmtShort(outTotalPaid)}원</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>
              잔여 <b style={{ color: "var(--color-danger)" }}>{fmtShort(outRemaining)}원</b>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: "10px 12px" }}>
            <div style={{ ...cardLabelStyle, marginBottom: 4 }}>
              월별 추이
              <span style={{ fontSize: 9, marginLeft: 6, fontWeight: 400 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--color-success)", borderRadius: 2, marginRight: 2 }} />임원
                <span style={{ display: "inline-block", width: 8, height: 8, background: "var(--color-primary)", borderRadius: 2, marginLeft: 6, marginRight: 2 }} />직원
              </span>
            </div>
            {monthlyData.length > 0 ? (
              <MiniBar data={monthlyData} maxVal={maxMonthly} />
            ) : (
              <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "var(--color-text-tertiary)" }}>
                해당 기간 데이터 없음
              </div>
            )}
          </div>
        </div>

        {/* ═══════ 탭 ═══════ */}
        <div className={s.projLocalTabs}>
          <button className={`${s.projLocalTab} ${activeTab === "exec" ? s.projLocalTabActive : ""}`}
            onClick={() => setActiveTab("exec")}>
            대표/임원
            <span className={s.projLocalTabCount}>{execList.length}</span>
          </button>
          <button className={`${s.projLocalTab} ${activeTab === "employee" ? s.projLocalTabActive : ""}`}
            onClick={() => setActiveTab("employee")}>
            직원
            <span className={s.projLocalTabCount}>{empList.length}</span>
          </button>
          <button className={`${s.projLocalTab} ${activeTab === "outsource" ? s.projLocalTabActive : ""}`}
            onClick={() => setActiveTab("outsource")}>
            외주인건비
            <span className={s.projLocalTabCount}>{outList.length}</span>
          </button>
        </div>

        {/* ═══════ 대표/임원 ═══════ */}
        {activeTab === "exec" && (
          <div className={s.projTableSection}>
            <div className={s.projTableScrollArea}>
              <table className={s.projTable}>
                <thead>
                  <tr>
                    <th>월</th>
                    <th>이름</th>
                    <th>구분</th>
                    <th>계약</th>
                    <th>프로젝트</th>
                    <th>매출</th>
                    <th>직접비</th>
                    <th>순수익</th>
                    <th>적립률</th>
                    <th>운영적립금</th>
                    <th>배분액</th>
                    <th>원천징수</th>
                    <th>실수령</th>
                    <th>지급일</th>
                    <th>상태</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {execList.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 12 }}>{r.month}</td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td><span className={`${s.badge} ${r.role === "대표" ? (s.badgePurple ?? s.badgeGray) : s.badgeBlue}`}>{r.role}</span></td>
                      <td><ContractLink hrId={r.hr_contract_id} /></td>
                      <td style={{ fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.project}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(r.revenue)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(r.direct_cost)}</td>
                      <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{fmt(r.net_profit)}</td>
                      <td>{r.reserve_rate}%</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(r.reserve_amount)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(r.distribution)}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-danger)" }}>-{fmt(r.tax)}</td>
                      <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{fmt(r.net_amount)}</td>
                      <td style={{ fontSize: 12 }}>{r.pay_date}</td>
                      <td><span className={`${s.badge} ${statusBadge(r.status)}`}>{r.status}</span></td>
                      <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.memo || "-"}</td>
                    </tr>
                  ))}
                  {execList.length === 0 && (
                    <tr><td colSpan={16} style={{ textAlign: "center", padding: 24, color: "var(--color-text-tertiary)", fontSize: 13 }}>해당 기간에 데이터가 없습니다</td></tr>
                  )}
                </tbody>
                {execList.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700, borderTop: "2px solid var(--color-border)" }}>
                      <td colSpan={12} style={{ textAlign: "right" }}>실수령 합계</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(execTotal)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ═══════ 직원 ═══════ */}
        {activeTab === "employee" && (
          <div className={s.projTableSection}>
            <div className={s.projTableScrollArea}>
              <table className={s.projTable}>
                <thead>
                  <tr>
                    <th>월</th>
                    <th>이름</th>
                    <th>구분</th>
                    <th>계약</th>
                    <th>직책</th>
                    <th>기본급</th>
                    <th>수당</th>
                    <th>인센티브</th>
                    <th>국민연금</th>
                    <th>건강보험</th>
                    <th>고용보험</th>
                    <th>소득세</th>
                    <th>주민세</th>
                    <th>실지급</th>
                    <th>지급일</th>
                    <th>상태</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {empList.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 12 }}>{r.month}</td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td><span className={`${s.badge} ${r.type === "정규직" ? s.badgeBlue : s.badgeOrange}`}>{r.type}</span></td>
                      <td><ContractLink hrId={r.hr_contract_id} outId={r.outsource_contract_id} /></td>
                      <td>{r.position}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(r.base_salary)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{r.allowances > 0 ? fmt(r.allowances) : "-"}</td>
                      <td style={{ whiteSpace: "nowrap", color: r.incentive > 0 ? "var(--color-primary)" : undefined }}>{r.incentive > 0 ? fmt(r.incentive) : "-"}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-danger)", fontSize: 12 }}>{r.national_pension > 0 ? fmt(r.national_pension) : "-"}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-danger)", fontSize: 12 }}>{r.health_insurance > 0 ? fmt(r.health_insurance) : "-"}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-danger)", fontSize: 12 }}>{r.employment_insurance > 0 ? fmt(r.employment_insurance) : "-"}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-danger)", fontSize: 12 }}>{r.income_tax > 0 ? fmt(r.income_tax) : "-"}</td>
                      <td style={{ whiteSpace: "nowrap", color: "var(--color-danger)", fontSize: 12 }}>{r.resident_tax > 0 ? fmt(r.resident_tax) : "-"}</td>
                      <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{fmt(r.net_salary)}</td>
                      <td style={{ fontSize: 12 }}>{r.pay_date}</td>
                      <td><span className={`${s.badge} ${statusBadge(r.status)}`}>{r.status}</span></td>
                      <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.memo || "-"}</td>
                    </tr>
                  ))}
                  {empList.length === 0 && (
                    <tr><td colSpan={17} style={{ textAlign: "center", padding: 24, color: "var(--color-text-tertiary)", fontSize: 13 }}>해당 기간에 데이터가 없습니다</td></tr>
                  )}
                </tbody>
                {empList.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700, borderTop: "2px solid var(--color-border)" }}>
                      <td colSpan={13} style={{ textAlign: "right" }}>실지급 합계</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(empTotal)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* ═══════ 외주인건비 ═══════ */}
        {activeTab === "outsource" && (
          <div className={s.projTableSection}>
            <div className={s.projTableScrollArea}>
              <table className={s.projTable}>
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>업체</th>
                    <th>계약</th>
                    <th>프로젝트</th>
                    <th>역할</th>
                    <th>계약금액</th>
                    <th>지급완료</th>
                    <th>잔여</th>
                    <th>원천징수</th>
                    <th>계약기간</th>
                    <th>최근지급일</th>
                    <th>상태</th>
                    <th>비고</th>
                  </tr>
                </thead>
                <tbody>
                  {outList.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.company}</td>
                      <td><ContractLink outId={r.outsource_contract_id} /></td>
                      <td style={{ fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.project}</td>
                      <td>{r.role}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(r.contract_amount)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(r.paid_amount)}</td>
                      <td style={{ whiteSpace: "nowrap", color: r.remaining > 0 ? "var(--color-danger)" : "var(--color-text-tertiary)" }}>{fmt(r.remaining)}</td>
                      <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>{r.tax > 0 ? fmt(r.tax) : "-"}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>{r.start_date} ~ {r.end_date}</td>
                      <td style={{ fontSize: 12 }}>{r.pay_date}</td>
                      <td><span className={`${s.badge} ${statusBadge(r.status)}`}>{r.status}</span></td>
                      <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.memo || "-"}</td>
                    </tr>
                  ))}
                  {outList.length === 0 && (
                    <tr><td colSpan={13} style={{ textAlign: "center", padding: 24, color: "var(--color-text-tertiary)", fontSize: 13 }}>해당 기간에 데이터가 없습니다</td></tr>
                  )}
                </tbody>
                {outList.length > 0 && (
                  <tfoot>
                    <tr style={{ fontWeight: 700, borderTop: "2px solid var(--color-border)" }}>
                      <td colSpan={5} style={{ textAlign: "right" }}>합계</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(outTotalContract)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(outTotalPaid)}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{fmt(outTotalContract - outTotalPaid)}</td>
                      <td colSpan={5} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--color-white)",
  borderRadius: "var(--radius-md)",
  boxShadow: "var(--shadow-sm)",
  padding: "14px 16px",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: 6,
};

const arrowBtnStyle: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 13,
  fontWeight: 700,
  background: "none",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-xs)",
  cursor: "pointer",
  color: "var(--color-text-secondary)",
};

const selectStyle: React.CSSProperties = {
  padding: "5px 10px",
  fontSize: 12,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-xs)",
  outline: "none",
  background: "var(--color-white)",
  cursor: "pointer",
};
