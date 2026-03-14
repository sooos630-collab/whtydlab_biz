import Head from "next/head";
import { useMemo, useState } from "react";
import s from "@/styles/Contracts.module.css";
import f from "@/styles/Sales.module.css";
import { type Client } from "@/data/dummy-sales";
import { useCustomers } from "@/contexts/CustomerContext";
import { useProjects } from "@/contexts/ProjectContext";

const fmtNum = (n: number) => n.toLocaleString();

const gradeBadge = (g: string) => {
  switch (g) {
    case "VIP": return s.badgeGreen;
    case "일반": return s.badgeBlue;
    case "잠재": return s.badgeGray;
    default: return s.badgeGray;
  }
};

const statusBadge = (st: string) => {
  switch (st) {
    case "고객사": return s.badgeGreen;
    case "잠재고객": return s.badgeGray;
    default: return s.badgeGray;
  }
};

type SortKey = "company" | "total_revenue" | "last_contact_date" | "project_count";
type SortDir = "asc" | "desc";

export default function ClientsPage() {
  const {
    clients: list, updateClient, addClient, deleteClient: ctxDelete,
    convertToCustomer, getRequestsByClientId,
  } = useCustomers();
  const { projects } = useProjects();

  const [subTab, setSubTab] = useState<"prospects" | "active">("active");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("last_contact_date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailTab, setDetailTab] = useState<"inquiry" | "contract" | "project">("inquiry");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };
  const sortArrow = (key: SortKey) => sortKey === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  const prospects = useMemo(() => list.filter((c) => c.client_status === "잠재고객"), [list]);
  const actives = useMemo(() => list.filter((c) => c.client_status === "고객사"), [list]);

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

  const changeGrade = (id: string, grade: Client["grade"]) => {
    const client = list.find(c => c.id === id);
    if (client) updateClient({ ...client, grade });
  };

  const handleConvert = (id: string) => {
    convertToCustomer(id);
  };

  const handleDelete = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    ctxDelete(id);
  };

  const handleAdd = () => {
    const newClient: Client = {
      id: `cli-${Date.now()}`, company: "", contact_name: "", contact_email: "",
      contact_phone: "", grade: subTab === "prospects" ? "잠재" : "일반",
      client_status: subTab === "prospects" ? "잠재고객" : "고객사",
      industry: "", total_revenue: 0, project_count: 0,
      last_contact_date: new Date().toISOString().slice(0, 10), memo: "",
      source_request_ids: [], contract_ids: [], inquiry_history: [],
    };
    addClient(newClient);
  };

  // 고객 상세: 계약/프로젝트 이력 조회
  const getClientContracts = (client: Client) => {
    return projects.filter(p =>
      client.contract_ids.includes(p.id) ||
      p.client.includes(client.company) ||
      client.company.includes(p.client)
    );
  };

  const getClientCumulativeAmount = (client: Client) => {
    const clientContracts = getClientContracts(client);
    return clientContracts.reduce((sum, p) => sum + (p.total_amount_num || 0), 0);
  };

  const totalRevenue = actives.reduce((a, c) => a + c.total_revenue, 0);

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
            <div className={s.summaryLabel}>고객사</div>
            <div className={s.summaryValue} style={{ color: "var(--color-success)" }}>{actives.length}사</div>
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
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={handleAdd}>+ 추가</button>
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
                  <th>상태</th>
                  <th>등급</th>
                  <th>산업</th>
                  <TH k="total_revenue" align="right">누적계약금액</TH>
                  <TH k="project_count" align="right">프로젝트</TH>
                  <TH k="last_contact_date">최근연락</TH>
                  <th>메모</th>
                  <th style={{ width: subTab === "prospects" ? 80 : 28 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const cumAmount = getClientCumulativeAmount(c);
                  return (
                    <tr key={c.id} className={s.clickableRow} onClick={() => { setSelectedClient(c); setDetailTab("inquiry"); }}>
                      <td style={{ fontWeight: 600 }}>{c.company || "-"}</td>
                      <td>{c.contact_name || "-"}</td>
                      <td style={{ fontSize: 12 }}>{c.contact_phone || "-"}</td>
                      <td><span className={`${s.badge} ${statusBadge(c.client_status)}`}>{c.client_status}</span></td>
                      <td>
                        <select
                          className={`${s.badge} ${gradeBadge(c.grade)}`}
                          style={{ border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, padding: "3px 6px", borderRadius: 100 }}
                          value={c.grade}
                          onChange={(e) => { e.stopPropagation(); changeGrade(c.id, e.target.value as Client["grade"]); }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="VIP">VIP</option>
                          <option value="일반">일반</option>
                          <option value="잠재">잠재</option>
                        </select>
                      </td>
                      <td style={{ fontSize: 12 }}>{c.industry || "-"}</td>
                      <td className={s.projAmountBold}>{cumAmount > 0 ? fmtNum(cumAmount) : c.total_revenue > 0 ? fmtNum(c.total_revenue) : "-"}</td>
                      <td style={{ textAlign: "right" }}>{c.project_count > 0 ? `${c.project_count}건` : getClientContracts(c).length > 0 ? `${getClientContracts(c).length}건` : "-"}</td>
                      <td style={{ fontSize: 12 }}>{c.last_contact_date}</td>
                      <td style={{ fontSize: 12, color: "var(--color-text-secondary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.memo || "-"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          {subTab === "prospects" && (
                            <button className={`${s.btn} ${s.btnSmall}`} style={{ fontSize: 10, padding: "2px 8px" }} onClick={(e) => { e.stopPropagation(); handleConvert(c.id); }}>고객전환</button>
                          )}
                          <button className={s.btnIcon} onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={11} className={s.empty}>{subTab === "prospects" ? "잠재고객이 없습니다" : "등록된 고객사가 없습니다"}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 고객 상세 모달 */}
      {selectedClient && (() => {
        const client = list.find(c => c.id === selectedClient.id) || selectedClient;
        const clientRequests = getRequestsByClientId(client.id);
        const clientContracts = getClientContracts(client);
        const cumAmount = clientContracts.reduce((sum, p) => sum + (p.total_amount_num || 0), 0);

        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedClient(null)}>
            <div style={{ background: "var(--color-white)", borderRadius: 8, width: "90%", maxWidth: 800, maxHeight: "85vh", overflow: "auto", padding: 0 }} onClick={e => e.stopPropagation()}>
              {/* 헤더 */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{client.company}</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                    {client.contact_name} | {client.contact_phone} | {client.contact_email}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className={`${s.badge} ${statusBadge(client.client_status)}`}>{client.client_status}</span>
                  <span className={`${s.badge} ${gradeBadge(client.grade)}`}>{client.grade}</span>
                  <button onClick={() => setSelectedClient(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--color-text-secondary)" }}>✕</button>
                </div>
              </div>

              {/* 요약 카드 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, padding: "12px 20px", background: "var(--color-bg)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>누적계약금액</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)" }}>{cumAmount > 0 ? fmtNum(cumAmount) + "원" : "-"}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>문의이력</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{client.inquiry_history.length}건</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>계약이력</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{clientContracts.length}건</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>최근연락</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{client.last_contact_date}</div>
                </div>
              </div>

              {/* 탭 */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
                {([
                  { key: "inquiry" as const, label: `문의이력 (${client.inquiry_history.length + clientRequests.length})` },
                  { key: "contract" as const, label: `계약이력 (${clientContracts.length})` },
                  { key: "project" as const, label: `프로젝트이력 (${clientContracts.filter(p => ["진행중", "납품완료", "정산완료"].includes(p.status)).length})` },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    style={{
                      flex: 1, padding: "10px 0", fontSize: 12, fontWeight: detailTab === tab.key ? 700 : 400,
                      border: "none", borderBottom: detailTab === tab.key ? "2px solid var(--color-primary)" : "2px solid transparent",
                      background: "none", cursor: "pointer", color: detailTab === tab.key ? "var(--color-primary)" : "var(--color-text-secondary)",
                    }}
                  >{tab.label}</button>
                ))}
              </div>

              {/* 탭 내용 */}
              <div style={{ padding: "12px 20px", minHeight: 200 }}>
                {/* 문의이력 */}
                {detailTab === "inquiry" && (
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>일자</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>유형</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>채널</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>내용</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.inquiry_history.map(h => (
                        <tr key={h.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "6px 8px" }}>{h.date}</td>
                          <td style={{ padding: "6px 8px" }}>{h.type}</td>
                          <td style={{ padding: "6px 8px" }}>{h.channel}</td>
                          <td style={{ padding: "6px 8px" }}>{h.summary}</td>
                          <td style={{ padding: "6px 8px" }}><span className={`${s.badge} ${s.badgeGray}`}>{h.status}</span></td>
                        </tr>
                      ))}
                      {clientRequests.filter(r => !client.inquiry_history.some(h => h.linked_request_id === r.id)).map(r => (
                        <tr key={r.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "6px 8px" }}>{r.created_at}</td>
                          <td style={{ padding: "6px 8px" }}>{r.type}</td>
                          <td style={{ padding: "6px 8px" }}>{r.source}</td>
                          <td style={{ padding: "6px 8px" }}>{r.title}</td>
                          <td style={{ padding: "6px 8px" }}><span className={`${s.badge} ${s.badgeGray}`}>{r.status}</span></td>
                        </tr>
                      ))}
                      {client.inquiry_history.length === 0 && clientRequests.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--color-text-secondary)" }}>문의이력이 없습니다</td></tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* 계약이력 */}
                {detailTab === "contract" && (
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>계약번호</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>프로젝트명</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>계약금액</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>수금율</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientContracts.map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "6px 8px", fontWeight: 600 }}>{p.contract_number}</td>
                          <td style={{ padding: "6px 8px" }}>{p.project_name}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600 }}>{fmtNum(p.total_amount_num || 0)}원</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.collection_rate || 0}%</td>
                          <td style={{ padding: "6px 8px" }}>
                            <span className={`${s.badge} ${p.status === "정산완료" ? s.badgeGreen : p.status === "진행중" ? s.badgeBlue : s.badgeGray}`}>{p.status}</span>
                          </td>
                        </tr>
                      ))}
                      {clientContracts.length === 0 && (
                        <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "var(--color-text-secondary)" }}>계약이력이 없습니다</td></tr>
                      )}
                    </tbody>
                  </table>
                )}

                {/* 프로젝트이력 */}
                {detailTab === "project" && (
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>프로젝트명</th>
                        <th style={{ padding: "6px 8px", textAlign: "left" }}>상태</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>진행률</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>공급가</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>순이익</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>이익률</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientContracts.filter(p => ["진행중", "납품완료", "정산완료", "계약완료"].includes(p.status)).map(p => (
                        <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "6px 8px", fontWeight: 600 }}>{p.project_name}</td>
                          <td style={{ padding: "6px 8px" }}>
                            <span className={`${s.badge} ${p.status === "정산완료" ? s.badgeGreen : p.status === "진행중" ? s.badgeBlue : s.badgeOrange}`}>{p.status}</span>
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.progress || 0}%</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{fmtNum(p.supply_amount || 0)}원</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: (p.net_profit || 0) > 0 ? "var(--color-success)" : "var(--color-danger, #e53e3e)" }}>{fmtNum(p.net_profit || 0)}원</td>
                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.net_profit_rate || 0}%</td>
                        </tr>
                      ))}
                      {clientContracts.filter(p => ["진행중", "납품완료", "정산완료", "계약완료"].includes(p.status)).length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--color-text-secondary)" }}>프로젝트이력이 없습니다</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
