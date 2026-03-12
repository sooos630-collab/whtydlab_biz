import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import { dummyTaxInvoices, type TaxInvoice } from "@/data/dummy-finance";

const fmt = (n: number) => n.toLocaleString() + "원";

const typeBadge = (type: string) => type === "발행" ? s.badgeBlue : s.badgeOrange;

const statusBadge = (status: string) => {
  switch (status) {
    case "발행완료": return s.badgeGreen;
    case "수취완료": return s.badgeGreen;
    case "미발행": return s.badgeRed;
    default: return s.badgeGray;
  }
};

export default function TaxInvoicePage() {
  const [list, setList] = useState<TaxInvoice[]>(() =>
    dummyTaxInvoices.map((d) => ({ ...d }))
  );
  const [filter, setFilter] = useState<"all" | "발행" | "수취">("all");

  const filtered = filter === "all" ? list : list.filter((t) => t.type === filter);

  const issued = list.filter((t) => t.type === "발행");
  const received = list.filter((t) => t.type === "수취");
  const issuedTotal = issued.reduce((a, t) => a + t.total_amount, 0);
  const receivedTotal = received.reduce((a, t) => a + t.total_amount, 0);
  const pendingCount = list.filter((t) => t.status === "미발행").length;

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((t) => t.id !== id));
  };

  return (
    <>
      <Head><title>세금계산서 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>세금계산서</h1>
          <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}>+ 등록</button>
        </div>

        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>발행 합계</div>
            <div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmt(issuedTotal)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>수취 합계</div>
            <div className={s.summaryValue}>{fmt(receivedTotal)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>전체 건수</div>
            <div className={s.summaryValue}>{list.length}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>미발행</div>
            <div className={s.summaryValue} style={{ color: pendingCount > 0 ? "var(--color-danger)" : undefined }}>{pendingCount}건</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {(["all", "발행", "수취"] as const).map((f) => (
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
                <th>구분</th>
                <th>날짜</th>
                <th>거래처</th>
                <th>적요</th>
                <th>공급가액</th>
                <th>세액</th>
                <th>합계</th>
                <th>상태</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td><span className={`${s.badge} ${typeBadge(t.type)}`}>{t.type}</span></td>
                  <td>{t.date}</td>
                  <td style={{ fontWeight: 600 }}>{t.partner}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t.description}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(t.supply_amount)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(t.tax_amount)}</td>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 700 }}>{fmt(t.total_amount)}</td>
                  <td><span className={`${s.badge} ${statusBadge(t.status)}`}>{t.status}</span></td>
                  <td><button className={s.btnIcon} onClick={() => remove(t.id)}>🗑</button></td>
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
