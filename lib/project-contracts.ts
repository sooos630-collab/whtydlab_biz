import type { PaymentPhase, ProjectContract } from "@/data/dummy-contracts";

const PAYMENT_LABELS = ["착수금", "중도금", "잔금"] as const;

type PaymentLabel = (typeof PAYMENT_LABELS)[number];

type CsvImportResult = {
  projects: ProjectContract[];
  added: number;
  updated: number;
  skipped: number;
  warnings: string[];
};

type CsvValue = {
  found: boolean;
  value: string;
};

const PAYMENT_FIELD_MAP: Record<
  PaymentLabel,
  {
    billingKey: keyof Pick<ProjectContract, "billing_initial" | "billing_interim" | "billing_final">;
    collectedKey: keyof Pick<ProjectContract, "collected_initial" | "collected_interim" | "collected_final">;
  }
> = {
  착수금: { billingKey: "billing_initial", collectedKey: "collected_initial" },
  중도금: { billingKey: "billing_interim", collectedKey: "collected_interim" },
  잔금: { billingKey: "billing_final", collectedKey: "collected_final" },
};

const PROJECT_STATUS_OPTIONS = ["제안", "계약완료", "진행중", "납품완료", "정산완료"] as const;
const PROJECT_CHANNEL_OPTIONS = ["소개", "입찰", "직접영업", "온라인", "기타"] as const;

function clonePhase(phase: PaymentPhase): PaymentPhase {
  return { ...phase };
}

export function cloneProjectContract(project: ProjectContract): ProjectContract {
  return {
    ...project,
    team_members: [...project.team_members],
    payment_phases: project.payment_phases.map(clonePhase),
  };
}

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const slashDate = trimmed.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})$/);
  if (slashDate) {
    const [, year, month, day] = slashDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const hyphenDate = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (hyphenDate) {
    const [, year, month, day] = hyphenDate;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return "";
}

function parseAmount(value: string | number | undefined | null) {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  if (!value) return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  let multiplier = 1;
  let normalized = trimmed;
  if (normalized.endsWith("억원")) {
    multiplier = 100000000;
    normalized = normalized.slice(0, -2);
  } else if (normalized.endsWith("억")) {
    multiplier = 100000000;
    normalized = normalized.slice(0, -1);
  } else if (normalized.endsWith("만원")) {
    multiplier = 10000;
    normalized = normalized.slice(0, -2);
  }
  normalized = normalized.replace(/[,%\s원]/g, "").replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * multiplier) : 0;
}

function parsePercent(value: string | number | undefined | null) {
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  if (!value) return 0;
  const normalized = value.replace(/[%\s]/g, "").replace(/,/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function parseBoolean(value: string, fallback = false) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["y", "yes", "true", "1", "발행", "완료", "예"].includes(normalized)) return true;
  if (["n", "no", "false", "0", "미발행", "아니오"].includes(normalized)) return false;
  return fallback;
}

function parseTeamMembers(value: string) {
  return value
    .split(/[|,/]/)
    .map((member) => member.trim())
    .filter(Boolean);
}

function formatManwonText(amount: number) {
  if (amount === 0) return "0원";
  const manwon = amount / 10000;
  const formatted =
    Number.isInteger(manwon) ? manwon.toLocaleString() : manwon.toLocaleString(undefined, { maximumFractionDigits: 1 });
  return `${formatted}만원`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getPhase(project: ProjectContract | null | undefined, label: PaymentLabel) {
  return project?.payment_phases.find((phase) => phase.label === label);
}

function midpointDate(startDate: string, endDate: string) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  if (!start) return end;
  if (!end) return start;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return start;
  return new Date(startMs + (endMs - startMs) / 2).toISOString().slice(0, 10);
}

function defaultProgressByStatus(status: ProjectContract["status"]) {
  switch (status) {
    case "계약완료":
      return 10;
    case "진행중":
      return 50;
    case "납품완료":
      return 90;
    case "정산완료":
      return 100;
    default:
      return 0;
  }
}

