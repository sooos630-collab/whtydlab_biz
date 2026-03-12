import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import { dummyAccounts, type AccountInfo } from "@/data/dummy-accounts";

const catBadge = (cat: string) => {
  switch (cat) {
    case "이메일": return s.badgeBlue;
    case "클라우드": return s.badgeOrange;
    case "디자인": return s.badgeGreen;
    case "개발": return s.badgeGray;
    case "마케팅": return s.badgeBlue;
    case "정부": return s.badgeOrange;
    case "금융": return s.badgeGreen;
    default: return s.badgeGray;
  }
};

type CatFilter = "all" | AccountInfo["category"];

export default function AccountsPage() {
  const [list, setList] = useState<AccountInfo[]>(() =>
    dummyAccounts.map((d) => ({ ...d }))
  );
  const [filter, setFilter] = useState<CatFilter>("all");
  const [visiblePw, setVisiblePw] = useState<Set<string>>(new Set());

  const categories = [...new Set(list.map((a) => a.category))];
  const filtered = filter === "all" ? list : list.filter((a) => a.category === filter);

  const togglePw = (id: string) => {
    setVisiblePw((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((a) => a.id !== id));
  };

  return (
    <>
      <Head><title>계정관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>계정관리</h1>
          <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}>+ 계정추가</button>
        </div>

        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>전체 계정</div>
            <div className={s.summaryValue}>{list.length}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>분류 수</div>
            <div className={s.summaryValue}>{categories.length}개</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>개발 도구</div>
            <div className={s.summaryValue}>{list.filter((a) => a.category === "개발").length}건</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>금융/정부</div>
            <div className={s.summaryValue}>{list.filter((a) => a.category === "금융" || a.category === "정부").length}건</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          <button
            className={`${s.btn} ${s.btnSmall} ${filter === "all" ? s.btnPrimary : ""}`}
            onClick={() => setFilter("all")}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${s.btn} ${s.btnSmall} ${filter === cat ? s.btnPrimary : ""}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>플랫폼</th>
                <th>분류</th>
                <th>아이디</th>
                <th>비밀번호</th>
                <th>URL</th>
                <th>담당자</th>
                <th>메모</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.platform}</td>
                  <td><span className={`${s.badge} ${catBadge(a.category)}`}>{a.category}</span></td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{a.login_id}</td>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: 12, marginRight: 4 }}>
                      {visiblePw.has(a.id) ? a.password : "••••••••"}
                    </span>
                    <button
                      className={s.btnIcon}
                      onClick={() => togglePw(a.id)}
                      style={{ fontSize: 11 }}
                    >
                      {visiblePw.has(a.id) ? "🙈" : "👁"}
                    </button>
                  </td>
                  <td>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "var(--color-primary)" }}
                    >
                      바로가기
                    </a>
                  </td>
                  <td>{a.manager}</td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.memo}</td>
                  <td><button className={s.btnIcon} onClick={() => remove(a.id)}>🗑</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className={s.empty}>데이터가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
