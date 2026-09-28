export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  bookingDate?: string; // YYYY-MM-DD
  accountNumber?: string;
  accountLabel?: string;
  label: string;
  rawDescription?: string;
  category: string;
  subCategory?: string;
  amount: number; // positive for income, negative for expense
  isPointed: boolean; // Pointée / Reconciled
  currency: string;
  notes?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  color: string;
  monthlyLimit: number;
  iconName: string;
  isEssential?: boolean;
}

export type PeriodFilter = 
  | 'all'
  | '2026-08'
  | '2026-07'
  | '2026-06'
  | '2026-05'
  | '2026-04'
  | '2026-03'
  | '2026-02'
  | 'last3months'
  | 'last6months'
  | 'custom';

export interface FilterOptions {
  period: PeriodFilter;
  customStartDate?: string;
  customEndDate?: string;
  category: string; // 'all' or category name
  type: 'all' | 'income' | 'expense';
  search: string;
  minAmount?: number;
  maxAmount?: number;
  reconciledStatus: 'all' | 'reconciled' | 'pending';
  sortBy: 'date' | 'amount' | 'label' | 'category';
  sortOrder: 'asc' | 'desc';
}

export interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // percentage (0 - 100)
  totalBudget: number;
  budgetUtilization: number; // percentage (0 - 100+)
  transactionCount: number;
  dailyAverageExpense: number;
  largestExpense: { label: string; amount: number; date: string } | null;
}

export interface CategorySpending {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  color: string;
  transactionCount: number;
  subCategories: { [subCat: string]: number };
}

export interface MonthlyCashFlow {
  month: string; // "YYYY-MM" or "Aug 2026"
  label: string;
  income: number;
  expense: number;
  net: number;
  cumulativeSavings: number;
}

export interface ColumnMapping {
  dateCol: number;
  labelCol: number;
  rawDescCol?: number;
  categoryCol?: number;
  subCategoryCol?: number;
  amountCol: number;
  pointedCol?: number;
  accountCol?: number;
}

export interface Rule503020Data {
  needs: {
    amount: number;
    percent: number;
    targetPercent: number;
    targetAmount: number;
    difference: number;
    status: 'optimal' | 'warning' | 'excess';
  };
  wants: {
    amount: number;
    percent: number;
    targetPercent: number;
    targetAmount: number;
    difference: number;
    status: 'optimal' | 'warning' | 'excess';
  };
  savings: {
    amount: number;
    percent: number;
    targetPercent: number;
    targetAmount: number;
    difference: number;
    status: 'optimal' | 'warning' | 'deficit';
  };
}

export interface DayOfWeekData {
  dayIndex: number;
  dayShort: string;
  dayFull: string;
  totalSpent: number;
  count: number;
  avgPerTx: number;
  percent: number;
}

export interface BudgetVarianceData {
  category: string;
  budget: number;
  spent: number;
  variance: number; // budget - spent (positive: surplus, negative: overrun)
  percentUsed: number;
  color: string;
}

export interface FixedVsVariableData {
  fixedAmount: number;
  fixedPercent: number;
  variableAmount: number;
  variablePercent: number;
  disposableIncome: number; // income - fixed
  fixedExpenseCount: number;
  variableExpenseCount: number;
}
