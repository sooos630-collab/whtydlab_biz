import { useState, useRef, useCallback } from "react";
import s from "@/styles/Documents.module.css";
import {
  docCategories,
  dummyDocuments,
  type DocFile,
} from "@/data/dummy-documents";
import { classifyByFilename } from "@/lib/doc-classifier";

let nextDocId = 100;

function sortByUploadDesc(docs: DocFile[]): DocFile[] {
  return [...docs].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
}

export default function DocumentManager() {
  const [docs, setDocs] = useState<DocFile[]>(() =>
    dummyDocuments.map((d) => ({ ...d }))
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const filtered = sortByUploadDesc(
    activeCategory === "all"
      ? docs
      : docs.filter((d) => d.category === activeCategory)
  );

  const removeDoc = (id: string) => {
    setDocs(docs.filter((d) => d.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
  };

  const getCategoryLabel = (key: string) =>
    docCategories.find((c) => c.key === key)?.label ?? key;

  return (
    <div className={s.docSection}>
      <div className={s.docHeader}>
        <span className={s.docTitle}>
          📁 서류 보관함
          <span className={s.docCount}>{docs.length}건</span>
        </span>
        <button
          className={`${s.btn} ${s.btnPrimary} ${s.btnSmall}`}
          onClick={() => setShowUpload(true)}
        >
          + 업로드
        </button>
      </div>

      {/* Category tabs */}
      <div className={s.catTabs}>
        {docCategories.map((cat) => (
          <button
            key={cat.key}
            className={`${s.catTab} ${
              activeCategory === cat.key ? s.catTabActive : ""
            }`}
            onClick={() => setActiveCategory(cat.key)}
          >
            {cat.label}
            {cat.key !== "all" && (
              <> ({docs.filter((d) => d.category === cat.key).length})</>
            )}
          </button>
        ))}
      </div>

      {/* Body: list + preview */}
      <div className={s.docBody}>
        {/* File list */}
        <div className={s.fileList}>
          <table className={s.fileTable}>
            <thead>
              <tr>
                <th>서류명</th>
                <th>카테고리</th>
                <th>업로드일</th>
                <th style={{ width: 28 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                  <tr
                    key={doc.id}
                    className={`${s.fileRow} ${
                      selectedDoc?.id === doc.id ? s.fileRowActive : ""
                    }`}
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <td>
                      <span className={s.fileName}>
                        <span
                          className={`${s.fileType} ${
                            doc.file_type === "pdf"
                              ? s.fileTypePdf
                              : s.fileTypeImg
                          }`}
                        >
                          {doc.file_type}
                        </span>
                        {doc.name}
                      </span>
                    </td>
                    <td>{getCategoryLabel(doc.category)}</td>
                    <td>{doc.uploaded_at}</td>
                    <td>
                      <button
                        className={s.btnDanger}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`"${doc.name}" 서류를 삭제하시겠습니까?`)) {
                            removeDoc(doc.id);
                          }
                        }}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 20, color: "#aaa" }}>
                    등록된 서류가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Preview */}
        <div className={s.preview}>
          {selectedDoc ? (
            <div className={s.previewContent}>
              <div className={s.previewHeader}>
                <span className={s.previewFileName}>{selectedDoc.name}</span>
                <div className={s.previewActions}>
                  <button className={s.btnIcon} title="다운로드">⬇</button>
                  <button className={s.btnIcon} title="닫기" onClick={() => setSelectedDoc(null)}>✕</button>
                </div>
              </div>
              <div className={s.previewBody}>
                <div className={s.previewPlaceholder}>
                  <div className={s.previewPlaceholderIcon}>
                    {selectedDoc.file_type === "pdf" ? "📄" : "🖼️"}
                  </div>
                  <div className={s.previewPlaceholderText}>
                    {selectedDoc.name}.{selectedDoc.file_type}
                    <br />
                    <span style={{ opacity: 0.5 }}>
                      파일 업로드 후 미리보기가 표시됩니다
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={s.previewEmpty}>
              <div className={s.previewEmptyIcon}>📋</div>
              서류를 선택하면 미리보기가 표시됩니다
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={(doc) => {
            setDocs([doc, ...docs]);
            setShowUpload(false);
          }}
        />
      )}
    </div>
  );
}

function UploadModal({
  onClose,
  onUpload,
}: {
  onClose: () => void;
  onUpload: (doc: DocFile) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("registration");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFileSelect = (f: File) => {
    setFile(f);
    const result = classifyByFilename(f.name);
    if (result) {
      setName(result.name);
      setCategory(result.category);
      setAutoDetected(true);
    } else {
      setAutoDetected(false);
      const nameWithoutExt = f.name.replace(/\.[^.]+$/, "").replace(/[_\-]/g, " ");
      if (!name) setName(nameWithoutExt);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileSelect(f);
  }, []);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const ext = file?.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const fileType = ext === "jpg" || ext === "jpeg" ? "jpg" : ext === "png" ? "png" : "pdf";
    onUpload({
      id: `doc-${nextDocId++}`,
      name: name.trim(),
      category,
      file_type: fileType as DocFile["file_type"],
      file_url: "",
      uploaded_at: new Date().toISOString().split("T")[0],
      expiry_date: null,
    });
  };

  return (
    <div className={s.uploadOverlay} onClick={onClose}>
      <div className={s.uploadModal} onClick={(e) => e.stopPropagation()}>
        <div className={s.uploadModalTitle}>서류 업로드</div>
        <div className={s.uploadForm}>
          <div className={s.uploadFormGroup}>
            <label className={s.uploadLabel}>파일</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFileSelect(f);
              }}
            />
            <div
              className={`${s.dropZone} ${dragging ? s.dropZoneActive : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className={s.dropZoneFile}>📎 {file.name}</div>
              ) : (
                <>
                  클릭 또는 드래그하여 파일 선택
                  <br />
                  <span style={{ fontSize: 11, opacity: 0.6 }}>PDF, JPG, PNG</span>
                </>
              )}
            </div>
          </div>

          {autoDetected && (
            <div className={s.autoDetect}>자동 분류됨 — 수정 가능합니다</div>
          )}

          <div className={s.uploadFormGroup}>
            <label className={s.uploadLabel}>서류명</label>
            <input
              className={s.uploadInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="서류 이름을 입력하세요"
            />
          </div>
          <div className={s.uploadFormGroup}>
            <label className={s.uploadLabel}>카테고리</label>
            <select
              className={s.uploadSelect}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {docCategories
                .filter((c) => c.key !== "all")
                .map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
            </select>
          </div>
          <div className={s.uploadBtns}>
            <button className={s.btn} onClick={onClose}>취소</button>
            <button
              className={`${s.btn} ${s.btnPrimary}`}
              onClick={handleSubmit}
              disabled={!name.trim()}
            >
              업로드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
