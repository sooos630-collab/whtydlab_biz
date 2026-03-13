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
    case "신분증": return s.badgePurple ?? s.badgeGray;
    case "통장사본": return s.badgeGreen;
    case "기타": return s.badgeGray;
    default: return s.badgeGray;
  }
};

type FormType = HrContract["type"];

interface AddForm {
  name: string;
  gender: "남" | "여";
  birth_date: string;
  address: string;
  position: string;
  type: FormType;
  start_date: string;
  end_date: string;
  salary: string;
  contract_file: File | null;
  id_file: File | null;
  bank_file: File | null;
  etc_files: File[];
}

const emptyForm: AddForm = {
  name: "", gender: "남", birth_date: "", address: "",
  position: "", type: "정규직", start_date: "", end_date: "",
  salary: "", contract_file: null, id_file: null, bank_file: null, etc_files: [],
};

export default function HrContractsPage() {
  const [list, setList] = useState<HrContract[]>(() =>
    dummyHrContracts.map((d) => ({ ...d }))
  );
  const [files, setFiles] = useState<ContractFile[]>(() =>
    dummyContractFiles.filter((f) => f.contract_type === "hr").map((f) => ({ ...f }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddForm>({ ...emptyForm });

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

  const handleAdd = () => {
    if (!form.name.trim()) { alert("이름을 입력하세요."); return; }
    if (!form.position.trim()) { alert("직책을 입력하세요."); return; }
    if (!form.start_date) { alert("입사일을 입력하세요."); return; }
    if (!form.salary.trim()) { alert("급여를 입력하세요."); return; }

    const newId = `hr-${Date.now()}`;
    const newHr: HrContract = {
      id: newId,
      name: form.name.trim(),
      gender: form.gender,
      birth_date: form.birth_date,
      address: form.address.trim(),
      position: form.position.trim(),
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date || null,
      status: "재직",
      salary: form.salary.trim(),
      docs: [],
    };

    // 첨부파일 처리
    const now = new Date().toISOString().slice(0, 10);
    const newFiles: ContractFile[] = [];
    let ts = Date.now();

    const addFile = (file: File, fileType: ContractFile["file_type"], docName: string) => {
      newFiles.push({
        id: `cf-${ts++}`,
        contract_id: newId,
        contract_type: "hr",
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        uploaded_at: now,
      });
      newHr.docs.push({ name: docName, uploaded: true });
    };

    if (form.contract_file) addFile(form.contract_file, "계약서", "근로계약서");
    if (form.id_file) addFile(form.id_file, "신분증", "신분증 사본");
    if (form.bank_file) addFile(form.bank_file, "통장사본", "통장사본");
    form.etc_files.forEach((f) => addFile(f, "기타", f.name));

    if (newFiles.length > 0) setFiles((prev) => [...prev, ...newFiles]);

    setList((prev) => [...prev, newHr]);
    setForm({ ...emptyForm });
    setShowAdd(false);
  };

  const F = (label: string, children: React.ReactNode, required = false) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>
        {label}{required && <span style={{ color: "var(--color-danger)" }}> *</span>}
      </label>
      {children}
    </div>
  );

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px", fontSize: 13, border: "1px solid var(--color-border)",
    borderRadius: 6, background: "var(--color-bg, #fff)", width: "100%",
  };

  return (
    <>
      <Head><title>HR 계약관리 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>HR 계약관리 <span className={s.count}>재직 {activeCount}명 / 전체 {list.length}명</span></h1>
          <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={() => setShowAdd(true)}>+ 직원 추가</button>
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>이름</th>
                <th>성별</th>
                <th>생년월일</th>
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
                      <td>{h.gender}</td>
                      <td style={{ fontSize: 12 }}>{h.birth_date || "-"}</td>
                      <td>{h.position}</td>
                      <td><span className={`${s.badge} ${typeBadge(h.type)}`}>{h.type}</span></td>
                      <td style={{ fontSize: 12 }}>{h.start_date}</td>
                      <td style={{ fontSize: 12 }}>{h.end_date ?? <span style={{ color: "#ccc" }}>-</span>}</td>
                      <td>{h.salary}</td>
                      <td><span className={`${s.badge} ${statusBadge(h.status)}`}>{h.status}</span></td>
                      <td><span className={s.fileCount}>📎 {hFiles.length}</span></td>
                      <td>
                        <button className={s.btnIcon} onClick={(e) => { e.stopPropagation(); remove(h.id); }}>🗑</button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={h.id + "-expand"} className={s.expandRow}>
                        <td colSpan={11}>
                          <div className={s.expandPanel}>
                            {/* 기본정보 */}
                            {h.address && (
                              <div style={{ marginBottom: 10, fontSize: 12, color: "var(--color-text-secondary)" }}>
                                주소: {h.address}
                              </div>
                            )}
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
                <tr><td colSpan={11} className={s.empty}>등록된 직원이 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 직원 추가 모달 */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }} onClick={() => setShowAdd(false)}>
          <div style={{
            background: "var(--color-bg, #fff)", borderRadius: 12, padding: 24,
            width: 520, maxHeight: "90vh", overflow: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>직원 추가</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {F("이름", <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="홍길동" />, true)}
              {F("성별", (
                <div style={{ display: "flex", gap: 8 }}>
                  {(["남", "여"] as const).map((g) => (
                    <label key={g} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, cursor: "pointer" }}>
                      <input type="radio" checked={form.gender === g} onChange={() => setForm({ ...form, gender: g })} /> {g}
                    </label>
                  ))}
                </div>
              ))}
              {F("생년월일", <input type="date" style={inputStyle} value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />)}
              {F("직책", <input style={inputStyle} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="팀장, 개발자 등" />, true)}
            </div>

            <div style={{ marginTop: 12 }}>
              {F("주소", <input style={inputStyle} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="서울시 강남구..." />)}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              {F("고용형태", (
                <select style={inputStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FormType })}>
                  <option value="정규직">정규직</option>
                  <option value="계약직">계약직</option>
                  <option value="파트타임">파트타임</option>
                  <option value="인턴">인턴</option>
                </select>
              ), true)}
              {F(form.type === "정규직" ? "연봉" : "월 급여", (
                <input style={inputStyle} value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  placeholder={form.type === "정규직" ? "4,200만원" : "400만원"} />
              ), true)}
              {F("입사일", <input type="date" style={inputStyle} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />, true)}
              {F("계약종료일", (
                <input type="date" style={inputStyle} value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  disabled={form.type === "정규직"} />
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-secondary)" }}>첨부서류</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {F("계약서", (
                  <div>
                    <input type="file" accept=".pdf,.doc,.docx,.hwp,.jpg,.png"
                      style={{ fontSize: 11, width: "100%" }}
                      onChange={(e) => setForm({ ...form, contract_file: e.target.files?.[0] ?? null })} />
                    {form.contract_file && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{form.contract_file.name} ({fmtSize(form.contract_file.size)})</span>}
                  </div>
                ))}
                {F("신분증 사본", (
                  <div>
                    <input type="file" accept=".pdf,.jpg,.png,.jpeg"
                      style={{ fontSize: 11, width: "100%" }}
                      onChange={(e) => setForm({ ...form, id_file: e.target.files?.[0] ?? null })} />
                    {form.id_file && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{form.id_file.name} ({fmtSize(form.id_file.size)})</span>}
                  </div>
                ))}
                {F("통장사본", (
                  <div>
                    <input type="file" accept=".pdf,.jpg,.png,.jpeg"
                      style={{ fontSize: 11, width: "100%" }}
                      onChange={(e) => setForm({ ...form, bank_file: e.target.files?.[0] ?? null })} />
                    {form.bank_file && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{form.bank_file.name} ({fmtSize(form.bank_file.size)})</span>}
                  </div>
                ))}
                {F("기타 첨부파일", (
                  <div>
                    <input type="file" multiple accept=".pdf,.doc,.docx,.hwp,.jpg,.png,.xlsx,.zip"
                      style={{ fontSize: 11, width: "100%" }}
                      onChange={(e) => setForm({ ...form, etc_files: e.target.files ? Array.from(e.target.files) : [] })} />
                    {form.etc_files.length > 0 && <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{form.etc_files.length}개 파일</span>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 24 }}>
              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => { setForm({ ...emptyForm }); setShowAdd(false); }}>취소</button>
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={handleAdd}>추가</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
