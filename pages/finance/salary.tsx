import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import { dummySalaryRecords, type SalaryRecord } from "@/data/dummy-finance";

const fmt = (n: number) => n.toLocaleString() + "원";

const statusBadge = (status: string) => {
  switch (status) {
    case "지급완료": return s.badgeGreen;
    case "예정": return s.badgeBlue;
    case "미지급": return s.badgeRed;
    default: return s.badgeGray;
  }
};

export default function SalaryPage() {
  const [list] = useState<SalaryRecord[]>(() =>
    dummySalaryRecords.map((d) => ({ ...d }))
  );
  const [selectedMonth, setSelectedMonth] = useState("2025-03");

  const months = [...new Set(list.map((r) => r.month))].sort().reverse();
  const filtered = list.filter((r) => r.month === selectedMonth);
  const totalNet = filtered.reduce((a, r) => a + r.net_salary, 0);
  const totalBase = filtered.reduce((a, r) => a + r.base_salary, 0);
  const totalDeduct = filtered.reduce((a, r) => a + r.deductions, 0);

  return (
    <>
      <Head><title>월 급여관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>월 급여관리</h1>
          <div style={{ display: "flex", gap: 4 }}>
            {months.map((m) => (
              <button
                key={m}
                className={`${s.btn} ${s.btnSmall} ${m === selectedMonth ? s.btnPrimary : ""}`}
                onClick={() => setSelectedMonth(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>인원</div>
            <div className={s.summaryValue}>{filtered.length}명</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>총 급여(세전)</div>
            <div className={s.summaryValue}>{fmt(totalBase)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>공제액 합계</div>
            <div className={s.summaryValue} style={{ color: "var(--color-danger)" }}>{fmt(totalDeduct)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>실지급 합계</div>
            <div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmt(totalNet)}</div>
          </div>
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>구분</th>
                <th>직책</th>
                <th>기본급</th>
                <th>공제액</th>
                <th>실지급액</th>
                <th>지급일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td><span className={`${s.badge} ${r.type === "정규직" ? s.badgeBlue : s.badgeOrange}`}>{r.type}</span></td>
                  <td>{r.position}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(r.base_salary)}</td>
                  <td style={{ whiteSpace: "nowrap", color: "var(--color-danger)" }}>-{fmt(r.deductions)}</td>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{fmt(r.net_salary)}</td>
                  <td>{r.pay_date}</td>
                  <td><span className={`${s.badge} ${statusBadge(r.status)}`}>{r.status}</span></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className={s.empty}>해당 월 급여 데이터가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
