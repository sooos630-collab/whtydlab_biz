import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import s from "@/styles/Dashboard.module.css";
import { useProjects } from "@/contexts/ProjectContext";
import { dummyFixedCosts, dummySalaryRecords, dummyTaxInvoices } from "@/data/dummy-finance";

const DASHBOARD_YEAR = 2026;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const MONTHLY_TARGET = Array(12).fill(10000000);
const AVAILABLE_CASH_STORAGE_KEY = "whydlab.dashboard.available-cash";

function formatCurrency(value: number) {
  return value.toLocaleString() + "원";
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatMonthCount(value: number) {
  return `${value.toFixed(1)}개월`;
}

function sanitizeNumericInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthDiffInclusive(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function normalizeMonthlyCost(amount: number, cycle: "월" | "분기" | "반기" | "연") {
  switch (cycle) {
    case "분기":
      return Math.round(amount / 3);
    case "반기":
      return Math.round(amount / 6);
    case "연":
      return Math.round(amount / 12);
    default:
      return amount;
  }
}

function monthLabel(month: number) {
  return `${month}월`;
}

function sumRange(values: number[], start: number, end: number) {
  return values.slice(start, end).reduce((total, value) => total + value, 0);
}

function getQuarter(month: number) {
  return Math.ceil(month / 3);
}

function getQuarterRange(month: number) {
  const quarter = getQuarter(month);
  return {
    quarter,
    start: (quarter - 1) * 3,
    end: quarter * 3,
  };
}

function stepMonth(month: number, diff: number) {
  const next = month + diff;
  if (next < 1) return 12;
  if (next > 12) return 1;
  return next;
}

function buildRiskRangeLabels(months: number[]) {
  if (months.length === 0) return [];
  const sorted = [...months].sort((left, right) => left - right);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    ranges.push(start === prev ? monthLabel(start) : `${monthLabel(start)}-${monthLabel(prev)}`);
    start = current;
    prev = current;
  }

  ranges.push(start === prev ? monthLabel(start) : `${monthLabel(start)}-${monthLabel(prev)}`);
  return ranges;
}

function extractMonth(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (iso) {
    const month = Number(iso[2]);
    return month >= 1 && month <= 12 ? month : null;
  }

  const monthMatch = trimmed.match(/(\d{1,2})월/);
  if (monthMatch) {
    const month = Number(monthMatch[1]);
    return month >= 1 && month <= 12 ? month : null;
  }

  return null;
}

function estimateRunwayMonths(
  availableCash: number,
  currentMonth: number,
  monthlyBaseBurn: number,
  scheduledExtraOutflows: number[],
  futureInflows: number[]
) {
  const safeCash = Math.max(availableCash, 0);
  if (safeCash === 0) return 0;
  if (monthlyBaseBurn <= 0 && scheduledExtraOutflows.every((value) => value <= 0)) return 24;

  let rollingCash = safeCash;
  let survivedMonths = 0;

  for (let offset = 0; offset < 24; offset += 1) {
    const monthIndex = currentMonth - 1 + offset;
    const normalizedIndex = monthIndex % 12;
    const inflow = monthIndex < 12 ? futureInflows[normalizedIndex] : 0;
    const extraOutflow = monthIndex < 12 ? scheduledExtraOutflows[normalizedIndex] : 0;
    const totalOutflow = monthlyBaseBurn + extraOutflow;

    if (totalOutflow <= inflow) {
      rollingCash += inflow - totalOutflow;
      survivedMonths += 1;
      continue;
    }

    const nextCash = rollingCash + inflow - totalOutflow;
    if (nextCash <= 0) {
      const burnGap = totalOutflow - inflow;
      return survivedMonths + rollingCash / burnGap;
    }

    rollingCash = nextCash;
    survivedMonths += 1;
  }

  return monthlyBaseBurn > 0 ? survivedMonths + rollingCash / monthlyBaseBurn : survivedMonths;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3.25v9.5M3.25 8h9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M11.85 2.5a1 1 0 0 0-1.7 0l-.58 1a6.6 6.6 0 0 0-1.48.4l-1.12-.46a1 1 0 0 0-1.3.55l-.55 1.32a1 1 0 0 0 .28 1.14l.83.7a6.7 6.7 0 0 0 0 1.7l-.83.7a1 1 0 0 0-.28 1.14l.55 1.32a1 1 0 0 0 1.3.55l1.12-.46c.47.2.96.34 1.48.4l.58 1a1 1 0 0 0 1.7 0l.58-1c.52-.06 1.01-.2 1.48-.4l1.12.46a1 1 0 0 0 1.3-.55l.55-1.32a1 1 0 0 0-.28-1.14l-.83-.7a6.7 6.7 0 0 0 0-1.7l.83-.7a1 1 0 0 0 .28-1.14l-.55-1.32a1 1 0 0 0-1.3-.55l-1.12.46a6.6 6.6 0 0 0-1.48-.4l-.58-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.35" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M9.75 3.5 5.25 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m6.25 3.5 4.5 4.5-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DashboardHeaderCard() {
  const quickActions = [
    { label: "빠른 추가", href: "/business" },
    { label: "의뢰 +", href: "/sales/inquiry" },
    { label: "고객 +", href: "/customers" },
    { label: "견적서 +", href: "/sales/quotes" },
    { label: "계약 +", href: "/contracts/overview" },
    { label: "세금계산서 +", href: "/finance/tax" },
  ];

  return (
    <section className={s.headerCard}>
      <div className={s.headerTop}>
        <div className={s.brandRow}>
          <span className={s.brandName}>와이디랩</span>
          <button type="button" className={s.brandButton} aria-label="설정">
            <GearIcon />
          </button>
        </div>
        <div className={s.quickActionRow}>
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href} className={s.quickActionButton}>
              <span className={s.actionIcon}>
                <PlusIcon />
              </span>
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CashPulseSection({
  summaryText,
  helperText,
  availableCash,
  cashBalanceDraft,
  hasSavedCashBalance,
  hasUnsavedCashBalance,
  onCashBalanceChange,
  onCashBalanceSave,
  monthlyFixedBurn,
  monthlyPayrollBurn,
  scheduledExpenseTotal,
  annualTargetGap,
  runwayMonths,
  riskRanges,
  nextCashEvent,
  blockedInvoiceAmount,
  projectedYearEndReserve,
}: {
  summaryText: string;
  helperText: string;
  availableCash: number;
  cashBalanceDraft: string;
  hasSavedCashBalance: boolean;
  hasUnsavedCashBalance: boolean;
  onCashBalanceChange: (value: string) => void;
  onCashBalanceSave: () => void;
  monthlyFixedBurn: number;
  monthlyPayrollBurn: number;
  scheduledExpenseTotal: number;
  annualTargetGap: number;
  runwayMonths: number;
  riskRanges: string[];
  nextCashEvent: string;
  blockedInvoiceAmount: number;
  projectedYearEndReserve: number;
}) {
  return (
    <section className={s.dashboardSection}>
      <SectionEyebrow label="AI 자금 운영" guideHref="/finance/fixed" />

      <div className={s.cashSectionHeader}>
        <h2 className={s.sectionHeadline}>
          {summaryText}
        </h2>
        <p className={s.cashLead}>
          {helperText}
        </p>
      </div>

      <div className={s.cashStatGrid}>
        <div className={s.cashStatCard}>
          <span className={s.cashStatLabel}>가용 현금</span>
          <strong className={s.cashStatValue}>{formatCurrency(Math.max(availableCash, 0))}</strong>
          <span className={s.cashStatMeta}>실제 통장 잔액을 직접 입력하면 이 값을 기준으로 계산한다</span>
          <div className={s.cashInputRow}>
            <input
              className={s.cashInput}
              type="text"
              inputMode="numeric"
              value={cashBalanceDraft}
              onChange={(event) => onCashBalanceChange(event.target.value)}
              placeholder="통장 잔액 입력"
              aria-label="실제 통장 잔액"
            />
            <button type="button" className={s.cashSaveButton} onClick={onCashBalanceSave} disabled={!hasUnsavedCashBalance}>
              저장
            </button>
          </div>
          <span className={s.cashInputState}>
            {hasUnsavedCashBalance
              ? "입력한 잔액이 아직 저장되지 않았어요"
              : hasSavedCashBalance
                ? "저장된 통장 잔액 기준으로 계산 중"
                : "저장된 잔액이 없어 추정 가용 현금 기준으로 계산 중"}
          </span>
        </div>
        <div className={s.cashStatCard}>
          <span className={s.cashStatLabel}>월 운영고정비</span>
          <strong className={s.cashStatValue}>{formatCurrency(monthlyFixedBurn)}</strong>
          <span className={s.cashStatMeta}>임대료, 구독, 보험, 식대 등 월 기준 환산 고정비</span>
        </div>
        <div className={s.cashStatCard}>
          <span className={s.cashStatLabel}>월 인건비</span>
          <strong className={s.cashStatValue}>{formatCurrency(monthlyPayrollBurn)}</strong>
          <span className={s.cashStatMeta}>최근 급여 기록 기준으로 보는 월 인건비 러닝비</span>
        </div>
        <div className={s.cashStatCard}>
          <span className={s.cashStatLabel}>추가 예정 지출</span>
          <strong className={s.cashStatValue}>{formatCurrency(scheduledExpenseTotal)}</strong>
          <span className={s.cashStatMeta}>연간 결제, 수취 세금계산서, 정산 예정분 등 올해 남은 추가 지출</span>
        </div>
        <div className={s.cashStatCard}>
          <span className={s.cashStatLabel}>연간 목표까지</span>
          <strong className={s.cashStatValue}>{formatCurrency(Math.max(annualTargetGap, 0))}</strong>
          <span className={s.cashStatMeta}>현재 실수금 기준 남은 목표액</span>
        </div>
        <div className={s.cashStatCard}>
          <span className={s.cashStatLabel}>지금 자금으로 버티는 기간</span>
          <strong className={s.cashStatValue}>{formatMonthCount(Math.max(runwayMonths, 0))}</strong>
          <span className={s.cashStatMeta}>추가 수금이 없다고 가정한 버팀 구간</span>
        </div>
      </div>

      <div className={s.cashInsightGrid}>
        <div className={s.cashInsightCard}>
          <div className={s.cashInsightTitle}>자금 압박 구간</div>
          <div className={s.riskBadgeRow}>
            {riskRanges.length > 0 ? (
              riskRanges.map((range) => (
                <span key={range} className={s.riskBadge}>
                  {range}
                </span>
              ))
            ) : (
              <span className={s.riskBadge}>당장 위험 구간 없음</span>
            )}
          </div>
          <p className={s.cashInsightText}>
            월 고정비와 인건비, 예정 추가 지출보다 예정 수금이 얇은 기간이다. 신규 계약금이나 선발행 수금이 없으면 이 구간에서 체감 압박이 커진다.
          </p>
        </div>

        <div className={s.cashInsightCard}>
          <div className={s.cashInsightTitle}>다음 현금 유입</div>
          <p className={s.cashInsightText}>{nextCashEvent}</p>
          <p className={s.cashInsightMeta}>프로젝트 관리 목록의 미수금 일정 기준</p>
        </div>

        <div className={s.cashInsightCard}>
          <div className={s.cashInsightTitle}>운영 코멘트</div>
          <p className={s.cashInsightText}>
            미발행 세금계산서 {formatCurrency(blockedInvoiceAmount)}는 바로 회수 가능한 후보 금액이다. 지금 추세라면 연말 예상 잔액은 {formatCurrency(Math.max(projectedYearEndReserve, 0))} 수준으로 보고, 추가 지출은 미리 현금에서 따로 떼어 두는 편이 안전하다.
          </p>
          <p className={s.cashInsightMeta}>프로젝트 수금 + 비용 런레이트 기반 추정</p>
        </div>
      </div>
    </section>
  );
}

function SectionEyebrow({ label, guideHref }: { label: string; guideHref: string }) {
  return (
    <div className={s.sectionEyebrowRow}>
      <span className={s.sectionChip}>{label}</span>
      <Link href={guideHref} className={s.guideLink}>
        관련 가이드
      </Link>
    </div>
  );
}

interface GoalMetricCardProps {
  title: string;
  subtitle: string;
  rate: number;
  achieved: number;
  goal: number;
  orderAmount: number;
  orderCount: number;
}

function GoalMetricCard({
  title,
  subtitle,
  rate,
  achieved,
  goal,
  orderAmount,
  orderCount,
}: GoalMetricCardProps) {
  return (
    <div className={s.metricCard}>
      <div className={s.metricHeader}>
        <span className={s.metricTitle}>{title}</span>
        <span className={s.metricSubtitle}>{subtitle}</span>
      </div>
      <div className={s.metricRateRow}>
        <strong className={s.metricRate}>{formatPercent(rate)}</strong>
        <span className={s.metricUnit}>달성</span>
      </div>
      <div className={s.metricTrack}>
        <div
          className={s.metricFill}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <div className={s.metricStats}>
        <div className={s.metricStat}>
          <span className={s.metricBadge}>달성</span>
          <span className={s.metricValue}>{formatCurrency(achieved)}</span>
        </div>
        <div className={s.metricStat}>
          <span className={s.metricBadge}>목표</span>
          <span className={s.metricValue}>{formatCurrency(goal)}</span>
        </div>
        <div className={s.metricStat}>
          <span className={s.metricBadge}>수주</span>
          <span className={s.metricValue}>
            {formatCurrency(orderAmount)} / {orderCount}건
          </span>
        </div>
      </div>
    </div>
  );
}

function buildLinePath(values: number[], xPoints: number[], yForValue: (value: number) => number) {
  return values
    .map((value, index) => `${index === 0 ? "M" : "L"} ${xPoints[index]} ${yForValue(value)}`)
    .join(" ");
}

interface GoalLineChartProps {
  actualValues: number[];
  targetValues: number[];
  orderValues: number[];
  showPercent: boolean;
  showOrderAmount: boolean;
  onTogglePercent: () => void;
  onToggleOrderAmount: () => void;
}

function GoalLineChart({
  actualValues,
  targetValues,
  orderValues,
  showPercent,
  showOrderAmount,
  onTogglePercent,
  onToggleOrderAmount,
}: GoalLineChartProps) {
  const baseValues = showOrderAmount ? orderValues : actualValues;
  const plotValues = showPercent
    ? baseValues.map((value, index) => (targetValues[index] > 0 ? (value / targetValues[index]) * 100 : 0))
    : baseValues;
  const goalLineValues = showPercent ? targetValues.map(() => 100) : targetValues;
  const yMax = showPercent
    ? Math.max(180, ...plotValues, ...goalLineValues)
    : Math.max(18000000, ...plotValues, ...goalLineValues);
  const ticks = showPercent ? [0, 60, 120, 180] : [0, 6000000, 12000000, 18000000];
  const width = 920;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 42, left: 58 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const xPoints = MONTHS.map(
    (_, index) => margin.left + (innerWidth / (MONTHS.length - 1)) * index
  );
  const yForValue = (value: number) =>
    margin.top + innerHeight - (value / yMax) * innerHeight;

  const actualPath = buildLinePath(plotValues, xPoints, yForValue);
  const goalPath = buildLinePath(goalLineValues, xPoints, yForValue);

  return (
    <div className={s.chartPanel}>
      <div className={s.chartLegend}>
        <span className={s.legendItem}>
          <span className={`${s.legendSwatch} ${s.legendSwatchBlue}`} />
          실제값
        </span>
        <span className={s.legendItem}>
          <span className={`${s.legendSwatch} ${s.legendSwatchGray}`} />
          목표값
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className={s.chartSvg} role="img" aria-label="매출 목표 라인 차트">
        {ticks.map((tick) => {
          const y = yForValue(tick);
          return (
            <g key={tick}>
              <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} className={s.gridLine} />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" className={s.axisText}>
                {showPercent ? `${tick}%` : formatCurrency(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={margin.left}
          y1={margin.top + innerHeight}
          x2={width - margin.right}
          y2={margin.top + innerHeight}
          className={s.axisLine}
        />

        <path d={goalPath} className={s.goalLine} />
        <path d={actualPath} className={s.actualLine} />

        {goalLineValues.map((value, index) => (
          <circle
            key={`goal-${MONTHS[index]}`}
            cx={xPoints[index]}
            cy={yForValue(value)}
            r="4"
            className={s.goalPoint}
          />
        ))}

        {plotValues.map((value, index) => (
          <circle
            key={`actual-${MONTHS[index]}`}
            cx={xPoints[index]}
            cy={yForValue(value)}
            r="5"
            className={s.actualPoint}
          />
        ))}

        {MONTHS.map((month, index) => (
          <text
            key={month}
            x={xPoints[index]}
            y={height - 12}
            textAnchor="middle"
            className={s.axisText}
          >
            {monthLabel(month)}
          </text>
        ))}
      </svg>

      <div className={s.chartFooter}>
        <label className={s.toggleItem}>
          <input type="checkbox" checked={showPercent} onChange={onTogglePercent} />
          <span className={s.toggleTrack}>
            <span className={s.toggleThumb} />
          </span>
          <span>표 %로 보기</span>
        </label>
        <label className={s.toggleItem}>
          <input type="checkbox" checked={showOrderAmount} onChange={onToggleOrderAmount} />
          <span className={s.toggleTrack}>
            <span className={s.toggleThumb} />
          </span>
          <span>계약 수주 금액</span>
        </label>
      </div>
    </div>
  );
}

function RevenueBarChart({
  values,
  activeMonth,
}: {
  values: number[];
  activeMonth: number;
}) {
  const width = 920;
  const height = 300;
  const margin = { top: 18, right: 20, bottom: 42, left: 58 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const yMax = 20000000;
  const ticks = [0, 5000000, 10000000, 15000000, 20000000];
  const gap = 14;
  const barWidth = (innerWidth - gap * (MONTHS.length - 1)) / MONTHS.length;

  const yForValue = (value: number) =>
    margin.top + innerHeight - (value / yMax) * innerHeight;

  return (
    <div className={s.chartPanel}>
      <svg viewBox={`0 0 ${width} ${height}`} className={s.chartSvg} role="img" aria-label="진행 매출 막대 차트">
        {ticks.map((tick) => {
          const y = yForValue(tick);
          return (
            <g key={tick}>
              <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} className={s.gridLine} />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" className={s.axisText}>
                {formatCurrency(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={margin.left}
          y1={margin.top + innerHeight}
          x2={width - margin.right}
          y2={margin.top + innerHeight}
          className={s.axisLine}
        />

        {MONTHS.map((month, index) => {
          const value = values[index];
          const x = margin.left + index * (barWidth + gap);
          const barHeight = (value / yMax) * innerHeight;
          const y = margin.top + innerHeight - barHeight;

          return (
            <g key={month}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="8"
                className={month === activeMonth ? s.revenueBarActive : s.revenueBar}
              />
              <text
                x={x + barWidth / 2}
                y={height - 12}
                textAnchor="middle"
                className={s.axisText}
              >
                {monthLabel(month)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GoalSummarySection({
  activeMonth,
  onPrevMonth,
  onNextMonth,
  onTogglePercent,
  onToggleOrderAmount,
  showPercent,
  showOrderAmount,
  monthlyActualValues,
  monthlyOrderAmounts,
  monthlyOrderCounts,
}: {
  activeMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTogglePercent: () => void;
  onToggleOrderAmount: () => void;
  showPercent: boolean;
  showOrderAmount: boolean;
  monthlyActualValues: number[];
  monthlyOrderAmounts: number[];
  monthlyOrderCounts: number[];
}) {
  const quarterRange = getQuarterRange(activeMonth);
  const annualGoal = MONTHLY_TARGET.reduce((total, value) => total + value, 0);
  const annualActual = monthlyActualValues.reduce((total, value) => total + value, 0);
  const annualOrderAmount = monthlyOrderAmounts.reduce((total, value) => total + value, 0);
  const annualOrderCount = monthlyOrderCounts.reduce((total, value) => total + value, 0);
  const quarterGoal = sumRange(MONTHLY_TARGET, quarterRange.start, quarterRange.end);
  const quarterActual = sumRange(monthlyActualValues, quarterRange.start, quarterRange.end);
  const quarterOrderAmount = sumRange(monthlyOrderAmounts, quarterRange.start, quarterRange.end);
  const quarterOrderCount = sumRange(monthlyOrderCounts, quarterRange.start, quarterRange.end);
  const monthlyGoal = MONTHLY_TARGET[activeMonth - 1];
  const monthlyActual = monthlyActualValues[activeMonth - 1];
  const monthlyOrderAmount = monthlyOrderAmounts[activeMonth - 1];
  const monthlyOrderCount = monthlyOrderCounts[activeMonth - 1];
  const monthDifference = monthlyActual - monthlyGoal;
  const headlinePrefix =
    monthDifference >= 0 ? "매출 목표보다" : "매출 목표까지";
  const headlineSuffix =
    monthDifference >= 0 ? "초과 달성했어요 🎉" : "남았어요";

  return (
    <section className={s.dashboardSection}>
      <SectionEyebrow label="목표" guideHref="/finance/payments" />

      <div className={s.sectionHeader}>
        <div className={s.sectionHeadlineBlock}>
          <h2 className={s.sectionHeadline}>
            {monthLabel(activeMonth)}, {headlinePrefix}{" "}
            <span className={s.headlineAccent}>
              {formatCurrency(Math.abs(monthDifference))}
            </span>{" "}
            {headlineSuffix}
          </h2>

          <div className={s.controlRow}>
            <div className={s.controlCluster}>
              <button type="button" className={s.primaryDarkButton}>
                {DASHBOARD_YEAR}년 목표 설정
              </button>
              <button type="button" className={s.outlineButton}>
                목표 기준 설정
              </button>
              <button type="button" className={s.outlineButton}>
                카테고리
              </button>
            </div>

            <div className={s.selectorGroup}>
              <button type="button" className={s.selectorButton}>
                {DASHBOARD_YEAR}년
              </button>
              <button type="button" className={s.selectorButton}>
                {monthLabel(activeMonth)}
              </button>
              <div className={s.monthNav}>
                <button type="button" className={s.iconButton} aria-label="이전 달" onClick={onPrevMonth}>
                  <ChevronLeftIcon />
                </button>
                <button type="button" className={s.iconButton} aria-label="다음 달" onClick={onNextMonth}>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={s.metricGrid}>
        <GoalMetricCard
          title="연간"
          subtitle={`${DASHBOARD_YEAR}년`}
          rate={(annualActual / annualGoal) * 100}
          achieved={annualActual}
          goal={annualGoal}
          orderAmount={annualOrderAmount}
          orderCount={annualOrderCount}
        />
        <GoalMetricCard
          title="분기"
          subtitle={`${quarterRange.quarter}/4 분기`}
          rate={(quarterActual / quarterGoal) * 100}
          achieved={quarterActual}
          goal={quarterGoal}
          orderAmount={quarterOrderAmount}
          orderCount={quarterOrderCount}
        />
        <GoalMetricCard
          title="월간"
          subtitle={monthLabel(activeMonth)}
          rate={(monthlyActual / monthlyGoal) * 100}
          achieved={monthlyActual}
          goal={monthlyGoal}
          orderAmount={monthlyOrderAmount}
          orderCount={monthlyOrderCount}
        />
      </div>

      <GoalLineChart
        actualValues={monthlyActualValues}
        targetValues={MONTHLY_TARGET}
        orderValues={monthlyOrderAmounts}
        showPercent={showPercent}
        showOrderAmount={showOrderAmount}
        onTogglePercent={onTogglePercent}
        onToggleOrderAmount={onToggleOrderAmount}
      />
    </section>
  );
}

function RevenueProgressSection({
  activeMonth,
  onPrevMonth,
  onNextMonth,
  monthlyRevenueValues,
  revenueTodayTotal,
  revenueYearTotal,
}: {
  activeMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  monthlyRevenueValues: number[];
  revenueTodayTotal: number;
  revenueYearTotal: number;
}) {
  const monthlyRevenue = monthlyRevenueValues[activeMonth - 1];
  const headlineLead =
    activeMonth === new Date().getMonth() + 1 ? "이번 달" : monthLabel(activeMonth);

  return (
    <section className={s.dashboardSection}>
      <SectionEyebrow label="진행 매출" guideHref="/contracts/projects" />

      <div className={s.sectionHeader}>
        <div className={s.sectionHeadlineBlock}>
          <h2 className={s.sectionHeadline}>
            {headlineLead}, 업무로{" "}
            <span className={s.headlineAccent}>{formatCurrency(monthlyRevenue)}</span>{" "}
            벌었어요 💰
          </h2>

          <div className={s.controlRow}>
            <div className={s.controlCluster}>
              <button type="button" className={s.outlineButton}>
                내역 다운로드
              </button>
              <button type="button" className={s.outlineButton}>
                월별 포함 계약 보기
              </button>
              <button type="button" className={s.outlineButton}>
                카테고리
              </button>
            </div>

            <div className={s.selectorGroup}>
              <button type="button" className={s.selectorButton}>
                {DASHBOARD_YEAR}년
              </button>
              <div className={s.monthNav}>
                <button type="button" className={s.iconButton} aria-label="이전 달" onClick={onPrevMonth}>
                  <ChevronLeftIcon />
                </button>
                <button type="button" className={s.iconButton} aria-label="다음 달" onClick={onNextMonth}>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={s.revenueSummaryGrid}>
        <div className={s.revenueSummaryCard}>
          <span className={s.revenueSummaryLabel}>{DASHBOARD_YEAR}년 오늘까지</span>
          <strong className={s.revenueSummaryValue}>{formatCurrency(revenueTodayTotal)}</strong>
        </div>
        <div className={s.revenueSummaryCard}>
          <span className={s.revenueSummaryLabel}>{DASHBOARD_YEAR}년 전체</span>
          <strong className={s.revenueSummaryValue}>{formatCurrency(revenueYearTotal)}</strong>
        </div>
      </div>

      <RevenueBarChart values={monthlyRevenueValues} activeMonth={activeMonth} />
    </section>
  );
}

export default function DashboardPage() {
  const { projects } = useProjects();
  const currentMonth = new Date().getMonth() + 1;
  const [goalMonth, setGoalMonth] = useState(currentMonth);
  const [revenueMonth, setRevenueMonth] = useState(currentMonth);
  const [showPercent, setShowPercent] = useState(false);
  const [showOrderAmount, setShowOrderAmount] = useState(false);
  const [cashBalanceDraft, setCashBalanceDraft] = useState("");
  const [savedCashBalance, setSavedCashBalance] = useState<number | null>(null);
  const [cashBalanceDirty, setCashBalanceDirty] = useState(false);

  const today = useMemo(() => new Date(), []);

  const monthlyActualValues = useMemo(() => {
    const values = Array(12).fill(0);
    projects.forEach((project) => {
      project.payment_phases.forEach((phase) => {
        if (!phase.paid || !phase.paid_date) return;
        const paidDate = parseDate(phase.paid_date);
        if (paidDate.getFullYear() !== DASHBOARD_YEAR) return;
        values[paidDate.getMonth()] += phase.amount;
      });
    });
    return values;
  }, [projects]);

  const { monthlyOrderAmounts, monthlyOrderCounts } = useMemo(() => {
    const amounts = Array(12).fill(0);
    const counts = Array(12).fill(0);

    projects.forEach((project) => {
      if (project.status === "제안") return;
      const contractDate = parseDate(project.contract_date);
      if (contractDate.getFullYear() !== DASHBOARD_YEAR) return;
      const monthIndex = contractDate.getMonth();
      amounts[monthIndex] += project.contract_amount;
      counts[monthIndex] += 1;
    });

    return {
      monthlyOrderAmounts: amounts,
      monthlyOrderCounts: counts,
    };
  }, [projects]);

  const monthlyRevenueValues = useMemo(() => {
    const values = Array(12).fill(0);
    projects.forEach((project) => {
      if (project.status === "제안") return;
      project.payment_phases.forEach((phase) => {
        const dueDate = parseDate(phase.due_date);
        if (dueDate.getFullYear() !== DASHBOARD_YEAR) return;
        values[dueDate.getMonth()] += phase.amount;
      });
    });
    return values;
  }, [projects]);

  const revenueTodayTotal = useMemo(() => {
    let total = 0;
    projects.forEach((project) => {
      if (project.status === "제안") return;
      project.payment_phases.forEach((phase) => {
        const dueDate = parseDate(phase.due_date);
        if (dueDate.getFullYear() !== DASHBOARD_YEAR) return;
        if (dueDate.getTime() <= today.getTime()) {
          total += phase.amount;
        }
      });
    });
    return total;
  }, [projects, today]);

  const revenueYearTotal = useMemo(
    () => monthlyRevenueValues.reduce((total, value) => total + value, 0),
    [monthlyRevenueValues]
  );

  const monthlyFixedBurn = useMemo(
    () =>
      dummyFixedCosts
        .filter((item) => item.status === "활성")
        .reduce((total, item) => total + normalizeMonthlyCost(item.amount, item.billing_cycle), 0),
    []
  );

  const monthlyPayrollBurn = useMemo(() => {
    const latestMonth = [...new Set(dummySalaryRecords.map((record) => record.month))].sort().at(-1);
    if (!latestMonth) return 0;
    return dummySalaryRecords
      .filter((record) => record.month === latestMonth)
      .reduce((total, record) => total + record.net_salary, 0);
  }, []);

  const monthlyOperatingBurn = monthlyFixedBurn + monthlyPayrollBurn;

  const scheduledAdditionalOutflowValues = useMemo(() => {
    const values = Array(12).fill(0);

    dummyFixedCosts
      .filter((item) => item.status === "활성" && item.billing_cycle !== "월")
      .forEach((item) => {
        const month = extractMonth(item.payment_date);
        if (!month) return;
        const delta = Math.max(item.amount - normalizeMonthlyCost(item.amount, item.billing_cycle), 0);
        values[month - 1] += delta;
      });

    const plannedPayrollByMonth = new Map<number, number>();
    dummySalaryRecords
      .filter((record) => record.status !== "지급완료")
      .forEach((record) => {
        const month = extractMonth(record.pay_date) ?? extractMonth(`${record.month}-01`);
        if (!month) return;
        plannedPayrollByMonth.set(month, (plannedPayrollByMonth.get(month) ?? 0) + record.net_salary);
      });

    plannedPayrollByMonth.forEach((amount, month) => {
      const delta = Math.max(amount - monthlyPayrollBurn, 0);
      values[month - 1] += delta;
    });

    dummyTaxInvoices
      .filter((invoice) => invoice.type === "수취")
      .forEach((invoice) => {
        const month = extractMonth(invoice.date);
        if (!month) return;
        values[month - 1] += invoice.total_amount;
      });

    return values;
  }, [monthlyPayrollBurn]);

  const totalCollectedToDate = useMemo(() => {
    let total = 0;
    projects.forEach((project) => {
      project.payment_phases.forEach((phase) => {
        if (!phase.paid || !phase.paid_date) return;
        const paidDate = parseDate(phase.paid_date);
        if (paidDate.getTime() <= today.getTime()) {
          total += phase.amount;
        }
      });
    });
    return total;
  }, [projects, today]);

  const estimatedReserve = useMemo(() => {
    const anchorDates = projects
      .flatMap((project) =>
        project.payment_phases
          .filter((phase) => phase.paid && phase.paid_date)
          .map((phase) => parseDate(phase.paid_date as string))
      )
      .sort((left, right) => left.getTime() - right.getTime());

    const anchorDate = anchorDates[0] ?? today;
    const elapsedMonths = Math.max(monthDiffInclusive(anchorDate, today), 1);
    return totalCollectedToDate - monthlyOperatingBurn * elapsedMonths;
  }, [monthlyOperatingBurn, projects, today, totalCollectedToDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawValue = window.localStorage.getItem(AVAILABLE_CASH_STORAGE_KEY);
    if (!rawValue) return;
    const parsed = Number(rawValue);
    if (Number.isFinite(parsed) && parsed >= 0) {
      setSavedCashBalance(parsed);
    }
  }, []);

  useEffect(() => {
    if (cashBalanceDirty) return;
    if (savedCashBalance !== null) {
      setCashBalanceDraft(String(savedCashBalance));
      return;
    }
    setCashBalanceDraft(String(Math.max(Math.round(estimatedReserve), 0)));
  }, [cashBalanceDirty, estimatedReserve, savedCashBalance]);

  const effectiveAvailableCash = savedCashBalance !== null ? Math.max(savedCashBalance, 0) : Math.max(estimatedReserve, 0);

  const scheduledAdditionalOutflowTotal = useMemo(
    () => scheduledAdditionalOutflowValues.slice(currentMonth - 1).reduce((total, value) => total + value, 0),
    [currentMonth, scheduledAdditionalOutflowValues]
  );

  const annualGoalTotal = useMemo(
    () => MONTHLY_TARGET.reduce((total, value) => total + value, 0),
    []
  );

  const annualActualTotal = useMemo(
    () => monthlyActualValues.reduce((total, value) => total + value, 0),
    [monthlyActualValues]
  );

  const annualTargetGap = Math.max(annualGoalTotal - annualActualTotal, 0);

  const futureUnpaidRevenueValues = useMemo(() => {
    const values = Array(12).fill(0);
    projects.forEach((project) => {
      if (project.status === "제안") return;
      project.payment_phases.forEach((phase) => {
        if (phase.paid) return;
        const dueDate = parseDate(phase.due_date);
        if (dueDate.getFullYear() !== DASHBOARD_YEAR) return;
        values[dueDate.getMonth()] += phase.amount;
      });
    });
    return values;
  }, [projects]);

  const runwayMonths = useMemo(
    () =>
      estimateRunwayMonths(
        effectiveAvailableCash,
        currentMonth,
        monthlyOperatingBurn,
        scheduledAdditionalOutflowValues,
        futureUnpaidRevenueValues
      ),
    [currentMonth, effectiveAvailableCash, futureUnpaidRevenueValues, monthlyOperatingBurn, scheduledAdditionalOutflowValues]
  );

  const riskRangeLabels = useMemo(() => {
    let rollingCash = Math.max(effectiveAvailableCash, 0);
    const riskyMonths = MONTHS.filter((month, index) => {
      if (month < currentMonth) return false;
      rollingCash += futureUnpaidRevenueValues[index] - monthlyOperatingBurn - scheduledAdditionalOutflowValues[index];
      return rollingCash < monthlyOperatingBurn;
    });
    return buildRiskRangeLabels(riskyMonths);
  }, [currentMonth, effectiveAvailableCash, futureUnpaidRevenueValues, monthlyOperatingBurn, scheduledAdditionalOutflowValues]);

  const nextCashEvent = useMemo(() => {
    const nextUnpaidPhase = projects
      .flatMap((project) =>
        project.payment_phases
          .filter((phase) => !phase.paid)
          .map((phase) => ({
            projectName: project.project_name,
            amount: phase.amount,
            dueDate: parseDate(phase.due_date),
          }))
      )
      .filter((phase) => phase.dueDate.getTime() >= today.getTime())
      .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())[0];

    if (!nextUnpaidPhase) {
      return "예정된 신규 수금 일정이 아직 없습니다.";
    }

    return `${nextUnpaidPhase.projectName} 수금이 ${nextUnpaidPhase.dueDate.getMonth() + 1}월 ${nextUnpaidPhase.dueDate.getDate()}일에 ${formatCurrency(nextUnpaidPhase.amount)} 들어올 예정입니다.`;
  }, [projects, today]);

  const blockedInvoiceAmount = useMemo(
    () =>
      dummyTaxInvoices
        .filter((invoice) => invoice.type === "발행" && invoice.status === "미발행")
        .reduce((total, invoice) => total + invoice.total_amount, 0),
    []
  );

  const projectedYearEndReserve = useMemo(() => {
    const futureInflow = futureUnpaidRevenueValues
      .slice(currentMonth - 1)
      .reduce((total, value) => total + value, 0);
    const remainingMonths = 12 - currentMonth + 1;
    return Math.max(effectiveAvailableCash, 0) + futureInflow - monthlyOperatingBurn * remainingMonths - scheduledAdditionalOutflowTotal;
  }, [currentMonth, effectiveAvailableCash, futureUnpaidRevenueValues, monthlyOperatingBurn, scheduledAdditionalOutflowTotal]);

  const cashSummaryText = useMemo(() => {
    if (runwayMonths < 2) {
      return `지금은 자금 여유가 얇아요. 고정비와 예정 지출까지 보면 약 ${formatMonthCount(runwayMonths)} 정도만 더 버틸 수 있어서 바로 수금과 비용 조정이 필요해요.`;
    }
    if (runwayMonths < 5) {
      return `지금 자금 흐름이면 약 ${formatMonthCount(runwayMonths)}은 더 버틸 수 있어요. 다만 ${riskRangeLabels.join(", ") || "다음 분기"} 구간은 예정 지출까지 보면 선제 대응이 필요해요.`;
    }
    return `지금 자금 흐름이면 약 ${formatMonthCount(runwayMonths)}은 비교적 안정적으로 버틸 수 있어요. 그래도 ${riskRangeLabels.join(", ") || "연말"} 구간은 예정 지출 전에 미리 수금 장치를 만들어두는 편이 안전해요.`;
  }, [riskRangeLabels, runwayMonths]);

  const cashHelperText = useMemo(
    () =>
      `${savedCashBalance !== null ? "저장된 통장 잔액" : "추정 가용 현금"}은 ${formatCurrency(Math.max(effectiveAvailableCash, 0))}, 월 기본 운영비는 ${formatCurrency(monthlyOperatingBurn)}이고 추가 예정 지출은 ${formatCurrency(scheduledAdditionalOutflowTotal)}다. 연간 목표까지는 ${formatCurrency(annualTargetGap)} 남아 있고, 프로젝트 수금 일정상 ${riskRangeLabels.join(", ") || "당장 큰 위험 구간은 없는 상태"}를 주의해서 보면 된다.`,
    [annualTargetGap, effectiveAvailableCash, monthlyOperatingBurn, riskRangeLabels, savedCashBalance, scheduledAdditionalOutflowTotal]
  );

  const hasUnsavedCashBalance = useMemo(() => {
    const draftValue = Number(sanitizeNumericInput(cashBalanceDraft) || "0");
    const sourceValue = savedCashBalance !== null ? savedCashBalance : Math.max(Math.round(estimatedReserve), 0);
    return Number.isFinite(draftValue) && draftValue !== sourceValue;
  }, [cashBalanceDraft, estimatedReserve, savedCashBalance]);

  const pageTitle = useMemo(
    () => `${DASHBOARD_YEAR}년 ${monthLabel(goalMonth)} 메인 대시보드`,
    [goalMonth]
  );

  return (
    <>
      <Head>
        <title>{pageTitle} - WHYDLAB BIZ</title>
      </Head>

      <div className={s.page}>
        <DashboardHeaderCard />

        <CashPulseSection
          summaryText={cashSummaryText}
          helperText={cashHelperText}
          availableCash={effectiveAvailableCash}
          cashBalanceDraft={cashBalanceDraft}
          hasSavedCashBalance={savedCashBalance !== null}
          hasUnsavedCashBalance={hasUnsavedCashBalance}
          onCashBalanceChange={(value) => {
            setCashBalanceDirty(true);
            setCashBalanceDraft(sanitizeNumericInput(value));
          }}
          onCashBalanceSave={() => {
            const nextValue = Number(sanitizeNumericInput(cashBalanceDraft) || "0");
            if (!Number.isFinite(nextValue)) return;
            setSavedCashBalance(nextValue);
            setCashBalanceDraft(String(nextValue));
            setCashBalanceDirty(false);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(AVAILABLE_CASH_STORAGE_KEY, String(nextValue));
            }
          }}
          monthlyFixedBurn={monthlyFixedBurn}
          monthlyPayrollBurn={monthlyPayrollBurn}
          scheduledExpenseTotal={scheduledAdditionalOutflowTotal}
          annualTargetGap={annualTargetGap}
          runwayMonths={runwayMonths}
          riskRanges={riskRangeLabels}
          nextCashEvent={nextCashEvent}
          blockedInvoiceAmount={blockedInvoiceAmount}
          projectedYearEndReserve={projectedYearEndReserve}
        />

        <GoalSummarySection
          activeMonth={goalMonth}
          onPrevMonth={() => setGoalMonth((prev) => stepMonth(prev, -1))}
          onNextMonth={() => setGoalMonth((prev) => stepMonth(prev, 1))}
          showPercent={showPercent}
          showOrderAmount={showOrderAmount}
          onTogglePercent={() => setShowPercent((prev) => !prev)}
          onToggleOrderAmount={() => setShowOrderAmount((prev) => !prev)}
          monthlyActualValues={monthlyActualValues}
          monthlyOrderAmounts={monthlyOrderAmounts}
          monthlyOrderCounts={monthlyOrderCounts}
        />

        <RevenueProgressSection
          activeMonth={revenueMonth}
          onPrevMonth={() => setRevenueMonth((prev) => stepMonth(prev, -1))}
          onNextMonth={() => setRevenueMonth((prev) => stepMonth(prev, 1))}
          monthlyRevenueValues={monthlyRevenueValues}
          revenueTodayTotal={revenueTodayTotal}
          revenueYearTotal={revenueYearTotal}
        />
      </div>
    </>
  );
}
