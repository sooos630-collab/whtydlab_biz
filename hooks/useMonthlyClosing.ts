import { useMemo } from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { dummyFixedCosts, dummyExecLabor, dummyEmployeeSalaries, dummyOutsourceLabor } from "@/data/dummy-finance";

export interface MonthlyClosing {
  month: string; // YYYY-MM
  supplyIncome: number;
  vatIncome: number;
  totalIncome: number;
  fixedCost: number;
  salary: number;
  etcExpense: number;
  etcMemo: string;
  totalExpense: number;
  netProfit: number;
  confirmed: boolean;
}

export interface YearTotals {
  supply: number;
  vat: number;
  totalIncome: number;
  fixed: number;
  salary: number;
  etc: number;
  totalExpense: number;
  net: number;
}

function loadEtcData(): Record<string, { amount: number; memo: string }> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("whydlab_etc_expense") : null;
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function loadConfirmed(): Record<string, boolean> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("whydlab_closing_confirmed") : null;
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function useMonthlyClosing(year: number, etcOverride?: Record<string, { amount: number; memo: string }>, confirmedOverride?: Record<string, boolean>) {
  const { projects } = useProjects();
  const etcData = etcOverride ?? loadEtcData();
  const confirmedMonths = confirmedOverride ?? loadConfirmed();

  const monthlyData = useMemo<MonthlyClosing[]>(() => {
    const months = Array.from({ length: 12 }, (_, i) =>
      `${year}-${String(i + 1).padStart(2, "0")}`
    );

    return months.map((ym) => {
      // 수입: phase.amount = VAT 포함. supply/total 비율로 분리
      let supplyIncome = 0;
      let vatIncome = 0;
      for (const proj of projects) {
        const total = proj.total_amount_num || proj.contract_amount;
        const supplyRatio = total > 0 ? proj.supply_amount / total : 1 / 1.1;
        const vatRatioOfTotal = total > 0 ? proj.vat_amount / total : 0.1 / 1.1;
        for (const phase of proj.payment_phases) {
          const paidDate = phase.paid ? (phase.paid_date ?? phase.due_date) : null;
          if (paidDate && paidDate.slice(0, 7) === ym) {
            supplyIncome += Math.round(phase.amount * supplyRatio);
            vatIncome += Math.round(phase.amount * vatRatioOfTotal);
          }
        }
      }

      // 고정비
      let fixedCost = 0;
      const monthNum = Number(ym.slice(5, 7)) - 1;
      for (const cost of dummyFixedCosts) {
        if (cost.status !== "활성") continue;
        if (cost.billing_cycle === "월") fixedCost += cost.amount;
        else if (cost.billing_cycle === "분기" && monthNum % 3 === 0) fixedCost += cost.amount;
        else if (cost.billing_cycle === "반기" && monthNum % 6 === 0) fixedCost += cost.amount;
        else if (cost.billing_cycle === "연" && monthNum === 2) fixedCost += cost.amount;
      }

      // 인건비
      let salary = 0;
      for (const exec of dummyExecLabor) {
        if (exec.month === ym) salary += exec.net_amount;
      }
      for (const emp of dummyEmployeeSalaries) {
        if (emp.month === ym) salary += emp.net_salary;
      }
      for (const out of dummyOutsourceLabor) {
        if (out.pay_date && out.pay_date.slice(0, 7) === ym && out.paid_amount > 0) salary += out.paid_amount;
      }

      // 기타지출
      const etc = etcData[ym] ?? { amount: 0, memo: "" };

      const totalIncome = supplyIncome + vatIncome;
      const totalExpense = fixedCost + salary + etc.amount;
      const netProfit = supplyIncome - totalExpense;

      return {
        month: ym,
        supplyIncome,
        vatIncome,
        totalIncome,
        fixedCost,
        salary,
        etcExpense: etc.amount,
        etcMemo: etc.memo,
        totalExpense,
        netProfit,
        confirmed: !!confirmedMonths[ym],
      };
    });
  }, [year, projects, etcData, confirmedMonths]);

  const yearTotals = useMemo<YearTotals>(() => {
    const t = { supply: 0, vat: 0, totalIncome: 0, fixed: 0, salary: 0, etc: 0, totalExpense: 0, net: 0 };
    for (const m of monthlyData) {
      t.supply += m.supplyIncome;
      t.vat += m.vatIncome;
      t.totalIncome += m.totalIncome;
      t.fixed += m.fixedCost;
      t.salary += m.salary;
      t.etc += m.etcExpense;
      t.totalExpense += m.totalExpense;
      t.net += m.netProfit;
    }
    return t;
  }, [monthlyData]);

  return { monthlyData, yearTotals, projects };
}
