import Head from "next/head";
import { useState, useMemo, useRef } from "react";
import s from "@/styles/Contracts.module.css";
import { dummyProjectPayments, type ProjectPayment } from "@/data/dummy-finance";

const fmt = (n: number) => n.toLocaleString() + "원";
const fmtMan = (n: number) => (n / 10000).toLocaleString() + "만원";

type PayStatus = "입금완료" | "미입금" | "지연";

const payStatusBadge = (status: string) => {
  switch (status) {
    case "입금완료": return s.badgeGreen;
    case "미입금": return s.badgeGray;
    case "지연": return s.badgeRed;
    default: return s.badgeGray;
  }
};

/* 플랫 행 데이터 */
interface PaymentRow {
  id: string;
  project_name: string;
  client: string;
  total_amount: number;
  label: string;
  amount: number;
  due_date: string;
  paid_date: string;
  status: PayStatus;
  memo: string;
}

function flattenPayments(list: ProjectPayment[]): PaymentRow[] {
  return list.flatMap((p) =>
    p.payments.map((pm, i) => ({
      id: `${p.id}-${i}`,
      project_name: p.project_name,
      client: p.client,
      total_amount: p.total_amount,
      label: pm.label,
      amount: pm.amount,
      due_date: pm.due_date,
      paid_date: pm.paid_date ?? "",
      status: pm.status,
      memo: "",
    }))
  );
}

type StatusFilter = "all" | PayStatus;

