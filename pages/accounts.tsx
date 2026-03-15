import Head from "next/head";
import { useState, useMemo } from "react";
import s from "@/styles/Contracts.module.css";
import {
  dummyAccounts,
  dummyGroups,
  type AccountInfo,
  type AccountGroup,
} from "@/data/dummy-accounts";

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
  const [groups, setGroups] = useState<AccountGroup[]>(() =>
    dummyGroups.map((g) => ({ ...g }))
  );
  const [list, setList] = useState<AccountInfo[]>(() =>
    dummyAccounts.map((d) => ({ ...d }))
  );
  const [activeGroup, setActiveGroup] = useState<string>(dummyGroups[0]?.id ?? "");
  const [filter, setFilter] = useState<CatFilter>("all");
  const [visiblePw, setVisiblePw] = useState<Set<string>>(new Set());

  // 그룹 추가
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // 그룹 수정/삭제
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");

  // 계정 추가 모달
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    platform: "",
    category: "기타" as AccountInfo["category"],
    login_id: "",
    password: "",
    url: "",
    memo: "",
  });

  const groupAccounts = useMemo(
    () => list.filter((a) => a.group_id === activeGroup),
    [list, activeGroup]
  );

  const categories = useMemo(
    () => [...new Set(groupAccounts.map((a) => a.category))],
    [groupAccounts]
  );

  const filtered = useMemo(
    () => filter === "all" ? groupAccounts : groupAccounts.filter((a) => a.category === filter),
    [groupAccounts, filter]
  );

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    groupAccounts.forEach((a) => { m[a.category] = (m[a.category] || 0) + 1; });
    return m;
  }, [groupAccounts]);

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

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const id = `grp-${Date.now()}`;
    setGroups([...groups, { id, name, order: groups.length }]);
    setNewGroupName("");
    setShowGroupInput(false);
    setActiveGroup(id);
    setFilter("all");
  };

  const renameGroup = (id: string) => {
    const name = editGroupName.trim();
    if (!name) return;
    setGroups(groups.map((g) => (g.id === id ? { ...g, name } : g)));
    setEditingGroup(null);
    setEditGroupName("");
  };

  const deleteGroup = (id: string) => {
    const g = groups.find((g) => g.id === id);
    const count = list.filter((a) => a.group_id === id).length;
    if (!confirm(`"${g?.name}" 그룹을 삭제합니다.\n포함된 ${count}개 계정도 함께 삭제됩니다.`)) return;
    setGroups(groups.filter((g) => g.id !== id));
    setList(list.filter((a) => a.group_id !== id));
    if (activeGroup === id) {
      const remaining = groups.filter((g) => g.id !== id);
      setActiveGroup(remaining[0]?.id ?? "");
    }
    setFilter("all");
  };

  const addAccount = () => {
    if (!newAccount.platform || !newAccount.login_id) return;
    const acc: AccountInfo = {
      id: `acc-${Date.now()}`,
      group_id: activeGroup,
      ...newAccount,
    };
    setList([...list, acc]);
    setNewAccount({ platform: "", category: "기타", login_id: "", password: "", url: "", memo: "" });
    setShowAddModal(false);
  };

  const activeGroupName = groups.find((g) => g.id === activeGroup)?.name ?? "";

  return (
    <>
      <Head><title>계정관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        {/* Header */}
        <div className={s.pageHeader}>
          <h1>계정관리</h1>
          <button
            className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
            onClick={() => setShowAddModal(true)}
          >
            + 계정추가
          </button>
        </div>

        {/* 업체 탭 */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 16, borderBottom: "2px solid var(--color-border)" }}>
          {groups.map((g) => (
            <div
              key={g.id}
              style={{ position: "relative" }}
              onContextMenu={(e) => {
                e.preventDefault();
                setEditingGroup(g.id);
                setEditGroupName(g.name);
              }}
            >
              <button
                onClick={() => { setActiveGroup(g.id); setFilter("all"); }}
                style={{
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: activeGroup === g.id ? 700 : 500,
                  color: activeGroup === g.id ? "var(--color-primary)" : "var(--color-text-secondary)",
                  background: "none",
                  border: "none",
                  borderBottom: activeGroup === g.id ? "2px solid var(--color-primary)" : "2px solid transparent",
                  marginBottom: -2,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {g.name}
                <span style={{
                  marginLeft: 6,
                  fontSize: 11,
                  color: activeGroup === g.id ? "var(--color-primary)" : "var(--color-text-tertiary)",
                  fontWeight: 400,
                }}>
                  {list.filter((a) => a.group_id === g.id).length}
                </span>
              </button>
            </div>
          ))}
          {showGroupInput ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 4 }}>
              <input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addGroup(); if (e.key === "Escape") setShowGroupInput(false); }}
                placeholder="그룹명"
                style={{
                  padding: "6px 10px",
                  fontSize: 12,
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-xs)",
                  width: 100,
                  outline: "none",
                }}
              />
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={addGroup} style={{ padding: "5px 10px", fontSize: 11 }}>추가</button>
              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setShowGroupInput(false)} style={{ padding: "5px 10px", fontSize: 11 }}>취소</button>
            </div>
          ) : (
            <button
              onClick={() => setShowGroupInput(true)}
              style={{
                padding: "10px 14px",
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + 그룹추가
            </button>
          )}
        </div>

        {/* 그룹 수정/삭제 드롭다운 */}
        {editingGroup && (
          <div
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
            }}
            onClick={() => setEditingGroup(null)}
          >
            <div
              style={{
                position: "absolute",
                top: 140,
                left: "50%",
                transform: "translateX(-50%)",
                background: "var(--color-white)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                padding: 16,
                minWidth: 240,
                zIndex: 1000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>그룹 관리</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                <input
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") renameGroup(editingGroup); }}
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    fontSize: 13,
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-xs)",
                    outline: "none",
                  }}
                />
                <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={() => renameGroup(editingGroup)} style={{ fontSize: 12 }}>변경</button>
              </div>
              <button
                onClick={() => { deleteGroup(editingGroup); setEditingGroup(null); }}
                style={{
                  width: "100%",
                  padding: "7px 0",
                  fontSize: 12,
                  color: "var(--color-danger)",
                  background: "none",
                  border: "1px solid var(--color-danger)",
                  borderRadius: "var(--radius-xs)",
                  cursor: "pointer",
                }}
              >
                그룹 삭제 ({list.filter((a) => a.group_id === editingGroup).length}개 계정 포함)
              </button>
            </div>
          </div>
        )}

        {/* 카테고리 필터 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          <button
            className={`${s.btn} ${s.btnSmall} ${filter === "all" ? s.btnPrimary : ""}`}
            onClick={() => setFilter("all")}
            style={{ fontSize: 12 }}
          >
            전체({groupAccounts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${s.btn} ${s.btnSmall} ${filter === cat ? s.btnPrimary : ""}`}
              onClick={() => setFilter(cat)}
              style={{ fontSize: 12 }}
            >
              {cat}({catCounts[cat] || 0})
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className={s.section} style={{ padding: 0 }}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>플랫폼</th>
                <th>분류</th>
                <th>아이디</th>
                <th>비밀번호</th>
                <th>URL</th>
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
                    <button className={s.btnIcon} onClick={() => togglePw(a.id)} style={{ fontSize: 11 }}>
                      {visiblePw.has(a.id) ? "🙈" : "👁"}
                    </button>
                  </td>
                  <td>
                    {a.url && (
                      <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--color-primary)" }}>
                        바로가기
                      </a>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.memo}
                  </td>
                  <td><button className={s.btnIcon} onClick={() => remove(a.id)}>🗑</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={s.empty}>등록된 계정이 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 안내 */}
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 8 }}>
          탭 우클릭으로 그룹 이름 변경 / 삭제
        </div>
      </div>

      {/* 계정 추가 모달 */}
      {showAddModal && (
        <div
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.35)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "var(--color-white)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-lg)",
              padding: 24,
              width: 420,
              maxWidth: "90vw",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              계정 추가 — {activeGroupName}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>플랫폼 *</label>
                <input
                  value={newAccount.platform}
                  onChange={(e) => setNewAccount({ ...newAccount, platform: e.target.value })}
                  placeholder="예: Google Workspace"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>분류</label>
                <select
                  value={newAccount.category}
                  onChange={(e) => setNewAccount({ ...newAccount, category: e.target.value as AccountInfo["category"] })}
                  style={inputStyle}
                >
                  {["이메일", "클라우드", "디자인", "개발", "마케팅", "정부", "금융", "기타"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>URL</label>
                <input
                  value={newAccount.url}
                  onChange={(e) => setNewAccount({ ...newAccount, url: e.target.value })}
                  placeholder="https://"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>아이디 *</label>
                <input
                  value={newAccount.login_id}
                  onChange={(e) => setNewAccount({ ...newAccount, login_id: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>비밀번호</label>
                <input
                  type="password"
                  value={newAccount.password}
                  onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>메모</label>
                <input
                  value={newAccount.memo}
                  onChange={(e) => setNewAccount({ ...newAccount, memo: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setShowAddModal(false)}>취소</button>
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={addAccount}>추가</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  fontSize: 13,
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-xs)",
  outline: "none",
  boxSizing: "border-box",
};
