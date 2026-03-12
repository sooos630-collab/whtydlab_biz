import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import { dummyFixedCosts, type FixedCost } from "@/data/dummy-finance";

const catBadge = (cat: string) => {
  switch (cat) {
    case "구독": return s.badgeBlue;
    case "임대료": return s.badgeOrange;
    case "식대": return s.badgeGreen;
    case "보험": return s.badgeGray;
    default: return s.badgeGray;
  }
};

const fmt = (n: number) => n.toLocaleString() + "원";

export default function FixedCostsPage() {
  const [list, setList] = useState<FixedCost[]>(() =>
    dummyFixedCosts.map((d) => ({ ...d }))
  );

  const active = list.filter((c) => c.status === "활성");
  const monthlyTotal = active.reduce((acc, c) => {
    if (c.billing_cycle === "월") return acc + c.amount;
    if (c.billing_cycle === "분기") return acc + Math.round(c.amount / 3);
    if (c.billing_cycle === "반기") return acc + Math.round(c.amount / 6);
    if (c.billing_cycle === "연") return acc + Math.round(c.amount / 12);
    return acc;
  }, 0);

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((c) => c.id !== id));
  };

  return (
    <>
      <Head><title>정기결제(고정비) - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>정기결제(고정비)</h1>
          <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}>+ 추가</button>
        </div>

        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>활성 항목</div>
            <div className={s.summaryValue}>{active.length}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>월 고정비 합계</div>
            <div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmt(monthlyTotal)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>구독 서비스</div>
            <div className={s.summaryValue}>{active.filter((c) => c.category === "구독").length}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>해지</div>
            <div className={s.summaryValue}>{list.filter((c) => c.status === "해지").length}건</div>
          </div>
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>항목명</th>
                <th>분류</th>
                <th>금액</th>
                <th>결제주기</th>
                <th>결제일</th>
                <th>메모</th>
                <th>상태</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td><span className={`${s.badge} ${catBadge(c.category)}`}>{c.category}</span></td>
                  <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(c.amount)}</td>
                  <td>{c.billing_cycle}</td>
                  <td>{c.payment_date}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{c.memo || "-"}</td>
                  <td>
                    <span className={`${s.badge} ${c.status === "활성" ? s.badgeGreen : s.badgeGray}`}>
                      {c.status}
                    </span>
                  </td>
                  <td><button className={s.btnIcon} onClick={() => remove(c.id)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
