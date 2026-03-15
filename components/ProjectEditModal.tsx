import { useState, useMemo } from "react";
import s from "@/styles/Contracts.module.css";
import { type ProjectContract, type ContractFile } from "@/data/dummy-contracts";
import { recalculateProjectContract } from "@/lib/project-contracts";

const fmtFileSize = (b: number) => b < 1024 * 1024 ? Math.round(b / 1024) + "KB" : (b / 1024 / 1024).toFixed(1) + "MB";
const fmtNum = (n: number) => n.toLocaleString();

const fileTypeBadgeColor = (ft: string) => {
  switch (ft) {
    case "계약서": case "최종계약서": return s.badgeBlue;
    case "계약서초안": return s.badgeOrange;
    case "견적서": case "검수확인서": return s.badgeGreen;
    case "발주서": case "변경계약서": return s.badgeOrange;
    case "NDA": return s.badgeRed;
    default: return s.badgeGray;
  }
};

/* ── inline styles ── */
const inp: React.CSSProperties = { padding: "6px 10px", fontSize: 12 };
const inpRo: React.CSSProperties = { ...inp, background: "var(--color-bg)", fontWeight: 700 };
const lbl: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 2 };
const grp: React.CSSProperties = { marginBottom: 6 };
const sec: React.CSSProperties = { fontSize: 10, fontWeight: 800, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 };
const divider: React.CSSProperties = { height: 1, background: "var(--color-divider)", margin: "10px 0" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "6px 8px", fontSize: 11, fontWeight: 600, color: "var(--color-text-tertiary)" };

