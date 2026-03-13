import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Contracts.module.css";
import f from "@/styles/Sales.module.css";
import {
  dummyInquiryForms,
  type InquiryForm, type FormField, type FormFieldType,
} from "@/data/dummy-sales";

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const FIELD_TYPES: { type: FormFieldType; label: string; icon: string }[] = [
  { type: "text", label: "텍스트", icon: "Aa" },
  { type: "textarea", label: "텍스트영역", icon: "¶" },
  { type: "select", label: "선택", icon: "▾" },
  { type: "checkbox", label: "체크박스", icon: "☑" },
  { type: "file", label: "파일첨부", icon: "📎" },
];

/* ══════════════════════════════════
   폼 미리보기 모달
   ══════════════════════════════════ */
function FormPreview({ form, onClose }: { form: InquiryForm; onClose: () => void }) {
  return (
    <div className={f.previewOverlay} onClick={onClose}>
      <div className={f.previewModal} onClick={(e) => e.stopPropagation()}>
        <div className={f.previewTitle}>{form.name}</div>
        <div className={f.previewDesc}>{form.description || "설명 없음"}</div>
        {form.fields.map((field) => (
          <div key={field.id} className={f.previewField}>
            <div className={f.previewFieldLabel}>
              {field.label}
              {field.required && <span className={f.previewFieldRequired}>*</span>}
            </div>
            {field.type === "text" && <input className={f.previewInput} placeholder={field.placeholder} disabled />}
            {field.type === "textarea" && <textarea className={f.previewTextarea} placeholder={field.placeholder} disabled />}
            {field.type === "select" && (
              <select className={f.previewSelect} disabled>
                <option>{field.placeholder || "선택하세요"}</option>
                {field.options.map((o) => <option key={o.value}>{o.label}</option>)}
              </select>
            )}
            {field.type === "checkbox" && (
              <div className={f.previewCheckGroup}>
                {field.options.map((o) => (
                  <label key={o.value} className={f.previewCheckItem}>
                    <input type="checkbox" disabled /> {o.label}
                  </label>
                ))}
                {field.options.length === 0 && <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>옵션이 없습니다</span>}
              </div>
            )}
            {field.type === "file" && <input className={f.previewInput} type="file" disabled />}
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button className={`${s.btn} ${s.btnSmall}`} onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   폼 빌더 에디터
   ══════════════════════════════════ */
function FormEditor({ form, onChange, onSave, onCancel }: {
  form: InquiryForm;
  onChange: (f: InquiryForm) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const addField = (type: FormFieldType) => {
    const defaults: Record<FormFieldType, string> = {
      text: "새 텍스트 필드",
      textarea: "새 텍스트영역",
      select: "새 선택 필드",
      checkbox: "새 체크박스",
      file: "파일첨부",
    };
    const newField: FormField = {
      id: `field-${genId()}`, type, label: defaults[type],
      placeholder: "", required: false, options: [],
    };
    onChange({ ...form, fields: [...form.fields, newField] });
  };

  const updateField = (id: string, patch: Partial<FormField>) => {
    onChange({ ...form, fields: form.fields.map((fld) => fld.id === id ? { ...fld, ...patch } : fld) });
  };

  const removeField = (id: string) => {
    onChange({ ...form, fields: form.fields.filter((fld) => fld.id !== id) });
  };

  const addOption = (fieldId: string) => {
    const label = prompt("옵션명을 입력하세요:");
    if (!label) return;
    const field = form.fields.find((fld) => fld.id === fieldId);
    if (!field) return;
    updateField(fieldId, { options: [...field.options, { label, value: label }] });
  };

  const removeOption = (fieldId: string, optIdx: number) => {
    const field = form.fields.find((fld) => fld.id === fieldId);
    if (!field) return;
    updateField(fieldId, { options: field.options.filter((_, i) => i !== optIdx) });
  };

  const handlePaletteDragStart = (e: React.DragEvent, type: FormFieldType) => {
    e.dataTransfer.setData("fieldType", type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleFieldDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData("fieldIdx", String(idx));
    e.dataTransfer.effectAllowed = "move";
    setDragIdx(idx);
  };

  const handleFieldDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleFieldDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromType = e.dataTransfer.getData("fieldType");
    const fromIdx = e.dataTransfer.getData("fieldIdx");

    if (fromType) {
      const defaults: Record<string, string> = {
        text: "새 텍스트 필드", textarea: "새 텍스트영역",
        select: "새 선택 필드", checkbox: "새 체크박스", file: "파일첨부",
      };
      const newField: FormField = {
        id: `field-${genId()}`, type: fromType as FormFieldType,
        label: defaults[fromType] ?? "새 필드", placeholder: "", required: false, options: [],
      };
      const fields = [...form.fields];
      fields.splice(targetIdx, 0, newField);
      onChange({ ...form, fields });
    } else if (fromIdx !== "") {
      const from = parseInt(fromIdx, 10);
      if (from === targetIdx) return;
      const fields = [...form.fields];
      const [moved] = fields.splice(from, 1);
      fields.splice(targetIdx, 0, moved);
      onChange({ ...form, fields });
    }

    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    const fromType = e.dataTransfer.getData("fieldType");
    if (fromType) {
      e.preventDefault();
      addField(fromType as FormFieldType);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDropZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setOverIdx(form.fields.length);
  };

  const typeLabel = (type: FormFieldType) => FIELD_TYPES.find((t) => t.type === type)?.label ?? type;

  return (
    <div className={f.builderEditorPanel}>
      <div className={f.editorHeader}>
        <input className={`${f.editorInput} ${f.editorInputTitle}`} value={form.name} placeholder="폼 이름"
          onChange={(e) => onChange({ ...form, name: e.target.value })} />
        <input className={f.editorInput} value={form.description} placeholder="폼 설명"
          onChange={(e) => onChange({ ...form, description: e.target.value })} />
      </div>

      <div>
        <div className={f.paletteLabel}>필드를 드래그하여 추가하세요</div>
        <div className={f.palette}>
          {FIELD_TYPES.map((ft) => (
            <div key={ft.type} className={f.paletteItem} draggable
              onDragStart={(e) => handlePaletteDragStart(e, ft.type)}>
              <span>{ft.icon}</span> {ft.label}
            </div>
          ))}
        </div>
      </div>

      <div
        className={`${f.dropZone} ${overIdx !== null ? f.dropZoneActive : ""}`}
        onDragOver={handleDropZoneDragOver}
        onDrop={handleDropZoneDrop}
        onDragLeave={() => setOverIdx(null)}
      >
        {form.fields.length === 0 && (
          <div className={f.dropZoneEmpty}>위의 필드를 이곳에 드래그하세요</div>
        )}
        {form.fields.map((field, idx) => (
          <div
            key={field.id}
            className={`${f.fieldCard} ${dragIdx === idx ? f.fieldCardDragging : ""} ${overIdx === idx ? f.fieldCardOver : ""}`}
            draggable
            onDragStart={(e) => handleFieldDragStart(e, idx)}
            onDragOver={(e) => handleFieldDragOver(e, idx)}
            onDrop={(e) => handleFieldDrop(e, idx)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
          >
            <div className={f.dragHandle}>⠿</div>
            <div className={f.fieldCardBody}>
              <div className={f.fieldCardTop}>
                <span className={f.fieldTypeChip}>{typeLabel(field.type)}</span>
                <input className={f.fieldLabelInput} value={field.label}
                  onChange={(e) => updateField(field.id, { label: e.target.value })} />
              </div>
              {(field.type === "text" || field.type === "textarea") && (
                <input className={f.fieldPlaceholderInput} value={field.placeholder} placeholder="placeholder"
                  onChange={(e) => updateField(field.id, { placeholder: e.target.value })} />
              )}
              {(field.type === "select" || field.type === "checkbox") && (
                <div className={f.optionsEditor}>
                  {field.options.map((opt, oi) => (
                    <span key={oi} className={f.optionChip}>
                      {opt.label}
                      <button className={f.optionChipRemove} onClick={() => removeOption(field.id, oi)}>×</button>
                    </span>
                  ))}
                  <button className={f.addOptionBtn} onClick={() => addOption(field.id)}>+ 옵션</button>
                </div>
              )}
            </div>
            <div className={f.fieldCardActions}>
              <button
                className={`${f.requiredToggle} ${field.required ? f.requiredToggleOn : ""}`}
                onClick={() => updateField(field.id, { required: !field.required })}
              >필수</button>
              <button className={s.btnIcon} style={{ fontSize: 12 }} onClick={() => removeField(field.id)}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      <div className={f.editorRow} style={{ justifyContent: "flex-end" }}>
        <button className={`${s.btn} ${s.btnSmall}`} onClick={onCancel}>취소</button>
        <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={onSave}>저장</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   메인 페이지 — 폼 빌더
   ══════════════════════════════════ */
export default function InquiryPage() {
  const [forms, setForms] = useState<InquiryForm[]>(() => dummyInquiryForms.map((fm) => ({ ...fm, fields: fm.fields.map((fld) => ({ ...fld, options: [...fld.options] })) })));
  const [editingForm, setEditingForm] = useState<InquiryForm | null>(null);
  const [previewForm, setPreviewForm] = useState<InquiryForm | null>(null);
  const [shareForm, setShareForm] = useState<InquiryForm | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFormEdit = (form: InquiryForm) => {
    setEditingForm(JSON.parse(JSON.stringify(form)));
  };

  const handleFormCreate = () => {
    const newForm: InquiryForm = {
      id: `form-${genId()}`, name: "", description: "", fields: [],
      status: "활성", created_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString().slice(0, 10),
    };
    setEditingForm(newForm);
  };

  const handleFormSave = () => {
    if (!editingForm) return;
    const updated = { ...editingForm, updated_at: new Date().toISOString().slice(0, 10) };
    const exists = forms.find((fm) => fm.id === updated.id);
    if (exists) {
      setForms(forms.map((fm) => fm.id === updated.id ? updated : fm));
    } else {
      setForms([...forms, updated]);
    }
    setEditingForm(null);
  };

  const handleFormDuplicate = (form: InquiryForm) => {
    const dup: InquiryForm = JSON.parse(JSON.stringify(form));
    dup.id = `form-${genId()}`;
    dup.name = `${form.name} (복사)`;
    dup.updated_at = new Date().toISOString().slice(0, 10);
    setForms([...forms, dup]);
  };

  const handleFormDelete = (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;
    setForms(forms.filter((fm) => fm.id !== id));
    if (editingForm?.id === id) setEditingForm(null);
  };

  const handleFormToggleStatus = (id: string) => {
    setForms(forms.map((fm) => fm.id === id ? { ...fm, status: fm.status === "활성" ? "비활성" as const : "활성" as const } : fm));
  };

  const getFormUrl = (form: InquiryForm) => {
    // TODO: 실제 배포 시 도메인으로 교체
    const base = typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com";
    return `${base}/form/${form.id}`;
  };

  const getEmbedCode = (form: InquiryForm) => {
    const url = getFormUrl(form);
    return `<iframe src="${url}" width="100%" height="600" frameborder="0" style="border:none;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,0.08);"></iframe>`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <>
      <Head><title>문의폼 - WHYDLAB BIZ</title></Head>
      <div className={s.projPage}>
        <div className={f.builderLayout}>
          <div className={f.builderListPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>문의폼 목록</div>
              <button className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`} onClick={handleFormCreate}>+ 새 폼</button>
            </div>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>폼 이름</th>
                  <th>필드</th>
                  <th>상태</th>
                  <th>수정일</th>
                  <th style={{ width: 130 }}>액션</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id}>
                    <td style={{ fontWeight: 600 }}>{form.name || "(이름없음)"}</td>
                    <td>{form.fields.length}개</td>
                    <td>
                      <span className={`${s.badge} ${form.status === "활성" ? s.badgeGreen : s.badgeGray}`}
                        style={{ cursor: "pointer" }} onClick={() => handleFormToggleStatus(form.id)}>
                        {form.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{form.updated_at}</td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className={`${s.btn} ${s.btnSmall}`} style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => handleFormEdit(form)}>편집</button>
                        <button className={`${s.btn} ${s.btnSmall}`} style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => setPreviewForm(form)}>미리보기</button>
                        <button className={`${s.btn} ${s.btnSmall}`} style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => handleFormDuplicate(form)}>복제</button>
                        <button className={`${s.btn} ${s.btnSmall}`} style={{ fontSize: 10, padding: "2px 8px" }} onClick={() => setShareForm(form)}>공유</button>
                        <button className={s.btnIcon} style={{ fontSize: 12 }} onClick={() => handleFormDelete(form.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {forms.length === 0 && <tr><td colSpan={5} className={s.empty}>생성된 폼이 없습니다</td></tr>}
              </tbody>
            </table>
          </div>

          {editingForm ? (
            <FormEditor
              form={editingForm}
              onChange={setEditingForm}
              onSave={handleFormSave}
              onCancel={() => setEditingForm(null)}
            />
          ) : (
            <div className={f.builderEditorPanel} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                좌측에서 폼을 선택하거나<br />새 폼을 만들어보세요
              </div>
            </div>
          )}
        </div>

        {previewForm && <FormPreview form={previewForm} onClose={() => setPreviewForm(null)} />}

        {/* 공유/임베드 모달 */}
        {shareForm && (
          <div className={f.previewOverlay} onClick={() => setShareForm(null)}>
            <div className={f.previewModal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <div className={f.previewTitle}>폼 공유 — {shareForm.name}</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--color-text-secondary)" }}>URL 공유</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    className={f.previewInput}
                    readOnly
                    value={getFormUrl(shareForm)}
                    style={{ flex: 1, fontSize: 12 }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`}
                    style={{ whiteSpace: "nowrap" }}
                    onClick={() => copyToClipboard(getFormUrl(shareForm), "url")}
                  >
                    {copied === "url" ? "복사됨!" : "복사"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--color-text-secondary)" }}>임베드 코드</div>
                <textarea
                  className={f.previewTextarea}
                  readOnly
                  value={getEmbedCode(shareForm)}
                  style={{ fontSize: 11, fontFamily: "monospace", resize: "none", height: 80 }}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                  <button
                    className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`}
                    onClick={() => copyToClipboard(getEmbedCode(shareForm), "embed")}
                  >
                    {copied === "embed" ? "복사됨!" : "코드 복사"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setShareForm(null)}>닫기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