function defaultDueDate(label: PaymentLabel, project: ProjectContract) {
  if (label === "착수금") return normalizeDate(project.start_date) || normalizeDate(project.contract_date);
  if (label === "잔금") return normalizeDate(project.end_date) || normalizeDate(project.start_date);
  return midpointDate(project.start_date, project.end_date) || normalizeDate(project.start_date) || normalizeDate(project.end_date);
}

function pickValue(record: Map<string, string>, aliases: string[]): CsvValue {
  for (const alias of aliases) {
    const normalized = normalizeHeader(alias);
    if (record.has(normalized)) {
      return { found: true, value: record.get(normalized) ?? "" };
    }
  }
  return { found: false, value: "" };
}

function applyTextField(
  target: ProjectContract,
  record: Map<string, string>,
  aliases: string[],
  key: keyof Pick<ProjectContract, "id" | "contract_number" | "project_name" | "client" | "description" | "manager" | "contract_date" | "start_date" | "end_date">
) {
  const cell = pickValue(record, aliases);
  if (!cell.found) return;
  const value = cell.value.trim();
  if (key === "contract_date" || key === "start_date" || key === "end_date") {
    target[key] = normalizeDate(value) as ProjectContract[typeof key];
    return;
  }
  target[key] = value as ProjectContract[typeof key];
}

function applyAmountField(
  target: ProjectContract,
  record: Map<string, string>,
  aliases: string[],
  key:
    | keyof Pick<
        ProjectContract,
        | "progress"
        | "supply_amount"
        | "vat_amount"
        | "total_amount_num"
        | "billing_initial"
        | "billing_interim"
        | "billing_final"
        | "collected_initial"
        | "collected_interim"
        | "collected_final"
        | "input_cost"
      >
) {
  const cell = pickValue(record, aliases);
  if (!cell.found) return;
  const value = key === "progress" ? parsePercent(cell.value) : parseAmount(cell.value);
  target[key] = value as ProjectContract[typeof key];
}

function ensurePaymentPhases(project: ProjectContract, previous?: ProjectContract | null) {
  return PAYMENT_LABELS.map((label) => {
    const currentPhase = getPhase(project, label);
    const previousPhase = getPhase(previous, label);
    const { billingKey, collectedKey } = PAYMENT_FIELD_MAP[label];
    const amount = project[billingKey] || currentPhase?.amount || previousPhase?.amount || project[collectedKey] || 0;
    const due_date = normalizeDate(currentPhase?.due_date) || normalizeDate(previousPhase?.due_date) || defaultDueDate(label, project);
    const paid = project[collectedKey] > 0;
    const paid_date = paid
      ? normalizeDate(currentPhase?.paid_date) || normalizeDate(previousPhase?.paid_date) || due_date || normalizeDate(project.contract_date)
      : null;

    return {
      label,
      amount,
      due_date,
      paid,
      paid_date,
    };
  });
}

export function recalculateProjectContract(project: ProjectContract, previous?: ProjectContract | null): ProjectContract {
  const next = cloneProjectContract(project);

  // 총금액 = 공급가액 + 부가세
  const total_amount_num =
    next.supply_amount > 0 || next.vat_amount > 0 ? next.supply_amount + next.vat_amount : next.total_amount_num;

  // 수금 합계
  const collected_amount = next.collected_initial + next.collected_interim + next.collected_final;
  const remaining_amount = total_amount_num - collected_amount;
  const collection_rate = total_amount_num > 0 ? Math.round((collected_amount / total_amount_num) * 100) : 0;

  // 순이익 = 수금액 - 투입원가
  const net_profit = collected_amount - next.input_cost;

  // 이익률 = 순이익 / 총 계약금액 × 100 (계약 기준)
  const net_profit_rate = total_amount_num > 0 ? Math.round((net_profit / total_amount_num) * 1000) / 10 : 0;

  const progress = next.progress > 0 || next.status === "제안" ? next.progress : defaultProgressByStatus(next.status);

  return {
    ...next,
    progress,
    total_amount_num,
    collected_amount,
    remaining_amount,
    collection_rate,
    net_profit,
    net_profit_rate,
    contract_amount: total_amount_num,
    total_amount: formatManwonText(total_amount_num),
    paid_amount: formatManwonText(collected_amount),
    payment_phases: ensurePaymentPhases({ ...next, total_amount_num }, previous),
    // 중복 필드 동기화
    total_settled: collected_amount,
    total_expense: next.input_cost,
    profit_rate: net_profit_rate,
  };
}

