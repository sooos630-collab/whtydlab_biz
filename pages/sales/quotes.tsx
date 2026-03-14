import Head from "next/head";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import s from "@/styles/Contracts.module.css";
import { useQuotes } from "@/contexts/QuoteContext";
import {
  type Quote,
  type QuoteItem,
  type CostItem,
  type CompanyInfo,
  type VatOption,
  type QuoteType,
} from "@/data/dummy-sales";

const fmt = (n: number) => n.toLocaleString() + "원";
const fmtMan = (n: number) => (n / 10000).toLocaleString() + "만원";

const statusBadge = (st: string) => {
  switch (st) {
    case "작성중": return s.badgeGray;
    case "발송완료": return s.badgeBlue;
    case "수주": return s.badgeGreen;
    case "실패": return s.badgeRed;
    case "만료": return s.badgeOrange;
    default: return s.badgeGray;
  }
};

type StatusFilter = "all" | Quote["status"];
type ViewTab = "list" | "board" | "history" | "trash";

/* ── 수정 히스토리 ── */
interface HistoryEntry {
  id: string;
  quote_id: string;
  quote_number: string;
  quote_name: string;
  action: "생성" | "수정" | "발송" | "상태변경" | "삭제" | "복원";
  detail: string;
  user: string;
  timestamp: string;
}

const dummyHistory: HistoryEntry[] = [
  { id: "h1", quote_id: "qt-01", quote_number: "QT-2025-001", quote_name: "그린에너지 ESG 견적", action: "생성", detail: "견적서 신규 생성", user: "김대표", timestamp: "2025-03-11 09:30" },
  { id: "h2", quote_id: "qt-01", quote_number: "QT-2025-001", quote_name: "그린에너지 ESG 견적", action: "수정", detail: "QA/배포 항목 금액 수정 (500만→700만)", user: "김대표", timestamp: "2025-03-11 14:20" },
  { id: "h3", quote_id: "qt-02", quote_number: "QT-2025-002", quote_name: "에듀플러스 LMS 견적", action: "생성", detail: "견적서 신규 생성", user: "이팀장", timestamp: "2025-03-05 10:00" },
  { id: "h4", quote_id: "qt-02", quote_number: "QT-2025-002", quote_name: "에듀플러스 LMS 견적", action: "발송", detail: "오수빈(에듀플러스)에게 메일 발송", user: "이팀장", timestamp: "2025-03-06 11:30" },
  { id: "h5", quote_id: "qt-04", quote_number: "QT-2025-004", quote_name: "스타트업허브 리뉴얼 견적", action: "생성", detail: "견적서 신규 생성", user: "이팀장", timestamp: "2025-03-01 11:00" },
  { id: "h6", quote_id: "qt-04", quote_number: "QT-2025-004", quote_name: "스타트업허브 리뉴얼 견적", action: "수정", detail: "할인금액 200만원 추가", user: "이팀장", timestamp: "2025-03-02 14:00" },
  { id: "h7", quote_id: "qt-04", quote_number: "QT-2025-004", quote_name: "스타트업허브 리뉴얼 견적", action: "상태변경", detail: "발송완료 → 수주", user: "김대표", timestamp: "2025-03-02 16:00" },
  { id: "h8", quote_id: "qt-05", quote_number: "QT-2024-010", quote_name: "블루오션 브랜딩 견적", action: "생성", detail: "견적서 신규 생성", user: "김대표", timestamp: "2025-01-15 14:00" },
  { id: "h9", quote_id: "qt-05", quote_number: "QT-2024-010", quote_name: "블루오션 브랜딩 견적", action: "상태변경", detail: "발송완료 → 실패", user: "김대표", timestamp: "2025-03-01 09:00" },
  { id: "h10", quote_id: "qt-03", quote_number: "QT-2025-003", quote_name: "넥스트핀테크 앱 견적", action: "생성", detail: "견적서 신규 생성", user: "김대표", timestamp: "2025-03-09 15:00" },
  { id: "h11", quote_id: "qt-03", quote_number: "QT-2025-003", quote_name: "넥스트핀테크 앱 견적", action: "수정", detail: "UI 디자인 수량 1→2 변경", user: "김대표", timestamp: "2025-03-10 09:45" },
  { id: "h12", quote_id: "qt-06", quote_number: "QT-2025-005", quote_name: "디포커스 대시보드 견적", action: "생성", detail: "견적서 신규 생성", user: "이팀장", timestamp: "2025-02-20 09:00" },
  { id: "h13", quote_id: "qt-06", quote_number: "QT-2025-005", quote_name: "디포커스 대시보드 견적", action: "발송", detail: "최서윤(디포커스)에게 메일 발송", user: "이팀장", timestamp: "2025-02-21 10:30" },
];

/* ── 견적 가이드 ── */
interface GuideItem {
  id: string;
  category: string;
  name: string;
  unit: string;
  unit_price: number;
  description: string;
}

interface QuoteGuide {
  items: GuideItem[];
  notes: string;
}

const defaultGuide: QuoteGuide = {
  items: [
    { id: "g1", category: "기획", name: "서비스 기획", unit: "건", unit_price: 3000000, description: "서비스 기획, 화면설계, 플로우차트 작성" },
    { id: "g2", category: "기획", name: "UX 리서치", unit: "건", unit_price: 2000000, description: "사용자 조사, 인터뷰, 벤치마킹 분석" },
    { id: "g3", category: "디자인", name: "UI/UX 디자인", unit: "페이지", unit_price: 500000, description: "화면 디자인 (Figma 납품)" },
    { id: "g4", category: "디자인", name: "BI/CI 디자인", unit: "건", unit_price: 5000000, description: "브랜드 아이덴티티 디자인 일체" },
    { id: "g5", category: "디자인", name: "인쇄물 디자인", unit: "종", unit_price: 300000, description: "브로슈어, 명함, 리플렛 등" },
    { id: "g6", category: "개발", name: "프론트엔드 개발", unit: "페이지", unit_price: 800000, description: "반응형 웹 프론트엔드 구현" },
    { id: "g7", category: "개발", name: "백엔드 개발", unit: "건", unit_price: 5000000, description: "서버 API, 데이터베이스 설계/구축" },
    { id: "g8", category: "개발", name: "관리자 페이지", unit: "건", unit_price: 3000000, description: "어드민 대시보드 개발" },
    { id: "g9", category: "개발", name: "모바일 앱 개발", unit: "건", unit_price: 10000000, description: "iOS/Android 앱 개발" },
    { id: "g10", category: "기타", name: "QA/테스트", unit: "건", unit_price: 1500000, description: "품질 검수, 테스트 리포트" },
    { id: "g11", category: "기타", name: "서버 구축/배포", unit: "건", unit_price: 1000000, description: "서버 세팅, CI/CD 구성, 배포" },
    { id: "g12", category: "기타", name: "유지보수 (월)", unit: "월", unit_price: 500000, description: "월 정기 유지보수 (버그픽스, 소규모 수정)" },
  ],
  notes: "- 부가세 별도\n- 프로젝트 규모에 따라 10~20% 할인 가능\n- 납기 촉박 시 긴급비 20% 가산\n- 수정 횟수: 디자인 3회, 개발 2회 포함",
};

const actionColor: Record<string, string> = {
  "생성": "#3182f6", "수정": "#f59e0b", "발송": "#00c471",
  "상태변경": "#6b7684", "삭제": "#f04452", "복원": "#00c471",
};

const actionBadge = (action: HistoryEntry["action"]) => {
  switch (action) {
    case "생성": return s.badgeBlue;
    case "수정": return s.badgeOrange;
    case "발송": return s.badgeGreen;
    case "상태변경": return s.badgeGray;
    case "삭제": return s.badgeRed;
    case "복원": return s.badgeGreen;
    default: return s.badgeGray;
  }
};

