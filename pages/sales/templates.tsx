import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import f from "@/styles/Sales.module.css";
import { dummyMailTemplates, type MailTemplate } from "@/data/dummy-sales";

const catBadge = (cat: string) => {
  switch (cat) {
    case "문의응답": return s.badgeBlue;
    case "견적발송": return s.badgeOrange;
    case "계약안내": return s.badgeGreen;
    case "프로젝트": return s.badgePurple ?? s.badgeGray;
    default: return s.badgeGray;
  }
};

export default function TemplatesPage() {
  const [list, setList] = useState<MailTemplate[]>(() => dummyMailTemplates.map((t) => ({ ...t })));
  const [editTpl, setEditTpl] = useState<MailTemplate | null>(null);
  const [search, setSearch] = useState("");

  const filtered = list.filter((t) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
  });

  const handleSave = () => {
    if (!editTpl) return;
    const exists = list.find((t) => t.id === editTpl.id);
    if (exists) {
      setList(list.map((t) => (t.id === editTpl.id ? { ...editTpl, updated_at: new Date().toISOString().slice(0, 10) } : t)));
    } else {
      setList([...list, { ...editTpl, updated_at: new Date().toISOString().slice(0, 10) }]);
    }
    setEditTpl(null);
  };

  const handleAdd = () => {
    setEditTpl({
      id: `tpl-${Date.now()}`,
      name: "",
      category: "기타",
      subject: "",
      body: "",
      updated_at: new Date().toISOString().slice(0, 10),
    });
  };

  const handleDuplicate = (t: MailTemplate) => {
    const dup: MailTemplate = { ...t, id: `tpl-${Date.now()}`, name: `${t.name} (복사)`, updated_at: new Date().toISOString().slice(0, 10) };
    setList([...list, dup]);
  };

  const handleDelete = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    setList(list.filter((t) => t.id !== id));
  };

  return (
    <>
      <Head><title>메일템플릿 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>메일템플릿 <span className={s.count}>{list.length}건</span></h1>
          <div style={{ display: "flex", gap: 8 }}>
            <input className={s.formInput} style={{ width: 200, padding: "6px 10px", fontSize: 12 }} placeholder="이름, 제목, 분류 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={handleAdd}>+ 추가</button>
          </div>
        </div>

        <div className={s.section}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>템플릿명</th>
                <th>분류</th>
                <th>제목</th>
                <th>수정일</th>
                <th style={{ width: 100 }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td><span className={`${s.badge} ${catBadge(t.category)}`}>{t.category}</span></td>
                  <td style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t.subject}</td>
                  <td style={{ fontSize: 12 }}>{t.updated_at}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setEditTpl({ ...t })}>편집</button>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => handleDuplicate(t)}>복제</button>
                      <button className={s.btnIcon} onClick={() => handleDelete(t.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className={s.empty}>등록된 템플릿이 없습니다</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 편집 모달 */}
      {editTpl && (
        <div className={f.previewOverlay} onClick={() => setEditTpl(null)}>
          <div className={f.templateModal} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{list.find((t) => t.id === editTpl.id) ? "템플릿 편집" : "새 템플릿"}</h2>
            <div className={f.templateField}>
              <div className={f.templateFieldLabel}>템플릿명</div>
              <input className={f.editorInput} value={editTpl.name} onChange={(e) => setEditTpl({ ...editTpl, name: e.target.value })} />
            </div>
            <div className={f.templateField}>
              <div className={f.templateFieldLabel}>분류</div>
              <select className={f.editorInput} value={editTpl.category} onChange={(e) => setEditTpl({ ...editTpl, category: e.target.value as MailTemplate["category"] })}>
                <option value="문의응답">문의응답</option>
                <option value="견적발송">견적발송</option>
                <option value="계약안내">계약안내</option>
                <option value="프로젝트">프로젝트</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div className={f.templateField}>
              <div className={f.templateFieldLabel}>제목</div>
              <input className={f.editorInput} value={editTpl.subject} onChange={(e) => setEditTpl({ ...editTpl, subject: e.target.value })} placeholder="제목 ({{name}}, {{project}} 등 변수 사용 가능)" />
            </div>
            <div className={f.templateField}>
              <div className={f.templateFieldLabel}>본문</div>
              <textarea className={f.templateTextarea} value={editTpl.body} onChange={(e) => setEditTpl({ ...editTpl, body: e.target.value })} placeholder="본문 내용 ({{name}}, {{project}}, {{date}} 등 변수 사용 가능)" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setEditTpl(null)}>취소</button>
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={handleSave}>저장</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
