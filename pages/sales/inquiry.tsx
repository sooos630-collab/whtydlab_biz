import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import { dummyInquiries, type Inquiry } from "@/data/dummy-sales";

const statusBadge = (st: string) => {
  switch (st) {
    case "신규": return s.badgeBlue;
    case "확인": return s.badgeOrange;
    case "응답완료": return s.badgeGray;
    case "의뢰전환": return s.badgeGreen;
    default: return s.badgeGray;
  }
};

const sourceBadge = (src: string) => {
  switch (src) {
    case "홈페이지": return s.badgeBlue;
    case "나라장터": return s.badgeGreen;
    case "소개": return s.badgeOrange;
    case "SNS": return s.badgeGray;
    default: return s.badgeGray;
  }
};

type StatusFilter = "all" | Inquiry["status"];

export default function InquiryPage() {
  const [list, setList] = useState<Inquiry[]>(() => dummyInquiries.map((d) => ({ ...d })));
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = filter === "all" ? list : list.filter((i) => i.status === filter);
  const newCount = list.filter((i) => i.status === "신규").length;

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((i) => i.id !== id));
  };

  return (
    <>
      <Head><title>문의폼 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>문의폼 <span className={s.count}>전체 {list.length}건 · 신규 {newCount}건</span></h1>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {(["all", "신규", "확인", "응답완료", "의뢰전환"] as const).map((f) => (
            <button key={f} className={`${s.btn} ${s.btnSmall} ${filter === f ? s.btnPrimary : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? "전체" : f}
            </button>
          ))}
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>접수일</th>
                <th>이름</th>
                <th>회사</th>
                <th>유형</th>
                <th>유입경로</th>
                <th>내용</th>
                <th>상태</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id}>
                  <td>{i.created_at}</td>
                  <td style={{ fontWeight: 600 }}>{i.name}</td>
                  <td>{i.company}</td>
                  <td><span className={`${s.badge} ${s.badgeBlue}`}>{i.type}</span></td>
                  <td><span className={`${s.badge} ${sourceBadge(i.source)}`}>{i.source}</span></td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.message}</td>
                  <td><span className={`${s.badge} ${statusBadge(i.status)}`}>{i.status}</span></td>
                  <td><button className={s.btnIcon} onClick={() => remove(i.id)}>🗑</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className={s.empty}>데이터가 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