/* ── helpers ── */
function uid() { return Math.random().toString(36).slice(2, 8); }

function emptyCostItem(): CostItem {
  return { id: `ci-${Date.now()}-${uid()}`, name: "", description: "", quantity: 1, unit: "건", unit_price: 0, amount: 0 };
}

function emptyQuoteItem(withCost = false): QuoteItem {
  return {
    id: `qi-${Date.now()}-${uid()}`, name: "", description: "", quantity: 1, unit: "건", unit_price: 0, amount: 0,
    cost_items: withCost ? [emptyCostItem()] : [],
  };
}

const DEFAULT_SUPPLIER: CompanyInfo = {
  company_name: "와이디랩", biz_number: "123-45-67890", representative: "송유섭", email: "biz@whydlab.com", address: "경기도 화성시 동탄대로 123, B동 1210호",
};

function generateNumber(): string {
  return `QT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`;
}

function emptyQuote(): Quote {
  const now = new Date().toISOString().replace("T", " ").slice(0, 16);
  return {
    id: `qt-${Date.now()}`, quote_number: generateNumber(), quote_name: "", title: "",
    client: "", receiver_company: "", contact_name: "", manager: "",
    status: "작성중", quote_type: "통합",
    quote_date: new Date().toISOString().slice(0, 10), valid_until: "",
    items: [emptyQuoteItem()],
    items_total: 0, discount_rate: 0, discount_amount: 0, supply_amount: 0,
    vat_option: "별도", vat_amount: 0, total_amount: 0,
    supplier: { ...DEFAULT_SUPPLIER },
    receiver: { company_name: "", biz_number: "", representative: "", email: "", address: "" },
    notes: "", created_at: now, updated_at: now,
  };
}

/** 금액 재계산 — 세부견적이면 cost_items 합산으로 QuoteItem.amount 갱신 */
function recalc(q: Quote): Quote {
  const items = q.items.map((it) => {
    if (q.quote_type === "세부" && it.cost_items.length > 0) {
      const amount = it.cost_items.reduce((a, c) => a + c.amount, 0);
      return { ...it, amount, unit_price: amount, quantity: 1 };
    }
    return it;
  });
  const items_total = items.reduce((a, i) => a + i.amount, 0);
  const discount_amount = Math.round(items_total * q.discount_rate / 100);
  const supply_amount = items_total - discount_amount;
  let vat_amount = 0;
  if (q.vat_option === "별도") vat_amount = Math.round(supply_amount * 0.1);
  else if (q.vat_option === "포함") vat_amount = Math.round(supply_amount - supply_amount / 1.1);
  const total_amount = q.vat_option === "포함" ? supply_amount : supply_amount + vat_amount;
  return { ...q, items, items_total, discount_amount, supply_amount, vat_amount, total_amount };
}

function deepCloneQuote(d: Quote): Quote {
  return {
    ...d,
    items: d.items.map((i) => ({ ...i, cost_items: i.cost_items.map((c) => ({ ...c })) })),
    supplier: { ...d.supplier },
    receiver: { ...d.receiver },
  };
}

/* ── 견적서 HTML 생성 (미리보기 + PDF 공용) ── */
function generateQuoteHTML(q: Quote): string {
  let tableBody = "";
  if (q.quote_type === "세부") {
    q.items.forEach((item) => {
      tableBody += `<tr style="background:#f4f6f8"><td colspan="5" style="font-weight:700;font-size:12px;padding:10px">${item.name}</td><td style="text-align:right;font-weight:700;padding:10px">${item.amount.toLocaleString()}</td></tr>`;
      item.cost_items.forEach((ci) => {
        tableBody += `<tr><td style="padding-left:24px">${ci.name}</td><td style="font-size:11px;color:#6b7684">${ci.description}</td><td style="text-align:center">${ci.quantity}</td><td style="text-align:center">${ci.unit}</td><td style="text-align:right">${ci.unit_price.toLocaleString()}</td><td style="text-align:right">${ci.amount.toLocaleString()}</td></tr>`;
      });
    });
  } else {
    q.items.forEach((it) => {
      tableBody += `<tr><td>${it.name}</td><td style="font-size:11px;color:#6b7684">${it.description}</td><td style="text-align:center">${it.quantity}</td><td style="text-align:center">${it.unit}</td><td style="text-align:right">${it.unit_price.toLocaleString()}</td><td style="text-align:right">${it.amount.toLocaleString()}</td></tr>`;
    });
  }

  const vatLabel = q.vat_option === "포함" ? "부가세(포함)" : q.vat_option === "제외" ? "부가세(제외)" : "부가세(10%)";
  return `<!DOCTYPE html><html><head><title>견적서 - ${q.quote_number}</title>
<style>
body{font-family:'Pretendard',sans-serif;padding:40px;color:#191f28;font-size:13px;max-width:800px;margin:0 auto;background:#fff}
h1{font-size:24px;text-align:center;margin-bottom:4px;letter-spacing:-0.03em}
.sub{text-align:center;color:#6b7684;margin-bottom:32px;font-size:12px}
.info{display:flex;justify-content:space-between;margin-bottom:24px;gap:24px}
.info-block{flex:1}.info-block h3{font-size:13px;font-weight:700;margin-bottom:8px;color:#3182f6}
.info-row{display:flex;font-size:12px;margin-bottom:4px}.info-label{width:70px;color:#6b7684;flex-shrink:0}.info-value{font-weight:600}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
th{background:#f4f6f8;padding:8px 10px;text-align:left;border-bottom:2px solid #e5e8eb;font-size:11px;font-weight:700}
td{padding:8px 10px;border-bottom:1px solid #f2f4f6;font-size:12px}
.totals{margin-left:auto;width:280px}
.total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
.total-row.big{border-top:2px solid #191f28;padding-top:10px;margin-top:6px;font-size:16px;font-weight:800}
.total-label{color:#6b7684}.total-value{font-weight:700}
.notes{margin-top:24px;padding:12px 16px;background:#f9fafb;border-radius:8px;font-size:12px;color:#4e5968;line-height:1.6}
.footer{margin-top:48px;text-align:center;color:#b0b8c1;font-size:11px}
@media print{body{padding:20px}}
</style></head><body>
<h1>견 적 서</h1>
<div class="sub">${q.quote_number} · 유효기간: ${q.valid_until || "-"}</div>
<div class="info">
  <div class="info-block"><h3>공급자</h3>
    <div class="info-row"><span class="info-label">회사명</span><span class="info-value">${q.supplier.company_name}</span></div>
    <div class="info-row"><span class="info-label">대표</span><span class="info-value">${q.supplier.representative}</span></div>
    <div class="info-row"><span class="info-label">사업자번호</span><span class="info-value">${q.supplier.biz_number}</span></div>
    <div class="info-row"><span class="info-label">이메일</span><span class="info-value">${q.supplier.email}</span></div>
    <div class="info-row"><span class="info-label">주소</span><span class="info-value">${q.supplier.address}</span></div></div>
  <div class="info-block"><h3>수신</h3>
    <div class="info-row"><span class="info-label">회사명</span><span class="info-value">${q.receiver.company_name}</span></div>
    <div class="info-row"><span class="info-label">담당자</span><span class="info-value">${q.receiver.representative}</span></div>
    <div class="info-row"><span class="info-label">사업자번호</span><span class="info-value">${q.receiver.biz_number || "-"}</span></div>
    <div class="info-row"><span class="info-label">이메일</span><span class="info-value">${q.receiver.email || "-"}</span></div></div>
</div>
<table><thead><tr><th>항목</th><th>설명</th><th style="text-align:center">수량</th><th style="text-align:center">단위</th><th style="text-align:right">단가</th><th style="text-align:right">금액</th></tr></thead><tbody>${tableBody}</tbody></table>
<div class="totals">
  <div class="total-row"><span class="total-label">항목합계</span><span class="total-value">${q.items_total.toLocaleString()}원</span></div>
  ${q.discount_amount > 0 ? `<div class="total-row"><span class="total-label">할인 (${q.discount_rate}%)</span><span class="total-value" style="color:#f04452">-${q.discount_amount.toLocaleString()}원</span></div>` : ""}
  <div class="total-row"><span class="total-label">공급가액</span><span class="total-value">${q.supply_amount.toLocaleString()}원</span></div>
  <div class="total-row"><span class="total-label">${vatLabel}</span><span class="total-value">${q.vat_amount.toLocaleString()}원</span></div>
  <div class="total-row big"><span>총 견적금액</span><span style="color:#3182f6">${q.total_amount.toLocaleString()}원</span></div>
</div>
${q.notes ? `<div class="notes"><strong>비고</strong><br/>${q.notes}</div>` : ""}
<div class="footer">본 견적서는 ${q.valid_until || "미정"}까지 유효합니다. · WHYDLAB BIZ</div>
</body></html>`;
}