export default function ProjectEditModal({
  project, onClose, onSave, files: pFiles, onDeleteFile, mode = "edit",
}: {
  project: ProjectContract; onClose: () => void; onSave: (u: ProjectContract) => void;
  files: ContractFile[]; onDeleteFile: (fid: string) => void;
  mode?: "create" | "edit";
}) {
  const [form, setForm] = useState<ProjectContract>({ ...project, team_members: [...project.team_members] });
  const [membersText, setMembersText] = useState(project.team_members.join(", "));
  const u = <K extends keyof ProjectContract>(key: K, val: ProjectContract[K]) => setForm((prev) => ({ ...prev, [key]: val }));
  const uNum = (key: keyof ProjectContract) => (e: React.ChangeEvent<HTMLInputElement>) => u(key, Number(e.target.value) as any);
  const uSupply = (e: React.ChangeEvent<HTMLInputElement>) => {
    const supply = Number(e.target.value) || 0;
    const vat = Math.round(supply * 0.1);
    setForm((prev) => ({ ...prev, supply_amount: supply, vat_amount: vat }));
  };

  const totalAmount = form.supply_amount + form.vat_amount;
  const collectedTotal = form.collected_initial + form.collected_interim + form.collected_final;
  const remainingTotal = totalAmount - collectedTotal;
  const collectionRate = totalAmount > 0 ? Math.round(collectedTotal / totalAmount * 100) : 0;
  const netProfit = form.supply_amount - form.input_cost;
  const profitRate = form.supply_amount > 0 ? (netProfit / form.supply_amount * 100).toFixed(1) : "-";

  const billTotal = form.billing_initial + form.billing_interim + form.billing_final;

  // 정산 비율 vs 수금 행 데이터
  const phaseRows = useMemo(() => [
    { label: "착수금", pct: form.billing_initial, coll: form.collected_initial, billKey: "billing_initial" as const, collKey: "collected_initial" as const },
    { label: "중도금", pct: form.billing_interim, coll: form.collected_interim, billKey: "billing_interim" as const, collKey: "collected_interim" as const },
    { label: "잔금", pct: form.billing_final, coll: form.collected_final, billKey: "billing_final" as const, collKey: "collected_final" as const },
  ], [form.billing_initial, form.billing_interim, form.billing_final, form.collected_initial, form.collected_interim, form.collected_final]);

  const handleSave = () => {
    const members = membersText.split(",").map((ss) => ss.trim()).filter(Boolean);
    onSave(recalculateProjectContract({ ...form, total_amount_num: totalAmount, team_members: members }, project));
  };

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ maxWidth: 820 }}>
        <div className={s.modalHeader}>
          <h2 className={s.modalTitle}>{mode === "create" ? "프로젝트 추가" : "프로젝트 수정"}</h2>
          <button className={s.btnIcon} onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>

        <div className={s.modalBody} style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", padding: "14px 20px" }}>

          {/* ═══ 프로젝트 개요 ═══ */}
          <div style={sec}>프로젝트 개요</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8 }}>
            <div style={grp}><label style={lbl}>코드넘버</label><input className={s.formInput} value={form.contract_number} readOnly style={{ ...inp, background: "var(--color-bg)", color: "var(--color-text-tertiary)" }} /></div>
            <div style={grp}><label style={lbl}>상태</label><select className={s.formSelect} value={form.status} onChange={(e) => u("status", e.target.value as ProjectContract["status"])} style={inp}>{(["제안","계약완료","진행중","납품완료","정산완료"] as const).map((st) => <option key={st} value={st}>{st}</option>)}</select></div>
            <div style={grp}><label style={lbl}>진척도</label><select className={s.formSelect} value={form.progress_stage} onChange={(e) => u("progress_stage", e.target.value as ProjectContract["progress_stage"])} style={inp}>{(["시작전","진행중","홀딩","완료"] as const).map((st) => <option key={st} value={st}>{st}</option>)}</select></div>
            <div style={grp}><label style={lbl}>수주경로</label><select className={s.formSelect} value={form.acquisition_channel} onChange={(e) => u("acquisition_channel", e.target.value as ProjectContract["acquisition_channel"])} style={inp}>{(["소개","입찰","직접영업","온라인","기타"] as const).map((ch) => <option key={ch} value={ch}>{ch}</option>)}</select></div>
            <div style={grp}><label style={lbl}>세금계산서</label><select className={s.formSelect} value={form.invoice_issued ? "Y" : "N"} onChange={(e) => u("invoice_issued", e.target.value === "Y")} style={inp}><option value="Y">발행완료</option><option value="N">미발행</option></select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 8 }}>
            <div style={grp}><label style={lbl}>프로젝트명</label><input className={s.formInput} value={form.project_name} onChange={(e) => u("project_name", e.target.value)} style={inp} /></div>
            <div style={grp}><label style={lbl}>회사명(고객사)</label><input className={s.formInput} value={form.client} onChange={(e) => u("client", e.target.value)} style={inp} /></div>
          </div>
          <div style={grp}><label style={lbl}>세부내역</label><input className={s.formInput} value={form.description} onChange={(e) => u("description", e.target.value)} style={inp} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr", gap: 8 }}>
            <div style={grp}><label style={lbl}>시작일</label><input className={s.formInput} type="date" value={form.start_date} onChange={(e) => u("start_date", e.target.value)} style={inp} /></div>
            <div style={grp}><label style={lbl}>종료일</label><input className={s.formInput} type="date" value={form.end_date} onChange={(e) => u("end_date", e.target.value)} style={inp} /></div>
            <div style={grp}><label style={lbl}>담당자</label><input className={s.formInput} value={form.manager} onChange={(e) => u("manager", e.target.value)} style={inp} /></div>
            <div style={grp}><label style={lbl}>투입인원 (콤마 구분)</label><input className={s.formInput} placeholder="홍길동, 김철수" value={membersText} onChange={(e) => setMembersText(e.target.value)} style={inp} /></div>
          </div>

          <div style={divider} />

          {/* ═══ 계약금액 ═══ */}
          <div style={sec}>계약금액</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={grp}><label style={lbl}>공급가액</label><input className={s.formInput} type="number" value={form.supply_amount || ""} onChange={uSupply} style={inp} /></div>
            <div style={grp}><label style={lbl}>부가세 10% (자동)</label><input className={s.formInput} value={fmtNum(form.vat_amount)} readOnly style={inpRo} /></div>
            <div style={grp}><label style={lbl}>총금액 (자동)</label><input className={s.formInput} value={fmtNum(totalAmount)} readOnly style={inpRo} /></div>
          </div>

          <div style={divider} />

          {/* ═══ 정산 비율 vs 수금 ═══ */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ ...sec, marginBottom: 0 }}>정산 비율 vs 수금</div>
            <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
              <span style={{ color: billTotal !== 100 ? "var(--color-danger)" : "var(--color-text-tertiary)" }}>비율 합계 <b>{billTotal}%</b>{billTotal !== 100 && " (100%가 아님)"}</span>
              <span style={{ color: "var(--color-text-secondary)" }}>수금율 <b style={{ color: collectionRate >= 100 ? "var(--color-success)" : "var(--color-primary)" }}>{collectionRate}%</b></span>
              <span style={{ color: "var(--color-text-secondary)" }}>잔여 <b style={{ color: remainingTotal > 0 ? "var(--color-danger)" : "var(--color-success)" }}>{fmtNum(remainingTotal)}원</b></span>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={thStyle}>구분</th>
                <th style={{ ...thStyle, textAlign: "center", width: 70 }}>정산 비율</th>
                <th style={{ ...thStyle, textAlign: "right" }}>정산금액 (자동)</th>
                <th style={{ ...thStyle, textAlign: "right" }}>수금액</th>
                <th style={{ ...thStyle, textAlign: "right", width: 100 }}>미수금</th>
              </tr>
            </thead>
            <tbody>
              {phaseRows.map((row) => {
                const billAmt = Math.round(totalAmount * row.pct / 100);
                const gap = row.coll - billAmt;
                return (
                  <tr key={row.label} style={{ borderBottom: "1px solid var(--color-divider)" }}>
                    <td style={{ padding: "5px 8px", fontWeight: 600, color: "var(--color-text-secondary)" }}>{row.label}</td>
                    <td style={{ padding: "2px 4px", textAlign: "center" }}>
                      <input className={s.formInput} type="number" value={row.pct || ""} onChange={uNum(row.billKey)} style={{ ...inp, textAlign: "center", border: "1px solid var(--color-divider)", width: 60 }} />
                    </td>
                    <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--color-text-secondary)" }}>{fmtNum(billAmt)}</td>
                    <td style={{ padding: "2px 4px", textAlign: "right" }}>
                      <input className={s.formInput} type="number" value={row.coll || ""} onChange={uNum(row.collKey)} style={{ ...inp, textAlign: "right", border: "1px solid var(--color-divider)" }} />
                    </td>
                    <td style={{
                      padding: "5px 8px", textAlign: "right", fontWeight: 700, fontSize: 12,
                      color: gap >= 0 ? "var(--color-success)" : "var(--color-danger)",
                    }}>
                      {gap === 0 ? "-" : (gap > 0 ? "+" : "") + fmtNum(gap)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--color-border)" }}>
                <td style={{ padding: "6px 8px", fontWeight: 700, fontSize: 11 }}>합계</td>
                <td style={{ padding: "6px 8px", textAlign: "center", fontWeight: 700 }}>{billTotal}%</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>{fmtNum(totalAmount)}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>{fmtNum(collectedTotal)}</td>
                <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700, color: remainingTotal > 0 ? "var(--color-danger)" : "var(--color-success)" }}>{remainingTotal === 0 ? "-" : fmtNum(-remainingTotal)}</td>
              </tr>
            </tfoot>
          </table>

          <div style={divider} />

          {/* ═══ 수익 요약 ═══ */}
          <div style={sec}>수익 요약</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div style={grp}>
              <label style={lbl}>투입원가</label>
              <input className={s.formInput} type="number" value={form.input_cost || ""} onChange={uNum("input_cost")} style={inp} />
            </div>
            <div style={grp}>
              <label style={lbl}>순이익 (자동)</label>
              <div style={{
                padding: "6px 10px", fontSize: 13, fontWeight: 800, borderRadius: "var(--radius-sm)",
                background: "var(--color-bg)",
                color: netProfit > 0 ? "var(--color-success)" : netProfit < 0 ? "var(--color-danger)" : "var(--color-text-tertiary)",
              }}>
                {netProfit !== 0 ? (netProfit > 0 ? "+" : "") + fmtNum(netProfit) + "원" : "-"}
              </div>
            </div>
            <div style={grp}>
              <label style={lbl}>이익률 (자동)</label>
              <div style={{
                padding: "6px 10px", fontSize: 13, fontWeight: 800, borderRadius: "var(--radius-sm)",
                background: "var(--color-bg)",
                color: Number(profitRate) > 0 ? "var(--color-success)" : Number(profitRate) < 0 ? "var(--color-danger)" : "var(--color-text-tertiary)",
              }}>
                {profitRate !== "-" ? profitRate + "%" : "-"}
              </div>
            </div>
          </div>

          <div style={divider} />

          {/* ═══ 계약 서류 ═══ */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ ...sec, marginBottom: 0 }}>계약 서류</div>
            <button className={`${s.btn} ${s.btnSmall}`} style={{ padding: "3px 10px", fontSize: 11 }}>+ 파일 업로드</button>
          </div>
          {pFiles.length > 0 ? (
            <div className={s.fileList}>{pFiles.map((f) => (
              <div key={f.id} className={s.fileItem}>
                <span className={s.fileIcon}>📄</span><span className={s.fileName}>{f.file_name}</span>
                <span className={s.fileType}><span className={`${s.badge} ${fileTypeBadgeColor(f.file_type)}`}>{f.file_type}</span></span>
                <span className={s.fileMeta}>{fmtFileSize(f.file_size)}</span><span className={s.fileMeta}>{f.uploaded_at}</span>
                <div className={s.fileActions}><button className={s.btnIcon} onClick={() => onDeleteFile(f.id)}>🗑</button></div>
              </div>
            ))}</div>
          ) : <div className={s.emptyFiles} style={{ padding: "10px 0", fontSize: 12 }}>첨부된 서류가 없습니다</div>}
        </div>

        <div className={s.modalFooter}>
          <button className={`${s.btn} ${s.btnSmall}`} onClick={onClose}>취소</button>
          <div style={{ flex: 1 }} />
          <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}
