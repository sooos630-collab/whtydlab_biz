import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import { type ProjectContract, type ContractFile } from "@/data/dummy-contracts";
import { recalculateProjectContract } from "@/lib/project-contracts";

const fmtFileSize = (b: number) => b < 1024 * 1024 ? Math.round(b / 1024) + "KB" : (b / 1024 / 1024).toFixed(1) + "MB";

const fileTypeBadgeColor = (ft: string) => {
  switch (ft) {
    case "계약서": return s.badgeBlue;
    case "견적서": case "검수확인서": return s.badgeGreen;
    case "발주서": case "변경계약서": return s.badgeOrange;
    case "NDA": return s.badgeRed;
    default: return s.badgeGray;
  }
};

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
  const handleSave = () => {
    const members = membersText.split(",").map((ss) => ss.trim()).filter(Boolean);
    onSave(recalculateProjectContract({ ...form, total_amount_num: form.supply_amount + form.vat_amount, team_members: members }, project));
  };
  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ maxWidth: 740 }}>
        <div className={s.modalHeader}><h2 className={s.modalTitle}>{mode === "create" ? "프로젝트 추가" : "프로젝트 수정"}</h2><button className={s.btnIcon} onClick={onClose} style={{ fontSize: 18 }}>✕</button></div>
        <div className={s.modalBody} style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
          <div className={s.editorBlockTitle}>기본 정보</div>
          <div className={s.formRow}>
            <div className={s.formGroup}><label className={s.formLabel}>코드넘버</label><input className={s.formInput} value={form.contract_number} readOnly style={{ background: "var(--color-bg)", color: "var(--color-text-tertiary)" }} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>상태</label><select className={s.formSelect} value={form.status} onChange={(e) => u("status", e.target.value as ProjectContract["status"])}>{(["제안","계약완료","진행중","납품완료","정산완료"] as const).map((st) => <option key={st} value={st}>{st}</option>)}</select></div>
          </div>
          <div className={s.formRow}>
            <div className={s.formGroup}><label className={s.formLabel}>프로젝트명</label><input className={s.formInput} value={form.project_name} onChange={(e) => u("project_name", e.target.value)} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>회사명(고객사)</label><input className={s.formInput} value={form.client} onChange={(e) => u("client", e.target.value)} /></div>
          </div>
          <div className={s.formGroup}><label className={s.formLabel}>세부내역</label><input className={s.formInput} value={form.description} onChange={(e) => u("description", e.target.value)} /></div>
          <div className={s.formRow}>
            <div className={s.formGroup}><label className={s.formLabel}>수주경로</label><select className={s.formSelect} value={form.acquisition_channel} onChange={(e) => u("acquisition_channel", e.target.value as ProjectContract["acquisition_channel"])}>{(["소개","입찰","직접영업","온라인","기타"] as const).map((ch) => <option key={ch} value={ch}>{ch}</option>)}</select></div>
            <div className={s.formGroup}><label className={s.formLabel}>전자세금계산서</label><select className={s.formSelect} value={form.invoice_issued ? "Y" : "N"} onChange={(e) => u("invoice_issued", e.target.value === "Y")}><option value="Y">발행완료</option><option value="N">미발행</option></select></div>
          </div>
          <div className={s.formGroup}><label className={s.formLabel}>담당자</label><input className={s.formInput} value={form.manager} onChange={(e) => u("manager", e.target.value)} /></div>
          <div className={s.formDivider} />
          <div className={s.editorBlockTitle}>기간</div>
          <div className={s.formRow}>
            <div className={s.formGroup}><label className={s.formLabel}>시작일</label><input className={s.formInput} type="date" value={form.start_date} onChange={(e) => u("start_date", e.target.value)} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>종료일</label><input className={s.formInput} type="date" value={form.end_date} onChange={(e) => u("end_date", e.target.value)} /></div>
          </div>
          <div className={s.formDivider} />
          <div className={s.editorBlockTitle}>금액</div>
          <div className={s.formRow3}>
            <div className={s.formGroup}><label className={s.formLabel}>공급가액</label><input className={s.formInput} type="number" value={form.supply_amount || ""} onChange={uNum("supply_amount")} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>부가세(VAT)</label><input className={s.formInput} type="number" value={form.vat_amount || ""} onChange={uNum("vat_amount")} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>총금액</label><input className={s.formInput} type="number" value={form.supply_amount + form.vat_amount} readOnly style={{ background: "var(--color-bg)", fontWeight: 700 }} /></div>
          </div>
          <div className={s.formDivider} />
          <div className={s.editorBlockTitle}>청구</div>
          <div className={s.formRow3}>
            <div className={s.formGroup}><label className={s.formLabel}>착수금</label><input className={s.formInput} type="number" value={form.billing_initial || ""} onChange={uNum("billing_initial")} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>중도금</label><input className={s.formInput} type="number" value={form.billing_interim || ""} onChange={uNum("billing_interim")} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>잔금</label><input className={s.formInput} type="number" value={form.billing_final || ""} onChange={uNum("billing_final")} /></div>
          </div>
          <div className={s.formDivider} />
          <div className={s.editorBlockTitle}>수금</div>
          <div className={s.formRow3}>
            <div className={s.formGroup}><label className={s.formLabel}>착수금</label><input className={s.formInput} type="number" value={form.collected_initial || ""} onChange={uNum("collected_initial")} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>중도금</label><input className={s.formInput} type="number" value={form.collected_interim || ""} onChange={uNum("collected_interim")} /></div>
            <div className={s.formGroup}><label className={s.formLabel}>잔금</label><input className={s.formInput} type="number" value={form.collected_final || ""} onChange={uNum("collected_final")} /></div>
          </div>
          <div className={s.formDivider} />
          <div className={s.editorBlockTitle}>수익</div>
          <div className={s.formGroup}><label className={s.formLabel}>투입원가</label><input className={s.formInput} type="number" value={form.input_cost || ""} onChange={uNum("input_cost")} /></div>
          <div className={s.formDivider} />
          <div className={s.editorBlockTitle}>투입인원</div>
          <div className={s.formGroup}><label className={s.formLabel}>인원 (콤마로 구분)</label><input className={s.formInput} placeholder="홍길동, 김철수" value={membersText} onChange={(e) => setMembersText(e.target.value)} /></div>
          <div className={s.formDivider} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className={s.editorBlockTitle} style={{ marginBottom: 0 }}>계약 서류</div>
            <button className={`${s.btn} ${s.btnSmall}`}>+ 파일 업로드</button>
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
          ) : <div className={s.emptyFiles}>첨부된 서류가 없습니다</div>}
        </div>
        <div className={s.modalFooter}><button className={`${s.btn} ${s.btnSmall}`} onClick={onClose}>취소</button><div style={{ flex: 1 }} /><button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={handleSave}>저장</button></div>
      </div>
    </div>
  );
}