/* ── PDF 다운로드 ── */
function downloadQuotePDF(q: Quote) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(generateQuoteHTML(q));
  w.document.close();
  setTimeout(() => { w.print(); w.close(); }, 300);
}

/* ── 미리보기 모달 ── */
function QuotePreviewModal({ quote, onClose, onPrint }: { quote: Quote; onClose: () => void; onPrint: () => void }) {
  const html = generateQuoteHTML(quote);

  return (
    <div className={s.modalOverlay} style={{ zIndex: 1100 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.previewModal}>
        <div className={s.previewModalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 className={s.modalTitle}>견적서 미리보기</h2>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--color-text-tertiary)" }}>{quote.quote_number}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={onPrint}>PDF 인쇄 / 저장</button>
            <button className={s.btnIcon} onClick={onClose} style={{ fontSize: 18 }}>✕</button>
          </div>
        </div>
        <div className={s.previewModalBody}>
          <div className={s.previewPaper}>
            <iframe
              srcDoc={html}
              title="견적서 미리보기"
              className={s.previewIframe}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   통합견적 에디터 — QuoteItem 플랫 리스트
   ══════════════════════════════════════════════════════════ */
function IntegratedEditor({ items, onUpdate }: { items: QuoteItem[]; onUpdate: (items: QuoteItem[]) => void }) {
  const updateItem = (idx: number, patch: Partial<QuoteItem>) => {
    const next = items.map((it, i) => {
      if (i !== idx) return it;
      const m = { ...it, ...patch };
      m.amount = m.quantity * m.unit_price;
      return m;
    });
    onUpdate(next);
  };
  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const n = [...items]; const [m] = n.splice(from, 1); n.splice(to, 0, m); onUpdate(n);
  };

  return (
    <>
      <div className={s.itemsTableWrap}>
        <table className={s.itemsTable}>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th style={{ width: 32 }}>No.</th>
              <th style={{ minWidth: 140 }}>항목명</th>
              <th style={{ minWidth: 100 }}>설명</th>
              <th style={{ textAlign: "right", width: 100 }}>단가</th>
              <th style={{ textAlign: "center", width: 56 }}>수량</th>
              <th style={{ textAlign: "center", width: 56 }}>단위</th>
              <th style={{ textAlign: "right", width: 110 }}>금액</th>
              <th style={{ width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={it.id}>
                <td>
                  <div className={s.moveButtons}>
                    <button className={s.moveBtn} onClick={() => moveItem(i, i - 1)} disabled={i === 0}>&#9650;</button>
                    <button className={s.moveBtn} onClick={() => moveItem(i, i + 1)} disabled={i === items.length - 1}>&#9660;</button>
                  </div>
                </td>
                <td style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center" }}>{i + 1}</td>
                <td><input className={s.itemInput} placeholder="항목명" value={it.name} onChange={(e) => updateItem(i, { name: e.target.value })} /></td>
                <td><input className={s.itemInput} placeholder="설명" value={it.description} onChange={(e) => updateItem(i, { description: e.target.value })} /></td>
                <td><input className={s.itemInputRight} type="number" placeholder="0" value={it.unit_price || ""} onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} /></td>
                <td><input className={s.itemInputCenter} type="number" min={1} value={it.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} /></td>
                <td><input className={s.itemInputCenter} placeholder="건" value={it.unit} onChange={(e) => updateItem(i, { unit: e.target.value })} /></td>
                <td className={s.itemAmount}>{it.amount.toLocaleString()}</td>
                <td><button className={s.phaseRemoveBtn} onClick={() => onUpdate(items.filter((_, j) => j !== i))}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => onUpdate([...items, emptyQuoteItem()])} style={{ marginTop: 8 }}>+ 항목 추가</button>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   세부견적 에디터 — QuoteItem(대항목) → CostItem(세부내역)
   ══════════════════════════════════════════════════════════ */
function DetailedEditor({ items, onUpdate }: { items: QuoteItem[]; onUpdate: (items: QuoteItem[]) => void }) {

  const updateItemName = (qi: number, name: string) => {
    onUpdate(items.map((it, i) => i === qi ? { ...it, name } : it));
  };

  const updateCost = (qi: number, ci: number, patch: Partial<CostItem>) => {
    onUpdate(items.map((it, i) => {
      if (i !== qi) return it;
      const cost_items = it.cost_items.map((c, j) => {
        if (j !== ci) return c;
        const m = { ...c, ...patch };
        m.amount = m.quantity * m.unit_price;
        return m;
      });
      const amount = cost_items.reduce((a, c) => a + c.amount, 0);
      return { ...it, cost_items, amount, unit_price: amount };
    }));
  };

  const addCost = (qi: number) => {
    onUpdate(items.map((it, i) => i === qi ? { ...it, cost_items: [...it.cost_items, emptyCostItem()] } : it));
  };

  const removeCost = (qi: number, ci: number) => {
    onUpdate(items.map((it, i) => {
      if (i !== qi) return it;
      const cost_items = it.cost_items.filter((_, j) => j !== ci);
      const amount = cost_items.reduce((a, c) => a + c.amount, 0);
      return { ...it, cost_items, amount, unit_price: amount };
    }));
  };

  const removeItem = (qi: number) => onUpdate(items.filter((_, i) => i !== qi));

  const moveCost = (qi: number, from: number, to: number) => {
    const item = items[qi];
    if (to < 0 || to >= item.cost_items.length) return;
    onUpdate(items.map((it, i) => {
      if (i !== qi) return it;
      const c = [...it.cost_items]; const [m] = c.splice(from, 1); c.splice(to, 0, m);
      return { ...it, cost_items: c };
    }));
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const n = [...items]; const [m] = n.splice(from, 1); n.splice(to, 0, m); onUpdate(n);
  };

  let globalNo = 0;

  return (
    <>
      <div className={s.itemsTableWrap}>
        <table className={s.itemsTable}>
          <thead>
            <tr>
              <th style={{ width: 32 }} />
              <th style={{ width: 32 }}>No.</th>
              <th style={{ minWidth: 140 }}>항목명</th>
              <th style={{ minWidth: 100 }}>설명</th>
              <th style={{ textAlign: "right", width: 100 }}>단가</th>
              <th style={{ textAlign: "center", width: 56 }}>수량</th>
              <th style={{ textAlign: "center", width: 56 }}>단위</th>
              <th style={{ textAlign: "right", width: 110 }}>금액</th>
              <th style={{ width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {items.map((item, qi) => {
              const itemTotal = item.cost_items.reduce((a, c) => a + c.amount, 0);
              return (
                <ItemGroup key={item.id}>
                  {/* ── 대항목 헤더 ── */}
                  <tr className={s.categoryRow}>
                    <td>
                      <div className={s.moveButtons}>
                        <button className={s.moveBtn} onClick={() => moveItem(qi, qi - 1)} disabled={qi === 0}>&#9650;</button>
                        <button className={s.moveBtn} onClick={() => moveItem(qi, qi + 1)} disabled={qi === items.length - 1}>&#9660;</button>
                      </div>
                    </td>
                    <td />
                    <td colSpan={5}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className={s.categoryBadge}>대항목</span>
                        <input
                          className={s.categoryNameInput}
                          placeholder="대항목명 입력 (예: 기획, 디자인, 개발...)"
                          value={item.name}
                          onChange={(e) => updateItemName(qi, e.target.value)}
                        />
                      </div>
                    </td>
                    <td className={s.categorySubtotal}>{itemTotal.toLocaleString()}</td>
                    <td><button className={s.phaseRemoveBtn} onClick={() => removeItem(qi)} title="대항목 삭제">✕</button></td>
                  </tr>
                  {/* ── 세부내역 (CostItem) ── */}
                  {item.cost_items.map((ci, cIdx) => {
                    globalNo++;
                    return (
                      <tr key={ci.id} className={s.costItemRow}>
                        <td>
                          <div className={s.moveButtons}>
                            <button className={s.moveBtn} onClick={() => moveCost(qi, cIdx, cIdx - 1)} disabled={cIdx === 0}>&#9650;</button>
                            <button className={s.moveBtn} onClick={() => moveCost(qi, cIdx, cIdx + 1)} disabled={cIdx === item.cost_items.length - 1}>&#9660;</button>
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--color-text-tertiary)", textAlign: "center" }}>{globalNo}</td>
                        <td style={{ paddingLeft: 8 }}><input className={s.itemInput} placeholder="세부내역명" value={ci.name} onChange={(e) => updateCost(qi, cIdx, { name: e.target.value })} /></td>
                        <td><input className={s.itemInput} placeholder="설명" value={ci.description} onChange={(e) => updateCost(qi, cIdx, { description: e.target.value })} /></td>
                        <td><input className={s.itemInputRight} type="number" placeholder="0" value={ci.unit_price || ""} onChange={(e) => updateCost(qi, cIdx, { unit_price: Number(e.target.value) })} /></td>
                        <td><input className={s.itemInputCenter} type="number" min={1} value={ci.quantity} onChange={(e) => updateCost(qi, cIdx, { quantity: Number(e.target.value) })} /></td>
                        <td><input className={s.itemInputCenter} placeholder="건" value={ci.unit} onChange={(e) => updateCost(qi, cIdx, { unit: e.target.value })} /></td>
                        <td className={s.itemAmount}>{ci.amount.toLocaleString()}</td>
                        <td><button className={s.phaseRemoveBtn} onClick={() => removeCost(qi, cIdx)}>✕</button></td>
                      </tr>
                    );
                  })}
                  {/* 세부내역 추가 */}
                  <tr className={s.addCostRow}>
                    <td /><td />
                    <td colSpan={7}>
                      <button className={s.linkBtn} onClick={() => addCost(qi)} style={{ fontSize: 11, padding: "4px 0" }}>+ 세부내역 추가</button>
                    </td>
                  </tr>
                </ItemGroup>
            );
          })}
        </tbody>
        </table>
      </div>
      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => onUpdate([...items, emptyQuoteItem(true)])} style={{ marginTop: 8 }}>+ 대항목 추가</button>
    </>
  );
}

function ItemGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/* ══════════════════════════════════════════════════════════
   견적 가이드 모달
   ══════════════════════════════════════════════════════════ */
function QuoteGuideModal({ guide, onClose, onSave }: {
  guide: QuoteGuide;
  onClose: () => void;
  onSave: (g: QuoteGuide) => void;
}) {
  const [items, setItems] = useState<GuideItem[]>(() => guide.items.map((i) => ({ ...i })));
  const [notes, setNotes] = useState(guide.notes);

  const categories = [...new Set(items.map((i) => i.category))];

  const updateItem = (id: string, patch: Partial<GuideItem>) =>
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i));

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const addItem = () => {
    setItems((prev) => [...prev, {
      id: `g-${Date.now()}-${uid()}`, category: "기타", name: "", unit: "건", unit_price: 0, description: "",
    }]);
  };

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal} style={{ maxWidth: 860 }}>
        <div className={s.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 className={s.modalTitle}>견적 가이드</h2>
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>AI 자동견적 시 참고되는 기준 단가표</span>
          </div>
          <button className={s.btnIcon} onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>
        <div className={s.modalBody} style={{ maxHeight: "calc(100vh - 240px)", overflowY: "auto" }}>
          <div className={s.editorBlockTitle}>서비스 단가표</div>

          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span className={s.categoryBadge}>{cat}</span>
              </div>
              <div style={{ border: "1px solid var(--color-divider)", borderRadius: 8, overflow: "hidden" }}>
                <table className={s.itemsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: 160 }}>항목명</th>
                      <th>설명</th>
                      <th style={{ width: 60, textAlign: "center" }}>단위</th>
                      <th style={{ width: 120, textAlign: "right" }}>기준단가</th>
                      <th style={{ width: 80, textAlign: "center" }}>카테고리</th>
                      <th style={{ width: 28 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter((i) => i.category === cat).map((item) => (
                      <tr key={item.id}>
                        <td><input className={s.itemInput} value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} /></td>
                        <td><input className={s.itemInput} value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} /></td>
                        <td><input className={s.itemInputCenter} value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} /></td>
                        <td><input className={s.itemInputRight} type="number" value={item.unit_price || ""} onChange={(e) => updateItem(item.id, { unit_price: Number(e.target.value) })} /></td>
                        <td>
                          <select style={{ width: "100%", border: "1px solid transparent", borderRadius: 4, padding: "4px 2px", fontSize: 11, background: "transparent", textAlign: "center" }}
                            value={item.category} onChange={(e) => updateItem(item.id, { category: e.target.value })}>
                            {["기획", "디자인", "개발", "기타"].map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td><button className={s.phaseRemoveBtn} onClick={() => removeItem(item.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <button className={`${s.btn} ${s.btnSmall}`} onClick={addItem} style={{ marginBottom: 20 }}>+ 항목 추가</button>

          <div className={s.formDivider} />

          <div className={s.editorBlockTitle}>견적 참고사항 / 정책</div>
          <textarea
            className={s.notesArea}
            placeholder="할인 정책, 긴급비, 수정 횟수 등 견적 시 참고할 내용을 입력하세요"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ minHeight: 100 }}
          />
        </div>
        <div className={s.modalFooter}>
          <button className={`${s.btn} ${s.btnSmall}`} onClick={onClose}>취소</button>
          <div style={{ flex: 1 }} />
          <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} onClick={() => { onSave({ items, notes }); onClose(); }}>저장</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   칸반보드
   ══════════════════════════════════════════════════════════ */
const KANBAN_COLUMNS: { status: Quote["status"]; label: string; color: string; bg: string }[] = [
  { status: "작성중", label: "작성중", color: "#6b7684", bg: "var(--color-divider)" },
  { status: "발송완료", label: "발송완료", color: "#3182f6", bg: "var(--color-primary-light)" },
  { status: "수주", label: "수주", color: "#00c471", bg: "var(--color-success-light)" },
  { status: "실패", label: "실패", color: "#f04452", bg: "var(--color-danger-light)" },
  { status: "만료", label: "만료", color: "#b45309", bg: "var(--color-warning-light)" },
];

function KanbanBoard({ list, onEdit, onChangeStatus, onTrash }: {
  list: Quote[];
  onEdit: (id: string) => void;
  onChangeStatus: (id: string, status: Quote["status"]) => void;
  onTrash: (id: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Quote["status"] | null>(null);

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragEnd = () => { setDragId(null); setDragOver(null); };

  const handleDrop = (status: Quote["status"]) => {
    if (dragId) {
      onChangeStatus(dragId, status);
    }
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className={s.kanbanBoard}>
      {KANBAN_COLUMNS.map((col) => {
        const items = list.filter((q) => q.status === col.status).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        const colTotal = items.reduce((a, q) => a + q.total_amount, 0);

        return (
          <div
            key={col.status}
            className={`${s.kanbanCol} ${dragOver === col.status ? s.kanbanColDragOver : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.status); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(col.status)}
          >
            <div className={s.kanbanColHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={s.kanbanColDot} style={{ background: col.color }} />
                <span className={s.kanbanColTitle}>{col.label}</span>
                <span className={s.kanbanColCount}>{items.length}</span>
              </div>
              {colTotal > 0 && <span className={s.kanbanColTotal}>{fmtMan(colTotal)}</span>}
            </div>
            <div className={s.kanbanColBody}>
              {items.map((q) => (
                <div
                  key={q.id}
                  className={`${s.kanbanCard} ${dragId === q.id ? s.kanbanCardDragging : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(q.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onEdit(q.id)}
                >
                  <div className={s.kanbanCardTop}>
                    <span className={s.kanbanCardNumber}>{q.quote_number}</span>
                    <span className={`${s.quoteTypeBadge} ${q.quote_type === "세부" ? s.quoteTypeBadgeDetailed : s.quoteTypeBadgeIntegrated}`}>{q.quote_type}</span>
                  </div>
                  <div className={s.kanbanCardTitle}>{q.quote_name || q.title || "(미입력)"}</div>
                  <div className={s.kanbanCardClient}>{q.receiver.company_name || q.receiver_company || "-"}</div>
                  <div className={s.kanbanCardBottom}>
                    <span className={s.kanbanCardAmount}>{q.total_amount > 0 ? fmt(q.total_amount) : "-"}</span>
                    <span className={s.kanbanCardMeta}>{q.manager || "-"} · {q.quote_date}</span>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className={s.kanbanEmpty}>견적서가 없습니다</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   견적서 편집 모달
   ══════════════════════════════════════════════════════════ */
function QuoteEditorModal({ quote, onClose, onSave, guide }: { quote: Quote; onClose: () => void; onSave: (u: Quote) => void; guide: QuoteGuide }) {
  const [q, setQ] = useState<Quote>(() => deepCloneQuote(quote));
  const [showPreview, setShowPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const update = <K extends keyof Quote>(key: K, val: Quote[K]) =>
    setQ((prev) => recalc({ ...prev, [key]: val }));

  const updateSupplier = (key: keyof CompanyInfo, val: string) =>
    setQ((prev) => recalc({ ...prev, supplier: { ...prev.supplier, [key]: val } }));

  const updateReceiver = (key: keyof CompanyInfo, val: string) =>
    setQ((prev) => recalc({ ...prev, receiver: { ...prev.receiver, [key]: val } }));

  const switchType = (type: QuoteType) => {
    if (type === q.quote_type) return;
    if (type === "세부") {
      // 통합→세부: 기존 items를 각각 대항목으로 변환, cost_items 없는 것은 빈 세부내역 추가
      const items = q.items.map((it) => {
        if (it.cost_items.length > 0) return it;
        return { ...it, cost_items: [{ id: `ci-${uid()}`, name: it.name, description: it.description, quantity: it.quantity, unit: it.unit, unit_price: it.unit_price, amount: it.amount }] };
      });
      setQ((prev) => recalc({ ...prev, quote_type: type, items: items.length > 0 ? items : [emptyQuoteItem(true)] }));
    } else {
      // 세부→통합: cost_items를 flatten해서 플랫 items로
      const flat: QuoteItem[] = q.items.flatMap((it) =>
        it.cost_items.length > 0
          ? it.cost_items.map((c) => ({ ...emptyQuoteItem(), id: c.id, name: c.name, description: c.description, quantity: c.quantity, unit: c.unit, unit_price: c.unit_price, amount: c.amount }))
          : [{ ...it, cost_items: [] }]
      );
      setQ((prev) => recalc({ ...prev, quote_type: type, items: flat.length > 0 ? flat : [emptyQuoteItem()] }));
    }
  };

  const calc = recalc(q);
  const canSave = q.title.trim() !== "" || q.quote_name.trim() !== "";

  return (
    <div className={s.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modalWide}>
        <div className={s.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 className={s.modalTitle}>견적서 편집</h2>
            <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--color-text-tertiary)" }}>{q.quote_number}</span>
            <span className={`${s.badge} ${statusBadge(q.status)}`}>{q.status}</span>
          </div>
          <button className={s.btnIcon} onClick={onClose} style={{ fontSize: 18 }}>✕</button>
        </div>

        <div className={s.modalBody}>
          {/* 제목 */}
          <input className={s.docTitleInput} placeholder="견적서 제목을 입력하세요" value={q.title} onChange={(e) => update("title", e.target.value)} />

          {/* 메타 */}
          <div className={s.editorMeta}>
            <div><label className={s.formLabel}>견적명</label><input className={s.formInput} placeholder="견적 이름" value={q.quote_name} onChange={(e) => update("quote_name", e.target.value)} style={{ padding: "6px 10px", fontSize: 12.5 }} /></div>
            <div><label className={s.formLabel}>견적일자</label><input className={s.formInput} type="date" value={q.quote_date} onChange={(e) => update("quote_date", e.target.value)} style={{ padding: "6px 10px", fontSize: 12.5 }} /></div>
            <div><label className={s.formLabel}>유효기간</label><input className={s.formInput} type="date" value={q.valid_until} onChange={(e) => update("valid_until", e.target.value)} style={{ padding: "6px 10px", fontSize: 12.5 }} /></div>
            <div><label className={s.formLabel}>견적 담당자</label><input className={s.formInput} placeholder="담당자" value={q.manager} onChange={(e) => update("manager", e.target.value)} style={{ padding: "6px 10px", fontSize: 12.5 }} /></div>
          </div>

          {/* 공급자/수신자 */}
          <div className={s.editorGrid}>
            <div className={s.editorBlock}>
              <div className={s.editorBlockTitle}>공급자 (발신)</div>
              {(["company_name", "representative", "biz_number", "email", "address"] as const).map((key) => (
                <div className={s.editorField} key={key}>
                  <span className={s.editorFieldLabel}>{{ company_name: "회사명", representative: "대표자", biz_number: "사업자번호", email: "이메일", address: "주소" }[key]}</span>
                  <div className={s.editorFieldValue}><input value={q.supplier[key]} onChange={(e) => updateSupplier(key, e.target.value)} /></div>
                </div>
              ))}
            </div>
            <div className={s.editorBlock}>
              <div className={s.editorBlockTitle}>수신자</div>
              {(["company_name", "representative", "biz_number", "email", "address"] as const).map((key) => (
                <div className={s.editorField} key={key}>
                  <span className={s.editorFieldLabel}>{{ company_name: "회사명", representative: "담당자", biz_number: "사업자번호", email: "이메일", address: "주소" }[key]}</span>
                  <div className={s.editorFieldValue}><input value={q.receiver[key]} onChange={(e) => updateReceiver(key, e.target.value)} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className={s.formDivider} />

          {/* 견적 유형 토글 + 항목 에디터 */}
          <div className={s.itemsSectionHeader}>
            <span className={s.itemsSectionTitle}>견적 항목</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className={s.quoteTypeToggle}>
                <button className={`${s.quoteTypeBtn} ${q.quote_type === "통합" ? s.quoteTypeBtnActive : ""}`} onClick={() => switchType("통합")}>
                  통합견적<span className={s.quoteTypeDesc}>항목 나열</span>
                </button>
                <button className={`${s.quoteTypeBtn} ${q.quote_type === "세부" ? s.quoteTypeBtnActive : ""}`} onClick={() => switchType("세부")}>
                  세부견적<span className={s.quoteTypeDesc}>대항목 &gt; 세부내역</span>
                </button>
              </div>
              <button className={s.aiQuoteBtn} disabled={aiLoading} onClick={() => {
                if (guide.items.length === 0) { alert("견적 가이드에 등록된 항목이 없습니다.\n먼저 견적 가이드를 설정해주세요."); return; }
                setAiLoading(true);
                setTimeout(() => {
                  // AI 자동견적: 가이드 기준으로 견적 항목 생성
                  const cats = [...new Set(guide.items.map((g) => g.category))];
                  if (q.quote_type === "세부") {
                    // 세부견적: 카테고리별 대항목 → 가이드 항목을 세부내역으로
                    const newItems: QuoteItem[] = cats.map((cat) => {
                      const catItems = guide.items.filter((g) => g.category === cat);
                      const costItems: CostItem[] = catItems.map((g) => ({
                        id: `ci-${uid()}`, name: g.name, description: g.description,
                        quantity: 1, unit: g.unit, unit_price: g.unit_price, amount: g.unit_price,
                      }));
                      const total = costItems.reduce((a, c) => a + c.amount, 0);
                      return {
                        id: `qi-${uid()}`, name: cat, description: "", quantity: 1, unit: "건",
                        unit_price: total, amount: total, cost_items: costItems,
                      };
                    });
                    setQ((prev) => recalc({ ...prev, items: newItems }));
                  } else {
                    // 통합견적: 가이드 항목을 그대로 나열
                    const newItems: QuoteItem[] = guide.items.map((g) => ({
                      id: `qi-${uid()}`, name: g.name, description: g.description,
                      quantity: 1, unit: g.unit, unit_price: g.unit_price, amount: g.unit_price,
                      cost_items: [],
                    }));
                    setQ((prev) => recalc({ ...prev, items: newItems }));
                  }
                  setAiLoading(false);
                }, 600);
              }}>
                <span className={s.aiQuoteBtnIcon}>AI</span>
                {aiLoading ? "생성중..." : "자동견적"}
              </button>
            </div>
          </div>

          {q.quote_type === "통합" ? (
            <IntegratedEditor items={q.items} onUpdate={(items) => setQ((prev) => recalc({ ...prev, items }))} />
          ) : (
            <DetailedEditor items={q.items} onUpdate={(items) => setQ((prev) => recalc({ ...prev, items }))} />
          )}

          {/* 비고 + 합계 */}
          <div className={s.editorBottom}>
            <div>
              <label className={s.formLabel}>비고</label>
              <textarea className={s.notesArea} placeholder="특이사항, 조건 등을 입력하세요" value={q.notes} onChange={(e) => update("notes", e.target.value)} />
            </div>
            <div className={s.totalsPanel}>
              <div className={s.totalsRow}><span className={s.totalsLabel}>항목합계</span><span className={s.totalsValue}>{calc.items_total.toLocaleString()}원</span></div>
              <div className={s.totalsRow}>
                <span className={s.totalsLabel} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  할인율
                  <input className={s.discountInput} type="number" min={0} max={100} step={0.1} value={q.discount_rate || ""} onChange={(e) => update("discount_rate", Number(e.target.value))} />%
                </span>
                <span className={s.totalsValue} style={{ color: calc.discount_amount > 0 ? "var(--color-danger)" : undefined }}>
                  {calc.discount_amount > 0 ? `-${calc.discount_amount.toLocaleString()}원` : "0원"}
                </span>
              </div>
              <div className={s.totalsRow}><span className={s.totalsLabel}>공급가액</span><span className={s.totalsValue}>{calc.supply_amount.toLocaleString()}원</span></div>
              <div className={s.totalsRow}>
                <span className={s.totalsLabel} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  부가세
                  <div className={s.vatToggle}>
                    {(["별도", "포함", "제외"] as VatOption[]).map((opt) => (
                      <button key={opt} className={`${s.vatToggleBtn} ${q.vat_option === opt ? s.vatToggleBtnActive : ""}`} onClick={() => update("vat_option", opt)}>{opt}</button>
                    ))}
                  </div>
                </span>
                <span className={s.totalsValue}>{calc.vat_amount.toLocaleString()}원</span>
              </div>
              <div className={s.totalsFinal}><span className={s.totalsFinalLabel}>총 견적금액</span><span className={s.totalsFinalValue}>{calc.total_amount.toLocaleString()}원</span></div>
            </div>
          </div>
        </div>

        <div className={s.modalFooter}>
          <button className={`${s.btn} ${s.btnSmall}`} onClick={onClose}>취소</button>
          <div style={{ flex: 1 }} />
          <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setShowPreview(true)}>미리보기</button>
          <button className={`${s.btn} ${s.btnSmall}`} onClick={() => downloadQuotePDF(recalc(q))}>PDF 다운로드</button>
          <button className={`${s.btn} ${s.btnSmall} ${s.btnPrimary}`} style={{ opacity: canSave ? 1 : 0.5 }} onClick={() => { if (canSave) onSave(recalc(q)); }}>저장</button>
        </div>
      </div>

      {showPreview && (
        <QuotePreviewModal
          quote={recalc(q)}
          onClose={() => setShowPreview(false)}
          onPrint={() => { downloadQuotePDF(recalc(q)); setShowPreview(false); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   메인 페이지
   ══════════════════════════════════════════════════════════ */
export default function QuotesPage() {
  const { quotes: list, updateQuote: ctxUpdateQuote, addQuote: ctxAddQuote, removeQuote: ctxRemoveQuote, restoreQuote: ctxRestoreQuote } = useQuotes();
  const router = useRouter();
  const [trash, setTrash] = useState<Quote[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>(() => [...dummyHistory]);
  const [viewTab, setViewTab] = useState<ViewTab>("list");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [quoteGuide, setQuoteGuide] = useState<QuoteGuide>(() => ({
    items: defaultGuide.items.map((i) => ({ ...i })),
    notes: defaultGuide.notes,
  }));
  const [showAdvFilter, setShowAdvFilter] = useState(false);

  const [filterClient, setFilterClient] = useState("");
  const [filterManager, setFilterManager] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");

  const clients = useMemo(() => [...new Set(list.map((q) => q.receiver.company_name || q.receiver_company || q.client).filter(Boolean))].sort(), [list]);
  const managers = useMemo(() => [...new Set(list.map((q) => q.manager).filter(Boolean))], [list]);

  const addHistory = useCallback((quoteId: string, quoteNumber: string, quoteName: string, action: HistoryEntry["action"], detail: string) => {
    setHistory((prev) => [{ id: `h${Date.now()}`, quote_id: quoteId, quote_number: quoteNumber, quote_name: quoteName, action, detail, user: "현재 사용자", timestamp: new Date().toISOString().replace("T", " ").slice(0, 16) }, ...prev]);
  }, []);

  const filtered = useMemo(() => {
    let result = list;
    if (filter !== "all") result = result.filter((q) => q.status === filter);
    if (search.trim()) {
      const t = search.trim().toLowerCase();
      result = result.filter((q) => q.quote_number.toLowerCase().includes(t) || q.quote_name.toLowerCase().includes(t) || q.title.toLowerCase().includes(t) || q.client.toLowerCase().includes(t) || q.receiver_company.toLowerCase().includes(t) || q.manager.toLowerCase().includes(t));
    }
    if (filterClient) result = result.filter((q) => (q.receiver.company_name || q.receiver_company || q.client) === filterClient);
    if (filterManager) result = result.filter((q) => q.manager === filterManager);
    if (filterDateFrom) result = result.filter((q) => q.quote_date >= filterDateFrom);
    if (filterDateTo) result = result.filter((q) => q.quote_date <= filterDateTo);
    if (filterAmountMin) result = result.filter((q) => q.total_amount >= Number(filterAmountMin));
    if (filterAmountMax) result = result.filter((q) => q.total_amount <= Number(filterAmountMax));
    return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [list, filter, search, filterClient, filterManager, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax]);

  const totalAmount = list.reduce((a, q) => a + q.total_amount, 0);
  const wonCount = list.filter((q) => q.status === "수주").length;
  const pendingCount = list.filter((q) => q.status === "작성중" || q.status === "발송완료").length;
  const wonRate = list.length > 0 ? Math.round(wonCount / list.length * 100) : 0;

  const advFilterCount = [filterClient, filterManager, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax].filter(Boolean).length;
  const clearAdvFilter = () => { setFilterClient(""); setFilterManager(""); setFilterDateFrom(""); setFilterDateTo(""); setFilterAmountMin(""); setFilterAmountMax(""); };

  const addNewQuote = () => {
    const nq = emptyQuote();
    ctxAddQuote(nq);
    addHistory(nq.id, nq.quote_number, "(신규)", "생성", "견적서 신규 생성");
    setEditId(nq.id);
    setViewTab("list");
    setFilter("all");
  };

  // TODO: DB 연동 시 localStorage 대신 Supabase로 교체
  // 의뢰 페이지에서 견적서 상태 전환 시 자동으로 견적서 생성
  useEffect(() => {
    try {
      const pending = localStorage.getItem("whydlab_pending_quote");
      if (pending) {
        const data = JSON.parse(pending);
        const nq = emptyQuote();
        nq.client = data.client ?? "";
        nq.receiver_company = data.receiver_company ?? data.client ?? "";
        nq.contact_name = data.contact_name ?? "";
        nq.title = data.title ?? "";
        nq.quote_name = data.quote_name ?? "";
        nq.receiver = { ...nq.receiver, company_name: data.receiver_company ?? data.client ?? "", representative: data.contact_name ?? "" };
        ctxAddQuote(nq);
        addHistory(nq.id, nq.quote_number, data.client ?? "(신규)", "생성", `의뢰에서 전환 — 견적서 자동 생성`);
        setEditId(nq.id);
        setViewTab("list");
        setFilter("all");
        localStorage.removeItem("whydlab_pending_quote");
      }
    } catch { /* ignore */ }
  }, []);

  const saveQuote = (updated: Quote) => {
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    const saved = { ...updated, updated_at: now, client: updated.receiver.company_name || updated.client, receiver_company: updated.receiver.company_name || updated.receiver_company };
    ctxUpdateQuote(saved);
    addHistory(saved.id, saved.quote_number, saved.quote_name || saved.title, "수정", "견적서 저장");
    setEditId(null);
  };

  const changeStatus = (id: string, newStatus: Quote["status"]) => {
    const qt = list.find((q) => q.id === id);
    if (!qt || qt.status === newStatus) return;
    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    ctxUpdateQuote({ ...qt, status: newStatus, updated_at: now });
    addHistory(qt.id, qt.quote_number, qt.quote_name || qt.title, "상태변경", `${qt.status} → ${newStatus}`);

    // 수주 전환 시 → 계약서 작성 페이지로 이동
    if (newStatus === "수주") {
      const goContract = confirm(`"${qt.quote_name || qt.title}" 수주 완료!\n\n계약서 작성으로 이동하시겠습니까?`);
      if (goContract) {
        localStorage.setItem("whydlab_pending_contract", "1");
        localStorage.setItem("whydlab_prefill_contract", JSON.stringify({
          title: qt.title,
          client: qt.receiver_company || qt.client,
          quote_id: qt.id,
          quote_number: qt.quote_number,
          amount: qt.supply_amount,
          contact_name: qt.contact_name,
        }));
        router.push("/contracts/overview");
      }
    }
  };

  const moveToTrash = (id: string) => { const q = list.find((qt) => qt.id === id); if (!q || !confirm("견적서를 휴지통으로 이동하시겠습니까?")) return; ctxRemoveQuote(id); setTrash((p) => [q, ...p]); addHistory(q.id, q.quote_number, q.quote_name, "삭제", "휴지통으로 이동"); };
  const restoreFromTrash = (id: string) => { const q = trash.find((qt) => qt.id === id); if (!q) return; setTrash((p) => p.filter((qt) => qt.id !== id)); ctxRestoreQuote(q); addHistory(q.id, q.quote_number, q.quote_name, "복원", "휴지통에서 복원"); };
  const permanentDelete = (id: string) => { if (!confirm("영구 삭제하시겠습니까?")) return; setTrash((p) => p.filter((qt) => qt.id !== id)); };
  const emptyTrashAll = () => { if (!confirm(`${trash.length}건 영구 삭제합니까?`)) return; setTrash([]); };

  const editQuote = editId ? list.find((q) => q.id === editId) ?? null : null;

  const [historySearch, setHistorySearch] = useState("");
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history;
    const t = historySearch.trim().toLowerCase();
    return history.filter((h) => h.quote_number.toLowerCase().includes(t) || h.quote_name.toLowerCase().includes(t) || h.detail.toLowerCase().includes(t) || h.user.toLowerCase().includes(t));
  }, [history, historySearch]);

  return (
    <>
      <Head><title>견적서 - WHYDLAB BIZ</title></Head>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h1>견적서</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className={`${s.btn} ${s.btnSmall}`} onClick={() => setShowGuide(true)} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 14 }}>📋</span> 견적 가이드
            </button>
            <button className={s.addQuoteBtn} onClick={addNewQuote}>+ 견적서 발급</button>
          </div>
        </div>

        <div className={s.summary}>
          <div className={s.summaryCard}><div className={s.summaryLabel}>전체 견적</div><div className={s.summaryValue}>{list.length}<span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-secondary)", marginLeft: 2 }}>건</span></div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>총 견적금액</div><div className={s.summaryValue}>{fmtMan(totalAmount)}</div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>수주</div><div style={{ display: "flex", alignItems: "baseline", gap: 8 }}><div className={s.summaryValue} style={{ color: "var(--color-success)" }}>{wonCount}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>건</span></div><span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-success)", background: "var(--color-success-light)", padding: "2px 8px", borderRadius: 100 }}>{wonRate}%</span></div></div>
          <div className={s.summaryCard}><div className={s.summaryLabel}>진행중</div><div className={s.summaryValue} style={{ color: "var(--color-primary)" }}>{pendingCount}<span style={{ fontSize: 14, fontWeight: 500, marginLeft: 2 }}>건</span></div></div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", background: "var(--color-divider)", borderRadius: 8, padding: 2 }}>
            {([{ id: "list" as ViewTab, label: "견적 목록" }, { id: "board" as ViewTab, label: "칸반보드" }, { id: "history" as ViewTab, label: "수정이력" }, { id: "trash" as ViewTab, label: "휴지통" }]).map((t) => (
              <button key={t.id} className={`${s.btn} ${s.btnSmall}`} style={{ background: viewTab === t.id ? "var(--color-white)" : "transparent", boxShadow: viewTab === t.id ? "var(--shadow-xs)" : "none", border: "none", position: "relative" }} onClick={() => setViewTab(t.id)}>
                {t.label}{t.id === "trash" && trash.length > 0 && <span className={s.iconBtnBadge}>{trash.length}</span>}
              </button>
            ))}
          </div>
          {(viewTab === "list" || viewTab === "board") && <button className={s.addQuoteBtn} onClick={addNewQuote} style={{ fontSize: 12, padding: "7px 14px" }}>+ 견적서 발급</button>}
        </div>

        {viewTab === "list" && (
          <>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {(["all", "작성중", "발송완료", "수주", "실패", "만료"] as const).map((f) => {
                const c = f === "all" ? list.length : list.filter((q) => q.status === f).length;
                return <button key={f} className={`${s.btn} ${s.btnSmall} ${filter === f ? s.btnPrimary : ""}`} onClick={() => setFilter(f)}>{f === "all" ? "전체" : f}<span style={{ marginLeft: 3, fontSize: 11, opacity: 0.7 }}>{c}</span></button>;
              })}
            </div>

            <div className={s.toolbar}>
              <div className={s.toolbarSearch}><span className={s.toolbarSearchIcon}>🔍</span><input className={s.toolbarSearchInput} placeholder="견적번호, 견적명, 업체명, 담당자 검색..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <button className={`${s.iconBtn} ${showAdvFilter ? s.iconBtnActive : ""}`} onClick={() => setShowAdvFilter(!showAdvFilter)}>필터{advFilterCount > 0 && <span className={s.iconBtnDot} />}</button>
            </div>

            {showAdvFilter && (
              <div className={s.filterPanel}>
                <div className={s.filterHeader}><span className={s.filterTitle}>고급 필터{advFilterCount > 0 && <span className={s.filterCount}>{advFilterCount}개 적용중</span>}</span>{advFilterCount > 0 && <button className={s.linkBtn} onClick={clearAdvFilter}>초기화</button>}</div>
                <div className={s.filterGrid}>
                  <div><label className={s.formLabel}>고객사</label><select className={s.formSelect} value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={{ padding: "7px 8px", fontSize: 12 }}><option value="">전체</option>{clients.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className={s.formLabel}>담당자</label><select className={s.formSelect} value={filterManager} onChange={(e) => setFilterManager(e.target.value)} style={{ padding: "7px 8px", fontSize: 12 }}><option value="">전체</option>{managers.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
                  <div><label className={s.formLabel}>견적일 (시작)</label><input className={s.formInput} type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} style={{ padding: "7px 8px", fontSize: 12 }} /></div>
                  <div><label className={s.formLabel}>견적일 (종료)</label><input className={s.formInput} type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} style={{ padding: "7px 8px", fontSize: 12 }} /></div>
                  <div><label className={s.formLabel}>최소 금액</label><input className={s.formInput} type="number" placeholder="0" value={filterAmountMin} onChange={(e) => setFilterAmountMin(e.target.value)} style={{ padding: "7px 8px", fontSize: 12 }} /></div>
                  <div><label className={s.formLabel}>최대 금액</label><input className={s.formInput} type="number" placeholder="0" value={filterAmountMax} onChange={(e) => setFilterAmountMax(e.target.value)} style={{ padding: "7px 8px", fontSize: 12 }} /></div>
                </div>
              </div>
            )}

            <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 8 }}>{filtered.length}건 {filter !== "all" || search || advFilterCount > 0 ? "(필터 적용)" : ""}</div>

            <div className={s.section} style={{ padding: 0, overflow: "auto" }}>
              <table className={s.table}>
                <thead><tr>
                  <th>번호</th><th>유형</th><th>견적명</th><th>상태</th><th>수신회사</th><th>견적일</th>
                  <th style={{ textAlign: "right" }}>총견적금액</th>
                  <th>담당</th><th style={{ width: 60 }} />
                </tr></thead>
                <tbody>
                  {filtered.map((q) => {
                    const isEmpty = !q.title && !q.quote_name && q.items_total === 0;
                    return (
                      <tr key={q.id} className={`${s.clickableRow} ${isEmpty ? s.tableRowNew : ""}`} onClick={() => setEditId(q.id)}>
                        <td style={{ fontFamily: "monospace", fontSize: 11.5, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{q.quote_number}</td>
                        <td><span className={`${s.quoteTypeBadge} ${q.quote_type === "세부" ? s.quoteTypeBadgeDetailed : s.quoteTypeBadgeIntegrated}`}>{q.quote_type}</span></td>
                        <td style={{ fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {q.quote_name || q.title || <span style={{ color: "var(--color-text-tertiary)" }}>미입력</span>}
                          {q.title && q.quote_name && <span style={{ display: "block", fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis" }}>{q.title}</span>}
                        </td>
                        <td><span className={`${s.badge} ${statusBadge(q.status)}`}>{q.status}</span></td>
                        <td style={{ whiteSpace: "nowrap" }}>{q.receiver.company_name || q.receiver_company || "-"}</td>
                        <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>{q.quote_date}</td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-primary)" }}>{q.total_amount > 0 ? fmt(q.total_amount) : "-"}</div>
                          {q.vat_amount > 0 && <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 400 }}>VAT {fmt(q.vat_amount)}</div>}
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{q.manager || "-"}</td>
                        <td style={{ textAlign: "center", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                          <button className={s.btnIcon} onClick={() => downloadQuotePDF(q)} title="PDF">📄</button>
                          <button className={s.btnIcon} onClick={() => moveToTrash(q.id)} title="삭제">🗑</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "var(--color-text-tertiary)" }}>견적서가 없습니다</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {viewTab === "board" && (
          <KanbanBoard list={list} onEdit={setEditId} onChangeStatus={changeStatus} onTrash={moveToTrash} />
        )}

        {viewTab === "history" && (
          <div className={s.section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>수정이력 <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-tertiary)" }}>{history.length}건</span></span>
              <div className={s.toolbarSearch} style={{ maxWidth: 260 }}><span className={s.toolbarSearchIcon}>🔍</span><input className={s.toolbarSearchInput} placeholder="검색..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} style={{ fontSize: 12 }} /></div>
            </div>
            <div className={s.timeline}>
              {filteredHistory.map((h) => (
                <div key={h.id} className={s.timelineItem}>
                  <div className={s.timelineDot} style={{ borderColor: actionColor[h.action] || "#b0b8c1" }} />
                  <div className={s.timelineContent}>
                    <div className={s.timelineTop}><span className={`${s.badge} ${actionBadge(h.action)}`}>{h.action}</span><span className={s.timelineTime}>{h.timestamp}</span><span className={s.timelineUser}>{h.user}</span></div>
                    <div className={s.timelineDetail}>{h.detail}</div>
                    <div className={s.timelineQuote}>{h.quote_number} · {h.quote_name}</div>
                  </div>
                </div>
              ))}
              {filteredHistory.length === 0 && <div className={s.emptyState} style={{ padding: "40px 20px" }}><div className={s.emptyStateIcon}>📝</div><div className={s.emptyStateTitle}>이력이 없습니다</div></div>}
            </div>
          </div>
        )}

        {viewTab === "trash" && (
          <div className={s.section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>휴지통 <span style={{ fontSize: 13, fontWeight: 400, color: "var(--color-text-tertiary)" }}>{trash.length}건</span></span>
              {trash.length > 0 && <button className={`${s.btn} ${s.btnSmall}`} onClick={emptyTrashAll} style={{ color: "var(--color-danger)" }}>전체 비우기</button>}
            </div>
            {trash.length === 0 ? (
              <div className={s.emptyState}><div className={s.emptyStateIcon}>🗑</div><div className={s.emptyStateTitle}>휴지통이 비어 있습니다</div><div className={s.emptyStateDesc}>삭제된 견적서가 이곳에 보관됩니다</div></div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {trash.map((q) => (
                  <div key={q.id} className={s.trashCard}>
                    <div className={s.trashCardInfo}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-text-tertiary)" }}>{q.quote_number}</span><span className={`${s.badge} ${statusBadge(q.status)}`}>{q.status}</span></div>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{q.quote_name || q.title || "(미입력)"}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{q.client || q.receiver.company_name || "-"} · {q.total_amount > 0 ? fmtMan(q.total_amount) : "0원"}</div>
                    </div>
                    <div className={s.trashCardActions}>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => restoreFromTrash(q.id)}>복원</button>
                      <button className={`${s.btn} ${s.btnSmall}`} onClick={() => permanentDelete(q.id)} style={{ color: "var(--color-danger)" }}>영구삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {editQuote && <QuoteEditorModal key={editQuote.id} quote={editQuote} onClose={() => setEditId(null)} onSave={saveQuote} guide={quoteGuide} />}
        {showGuide && <QuoteGuideModal guide={quoteGuide} onClose={() => setShowGuide(false)} onSave={setQuoteGuide} />}
      </div>
    </>
  );
}
