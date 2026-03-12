import Head from "next/head";
import { useMemo, useRef, useState } from "react";
import s from "@/styles/Contracts.module.css";
import { type ProjectContract } from "@/data/dummy-contracts";
import { useProjects } from "@/contexts/ProjectContext";
import ProjectEditModal from "@/components/ProjectEditModal";
import { buildProjectExcelDocument, createProjectDraft, importProjectsFromCsv } from "@/lib/project-contracts";

const fmtNum = (n: number) => n.toLocaleString();
const fmtManAmt = (n: number) => n === 0 ? "-" : (n / 10000).toLocaleString() + "만원";

const channelBadge = (ch: string) => {
  switch (ch) {
    case "소개": return s.badgeBlue;
    case "입찰": return s.badgeGreen;
    case "직접영업": return s.badgeOrange;
    case "온라인": return s.badgeGray;
    default: return s.badgeGray;
  }
};

const rateColor = (rate: number) => rate >= 50 ? "var(--color-success)" : rate >= 30 ? "var(--color-primary)" : rate > 0 ? "#b45309" : "var(--color-text-tertiary)";

type ProjSortKey = "contract_number" | "client" | "start_date" | "total_amount_num" | "collection_rate" | "net_profit_rate";
type ProjSortDir = "asc" | "desc";

type ImportNotice = {
  tone: "success" | "error";
  text: string;
};

