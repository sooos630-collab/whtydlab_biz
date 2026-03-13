import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import { dummyGovProjects, type GovProject } from "@/data/dummy-government";

const fmt = (n: number) => n.toLocaleString() + "원";

const statusBadge = (status: string) => {
  switch (status) {
    case "공고확인": return s.badgeGray;
    case "준비중": return s.badgeBlue;
    case "신청완료": return s.badgeOrange;
    case "선정": return s.badgeGreen;
    case "탈락": return s.badgeRed;
    case "수행중": return s.badgeGreen;
    case "완료": return s.badgeGray;
    default: return s.badgeGray;
  }
};

const catBadge = (cat: string) => {
  switch (cat) {
    case "R&D": return s.badgeBlue;
    case "사업화": return s.badgeOrange;
    case "인력": return s.badgeGreen;
    case "수출": return s.badgeGray;
    default: return s.badgeGray;
  }
};

type StatusFilter = "all" | "진행" | "완료/탈락";

export default function GovernmentManagePage() {
  const [list, setList] = useState<GovProject[]>(() =>
    dummyGovProjects.map((d) => ({ ...d }))
  );
  const [filter, setFilter] = useState<StatusFilter>("all");

  const getFiltered = () => {
    if (filter === "all") return list;
    if (filter === "진행") return list.filter((p) => !["완료", "탈락"].includes(p.status));
    return list.filter((p) => ["완료", "탈락"].includes(p.status));
  };
  const filtered = getFiltered();

  const active = list.filter((p) => ["수행중", "선정"].includes(p.status));
  const activeTotal = active.reduce((a, p) => a + p.amount, 0);
  const preparing = list.filter((p) => ["공고확인", "준비중", "신청완료"].includes(p.status)).length;
  const successRate = (() => {
    const decided = list.filter((p) => ["선정", "탈락", "수행중", "완료"].includes(p.status));
    if (decided.length === 0) return "-";
    const won = decided.filter((p) => ["선정", "수행중", "완료"].includes(p.status)).length;
    return Math.round((won / decided.length) * 100) + "%";
  })();

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((p) => p.id !== id));
  };

  return (
    <>
      <Head><title>지원사업관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>지원사업관리</h1>
          <button className={`${s.btn} ${s.btnSmall}`}>+ 사업등록</button>
        </div>

        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>수행/선정 금액</div>
            <div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmt(activeTotal)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>준비중</div>
            <div className={s.summaryValue}>{preparing}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>수행중</div>
            <div className={s.summaryValue} style={{ color: "var(--color-success)" }}>{active.length}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>선정률</div>
            <div className={s.summaryValue}>{successRate}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {(["all", "진행", "완료/탈락"] as const).map((f) => (
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
                <th>사업명</th>
                <th>주관기관</th>
                <th>분류</th>
                <th>지원금액</th>
                <th>마감일</th>
                <th>수행기간</th>
                <th>담당자</th>
                <th>상태</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</td>
                  <td style={{ fontSize: 12 }}>{p.agency}</td>
                  <td><span className={`${s.badge} ${catBadge(p.category)}`}>{p.category}</span></td>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{fmt(p.amount)}</td>
                  <td>{p.deadline}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{p.period}</td>
                  <td>{p.manager}</td>
                  <td><span className={`${s.badge} ${statusBadge(p.status)}`}>{p.status}</span></td>
                  <td><button className={s.btnIcon} onClick={() => remove(p.id)}>🗑</button></td>
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
