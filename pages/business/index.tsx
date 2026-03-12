import Head from "next/head";
import { useEffect, useState } from "react";
import s from "@/styles/Business.module.css";

// TODO: DB 연동 시 dummy import 제거 → supabase fetch로 교체
import {
  dummyBusinessInfo,
  dummyBusinessTypes,
  dummyCertificates,
  dummyDirectProductions,
  dummyNaraCodes,
} from "@/data/dummy-business";

interface BusinessInfo {
  id: string;
  company_name: string;
  registration_number: string;
  address: string;
  zipcode: string;
  opening_date: string;
  birth_date: string;
  founder_tags: string[];
  business_scale: string;
  updated_at: string;
}

interface BusinessType {
  id: string;
  category: string;
  item: string;
  sort_order: number;
}

interface Certificate {
  id: string;
  issuer: string;
  certificate_name: string;
  details: string;
  sort_order: number;
}

interface DirectProduction {
  id: string;
  certificate_name: string;
  major_category: string;
  minor_category: string;
  detail_item: string;
  sort_order: number;
}

interface NaraCode {
  id: string;
  name: string;
  code: string;
  sort_order: number;
}

type Status = null | "saving" | "saved" | "error";

let nextId = 100;
const genId = () => `temp-${nextId++}`;

export default function BusinessPage() {
  const [info, setInfo] = useState<BusinessInfo | null>(null);
  const [types, setTypes] = useState<BusinessType[]>([]);

  const [certs, setCerts] = useState<Certificate[]>([]);
  const [prods, setProds] = useState<DirectProduction[]>([]);
  const [naras, setNaras] = useState<NaraCode[]>([]);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [loading, setLoading] = useState(true);

  // TODO: DB 연동 시 이 부분을 supabase fetch로 교체
  const fetchAll = () => {
    setLoading(true);
    setInfo({ ...dummyBusinessInfo });
    setTypes(dummyBusinessTypes.map((t) => ({ ...t })));

    setCerts(dummyCertificates.map((c) => ({ ...c })));
    setProds(dummyDirectProductions.map((d) => ({ ...d })));
    setNaras(dummyNaraCodes.map((n) => ({ ...n })));
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const showStatus = (s: Status) => {
    setStatus(s);
    if (s === "saved") setTimeout(() => setStatus(null), 2000);
  };

  // TODO: DB 연동 시 supabase update로 교체
  const saveAll = () => {
    if (!info) return;
    showStatus("saving");
    setTimeout(() => {
      showStatus("saved");
      setEditing(false);
    }, 500);
  };

  // ── Add row helpers ──
  const addType = () => {
    setTypes([...types, { id: genId(), category: "", item: "", sort_order: types.length + 1 }]);
  };

  const removeType = (id: string) => {
    setTypes(types.filter((t) => t.id !== id));
  };

  const addCert = () => {
    setCerts([...certs, { id: genId(), issuer: "", certificate_name: "", details: "", sort_order: certs.length + 1 }]);
  };

  const removeCert = (id: string) => {
    setCerts(certs.filter((c) => c.id !== id));
  };

  const addProd = () => {
    setProds([...prods, { id: genId(), certificate_name: "", major_category: "", minor_category: "", detail_item: "", sort_order: prods.length + 1 }]);
  };

  const removeProd = (id: string) => {
    setProds(prods.filter((p) => p.id !== id));
  };

  const addNara = () => {
    setNaras([...naras, { id: genId(), name: "", code: "", sort_order: naras.length + 1 }]);
  };

  const removeNara = (id: string) => {
    setNaras(naras.filter((n) => n.id !== id));
  };

  // ── Update helpers ──
  const updateInfo = (field: keyof BusinessInfo, value: string | string[]) => {
    if (!info) return;
    setInfo({ ...info, [field]: value });
  };

  const updateType = (id: string, field: keyof BusinessType, value: string) => {
    setTypes(types.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const updateCert = (id: string, field: keyof Certificate, value: string) => {
    setCerts(certs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateProd = (id: string, field: keyof DirectProduction, value: string) => {
    setProds(prods.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const updateNara = (id: string, field: keyof NaraCode, value: string) => {
    setNaras(naras.map((n) => (n.id === id ? { ...n, [field]: value } : n)));
  };

  if (loading) {
    return (
      <div className={`${s.statusBar} ${s.statusLoading}`}>
        데이터를 불러오는 중...
      </div>
    );
  }

  if (!info) {
    return (
      <div className={`${s.statusBar} ${s.statusError}`}>
        사업자 정보가 없습니다.
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>사업자 기본정보 - WHYDLAB BIZ</title>
      </Head>
      <div className={s.page}>
        {/* Header */}
        <div className={s.pageHeader}>
          <div>
            <h1>사업자 기본정보</h1>
            {info.updated_at && (
              <span className={s.updatedAt}>
                마지막 수정: {new Date(info.updated_at).toLocaleString("ko-KR")}
              </span>
            )}
          </div>
          <div className={s.btnRow}>
            {editing ? (
              <>
                <button className={s.btn} onClick={() => { setEditing(false); fetchAll(); }}>
                  취소
                </button>
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={saveAll}>
                  {status === "saving" ? "저장 중..." : "저장"}
                </button>
              </>
            ) : (
              <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => setEditing(true)}>
                수정
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        {status === "saved" && (
          <div className={`${s.statusBar} ${s.statusSuccess}`}>저장되었습니다.</div>
        )}
        {status === "error" && (
          <div className={`${s.statusBar} ${s.statusError}`}>저장 중 오류가 발생했습니다.</div>
        )}

        {/* 기본정보 */}
        <div className={s.section}>
          <div className={s.sectionHeader}>
            <span className={s.sectionTitle}>
              <span className={s.sectionIcon}>🏢</span> 기본정보
            </span>
          </div>
          <div className={s.formGrid}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>회사명</label>
              <input className={s.formInput} value={info.company_name} disabled={!editing}
                onChange={(e) => updateInfo("company_name", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>사업자등록번호</label>
              <input className={s.formInput} value={info.registration_number} disabled={!editing}
                onChange={(e) => updateInfo("registration_number", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>개업연월일</label>
              <input className={s.formInput} type="date" value={info.opening_date ?? ""} disabled={!editing}
                onChange={(e) => updateInfo("opening_date", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>대표자 생년월일</label>
              <input className={s.formInput} type="date" value={info.birth_date ?? ""} disabled={!editing}
                onChange={(e) => updateInfo("birth_date", e.target.value)} />
            </div>
            <div className={`${s.formGroup} ${s.formGroupHalf}`}>
              <label className={s.formLabel}>주소</label>
              <input className={s.formInput} value={info.address} disabled={!editing}
                onChange={(e) => updateInfo("address", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>우편번호</label>
              <input className={s.formInput} value={info.zipcode} disabled={!editing}
                onChange={(e) => updateInfo("zipcode", e.target.value)} />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>사업규모</label>
              <input className={s.formInput} value={info.business_scale} disabled={!editing}
                onChange={(e) => updateInfo("business_scale", e.target.value)} />
            </div>
            <div className={`${s.formGroup} ${s.formGroupFull}`}>
              <label className={s.formLabel}>창업자 태그</label>
              <div className={s.tags}>
                {info.founder_tags.map((tag, i) => (
                  <span key={i} className={s.tag}>
                    {tag}
                    {editing && (
                      <button className={s.tagRemove} onClick={() =>
                        updateInfo("founder_tags", info.founder_tags.filter((_, j) => j !== i))
                      }>×</button>
                    )}
                  </span>
                ))}
                {editing && (
                  <button className={`${s.btn} ${s.btnSmall}`} onClick={() => {
                    const tag = prompt("태그를 입력하세요:");
                    if (tag) updateInfo("founder_tags", [...info.founder_tags, tag]);
                  }}>+ 태그</button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 업태/종목 + 자격증빙 2컬럼 */}
        <div className={s.grid2}>
          <div className={s.section}>
            <div className={s.sectionHeader}>
              <span className={s.sectionTitle}>
                <span className={s.sectionIcon}>📑</span> 업태 / 종목
              </span>
              {editing && (
                <button className={`${s.btn} ${s.btnSmall}`} onClick={addType}>+ 추가</button>
              )}
            </div>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>업태</th>
                  <th>종목</th>
                  {editing && <th style={{ width: 32 }}></th>}
                </tr>
              </thead>
              <tbody>
                {types.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <input className={s.tableInput} value={t.category} disabled={!editing}
                        onChange={(e) => updateType(t.id, "category", e.target.value)} />
                    </td>
                    <td>
                      <input className={s.tableInput} value={t.item} disabled={!editing}
                        onChange={(e) => updateType(t.id, "item", e.target.value)} />
                    </td>
                    {editing && (
                      <td>
                        <button className={s.btnIcon} onClick={() => removeType(t.id)}>🗑</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={s.section}>
            <div className={s.sectionHeader}>
              <span className={s.sectionTitle}>
                <span className={s.sectionIcon}>📄</span> 자격 및 증빙서류
              </span>
              {editing && (
                <button className={`${s.btn} ${s.btnSmall}`} onClick={addCert}>+ 추가</button>
              )}
            </div>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>발급기관</th>
                  <th>서류명</th>
                  <th>상세</th>
                  {editing && <th style={{ width: 32 }}></th>}
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <input className={s.tableInput} value={c.issuer} disabled={!editing}
                        onChange={(e) => updateCert(c.id, "issuer", e.target.value)} />
                    </td>
                    <td>
                      <input className={s.tableInput} value={c.certificate_name} disabled={!editing}
                        onChange={(e) => updateCert(c.id, "certificate_name", e.target.value)} />
                    </td>
                    <td>
                      <input className={s.tableInput} value={c.details} disabled={!editing}
                        onChange={(e) => updateCert(c.id, "details", e.target.value)} />
                    </td>
                    {editing && (
                      <td>
                        <button className={s.btnIcon} onClick={() => removeCert(c.id)}>🗑</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 직접생산 + 나라장터 2컬럼 */}
        <div className={s.grid2}>
          <div className={s.section}>
            <div className={s.sectionHeader}>
              <span className={s.sectionTitle}>
                <span className={s.sectionIcon}>🏭</span> 직접생산업체 등록
              </span>
              {editing && (
                <button className={`${s.btn} ${s.btnSmall}`} onClick={addProd}>+ 추가</button>
              )}
            </div>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>증명서명</th>
                  <th>대분류</th>
                  <th>소분류</th>
                  <th>세부품명</th>
                  {editing && <th style={{ width: 32 }}></th>}
                </tr>
              </thead>
              <tbody>
                {prods.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <input className={s.tableInput} value={d.certificate_name} disabled={!editing}
                        onChange={(e) => updateProd(d.id, "certificate_name", e.target.value)} />
                    </td>
                    <td>
                      <input className={s.tableInput} value={d.major_category} disabled={!editing}
                        onChange={(e) => updateProd(d.id, "major_category", e.target.value)} />
                    </td>
                    <td>
                      <input className={s.tableInput} value={d.minor_category} disabled={!editing}
                        onChange={(e) => updateProd(d.id, "minor_category", e.target.value)} />
                    </td>
                    <td>
                      <input className={s.tableInput} value={d.detail_item} disabled={!editing}
                        onChange={(e) => updateProd(d.id, "detail_item", e.target.value)} />
                    </td>
                    {editing && (
                      <td>
                        <button className={s.btnIcon} onClick={() => removeProd(d.id)}>🗑</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={s.section}>
            <div className={s.sectionHeader}>
              <span className={s.sectionTitle}>
                <span className={s.sectionIcon}>🏛️</span> 나라장터 등록코드
              </span>
              {editing && (
                <button className={`${s.btn} ${s.btnSmall}`} onClick={addNara}>+ 추가</button>
              )}
            </div>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>업종명</th>
                  <th>업종코드</th>
                  {editing && <th style={{ width: 32 }}></th>}
                </tr>
              </thead>
              <tbody>
                {naras.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <input className={s.tableInput} value={n.name} disabled={!editing}
                        onChange={(e) => updateNara(n.id, "name", e.target.value)} />
                    </td>
                    <td>
                      <input className={s.tableInput} value={n.code} disabled={!editing}
                        onChange={(e) => updateNara(n.id, "code", e.target.value)} />
                    </td>
                    {editing && (
                      <td>
                        <button className={s.btnIcon} onClick={() => removeNara(n.id)}>🗑</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
