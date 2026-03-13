import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import s from "@/styles/Contracts.module.css";
import { dummyRequests, type SalesRequest } from "@/data/dummy-sales";

const statusBadge = (st: string) => {
  switch (st) {
    case "신규": return s.badgeBlue;
    case "확인": return s.badgeOrange;
    case "상담": return s.badgePurple ?? s.badgeGray;
    case "견적서": return s.badgeOrange;
    case "계약": return s.badgePurple ?? s.badgeGray;
    case "수주": return s.badgeGreen;
    case "실패": return s.badgeRed;
    default: return s.badgeGray;
  }
};

const typeBadge = (t: string) => {
  switch (t) {
    case "웹사이트": return s.badgeBlue;
    case "앱": return s.badgeGreen;
    case "브랜딩": return s.badgeOrange;
    default: return s.badgeGray;
  }
};

const sourceBadge = (src: string) => {
  switch (src) {
    case "홈페이지": return s.badgeBlue;
    case "나라장터": return s.badgeGreen;
    case "소개": return s.badgeOrange;
    case "SNS": return s.badgePurple ?? s.badgeGray;
    default: return s.badgeGray;
  }
};

type SortKey = "title" | "client" | "created_at" | "status";
type SortDir = "asc" | "desc";

const STATUSES: SalesRequest["status"][] = ["신규", "확인", "상담", "견적서", "계약", "수주", "실패"];

export default function RequestsPage() {
  const router = useRouter();
  const [list, setList] = useState<SalesRequest[]>(() => dummyRequests.map((r) => ({ ...r })));
  const [statusFilter, setStatusFilter] = useState<"all" | SalesRequest["status"]>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // TODO: DB 연동 시 localStorage 대신 Supabase로 교체
  useEffect(() => {
    try {
      const pending = localStorage.getItem("whydlab_pending_requests");
      if (pending) {
        const items: SalesRequest[] = JSON.parse(pending);
        setList((prev) => [...prev, ...items]);
        localStorage.removeItem("whydlab_pending_requests");
      }
    } catch { /* ignore */ }
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };
  const sortArrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const filtered = useMemo(() => {
    let result = list;
    if (statusFilter !== "all") result = result.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) =>
        r.title.toLowerCase().includes(q) || r.client.toLowerCase().includes(q) ||
        r.contact_name.toLowerCase().includes(q) || r.memo.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return 0;
    });
  }, [list, statusFilter, search, sortKey, sortDir]);

  const changeStatus = (id: string, newStatus: SalesRequest["status"]) => {
    const req = list.find((r) => r.id === id);
    if (!req) return;

    // TODO: DB 연동 시 Supabase로 교체

    if (newStatus === "견적서") {
      const pendingQuote = {
        client: req.client,
        receiver_company: req.client,
        contact_name: req.contact_name,
        title: req.title,
        quote_name: `${req.client} ${req.title} 견적`,
        _source_request_id: req.id,
      };
      localStorage.setItem("whydlab_pending_quote", JSON.stringify(pendingQuote));
      setList((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
      router.push("/sales/quotes");
      return;
    }

    if (newStatus === "계약") {
      const pendingContract = {
        client: req.client,
        contact_name: req.contact_name,
        title: req.title,
        budget: req.budget,
        deadline: req.deadline,
        _source_request_id: req.id,
      };
      localStorage.setItem("whydlab_pending_contract", JSON.stringify(pendingContract));
      localStorage.setItem("whydlab_prefill_contract", JSON.stringify({ title: req.title, client: req.client }));
      setList((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
      router.push("/contracts/overview");
      return;
    }

    if (newStatus === "수주") {
      try {
        const existing = JSON.parse(localStorage.getItem("whydlab_pending_clients") ?? "[]");
        existing.push({
          id: `cli-${Date.now()}`,
          company: req.client,
          contact_name: req.contact_name,
          contact_email: req.contact_email,
          contact_phone: req.contact_phone,
          grade: "일반",
          industry: "",
          total_revenue: 0,
          project_count: 1,
          last_contact_date: new Date().toISOString().slice(0, 10),
          memo: `의뢰에서 수주 전환 (${req.id})`,
        });
        localStorage.setItem("whydlab_pending_clients", JSON.stringify(existing));
      } catch { /* ignore */ }
    }

    setList((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
  };

  const deleteRequest = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    setList(list.filter((r) => r.id !== id));
  };

  const TH = ({ k, children }: { k?: SortKey; children: React.ReactNode }) => (
    <th style={{ cursor: k ? "pointer" : undefined, userSelect: "none" }} onClick={k ? () => toggleSort(k) : undefined}>{children}{k ? sortArrow(k) : ""}</th>
  );

  return (
    <>
      <Head><title>의뢰 - WHYDLAB BIZ</title></Head>
      <div className={s.projPage}>
        {/* 상태 필터 탭 */}
        <div className={s.projLocalTabs}>
          {(["all", ...STATUSES] as const).map((f) => {
            const c = f === "all" ? list.length : list.filter((r) => r.status === f).length;
            return (
              <button key={f} className={`${s.projLocalTab} ${statusFilter === f ? s.projLocalTabActive : ""}`} onClick={() => setStatusFilter(f)}>
                {f === "all" ? "전체" : f}
                <span className={s.projLocalTabCount}>{c}</span>
              </button>
            );
          })}
        </div>

        {/* 툴바 */}
        <div className={s.projToolbar}>
          <div className={s.projSearchWrap}>
            <input className={s.projSearchInput} placeholder="제목, 업체, 담당자, 메모 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className={s.projActions}>
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={() => {
              const newReq: SalesRequest = {
                id: `req-${Date.now()}`, title: "", client: "", contact_name: "",
                contact_email: "", contact_phone: "",
                type: "기타", source: "직접", status: "신규", budget: "미정", deadline: "-",
                created_at: new Date().toISOString().slice(0, 10), memo: "",
              };
              setList([newReq, ...list]);
            }}>+ 추가</button>
          </div>
        </div>

        {/* 테이블 */}
        <div className={s.projTableSection}>
          <div className={s.projTableScrollArea}>
            <table className={s.projTable}>
              <thead>
                <tr>
                  <TH k="title">제목</TH>
                  <TH k="client">업체</TH>
                  <th>담당자</th>
                  <th>유형</th>
                  <th>유입경로</th>
                  <TH k="status">상태</TH>
                  <th>예산</th>
                  <th>마감일</th>
                  <TH k="created_at">접수일</TH>
                  <th>메모</th>
                  <th style={{ width: 28 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={s.clickableRow}>
                    <td style={{ fontWeight: 600 }}>{r.title || "-"}</td>
                    <td>{r.client || "-"}</td>
                    <td>{r.contact_name || "-"}</td>
                    <td><span className={`${s.badge} ${typeBadge(r.type)}`}>{r.type}</span></td>
                    <td><span className={`${s.badge} ${sourceBadge(r.source)}`}>{r.source}</span></td>
                    <td>
                      <select
                        className={`${s.badge} ${statusBadge(r.status)}`}
                        style={{ border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "3px 6px", borderRadius: 100 }}
                        value={r.status}
                        onChange={(e) => changeStatus(r.id, e.target.value as SalesRequest["status"])}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{r.budget}</td>
                    <td style={{ fontSize: 12 }}>{r.deadline}</td>
                    <td style={{ fontSize: 12 }}>{r.created_at}</td>
                    <td style={{ fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.memo || "-"}</td>
                    <td><button className={s.btnIcon} onClick={() => deleteRequest(r.id)}>🗑</button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={11} className={s.empty}>등록된 의뢰가 없습니다</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
