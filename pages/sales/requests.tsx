import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import s from "@/styles/Contracts.module.css";
import { type SalesRequest } from "@/data/dummy-sales";
import { useCustomers } from "@/contexts/CustomerContext";
import { useQuotes } from "@/contexts/QuoteContext";
import { useProjects } from "@/contexts/ProjectContext";

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

type ModalType = "quote_check" | "contract_check" | null;

export default function RequestsPage() {
  const router = useRouter();
  const {
    requests: list, addRequest, deleteRequest: ctxDeleteRequest,
    changeRequestStatus, registerClientFromRequest,
  } = useCustomers();
  const { quotes } = useQuotes();
  const { projects, files: contractFiles } = useProjects();

  const [statusFilter, setStatusFilter] = useState<"all" | SalesRequest["status"]>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // 모달 상태
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalRequestId, setModalRequestId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // localStorage에서 pending 의뢰 불러오기
  useEffect(() => {
    try {
      const pending = localStorage.getItem("whydlab_pending_requests");
      if (pending) {
        const items: SalesRequest[] = JSON.parse(pending);
        items.forEach(item => {
          addRequest(item);
          registerClientFromRequest(item);
        });
        localStorage.removeItem("whydlab_pending_requests");
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // 해당 고객의 견적서 목록
  const getClientQuotes = (clientName: string) => {
    return quotes.filter(q => q.client === clientName || q.receiver_company.includes(clientName) || clientName.includes(q.client));
  };

  // 해당 고객의 계약(프로젝트) 목록
  const getClientContracts = (clientName: string) => {
    return projects.filter(p => p.client === clientName || p.client.includes(clientName) || clientName.includes(p.client));
  };

  // 해당 고객의 계약서 파일 목록
  const getClientContractFiles = (clientName: string) => {
    const clientProjects = getClientContracts(clientName);
    const projectIds = clientProjects.map(p => p.id);
    return contractFiles.filter(f => projectIds.includes(f.contract_id) && f.file_type === "계약서");
  };

  const changeStatus = (id: string, newStatus: SalesRequest["status"]) => {
    const req = list.find((r) => r.id === id);
    if (!req) return;

    // 의뢰가 아직 고객DB에 연결 안 되어 있으면 자동 등록
    if (!req.client_id && req.client) {
      registerClientFromRequest(req);
    }

    // 견적서 → 계약: 견적서 확인 모달
    if (newStatus === "계약") {
      if (req.status !== "견적서") {
        alert("견적서 단계를 거쳐야 계약 단계로 전환할 수 있습니다.");
        return;
      }
      setModalRequestId(id);
      setModalType("quote_check");
      setSelectedQuoteId(null);
      return;
    }

    // 계약 → 수주: 계약 확인 모달
    if (newStatus === "수주") {
      if (req.status !== "계약") {
        alert("계약 단계를 거쳐야 수주로 전환할 수 있습니다.\n(예외: 계약금액 100만원 이하)");
        return;
      }
      setModalRequestId(id);
      setModalType("contract_check");
      setSelectedContractId(null);
      return;
    }

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
      changeRequestStatus(id, newStatus);
      router.push("/sales/quotes");
      return;
    }

    changeRequestStatus(id, newStatus);
  };

  // 견적서 확인 모달: 작성완료 → 견적서 선택 후 계약 전환
  const handleQuoteConfirm = () => {
    if (!modalRequestId || !selectedQuoteId) return;
    const req = list.find(r => r.id === modalRequestId);
    if (!req) return;

    const pendingContract = {
      client: req.client,
      contact_name: req.contact_name,
      title: req.title,
      budget: req.budget,
      deadline: req.deadline,
      _source_request_id: req.id,
      _source_quote_id: selectedQuoteId,
    };
    localStorage.setItem("whydlab_pending_contract", JSON.stringify(pendingContract));
    localStorage.setItem("whydlab_prefill_contract", JSON.stringify({ title: req.title, client: req.client }));
    changeRequestStatus(modalRequestId, "계약");
    setModalType(null);
    setModalRequestId(null);
    router.push("/contracts/overview");
  };

  // 계약 확인 모달: 계약완료 → 계약서 선택 후 수주 전환
  const handleContractConfirm = () => {
    if (!modalRequestId) return;
    changeRequestStatus(modalRequestId, "수주");
    setModalType(null);
    setModalRequestId(null);
  };

  // 100만원 이하 → 바로 수주
  const handleUnder100 = () => {
    if (!modalRequestId) return;
    changeRequestStatus(modalRequestId, "수주");
    setModalType(null);
    setModalRequestId(null);
  };

  const handleAddRequest = () => {
    const newReq: SalesRequest = {
      id: `req-${Date.now()}`, title: "", client: "", client_id: null, contact_name: "",
      contact_email: "", contact_phone: "",
      type: "기타", source: "직접", status: "신규", budget: "미정", deadline: "-",
      created_at: new Date().toISOString().slice(0, 10), memo: "",
    };
    addRequest(newReq);
  };

  const handleDelete = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    ctxDeleteRequest(id);
  };

  const closeModal = () => {
    setModalType(null);
    setModalRequestId(null);
    setSelectedQuoteId(null);
    setSelectedContractId(null);
  };

  const modalRequest = modalRequestId ? list.find(r => r.id === modalRequestId) : null;
  const modalClientQuotes = modalRequest ? getClientQuotes(modalRequest.client) : [];
  const modalClientContractFiles = modalRequest ? getClientContractFiles(modalRequest.client) : [];
  const modalClientContracts = modalRequest ? getClientContracts(modalRequest.client) : [];

  const fmtNum = (n: number) => n.toLocaleString();

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
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={handleAddRequest}>+ 추가</button>
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
                    <td>
                      {r.client || "-"}
                      {r.client_id && <span style={{ fontSize: 9, marginLeft: 4, color: "var(--color-success)" }}>DB</span>}
                    </td>
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
                    <td><button className={s.btnIcon} onClick={() => handleDelete(r.id)}>🗑</button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={11} className={s.empty}>등록된 의뢰가 없습니다</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 견적서 확인 모달: 견적서 → 계약 전환 시 */}
      {modalType === "quote_check" && modalRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={closeModal}>
          <div style={{ background: "var(--color-white)", borderRadius: 8, width: "90%", maxWidth: 500, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>견적서 확인</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                &quot;{modalRequest.client}&quot; — {modalRequest.title}
              </div>
            </div>

            {/* 선택 안 된 초기 상태 */}
            {!selectedQuoteId && selectedQuoteId !== "writing" && (
              <div style={{ padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 14, marginBottom: 16 }}>견적서를 작성하셨나요?</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    className={`${s.btn} ${s.btnPrimary}`}
                    style={{ padding: "10px 24px" }}
                    onClick={() => setSelectedQuoteId("selecting")}
                  >
                    작성완료
                  </button>
                  <button
                    className={s.btn}
                    style={{ padding: "10px 24px" }}
                    onClick={() => setSelectedQuoteId("writing")}
                  >
                    미작성
                  </button>
                </div>
              </div>
            )}

            {/* 미작성 → 안내 메시지 */}
            {selectedQuoteId === "writing" && (
              <div style={{ padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>견적서를 먼저 작성해주세요</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>
                  견적서 탭에서 견적서를 작성한 후 다시 시도해주세요.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button className={s.btn} style={{ padding: "8px 20px" }} onClick={closeModal}>닫기</button>
                  <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: "8px 20px" }} onClick={() => { closeModal(); router.push("/sales/quotes"); }}>
                    견적서 작성하러 가기
                  </button>
                </div>
              </div>
            )}

            {/* 작성완료 → 견적서 선택 */}
            {selectedQuoteId === "selecting" && (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>견적서를 선택하세요</div>
                {modalClientQuotes.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 12 }}>
                    &quot;{modalRequest.client}&quot; 고객의 견적서가 없습니다.<br />견적서 탭에서 먼저 작성해주세요.
                  </div>
                ) : (
                  <div style={{ maxHeight: 250, overflow: "auto" }}>
                    {modalClientQuotes.map(q => (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuoteId(q.id)}
                        style={{
                          padding: "10px 12px", borderRadius: 6, marginBottom: 6, cursor: "pointer",
                          border: `1px solid ${selectedQuoteId === q.id ? "var(--color-primary)" : "var(--color-border)"}`,
                          background: selectedQuoteId === q.id ? "var(--color-primary-light, #e8f0fe)" : "var(--color-bg)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{q.quote_name || q.title}</div>
                            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                              {q.quote_number} | {q.quote_date} | <span className={`${s.badge} ${q.status === "수주" ? s.badgeGreen : q.status === "발송완료" ? s.badgeBlue : s.badgeGray}`}>{q.status}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>{fmtNum(q.total_amount)}원</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <button className={s.btn} style={{ padding: "8px 16px" }} onClick={closeModal}>취소</button>
                  {modalClientQuotes.length > 0 && selectedQuoteId && selectedQuoteId !== "selecting" && (
                    <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: "8px 16px" }} onClick={handleQuoteConfirm}>
                      선택 완료 → 계약 전환
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 견적서 선택된 상태 (selecting이 아닌 실제 ID) */}
            {selectedQuoteId && selectedQuoteId !== "selecting" && selectedQuoteId !== "writing" && (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>견적서를 선택하세요</div>
                <div style={{ maxHeight: 250, overflow: "auto" }}>
                  {modalClientQuotes.map(q => (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuoteId(q.id)}
                      style={{
                        padding: "10px 12px", borderRadius: 6, marginBottom: 6, cursor: "pointer",
                        border: `1px solid ${selectedQuoteId === q.id ? "var(--color-primary)" : "var(--color-border)"}`,
                        background: selectedQuoteId === q.id ? "var(--color-primary-light, #e8f0fe)" : "var(--color-bg)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{q.quote_name || q.title}</div>
                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                            {q.quote_number} | {q.quote_date} | <span className={`${s.badge} ${q.status === "수주" ? s.badgeGreen : q.status === "발송완료" ? s.badgeBlue : s.badgeGray}`}>{q.status}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>{fmtNum(q.total_amount)}원</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <button className={s.btn} style={{ padding: "8px 16px" }} onClick={closeModal}>취소</button>
                  <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: "8px 16px" }} onClick={handleQuoteConfirm}>
                    선택 완료 → 계약 전환
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 계약 확인 모달: 계약 → 수주 전환 시 */}
      {modalType === "contract_check" && modalRequest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={closeModal}>
          <div style={{ background: "var(--color-white)", borderRadius: 8, width: "90%", maxWidth: 500, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>수주 전환 확인</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
                &quot;{modalRequest.client}&quot; — {modalRequest.title}
              </div>
            </div>

            {/* 초기 선택 */}
            {!selectedContractId && (
              <div style={{ padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 14, marginBottom: 16 }}>계약 상태를 선택하세요</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    className={`${s.btn} ${s.btnPrimary}`}
                    style={{ padding: "10px 20px" }}
                    onClick={() => setSelectedContractId("selecting")}
                  >
                    계약완료
                  </button>
                  <button
                    className={s.btn}
                    style={{ padding: "10px 20px" }}
                    onClick={() => setSelectedContractId("not_contracted")}
                  >
                    미계약
                  </button>
                  <button
                    className={s.btn}
                    style={{ padding: "10px 20px", color: "var(--color-success)" }}
                    onClick={handleUnder100}
                  >
                    100만원 이하
                  </button>
                </div>
              </div>
            )}

            {/* 미계약 → 안내 */}
            {selectedContractId === "not_contracted" && (
              <div style={{ padding: "24px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>계약서 작성 후 다시 시도하세요</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 16 }}>
                  계약관리 탭에서 계약서를 작성한 후 수주 전환이 가능합니다.
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button className={s.btn} style={{ padding: "8px 20px" }} onClick={closeModal}>닫기</button>
                  <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: "8px 20px" }} onClick={() => { closeModal(); router.push("/contracts/overview"); }}>
                    계약관리로 이동
                  </button>
                </div>
              </div>
            )}

            {/* 계약완료 → 계약서 선택 */}
            {selectedContractId === "selecting" && (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>계약서를 선택하세요</div>

                {/* 프로젝트 계약 목록 */}
                {modalClientContracts.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6 }}>프로젝트 계약</div>
                    <div style={{ maxHeight: 150, overflow: "auto", marginBottom: 12 }}>
                      {modalClientContracts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedContractId(p.id)}
                          style={{
                            padding: "10px 12px", borderRadius: 6, marginBottom: 6, cursor: "pointer",
                            border: `1px solid ${selectedContractId === p.id ? "var(--color-primary)" : "var(--color-border)"}`,
                            background: selectedContractId === p.id ? "var(--color-primary-light, #e8f0fe)" : "var(--color-bg)",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.project_name}</div>
                              <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
                                {p.contract_number} | <span className={`${s.badge} ${p.status === "정산완료" ? s.badgeGreen : s.badgeBlue}`}>{p.status}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>{fmtNum(p.total_amount_num || 0)}원</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* 계약서 파일 목록 */}
                {modalClientContractFiles.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 6 }}>계약서 파일</div>
                    <div style={{ maxHeight: 100, overflow: "auto", marginBottom: 12 }}>
                      {modalClientContractFiles.map(f => (
                        <div key={f.id} style={{ padding: "6px 12px", fontSize: 12, display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)" }}>
                          <span>{f.file_name}</span>
                          <span style={{ color: "var(--color-text-secondary)" }}>{f.uploaded_at}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {modalClientContracts.length === 0 && modalClientContractFiles.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "var(--color-text-secondary)", fontSize: 12 }}>
                    &quot;{modalRequest.client}&quot; 고객의 계약 내역이 없습니다.<br />계약관리 탭에서 먼저 등록해주세요.
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <button className={s.btn} style={{ padding: "8px 16px" }} onClick={closeModal}>취소</button>
                  {(modalClientContracts.length > 0 && selectedContractId && selectedContractId !== "selecting") ? (
                    <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: "8px 16px" }} onClick={handleContractConfirm}>
                      선택 완료 → 수주 전환
                    </button>
                  ) : modalClientContracts.length > 0 ? (
                    <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: "8px 16px", opacity: 0.5 }} disabled>
                      계약을 선택하세요
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            {/* 계약 선택된 상태 */}
            {selectedContractId && selectedContractId !== "selecting" && selectedContractId !== "not_contracted" && (
              <div style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>계약서를 선택하세요</div>
                <div style={{ maxHeight: 200, overflow: "auto" }}>
                  {modalClientContracts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedContractId(p.id)}
                      style={{
                        padding: "10px 12px", borderRadius: 6, marginBottom: 6, cursor: "pointer",
                        border: `1px solid ${selectedContractId === p.id ? "var(--color-primary)" : "var(--color-border)"}`,
                        background: selectedContractId === p.id ? "var(--color-primary-light, #e8f0fe)" : "var(--color-bg)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{p.project_name}</div>
                          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{p.contract_number}</div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-primary)" }}>{fmtNum(p.total_amount_num || 0)}원</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                  <button className={s.btn} style={{ padding: "8px 16px" }} onClick={closeModal}>취소</button>
                  <button className={`${s.btn} ${s.btnPrimary}`} style={{ padding: "8px 16px" }} onClick={handleContractConfirm}>
                    선택 완료 → 수주 전환
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
