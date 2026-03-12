import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import {
  dummyHrContracts, type HrContract,
  dummyContractFiles, type ContractFile,
} from "@/data/dummy-contracts";

const fmtSize = (b: number) => b < 1024 * 1024 ? Math.round(b / 1024) + "KB" : (b / 1024 / 1024).toFixed(1) + "MB";

const statusBadge = (status: string) => {
  switch (status) {
    case "재직": return s.badgeGreen;
    case "퇴직": return s.badgeGray;
    case "휴직": return s.badgeOrange;
    default: return s.badgeGray;
  }
};

const typeBadge = (type: string) => {
  switch (type) {
    case "정규직": return s.badgeBlue;
    case "계약직": return s.badgeOrange;
    case "파트타임": return s.badgeGray;
    case "인턴": return s.badgeGray;
    default: return s.badgeGray;
  }
};

const fileTypeBadge = (ft: string) => {
  switch (ft) {
    case "계약서": return s.badgeBlue;
    case "NDA": return s.badgeOrange;
    default: return s.badgeGray;
  }
};

export default function HrContractsPage() {
  const [list, setList] = useState<HrContract[]>(() =>
    dummyHrContracts.map((d) => ({ ...d }))
  );
  const [files, setFiles] = useState<ContractFile[]>(() =>
    dummyContractFiles.filter((f) => f.contract_type === "hr").map((f) => ({ ...f }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeCount = list.filter((h) => h.status === "재직").length;
  const getFiles = (id: string) => files.filter((f) => f.contract_id === id);

  const remove = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setList(list.filter((h) => h.id !== id));
    setFiles(files.filter((f) => f.contract_id !== id));
  };

  const removeFile = (fileId: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;
    setFiles(files.filter((f) => f.id !== fileId));
  };

  return (
    <>
      <Head><title>HR 계약관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>HR 계약관리 <span className={s.count}>재직 {activeCount}명 / 전체 {list.length}명</span></h1>
          <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}>+ 직원 추가</button>
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>직책</th>
                <th>고용형태</th>
                <th>입사일</th>
                <th>퇴사일</th>
                <th>급여</th>
                <th>상태</th>
                <th>서류</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((h) => {
                const hFiles = getFiles(h.id);
                const isOpen = expandedId === h.id;
                return (
                  <>
                    <tr
                      key={h.id}
                      className={`${s.clickableRow} ${isOpen ? s.activeRow : ""}`}
                      onClick={() => setExpandedId(isOpen ? null : h.id)}
                    >
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td>{h.position}</td>
                      <td><span className={`${s.badge} ${typeBadge(h.type)}`}>{h.type}</span></td>
                      <td>{h.start_date}</td>
                      <td>{h.end_date ?? <span style={{ color: "#ccc" }}>-</span>}</td>
                      <td>{h.salary}</td>
                      <td><span className={`${s.badge} ${statusBadge(h.status)}`}>{h.status}</span></td>
                      <td><span className={s.fileCount}>📎 {hFiles.length}</span></td>
                      <td>
                        <button className={s.btnIcon} onClick={(e) => { e.stopPropagation(); remove(h.id); }}>🗑</button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={h.id + "-expand"} className={s.expandRow}>
                        <td colSpan={9}>
                          <div className={s.expandPanel}>
                            <div className={s.expandHeader}>
                              <span className={s.expandTitle}>첨부 서류</span>
                              <button className={`${s.btn} ${s.btnSmall}`}>+ 파일 업로드</button>
                            </div>
                            {hFiles.length > 0 ? (
                              <div className={s.fileList}>
                                {hFiles.map((f) => (
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
                <tr><td colSpan={9} className={s.empty}>등록된 직원이 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