/* ── CSV Export (Excel) ── */
function downloadCSV(rows: PaymentRow[]) {
  const BOM = "\uFEFF";
  const header = ["프로젝트명", "고객사", "총계약금액", "구분", "금액", "예정일", "입금일", "상태", "메모"];
  const body = rows.map((r) => [
    r.project_name, r.client, r.total_amount, r.label,
    r.amount, r.due_date, r.paid_date, r.status, r.memo,
  ]);
  const csv = BOM + [header, ...body].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `프로젝트수금관리_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── CSV Parse ── */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols;
  });
}

function csvToRows(parsed: string[][]): PaymentRow[] {
  // 첫 행 = 헤더, 나머지 = 데이터
  if (parsed.length < 2) return [];
  const header = parsed[0].map((h) => h.replace(/^\uFEFF/, "").trim());

  // 헤더 매핑 (유연하게)
  const colMap: Record<string, number> = {};
  const aliases: Record<string, string[]> = {
    project_name: ["프로젝트명", "프로젝트", "project_name", "project"],
    client: ["고객사", "거래처", "client"],
    total_amount: ["총계약금액", "계약금액", "total_amount"],
    label: ["구분", "회차", "label", "phase"],
    amount: ["금액", "수금액", "amount"],
    due_date: ["예정일", "수금예정일", "due_date"],
    paid_date: ["입금일", "수금일", "paid_date"],
    status: ["상태", "status"],
    memo: ["메모", "비고", "memo", "note"],
  };

  for (const [key, names] of Object.entries(aliases)) {
    const idx = header.findIndex((h) => names.some((n) => h.toLowerCase().includes(n.toLowerCase())));
    if (idx >= 0) colMap[key] = idx;
  }

  const get = (row: string[], key: string) => {
    const idx = colMap[key];
    return idx !== undefined && idx < row.length ? row[idx] : "";
  };

  const parseStatus = (val: string): PayStatus => {
    if (val.includes("완료") || val.includes("입금")) return "입금완료";
    if (val.includes("지연")) return "지연";
    return "미입금";
  };

  return parsed.slice(1).map((row, i) => ({
    id: `csv-${Date.now()}-${i}`,
    project_name: get(row, "project_name"),
    client: get(row, "client"),
    total_amount: Number(get(row, "total_amount").replace(/[^0-9.-]/g, "")) || 0,
    label: get(row, "label") || `회차${i + 1}`,
    amount: Number(get(row, "amount").replace(/[^0-9.-]/g, "")) || 0,
    due_date: get(row, "due_date"),
    paid_date: get(row, "paid_date"),
    status: parseStatus(get(row, "status")),
    memo: get(row, "memo"),
  })).filter((r) => r.project_name || r.amount > 0);
}

/* ══════════════════════════════════ */
export default function PaymentsPage() {
  const [rows, setRows] = useState<PaymentRow[]>(() => flattenPayments(dummyProjectPayments));
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let result = [...rows].sort((a, b) => {
      // 빈 행(신규)은 항상 맨 위
      const aNew = a.id.startsWith("new-") ? 1 : 0;
      const bNew = b.id.startsWith("new-") ? 1 : 0;
      if (aNew !== bNew) return bNew - aNew;
      // 예정일 기준 최신순 (내림차순)
      return (b.due_date || "").localeCompare(a.due_date || "");
    });
    if (filter !== "all") result = result.filter((r) => r.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) =>
        r.project_name.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rows, filter, search]);

  const totalContract = useMemo(() => {
    const seen = new Set<string>();
    let sum = 0;
    rows.forEach((r) => {
      const key = `${r.project_name}-${r.client}`;
      if (!seen.has(key)) { seen.add(key); sum += r.total_amount; }
    });
    return sum;
  }, [rows]);
  const totalPaid = rows.filter((r) => r.status === "입금완료").reduce((a, r) => a + r.amount, 0);
  const totalUnpaid = rows.filter((r) => r.status !== "입금완료").reduce((a, r) => a + r.amount, 0);
  const delayCount = rows.filter((r) => r.status === "지연").length;

  /* 행 편집 */
  const updateRow = (id: string, patch: Partial<PaymentRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    const newId = `new-${Date.now()}`;
    setRows((prev) => [{
      id: newId,
      project_name: "", client: "", total_amount: 0,
      label: "", amount: 0, due_date: "", paid_date: "", status: "미입금", memo: "",
    }, ...prev]);
    setEditId(newId);
  };

  const removeRow = (id: string) => {
    if (!confirm("해당 행을 삭제하시겠습니까?")) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  /* CSV 업로드 */
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;
      const parsed = parseCSV(text);
      const newRows = csvToRows(parsed);
      if (newRows.length === 0) {
        alert("유효한 데이터를 찾을 수 없습니다. CSV 형식을 확인해주세요.");
        return;
      }
      const mode = confirm(
        `${newRows.length}건의 데이터를 불러왔습니다.\n\n[확인] 기존 데이터에 추가\n[취소] 기존 데이터 대체`
      );
      if (mode) {
        setRows((prev) => [...prev, ...newRows]);
      } else {
        setRows(newRows);
      }
    };
    reader.readAsText(file, "UTF-8");
    // input 초기화
    e.target.value = "";
  };

  return (
    <>
      <Head><title>프로젝트 수금 - WHYDLAB BIZ</title></Head>
      <div className={s.page} style={{ maxWidth: "100%" }}>
        {/* 헤더 */}
        <div className={s.pageHeader}>
          <h1>프로젝트 수금</h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* CSV 업로드 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              style={{ display: "none" }}
              onChange={handleCSVUpload}
            />
            <button className={`${s.btn} ${s.btnSmall}`} onClick={() => fileInputRef.current?.click()}>
              CSV 업로드
            </button>
            <button className={`${s.btn} ${s.btnSmall}`} onClick={() => downloadCSV(rows)}>
              Excel 다운로드
            </button>
            <div style={{ width: 1, height: 20, background: "var(--color-border)", margin: "0 2px" }} />
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={addRow}>
              + 행 추가
            </button>
          </div>
        </div>

        {/* 요약 */}
        <div className={s.summary}>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>총 계약금액</div>
            <div className={s.summaryValue}>{fmtMan(totalContract)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>수금 완료</div>
            <div className={s.summaryValue} style={{ color: "var(--color-success)" }}>{fmtMan(totalPaid)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>미수금</div>
            <div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{fmtMan(totalUnpaid)}</div>
          </div>
          <div className={s.summaryCard}>
            <div className={s.summaryLabel}>지연</div>
            <div className={s.summaryValue} style={{ color: delayCount > 0 ? "var(--color-danger)" : undefined }}>{delayCount}건</div>
          </div>
        </div>

        {/* 필터 + 검색 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
          {(["all", "입금완료", "미입금", "지연"] as const).map((f) => {
            const cnt = f === "all" ? rows.length : rows.filter((r) => r.status === f).length;
            return (
              <button key={f} className={`${s.btn} ${s.btnSmall} ${filter === f ? s.btnPrimary : ""}`} onClick={() => setFilter(f)}>
                {f === "all" ? "전체" : f}
                <span style={{ marginLeft: 3, fontSize: 11, opacity: 0.7 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        <div className={s.toolbar}>
          <div className={s.toolbarSearch}>
            <span className={s.toolbarSearchIcon}>🔍</span>
            <input className={s.toolbarSearchInput} placeholder="프로젝트명, 고객사, 구분 검색..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
            {filtered.length}건
          </span>
        </div>

        {/* 테이블 */}
        <div className={s.section} style={{ overflowX: "auto", padding: 0 }}>
          <table className={s.table} style={{ minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 20 }}>프로젝트명</th>
                <th>고객사</th>
                <th style={{ textAlign: "right" }}>총계약금액</th>
                <th>구분</th>
                <th style={{ textAlign: "right" }}>금액</th>
                <th>예정일</th>
                <th>입금일</th>
                <th>상태</th>
                <th>메모</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const isEditing = editId === r.id;
                return (
                  <tr key={r.id} onDoubleClick={() => setEditId(r.id)} style={{ background: isEditing ? "var(--color-primary-light)" : undefined }}>
                    <td style={{ paddingLeft: 20 }}>
                      {isEditing ? (
                        <input className={s.formInput} value={r.project_name} onChange={(e) => updateRow(r.id, { project_name: e.target.value })} style={{ padding: "4px 8px", fontSize: 13, fontWeight: 600 }} />
                      ) : (
                        <span style={{ fontWeight: 600 }}>{r.project_name || <span style={{ color: "var(--color-text-tertiary)" }}>-</span>}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className={s.formInput} value={r.client} onChange={(e) => updateRow(r.id, { client: e.target.value })} style={{ padding: "4px 8px", fontSize: 13 }} />
                      ) : (
                        r.client || <span style={{ color: "var(--color-text-tertiary)" }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isEditing ? (
                        <input className={s.formInput} type="number" value={r.total_amount || ""} onChange={(e) => updateRow(r.id, { total_amount: Number(e.target.value) })} style={{ padding: "4px 8px", fontSize: 13, textAlign: "right", width: 120 }} />
                      ) : (
                        <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{r.total_amount > 0 ? fmtMan(r.total_amount) : "-"}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className={s.formInput} value={r.label} onChange={(e) => updateRow(r.id, { label: e.target.value })} style={{ padding: "4px 8px", fontSize: 13, width: 100 }} />
                      ) : (
                        r.label
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {isEditing ? (
                        <input className={s.formInput} type="number" value={r.amount || ""} onChange={(e) => updateRow(r.id, { amount: Number(e.target.value) })} style={{ padding: "4px 8px", fontSize: 13, textAlign: "right", width: 120 }} />
                      ) : (
                        <span style={{ fontWeight: 700, whiteSpace: "nowrap", color: r.status === "입금완료" ? "var(--color-success)" : undefined }}>
                          {r.amount > 0 ? fmt(r.amount) : "-"}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className={s.formInput} type="date" value={r.due_date} onChange={(e) => updateRow(r.id, { due_date: e.target.value })} style={{ padding: "4px 8px", fontSize: 12 }} />
                      ) : (
                        <span style={{ whiteSpace: "nowrap" }}>{r.due_date || "-"}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className={s.formInput} type="date" value={r.paid_date} onChange={(e) => updateRow(r.id, { paid_date: e.target.value })} style={{ padding: "4px 8px", fontSize: 12 }} />
                      ) : (
                        <span style={{ whiteSpace: "nowrap" }}>{r.paid_date || <span style={{ color: "var(--color-text-tertiary)" }}>-</span>}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select className={s.formSelect} value={r.status} onChange={(e) => updateRow(r.id, { status: e.target.value as PayStatus })} style={{ padding: "4px 8px", fontSize: 12, width: 100 }}>
                          <option value="입금완료">입금완료</option>
                          <option value="미입금">미입금</option>
                          <option value="지연">지연</option>
                        </select>
                      ) : (
                        <span className={`${s.badge} ${payStatusBadge(r.status)}`}>{r.status}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input className={s.formInput} value={r.memo} onChange={(e) => updateRow(r.id, { memo: e.target.value })} placeholder="메모" style={{ padding: "4px 8px", fontSize: 12 }} />
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.memo || ""}</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 2 }}>
                        {isEditing ? (
                          <button className={s.btnIcon} title="완료" onClick={() => setEditId(null)} style={{ fontSize: 13, color: "var(--color-primary)" }}>✓</button>
                        ) : (
                          <button className={s.btnIcon} title="편집" onClick={() => setEditId(r.id)} style={{ fontSize: 12 }}>✏️</button>
                        )}
                        <button className={s.btnIcon} title="삭제" onClick={() => removeRow(r.id)} style={{ fontSize: 12 }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className={s.empty}>데이터가 없습니다</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 안내 */}
        <div style={{ marginTop: 12, padding: "12px 16px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)", fontSize: 12, color: "var(--color-text-tertiary)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--color-text-secondary)" }}>사용 가이드</strong><br />
          행을 <strong>더블클릭</strong>하면 인라인 편집 모드로 전환됩니다.<br />
          <strong>CSV 업로드</strong> 시 헤더(프로젝트명, 고객사, 총계약금액, 구분, 금액, 예정일, 입금일, 상태, 메모)를 포함한 CSV 파일을 선택하세요.<br />
          <strong>Excel 다운로드</strong>는 현재 테이블 데이터를 CSV(UTF-8 BOM)로 내보냅니다. Excel에서 바로 열 수 있습니다.
        </div>
      </div>
    </>
  );
}
