import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import {
  dummyExecLabor, dummyEmployeeSalaries, dummyOutsourceLabor,
  type ExecLaborCost, type EmployeeSalary, type OutsourceLaborCost,
} from "@/data/dummy-finance";
import { dummyHrContracts, dummyOutsourceContracts } from "@/data/dummy-contracts";

const fmt = (n: number) => n.toLocaleString() + "원";

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

export default function SalaryPage() {
  const [activeTab, setActiveTab] = useState<"exec" | "employee" | "outsource">("exec");

  const [execList] = useState<ExecLaborCost[]>(() => dummyExecLabor.map((d) => ({ ...d })));
  const [empList] = useState<EmployeeSalary[]>(() => dummyEmployeeSalaries.map((d) => ({ ...d })));
  const [outList] = useState<OutsourceLaborCost[]>(() => dummyOutsourceLabor.map((d) => ({ ...d })));

  const execTotal = execList.reduce((a, r) => a + r.net_amount, 0);
  const empTotal = empList.reduce((a, r) => a + r.net_salary, 0);
  const outTotalContract = outList.reduce((a, r) => a + r.contract_amount, 0);
  const outTotalPaid = outList.reduce((a, r) => a + r.paid_amount, 0);

  return (
    <>
      <Head><title>인건비 관리 - WHYDLAB BIZ</title></Head>
      <div className={s.projPage}>
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
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: "2px solid var(--color-border)" }}>
                    <td colSpan={12} style={{ textAlign: "right" }}>실수령 합계</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(execTotal)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
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
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: "2px solid var(--color-border)" }}>
                    <td colSpan={13} style={{ textAlign: "right" }}>실지급 합계</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(empTotal)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
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
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: "2px solid var(--color-border)" }}>
                    <td colSpan={5} style={{ textAlign: "right" }}>합계</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(outTotalContract)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(outTotalPaid)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmt(outTotalContract - outTotalPaid)}</td>
                    <td colSpan={5} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