export default function ProjectContractsPage() {
  const { projects: projList, files: projFiles, updateProject, addProject, upsertProjects, deleteFile } = useProjects();
  const [projSearch, setProjSearch] = useState("");
  const [projStatusFilter, setProjStatusFilter] = useState<"all" | ProjectContract["status"]>("all");
  const [projSortKey, setProjSortKey] = useState<ProjSortKey>("contract_number");
  const [projSortDir, setProjSortDir] = useState<ProjSortDir>("desc");
  const [projEditId, setProjEditId] = useState<string | null>(null);
  const [projCreateDraft, setProjCreateDraft] = useState<ProjectContract | null>(null);
  const [projImportNotice, setProjImportNotice] = useState<ImportNotice | null>(null);
  const projCsvInputRef = useRef<HTMLInputElement | null>(null);

  const projToggleSort = (key: ProjSortKey) => {
    if (projSortKey === key) setProjSortDir(projSortDir === "asc" ? "desc" : "asc");
    else { setProjSortKey(key); setProjSortDir("desc"); }
  };
  const projSortArrow = (key: ProjSortKey) => projSortKey === key ? (projSortDir === "asc" ? " ▲" : " ▼") : "";

  const projFiltered = useMemo(() => {
    let result = projList;
    if (projStatusFilter !== "all") result = result.filter((p) => p.status === projStatusFilter);
    if (projSearch.trim()) {
      const t = projSearch.trim().toLowerCase();
      result = result.filter((p) =>
        p.contract_number.toLowerCase().includes(t) || p.client.toLowerCase().includes(t) ||
        p.project_name.toLowerCase().includes(t) || p.description.toLowerCase().includes(t) ||
        p.team_members.some((m) => m.toLowerCase().includes(t))
      );
    }
    return [...result].sort((a, b) => {
      const av = a[projSortKey]; const bv = b[projSortKey];
      if (typeof av === "string" && typeof bv === "string") return projSortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return projSortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [projList, projStatusFilter, projSearch, projSortKey, projSortDir]);

  const projTotalSupply = projList.reduce((a, p) => a + p.supply_amount, 0);
  const projTotalCollected = projList.reduce((a, p) => a + p.collected_amount, 0);
  const projTotalRemaining = projList.reduce((a, p) => a + p.remaining_amount, 0);
  const projTotalProfit = projList.reduce((a, p) => a + p.net_profit, 0);
  const projActiveCount = projList.filter((p) => p.status === "진행중" || p.status === "계약완료").length;
  const projAvgRate = projList.length > 0 ? Math.round(projList.reduce((a, p) => a + p.collection_rate, 0) / projList.length) : 0;

  const projEditProject = projCreateDraft ?? projList.find((p) => p.id === projEditId) ?? null;
  const projEditFiles = projCreateDraft ? [] : projEditId ? projFiles.filter((f) => f.contract_id === projEditId) : [];
  const closeProjModal = () => {
    setProjEditId(null);
    setProjCreateDraft(null);
  };
  const handleProjSave = (updated: ProjectContract) => {
    if (projCreateDraft) addProject(updated);
    else updateProject(updated);
    closeProjModal();
  };
  const handleProjDeleteFile = (fileId: string) => { if (!confirm("파일을 삭제하시겠습니까?")) return; deleteFile(fileId); };
  const handleProjAdd = () => {
    setProjImportNotice(null);
    setProjEditId(null);
    setProjCreateDraft(createProjectDraft(projList));
  };
  const handleProjExportExcel = () => {
    const html = buildProjectExcelDocument(projList);
    const blob = new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `project-contracts-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const handleProjCsvChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const csvText = await file.text();
      const result = importProjectsFromCsv(csvText, projList);
      if (result.projects.length === 0) {
        setProjImportNotice({
          tone: "error",
          text: result.warnings[0] ?? "반영할 프로젝트를 찾지 못했습니다. CSV 헤더와 코드넘버를 확인해 주세요.",
        });
        return;
      }

      upsertProjects(result.projects);
      const warningText = result.warnings.length > 0 ? ` 경고 ${result.warnings.length}건.` : "";
      setProjImportNotice({
        tone: "success",
        text: `CSV 반영 완료: 신규 ${result.added}건, 업데이트 ${result.updated}건, 건너뜀 ${result.skipped}건.${warningText}`,
      });
    } catch {
      setProjImportNotice({
        tone: "error",
        text: "CSV 파일을 읽지 못했습니다. UTF-8 형식과 헤더명을 확인해 주세요.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const ProjTH = ({ k, children, align }: { k?: ProjSortKey; children: React.ReactNode; align?: "right" | "center" }) => (
    <th style={{ textAlign: align, cursor: k ? "pointer" : undefined, userSelect: "none" }} onClick={k ? () => projToggleSort(k) : undefined}>{children}{k ? projSortArrow(k) : ""}</th>
  );

  return (
    <>
      <Head><title>프로젝트 관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page} style={{ maxWidth: "100%" }}>
        {/* 헤더 */}
        <div className={s.pageHeader} style={{ flexWrap: "wrap", gap: 10 }}>
          <h1>프로젝트 관리 <span className={s.count}>진행 {projActiveCount}건 / 전체 {projList.length}건</span></h1>
        </div>

        {/* 요약 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
          <div className={s.summaryCard}><div className={s.summaryLabel}>전체</div><div className={s.summaryValue}>{projList.length}<span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", marginLeft: 2 }}>건</span></div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>총 공급가액</div><div className={s.summaryValue}>{fmtManAmt(projTotalSupply)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>수금액</div><div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmtManAmt(projTotalCollected)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>잔여금</div><div className={s.summaryValue} style={{ color: projTotalRemaining > 0 ? "#b45309" : "var(--color-text)" }}>{fmtManAmt(projTotalRemaining)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>순이익 합계</div><div className={s.summaryValue} style={{ color: "var(--color-success)" }}>{fmtManAmt(projTotalProfit)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>평균 수금율</div><div className={s.summaryValue}>{projAvgRate}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 1 }}>%</span></div></div>
        </div>

        {/* 필터 + 검색 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
          {(["all", "제안", "계약완료", "진행중", "납품완료", "정산완료"] as const).map((f) => {
            const c = f === "all" ? projList.length : projList.filter((p) => p.status === f).length;
            return <button key={f} className={`${s.btn} ${s.btnSmall} ${projStatusFilter === f ? s.btnPrimary : ""}`} onClick={() => setProjStatusFilter(f)}>{f === "all" ? "전체" : f}<span style={{ marginLeft: 3, fontSize: 11, opacity: 0.7 }}>{c}</span></button>;
          })}
        </div>
        <div className={s.projectActionBar}>
          <div className={s.projectActionGroup}>
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={handleProjAdd}>+ 프로젝트 추가</button>
            <button className={`${s.btn} ${s.btnSmall}`} onClick={() => projCsvInputRef.current?.click()}>CSV 일괄 반영</button>
            <button className={`${s.btn} ${s.btnSmall}`} onClick={handleProjExportExcel}>전체표 엑셀 다운로드</button>
            <input ref={projCsvInputRef} type="file" accept=".csv,text/csv" className={s.fileInputHidden} onChange={handleProjCsvChange} />
          </div>
          <div className={s.projectActionHint}>CSV는 `코드넘버` 또는 `ID` 기준으로 기존 프로젝트를 업데이트하고, 없는 항목은 신규 추가합니다.</div>
        </div>
        {projImportNotice && (
          <div className={`${s.projectImportNotice} ${projImportNotice.tone === "success" ? s.projectImportNoticeSuccess : s.projectImportNoticeError}`}>
            {projImportNotice.text}
          </div>
        )}
        <div className={s.toolbar} style={{ marginBottom: 8 }}>
          <div className={s.toolbarSearch}>
            <span className={s.toolbarSearchIcon}>🔍</span>
            <input className={s.toolbarSearchInput} placeholder="코드, 회사명, 프로젝트명, 투입인원 검색..." value={projSearch} onChange={(e) => setProjSearch(e.target.value)} />
          </div>
        </div>

        {/* 테이블 */}
        <div className={s.section} style={{ padding: 0, overflow: "auto" }}>
          <table className={s.projTable}>
            <thead>
              <tr className={s.projGroupRow}>
                <th colSpan={5}>기본정보</th>
                <th colSpan={2}>기간</th>
                <th colSpan={3}>금액</th>
                <th colSpan={3} style={{ background: "rgba(49,130,246,0.06)" }}>청구</th>
                <th colSpan={3} style={{ background: "rgba(0,196,113,0.06)" }}>수금</th>
                <th colSpan={3} style={{ background: "rgba(180,83,9,0.06)" }}>수금현황</th>
                <th colSpan={3} style={{ background: "rgba(99,102,241,0.06)" }}>수익</th>
                <th>인원</th>
              </tr>
              <tr>
                <ProjTH k="contract_number">코드넘버</ProjTH>
                <th>회사명</th><th>세부내역</th><th>수주경로</th>
                <th style={{ textAlign: "center" }}>세금계산서</th>
                <ProjTH k="start_date">시작</ProjTH><th>종료</th>
                <ProjTH k="total_amount_num" align="right">공급가액</ProjTH>
                <th style={{ textAlign: "right" }}>부가세</th><th style={{ textAlign: "right" }}>총금액</th>
                <th style={{ textAlign: "right", background: "rgba(49,130,246,0.04)" }}>착수금</th>
                <th style={{ textAlign: "right", background: "rgba(49,130,246,0.04)" }}>중도금</th>
                <th style={{ textAlign: "right", background: "rgba(49,130,246,0.04)" }}>잔금</th>
                <th style={{ textAlign: "right", background: "rgba(0,196,113,0.04)" }}>착수금</th>
                <th style={{ textAlign: "right", background: "rgba(0,196,113,0.04)" }}>중도금</th>
                <th style={{ textAlign: "right", background: "rgba(0,196,113,0.04)" }}>잔금</th>
                <th style={{ textAlign: "right" }}>수금액</th><th style={{ textAlign: "right" }}>잔여금</th>
                <ProjTH k="collection_rate" align="right">수금율</ProjTH>
                <th style={{ textAlign: "right" }}>투입원가</th>
                <ProjTH k="net_profit_rate" align="right">이익률</ProjTH>
                <th style={{ textAlign: "right" }}>순이익금</th>
                <th>투입인원</th>
              </tr>
            </thead>
            <tbody>
              {projFiltered.map((p) => (
                <tr key={p.id} className={s.clickableRow} onClick={() => setProjEditId(p.id)}>
                  <td className={s.projCode}>{p.contract_number}</td>
                  <td className={s.projClient}>{p.client}</td>
                  <td className={s.projDesc}>{p.description}</td>
                  <td><span className={`${s.badge} ${channelBadge(p.acquisition_channel)}`}>{p.acquisition_channel}</span></td>
                  <td style={{ textAlign: "center" }}>{p.invoice_issued ? <span style={{ color: "var(--color-success)", fontWeight: 700, fontSize: 12 }}>발행</span> : <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>미발행</span>}</td>
                  <td className={s.projDate}>{p.start_date}</td>
                  <td className={s.projDate}>{p.end_date}</td>
                  <td className={s.projAmountBold}>{fmtNum(p.supply_amount)}</td>
                  <td className={s.projAmount}>{fmtNum(p.vat_amount)}</td>
                  <td className={s.projAmountPrimary}>{fmtNum(p.total_amount_num)}</td>
                  <td className={s.projAmountBilling}>{fmtNum(p.billing_initial)}</td>
                  <td className={s.projAmountBilling}>{fmtNum(p.billing_interim)}</td>
                  <td className={s.projAmountBilling}>{fmtNum(p.billing_final)}</td>
                  <td className={s.projAmountCollected}>{p.collected_initial > 0 ? fmtNum(p.collected_initial) : "-"}</td>
                  <td className={s.projAmountCollected}>{p.collected_interim > 0 ? fmtNum(p.collected_interim) : "-"}</td>
                  <td className={s.projAmountCollected}>{p.collected_final > 0 ? fmtNum(p.collected_final) : "-"}</td>
                  <td className={s.projAmountBold}>{p.collected_amount > 0 ? fmtNum(p.collected_amount) : "-"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12, color: p.remaining_amount > 0 ? "#b45309" : "var(--color-text-tertiary)" }}>{p.remaining_amount > 0 ? fmtNum(p.remaining_amount) : "-"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: p.collection_rate >= 100 ? "var(--color-success)" : "var(--color-text)" }}>{p.collection_rate > 0 ? `${p.collection_rate}%` : "-"}</td>
                  <td className={s.projAmount}>{p.input_cost > 0 ? fmtNum(p.input_cost) : "-"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: rateColor(p.net_profit_rate) }}>{p.net_profit_rate > 0 ? `${p.net_profit_rate}%` : "-"}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: p.net_profit > 0 ? "var(--color-success)" : p.net_profit < 0 ? "var(--color-danger)" : "var(--color-text-tertiary)" }}>{p.net_profit !== 0 ? fmtNum(p.net_profit) : "-"}</td>
                  <td className={s.projMembers}>{p.team_members.map((m) => <span key={m} className={s.projMemberChip}>{m}</span>)}</td>
                </tr>
              ))}
              {projFiltered.length === 0 && <tr><td colSpan={23} className={s.empty}>등록된 프로젝트가 없습니다</td></tr>}
            </tbody>
            {projFiltered.length > 0 && (
              <tfoot>
                <tr className={s.projTotalRow}>
                  <td colSpan={2} style={{ fontWeight: 700 }}>합계 ({projFiltered.length}건)</td>
                  <td colSpan={5} />
                  <td className={s.projAmountBold}>{fmtNum(projFiltered.reduce((a, p) => a + p.supply_amount, 0))}</td>
                  <td className={s.projAmount}>{fmtNum(projFiltered.reduce((a, p) => a + p.vat_amount, 0))}</td>
                  <td className={s.projAmountPrimary}>{fmtNum(projFiltered.reduce((a, p) => a + p.total_amount_num, 0))}</td>
                  <td className={s.projAmountBilling}>{fmtNum(projFiltered.reduce((a, p) => a + p.billing_initial, 0))}</td>
                  <td className={s.projAmountBilling}>{fmtNum(projFiltered.reduce((a, p) => a + p.billing_interim, 0))}</td>
                  <td className={s.projAmountBilling}>{fmtNum(projFiltered.reduce((a, p) => a + p.billing_final, 0))}</td>
                  <td className={s.projAmountCollected}>{fmtNum(projFiltered.reduce((a, p) => a + p.collected_initial, 0))}</td>
                  <td className={s.projAmountCollected}>{fmtNum(projFiltered.reduce((a, p) => a + p.collected_interim, 0))}</td>
                  <td className={s.projAmountCollected}>{fmtNum(projFiltered.reduce((a, p) => a + p.collected_final, 0))}</td>
                  <td className={s.projAmountBold}>{fmtNum(projFiltered.reduce((a, p) => a + p.collected_amount, 0))}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: "#b45309" }}>{fmtNum(projFiltered.reduce((a, p) => a + p.remaining_amount, 0))}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700 }}>
                    {(() => { const t = projFiltered.reduce((a, p) => a + p.total_amount_num, 0); const c = projFiltered.reduce((a, p) => a + p.collected_amount, 0); return t > 0 ? Math.round(c / t * 100) + "%" : "-"; })()}
                  </td>
                  <td className={s.projAmount}>{fmtNum(projFiltered.reduce((a, p) => a + p.input_cost, 0))}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700 }}>
                    {(() => { const c = projFiltered.reduce((a, p) => a + p.collected_amount, 0); const pr = projFiltered.reduce((a, p) => a + p.net_profit, 0); return c > 0 ? (pr / c * 100).toFixed(1) + "%" : "-"; })()}
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: 12, fontWeight: 700, color: "var(--color-success)" }}>{fmtNum(projFiltered.reduce((a, p) => a + p.net_profit, 0))}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* 프로젝트 수정 모달 */}
        {projEditProject && (
          <ProjectEditModal
            project={projEditProject}
            onClose={closeProjModal}
            onSave={handleProjSave}
            files={projEditFiles}
            onDeleteFile={handleProjDeleteFile}
            mode={projCreateDraft ? "create" : "edit"}
          />
        )}
      </div>
    </>
  );
}
