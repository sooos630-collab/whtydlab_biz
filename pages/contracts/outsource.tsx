import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import {
  dummyOutsourceContracts, type OutsourceContract,
  dummyContractFiles, type ContractFile,
} from "@/data/dummy-contracts";

const fmtSize = (b: number) => b < 1024 * 1024 ? Math.round(b / 1024) + "KB" : (b / 1024 / 1024).toFixed(1) + "MB";

const statusBadge = (status: string) => {
  switch (status) {
    case "계약중": return s.badgeGreen;
    case "계약완료": return s.badgeGray;
    case "계약해지": return s.badgeRed;
    default: return s.badgeGray;
  }
};

const typeBadge = (type: string) => type === "프리랜서" ? s.badgeBlue : s.badgeOrange;

const fileTypeBadge = (ft: string) => {
  switch (ft) {
    case "계약서": return s.badgeBlue;
    case "NDA": return s.badgeOrange;
    case "견적서": return s.badgeGreen;
    case "검수확인서": return s.badgeGreen;
    default: return s.badgeGray;
  }
};

export default function OutsourceContractsPage() {
  const [list, setList] = useState<OutsourceContract[]>(() =>
    dummyOutsourceContracts.map((d) => ({ ...d }))
  );
  const [files, setFiles] = useState<ContractFile[]>(() =>
    dummyContractFiles.filter((f) => f.contract_type === "outsource").map((f) => ({ ...f }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeCount = list.filter((o) => o.status === "계약중").length;
  const getFiles = (id: string) => files.filter((f) => f.contract_id === id);

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((o) => o.id !== id));
    setFiles(files.filter((f) => f.contract_id !== id));
  };

  const removeFile = (fileId: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;
    setFiles(files.filter((f) => f.id !== fileId));
  };

  return (
    <>
      <Head><title>외주 계약관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>외주 계약관리 <span className={s.count}>계약중 {activeCount}건 / 전체 {list.length}건</span></h1>
          <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}>+ 계약 추가</button>
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>소속/회사</th>
                <th>유형</th>
                <th>역할</th>
                <th>계약기간</th>
                <th>금액</th>
                <th>상태</th>
                <th>서류</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((o) => {
                const oFiles = getFiles(o.id);
                const isOpen = expandedId === o.id;
                return (
                  <>
                    <tr
                      key={o.id}
                      className={`${s.clickableRow} ${isOpen ? s.activeRow : ""}`}
                      onClick={() => setExpandedId(isOpen ? null : o.id)}
                    >
                      <td style={{ fontWeight: 600 }}>{o.name}</td>
                      <td>{o.company || <span style={{ color: "#ccc" }}>-</span>}</td>
                      <td><span className={`${s.badge} ${typeBadge(o.type)}`}>{o.type}</span></td>
                      <td>{o.role}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{o.contract_start} ~ {o.contract_end}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{o.amount}</td>
                      <td><span className={`${s.badge} ${statusBadge(o.status)}`}>{o.status}</span></td>
                      <td><span className={s.fileCount}>📎 {oFiles.length}</span></td>
                      <td>
                        <button className={s.btnIcon} onClick={(e) => { e.stopPropagation(); remove(o.id); }}>🗑</button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={o.id + "-expand"} className={s.expandRow}>
                        <td colSpan={9}>
                          <div className={s.expandPanel}>
                            <div className={s.expandHeader}>
                              <span className={s.expandTitle}>첨부 서류</span>
                              <button className={`${s.btn} ${s.btnSmall}`}>+ 파일 업로드</button>
                            </div>
                            {oFiles.length > 0 ? (
                              <div className={s.fileList}>
                                {oFiles.map((f) => (
                                  <div key={f.id} className={s.fileItem}>
                                    <span className={s.fileIcon}>📄</span>
                                    <span className={s.fileName}>{f.file_name}</span>
                                    <span className={s.fileType}>
                                      <span className={`${s.badge} ${fileTypeBadge(f.file_type)}`}>{f.file_type}</span>
                                    </span>
                                    <span className={s.fileMeta}>{fmtSize(f.file_size)}</span>
                                    <span className={s.fileMeta}>{f.uploaded_at}</span>
                                    <div className={s.fileActions}>
                                      <button className={s.btnIcon} onClick={() => removeFile(f.id)}>🗑</button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className={s.emptyFiles}>첨부된 서류가 없습니다</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={9} className={s.empty}>등록된 외주 계약이 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