function generateContractNumber(existingProjects: ProjectContract[]) {
  const year = new Date().getFullYear();
  const yearPrefix = `WDL-${year}-`;
  const maxSequence = existingProjects.reduce((max, project) => {
    if (!project.contract_number.startsWith(yearPrefix)) return max;
    const lastChunk = project.contract_number.split("-").at(-1) ?? "";
    const parsed = Number(lastChunk);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);
  return `${yearPrefix}${String(maxSequence + 1).padStart(3, "0")}`;
}

export function createProjectDraft(existingProjects: ProjectContract[]) {
  const today = new Date().toISOString().slice(0, 10);
  return recalculateProjectContract({
    id: `proj-${Date.now()}`,
    contract_number: generateContractNumber(existingProjects),
    project_name: "신규 프로젝트",
    client: "고객사 미정",
    description: "",
    progress: 0,
    acquisition_channel: "직접영업",
    invoice_issued: false,
    start_date: today,
    end_date: today,
    supply_amount: 0,
    vat_amount: 0,
    total_amount_num: 0,
    billing_initial: 0,
    billing_interim: 0,
    billing_final: 0,
    collected_initial: 0,
    collected_interim: 0,
    collected_final: 0,
    collected_amount: 0,
    remaining_amount: 0,
    collection_rate: 0,
    input_cost: 0,
    net_profit: 0,
    net_profit_rate: 0,
    team_members: [],
    status: "제안",
    manager: "",
    contract_date: today,
    total_amount: "0원",
    paid_amount: "0원",
    contract_amount: 0,
    payment_phases: [
      { label: "착수금", amount: 0, due_date: today, paid: false, paid_date: null },
      { label: "중도금", amount: 0, due_date: today, paid: false, paid_date: null },
      { label: "잔금", amount: 0, due_date: today, paid: false, paid_date: null },
    ],
    total_settled: 0,
    total_expense: 0,
    profit_rate: 0,
  });
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

export function importProjectsFromCsv(csvText: string, existingProjects: ProjectContract[]): CsvImportResult {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return { projects: [], added: 0, updated: 0, skipped: 0, warnings: ["CSV에 데이터 행이 없습니다."] };
  }

  const headers = rows[0].map(normalizeHeader);
  const importedProjects: ProjectContract[] = [];
  const warnings: string[] = [];
  let added = 0;
  let updated = 0;
  let skipped = 0;

  rows.slice(1).forEach((cells, rowIndex) => {
    const record = new Map<string, string>();
    headers.forEach((header, cellIndex) => {
      if (!header) return;
      record.set(header, cells[cellIndex] ?? "");
    });

    const hasContent = cells.some((cell) => cell.trim() !== "");
    if (!hasContent) return;

    const idCell = pickValue(record, ["id", "프로젝트id", "projectid"]);
    const contractNumberCell = pickValue(record, ["코드넘버", "코드번호", "contract_number", "contractnumber", "contractno"]);
    const previous =
      existingProjects.find((project) => project.id === idCell.value.trim()) ||
      existingProjects.find((project) => project.contract_number === contractNumberCell.value.trim()) ||
      importedProjects.find((project) => project.id === idCell.value.trim()) ||
      importedProjects.find((project) => project.contract_number === contractNumberCell.value.trim()) ||
      null;

    if (!previous && !contractNumberCell.value.trim() && !idCell.value.trim()) {
      skipped += 1;
      warnings.push(`${rowIndex + 2}행: 코드넘버 또는 ID가 없어 건너뛰었습니다.`);
      return;
    }

    const base = previous ? cloneProjectContract(previous) : createProjectDraft([...existingProjects, ...importedProjects]);

    applyTextField(base, record, ["id", "프로젝트id", "projectid"], "id");
    applyTextField(base, record, ["코드넘버", "코드번호", "contract_number", "contractnumber", "contractno"], "contract_number");
    applyTextField(base, record, ["프로젝트명", "project_name", "projectname"], "project_name");
    applyTextField(base, record, ["회사명", "고객사", "client"], "client");
    applyTextField(base, record, ["세부내역", "description"], "description");
    applyTextField(base, record, ["담당자", "manager"], "manager");
    applyTextField(base, record, ["계약일", "contract_date", "contractdate"], "contract_date");
    applyTextField(base, record, ["시작일", "start_date", "startdate"], "start_date");
    applyTextField(base, record, ["종료일", "end_date", "enddate"], "end_date");

    applyAmountField(base, record, ["진척도", "progress"], "progress");
    applyAmountField(base, record, ["공급가액", "supply_amount", "supplyamount"], "supply_amount");
    applyAmountField(base, record, ["부가세", "vat", "vat_amount", "vatamount"], "vat_amount");
    applyAmountField(base, record, ["총금액", "합계금액", "total_amount_num", "totalamount"], "total_amount_num");
    applyAmountField(base, record, ["착수금청구", "착수금 청구", "billing_initial"], "billing_initial");
    applyAmountField(base, record, ["중도금청구", "중도금 청구", "billing_interim"], "billing_interim");
    applyAmountField(base, record, ["잔금청구", "잔금 청구", "billing_final"], "billing_final");
    applyAmountField(base, record, ["착수금수금", "착수금 수금", "collected_initial"], "collected_initial");
    applyAmountField(base, record, ["중도금수금", "중도금 수금", "collected_interim"], "collected_interim");
    applyAmountField(base, record, ["잔금수금", "잔금 수금", "collected_final"], "collected_final");
    applyAmountField(base, record, ["투입원가", "input_cost", "inputcost"], "input_cost");

    const statusCell = pickValue(record, ["상태", "status"]);
    if (statusCell.found) {
      const status = statusCell.value.trim() as ProjectContract["status"];
      if (PROJECT_STATUS_OPTIONS.includes(status)) base.status = status;
      else if (statusCell.value.trim()) warnings.push(`${rowIndex + 2}행: 상태 값 '${statusCell.value}'는 지원되지 않아 기존 값을 유지했습니다.`);
    }

    const channelCell = pickValue(record, ["수주경로", "유입경로", "acquisition_channel", "channel"]);
    if (channelCell.found) {
      const channel = channelCell.value.trim() as ProjectContract["acquisition_channel"];
      if (PROJECT_CHANNEL_OPTIONS.includes(channel)) base.acquisition_channel = channel;
      else if (channelCell.value.trim()) warnings.push(`${rowIndex + 2}행: 수주경로 값 '${channelCell.value}'는 지원되지 않아 기존 값을 유지했습니다.`);
    }

    const invoiceCell = pickValue(record, ["전자세금계산서", "세금계산서", "invoice_issued", "invoiceissued"]);
    if (invoiceCell.found) base.invoice_issued = parseBoolean(invoiceCell.value, base.invoice_issued);

    const membersCell = pickValue(record, ["투입인원", "팀원", "team_members", "teammembers"]);
    if (membersCell.found) base.team_members = parseTeamMembers(membersCell.value);

    const explicitPhases = base.payment_phases.map(clonePhase);
    PAYMENT_LABELS.forEach((label) => {
      const phaseIndex = explicitPhases.findIndex((phase) => phase.label === label);
      const dueDateCell = pickValue(record, [`${label}예정일`, `${label} 예정일`, `${label}due_date`, `${label}duedate`]);
      const paidDateCell = pickValue(record, [`${label}수금일`, `${label} 수금일`, `${label}paid_date`, `${label}paiddate`]);
      const paidCell = pickValue(record, [`${label}수금여부`, `${label} 수금여부`, `${label}paid`, `${label}ispaid`]);

      if (phaseIndex === -1) return;
      if (dueDateCell.found) explicitPhases[phaseIndex].due_date = normalizeDate(dueDateCell.value);
      if (paidDateCell.found) explicitPhases[phaseIndex].paid_date = normalizeDate(paidDateCell.value) || null;
      if (paidCell.found) explicitPhases[phaseIndex].paid = parseBoolean(paidCell.value, explicitPhases[phaseIndex].paid);
    });

    base.payment_phases = explicitPhases;

    const nextProject = recalculateProjectContract(base, previous);
    const duplicateIndex = importedProjects.findIndex(
      (project) => project.id === nextProject.id || project.contract_number === nextProject.contract_number
    );
    if (duplicateIndex >= 0) importedProjects[duplicateIndex] = nextProject;
    else importedProjects.push(nextProject);

    if (previous) updated += 1;
    else added += 1;
  });

  return { projects: importedProjects, added, updated, skipped, warnings };
}

function getExportRows(projects: ProjectContract[]) {
  return projects.map((project) => {
    const initialPhase = getPhase(project, "착수금");
    const interimPhase = getPhase(project, "중도금");
    const finalPhase = getPhase(project, "잔금");

    return {
      ID: project.id,
      코드넘버: project.contract_number,
      상태: project.status,
      프로젝트명: project.project_name,
      회사명: project.client,
      세부내역: project.description,
      수주경로: project.acquisition_channel,
      전자세금계산서: project.invoice_issued ? "발행" : "미발행",
      담당자: project.manager,
      계약일: project.contract_date,
      시작일: project.start_date,
      종료일: project.end_date,
      진척도: project.progress,
      공급가액: project.supply_amount,
      부가세: project.vat_amount,
      총금액: project.total_amount_num,
      착수금_청구: project.billing_initial,
      중도금_청구: project.billing_interim,
      잔금_청구: project.billing_final,
      착수금_수금: project.collected_initial,
      중도금_수금: project.collected_interim,
      잔금_수금: project.collected_final,
      착수금_예정일: initialPhase?.due_date ?? "",
      중도금_예정일: interimPhase?.due_date ?? "",
      잔금_예정일: finalPhase?.due_date ?? "",
      착수금_수금일: initialPhase?.paid_date ?? "",
      중도금_수금일: interimPhase?.paid_date ?? "",
      잔금_수금일: finalPhase?.paid_date ?? "",
      착수금_수금여부: initialPhase?.paid ? "Y" : "N",
      중도금_수금여부: interimPhase?.paid ? "Y" : "N",
      잔금_수금여부: finalPhase?.paid ? "Y" : "N",
      수금액: project.collected_amount,
      잔여금: project.remaining_amount,
      수금율: project.collection_rate,
      투입원가: project.input_cost,
      이익률: project.net_profit_rate,
      순이익금: project.net_profit,
      투입인원: project.team_members.join(", "),
    };
  });
}

export function buildProjectExcelDocument(projects: ProjectContract[]) {
  const rows = getExportRows(projects);
  const headers = rows[0] ? Object.keys(rows[0]) : ["ID", "코드넘버", "프로젝트명"];
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${headers.map((header) => `<td>${escapeHtml(String(row[header as keyof typeof row] ?? ""))}</td>`).join("")}</tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <style>
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; font-size: 12px; text-align: left; }
      th { background: #f8fafc; font-weight: 700; }
    </style>
  </head>
  <body>
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;
}
