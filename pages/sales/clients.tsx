import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import s from "@/styles/Contracts.module.css";
import f from "@/styles/Sales.module.css";
import { dummyClients, type Client } from "@/data/dummy-sales";

const fmtNum = (n: number) => n.toLocaleString();

const gradeBadge = (g: string) => {
  switch (g) {
    case "VIP": return s.badgeGreen;
    case "일반": return s.badgeBlue;
    case "잠재": return s.badgeGray;
    default: return s.badgeGray;
  }
};

type SortKey = "company" | "total_revenue" | "last_contact_date" | "project_count";
type SortDir = "asc" | "desc";

export default function ClientsPage() {
  const [list, setList] = useState<Client[]>(() => dummyClients.map((c) => ({ ...c })));
  const [subTab, setSubTab] = useState<"prospects" | "active">("active");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("last_contact_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // TODO: DB 연동 시 localStorage 대신 Supabase로 교체
  useEffect(() => {
    try {
      const pending = localStorage.getItem("whydlab_pending_clients");
      if (pending) {
        const items: Client[] = JSON.parse(pending);
        setList((prev) => [...prev, ...items]);
        localStorage.removeItem("whydlab_pending_clients");
      }
    } catch { /* ignore */ }
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };
  const sortArrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const prospects = useMemo(() => list.filter((c) => c.grade === "잠재"), [list]);
  const actives = useMemo(() => list.filter((c) => c.grade === "VIP" || c.grade === "일반"), [list]);

  const baseList = subTab === "prospects" ? prospects : actives;

  const filtered = useMemo(() => {
    let result = baseList;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((c) =>
        c.company.toLowerCase().includes(q) || c.contact_name.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q) || c.memo.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
      return 0;
    });
  }, [baseList, search, sortKey, sortDir]);

  const convertToActive = (id: string) => {
    setList(list.map((c) => (c.id === id ? { ...c, grade: "일반" as const } : c)));
  };

  const deleteClient = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    setList(list.filter((c) => c.id !== id));
  };

  const changeGrade = (id: string, grade: Client["grade"]) => {
    setList(list.map((c) => (c.id === id ? { ...c, grade } : c)));
  };

  const totalRevenue = actives.reduce((a, c) => a + c.total_revenue, 0);
  const totalProjects = actives.reduce((a, c) => a + c.project_count, 0);

  const TH = ({ k, children, align }: { k?: SortKey; children: React.ReactNode; align?: "right" }) => (
    <th style={{ textAlign: align, cursor: k ? "pointer" : undefined, userSelect: "none" }} onClick={k ? () => toggleSort(k) : undefined}>{children}{k ? sortArrow(k) : ""}</th>
  );

  return (
    <>
      <Head><title>고객 - WHYDLAB BIZ</title></Head>
      <div className={s.projPage}>
        {/* 요약 카드 */}
        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>전체 고객</div>
            <div className={s.summaryValue}>{list.length}사</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>VIP</div>
            <div className={s.summaryValue} style={{ color: "var(--color-success)" }}>{list.filter((c) => c.grade === "VIP").length}사</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>잠재고객</div>
            <div className={s.summaryValue} style={{ color: "var(--color-text-secondary)" }}>{prospects.length}사</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>총 매출</div>
            <div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmtNum(totalRevenue)}원</div>
          </div>
        </div>

        {/* 서브탭 */}
        <div className={f.subTabBar}>
          <button className={`${f.subTab} ${subTab === "active" ? f.subTabActive : ""}`} onClick={() => setSubTab("active")}>
            고객사 ({actives.length})
          </button>
          <button className={`${f.subTab} ${subTab === "prospects" ? f.subTabActive : ""}`} onClick={() => setSubTab("prospects")}>
            잠재고객 ({prospects.length})
          </button>
        </div>

        {/* 툴바 */}
        <div className={s.projToolbar}>
          <div className={s.projSearchWrap}>
            <input className={s.projSearchInput} placeholder="회사명, 담당자, 산업, 메모 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className={s.projActions}>
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={() => {
              const newClient: Client = {
                id: `cli-${Date.now()}`, company: "", contact_name: "", contact_email: "",
                contact_phone: "", grade: subTab === "prospects" ? "잠재" : "일반",
                industry: "", total_revenue: 0, project_count: 0,
                last_contact_date: new Date().toISOString().slice(0, 10), memo: "",
              };
              setList([newClient, ...list]);
            }}>+ 추가</button>
          </div>
        </div>

        {/* 테이블 */}
        <div className={s.projTableSection}>
          <div className={s.projTableScrollArea}>
            <table className={s.projTable}>
              <thead>
                <tr>
                  <TH k="company">회사명</TH>
                  <th>담당자</th>
                  <th>연락처</th>
                  {subTab === "active" && <th>이메일</th>}
                  <th>등급</th>
                  <th>산업</th>
                  {subTab === "active" && <TH k="total_revenue" align="right">총 매출</TH>}
                  {subTab === "active" && <TH k="project_count" align="right">프로젝트</TH>}
                  <TH k="last_contact_date">최근연락</TH>
                  <th>메모</th>
                  <th style={{ width: subTab === "prospects" ? 80 : 28 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className={s.clickableRow}>
                    <td style={{ fontWeight: 600 }}>{c.company || "-"}</td>
                    <td>{c.contact_name || "-"}</td>
                    <td style={{ fontSize: 12 }}>{c.contact_phone || "-"}</td>
                    {subTab === "active" && <td style={{ fontSize: 12 }}>{c.contact_email || "-"}</td>}
                    <td>
                      <select
                        className={`${s.badge} ${gradeBadge(c.grade)}`}
                        style={{ border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "3px 6px", borderRadius: 100 }}
                        value={c.grade}
                        onChange={(e) => changeGrade(c.id, e.target.value as Client["grade"])}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="VIP">VIP</option>
                        <option value="일반">일반</option>
                        <option value="잠재">잠재</option>
                      </select>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.industry || "-"}</td>
                    {subTab === "active" && <td className={s.projAmountBold}>{c.total_revenue > 0 ? fmtNum(c.total_revenue) : "-"}</td>}
                    {subTab === "active" && <td style={{ textAlign: "right" }}>{c.project_count > 0 ? `${c.project_count}건` : "-"}</td>}
                    <td style={{ fontSize: 12 }}>{c.last_contact_date}</td>
                    <td style={{ fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.memo || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {subTab === "prospects" && (
                          <button className={`${s.btn} ${s.btnSmall}`} style={{ fontSize: 10, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); convertToActive(c.id); }}>전환</button>
                        )}
                        <button className={s.btnIcon} onClick={(e) => { e.stopPropagation(); deleteClient(c.id); }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={subTab === "active" ? 11 : 9} className={s.empty}>{subTab === "prospects" ? "잠재고객이 없습니다" : "등록된 고객사가 없습니다"}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
