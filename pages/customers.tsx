import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import { dummyCustomers, type Customer } from "@/data/dummy-customers";

const fmt = (n: number) => n.toLocaleString() + "원";

const statusBadge = (status: string) => {
  switch (status) {
    case "상담중": return s.badgeBlue;
    case "견적발송": return s.badgeOrange;
    case "계약완료": return s.badgeGreen;
    case "보류": return s.badgeGray;
    case "실패": return s.badgeRed;
    default: return s.badgeGray;
  }
};

const sourceBadge = (source: string) => {
  switch (source) {
    case "나라장터": return s.badgeGreen;
    case "홈페이지": return s.badgeBlue;
    case "소개": return s.badgeOrange;
    case "SNS": return s.badgeGray;
    default: return s.badgeGray;
  }
};

type StatusFilter = "all" | Customer["status"];

export default function CustomersPage() {
  const [list, setList] = useState<Customer[]>(() =>
    dummyCustomers.map((d) => ({ ...d }))
  );
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = filter === "all" ? list : list.filter((c) => c.status === filter);

  const totalExpected = list.filter((c) => c.status !== "실패").reduce((a, c) => a + c.expected_amount, 0);
  const contracted = list.filter((c) => c.status === "계약완료");
  const contractedTotal = contracted.reduce((a, c) => a + c.expected_amount, 0);
  const inProgress = list.filter((c) => c.status === "상담중" || c.status === "견적발송").length;

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((c) => c.id !== id));
  };

  return (
    <>
      <Head><title>영업 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>영업</h1>
          <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}>+ 고객등록</button>
        </div>

        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>전체 고객</div>
            <div className={s.summaryValue}>{list.length}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>진행중</div>
            <div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{inProgress}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>계약완료 금액</div>
            <div className={s.summaryValue} style={{ color: "var(--color-success)" }}>{fmt(contractedTotal)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>예상 총 매출</div>
            <div className={s.summaryValue}>{fmt(totalExpected)}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {(["all", "상담중", "견적발송", "계약완료", "보류", "실패"] as const).map((f) => (
            <button
              key={f}
              className={`${s.btn} ${s.btnSmall} ${filter === f ? s.btnPrimary : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "전체" : f}
            </button>
          ))}
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>업체명</th>
                <th>담당자</th>
                <th>연락처</th>
                <th>유입경로</th>
                <th>예상금액</th>
                <th>최근연락</th>
                <th>상태</th>
                <th>메모</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.company}</td>
                  <td>{c.contact_name}</td>
                  <td style={{ fontSize: 12 }}>{c.contact_phone}</td>
                  <td><span className={`${s.badge} ${sourceBadge(c.source)}`}>{c.source}</span></td>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{fmt(c.expected_amount)}</td>
                  <td>{c.last_contact_date}</td>
                  <td><span className={`${s.badge} ${statusBadge(c.status)}`}>{c.status}</span></td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.memo}</td>
                  <td><button className={s.btnIcon} onClick={() => remove(c.id)}>🗑</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className={s.empty}>데이터가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
