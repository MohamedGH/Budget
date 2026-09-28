import {
  Transaction,
  BudgetCategory,
  FilterOptions,
  FinancialStats,
  CategorySpending,
  MonthlyCashFlow,
  Rule503020Data,
  DayOfWeekData,
  BudgetVarianceData,
  FixedVsVariableData,
} from '../types';

export const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const MONTH_SHORT_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
];

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function filterTransactions(
  transactions: Transaction[],
  filters: FilterOptions
): Transaction[] {
  return transactions.filter(tx => {
    // 1. Period Filter
    if (filters.period !== 'all') {
      if (filters.period === 'custom') {
        if (filters.customStartDate && tx.date < filters.customStartDate) return false;
        if (filters.customEndDate && tx.date > filters.customEndDate) return false;
      } else if (filters.period === 'last3months') {
        // Assume reference date is Aug 2026 (based on current dataset)
        const threeMonthsAgo = '2026-06-01';
        if (tx.date < threeMonthsAgo) return false;
      } else if (filters.period === 'last6months') {
        const sixMonthsAgo = '2026-03-01';
        if (tx.date < sixMonthsAgo) return false;
      } else if (filters.period.startsWith('2026-')) {
        if (!tx.date.startsWith(filters.period)) return false;
      }
    }

    // 2. Category Filter
    if (filters.category !== 'all' && tx.category !== filters.category) {
      return false;
    }

    // 3. Type Filter
    if (filters.type === 'income' && tx.amount < 0) return false;
    if (filters.type === 'expense' && tx.amount >= 0) return false;

    // 4. Reconciled / Pointée Status
    if (filters.reconciledStatus === 'reconciled' && !tx.isPointed) return false;
    if (filters.reconciledStatus === 'pending' && tx.isPointed) return false;

    // 5. Min / Max Amount
    if (filters.minAmount !== undefined && Math.abs(tx.amount) < filters.minAmount) return false;
    if (filters.maxAmount !== undefined && Math.abs(tx.amount) > filters.maxAmount) return false;

    // 6. Search keyword
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const matchLabel = tx.label.toLowerCase().includes(q);
      const matchDesc = (tx.rawDescription || '').toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchSubCat = (tx.subCategory || '').toLowerCase().includes(q);
      const matchAmount = tx.amount.toString().includes(q);
      if (!matchLabel && !matchDesc && !matchCat && !matchSubCat && !matchAmount) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    let comparison = 0;
    if (filters.sortBy === 'date') {
      comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (filters.sortBy === 'amount') {
      comparison = Math.abs(b.amount) - Math.abs(a.amount);
    } else if (filters.sortBy === 'label') {
      comparison = a.label.localeCompare(b.label);
    } else if (filters.sortBy === 'category') {
      comparison = a.category.localeCompare(b.category);
    }
    return filters.sortOrder === 'asc' ? -comparison : comparison;
  });
}

export function calculateFinancialStats(
  transactions: Transaction[],
  categories: BudgetCategory[]
): FinancialStats {
  let totalIncome = 0;
  let totalExpense = 0;
  let largestExpense: { label: string; amount: number; date: string } | null = null;

  const datesSet = new Set<string>();

  transactions.forEach(tx => {
    datesSet.add(tx.date);
    if (tx.amount > 0) {
      totalIncome += tx.amount;
    } else {
      const absAmount = Math.abs(tx.amount);
      totalExpense += absAmount;
      if (!largestExpense || absAmount > largestExpense.amount) {
        largestExpense = { label: tx.label, amount: absAmount, date: tx.date };
      }
    }
  });

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;

  // Sum monthly limits of expense categories
  const totalBudget = categories.reduce((sum, cat) => sum + (cat.monthlyLimit || 0), 0);
  const budgetUtilization = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

  const daysCount = Math.max(1, datesSet.size);
  const dailyAverageExpense = totalExpense / daysCount;

  return {
    totalIncome,
    totalExpense,
    netSavings,
    savingsRate,
    totalBudget,
    budgetUtilization,
    transactionCount: transactions.length,
    dailyAverageExpense,
    largestExpense,
  };
}

export function calculateCategorySpending(
  transactions: Transaction[],
  categories: BudgetCategory[]
): CategorySpending[] {
  const categoryMap = new Map<string, { spent: number; count: number; subCategories: { [k: string]: number } }>();

  // Filter only expenses
  transactions.filter(t => t.amount < 0).forEach(tx => {
    const catName = tx.category || 'Autres dépenses';
    const current = categoryMap.get(catName) || { spent: 0, count: 0, subCategories: {} };
    const absAmount = Math.abs(tx.amount);
    current.spent += absAmount;
    current.count += 1;

    const sub = tx.subCategory || 'Divers';
    current.subCategories[sub] = (current.subCategories[sub] || 0) + absAmount;

    categoryMap.set(catName, current);
  });

  const categorySpendingList: CategorySpending[] = [];

  // Add all existing categories
  categories.forEach(cat => {
    const data = categoryMap.get(cat.name) || { spent: 0, count: 0, subCategories: {} };
    const percentage = cat.monthlyLimit > 0 ? (data.spent / cat.monthlyLimit) * 100 : (data.spent > 0 ? 100 : 0);

    categorySpendingList.push({
      category: cat.name,
      spent: data.spent,
      budget: cat.monthlyLimit,
      percentage,
      color: cat.color,
      transactionCount: data.count,
      subCategories: data.subCategories,
    });

    categoryMap.delete(cat.name);
  });

  // Add any extra uncategorized groups that were in transactions
  categoryMap.forEach((data, catName) => {
    categorySpendingList.push({
      category: catName,
      spent: data.spent,
      budget: 0,
      percentage: 100,
      color: '#94a3b8',
      transactionCount: data.count,
      subCategories: data.subCategories,
    });
  });

  // Sort by spent descending
  return categorySpendingList.sort((a, b) => b.spent - a.spent);
}

export function calculateMonthlyCashFlow(transactions: Transaction[]): MonthlyCashFlow[] {
  const monthMap = new Map<string, { income: number; expense: number }>();

  transactions.forEach(tx => {
    if (!tx.date) return;
    const monthKey = tx.date.substring(0, 7); // "YYYY-MM"
    const current = monthMap.get(monthKey) || { income: 0, expense: 0 };
    if (tx.amount > 0) {
      current.income += tx.amount;
    } else {
      current.expense += Math.abs(tx.amount);
    }
    monthMap.set(monthKey, current);
  });

  const sortedMonths = Array.from(monthMap.keys()).sort();

  let cumulativeSavings = 0;
  return sortedMonths.map(month => {
    const data = monthMap.get(month)!;
    const net = data.income - data.expense;
    cumulativeSavings += net;

    const [year, mStr] = month.split('-');
    const mNum = parseInt(mStr, 10) - 1;
    const label = `${MONTH_SHORT_FR[mNum] || mStr} ${year}`;

    return {
      month,
      label,
      income: Number(data.income.toFixed(2)),
      expense: Number(data.expense.toFixed(2)),
      net: Number(net.toFixed(2)),
      cumulativeSavings: Number(cumulativeSavings.toFixed(2)),
    };
  });
}

export function calculateDailySpendingPacing(
  transactions: Transaction[],
  selectedMonth: string, // "YYYY-MM" or "all"
  monthlyBudget: number
) {
  if (selectedMonth === 'all' || !selectedMonth.startsWith('202')) {
    // Return aggregate spending by day of month
    const daysData: { day: number; spent: number; cumulative: number }[] = [];
    let cumulative = 0;
    const dayMap = new Map<number, number>();

    transactions.filter(t => t.amount < 0).forEach(t => {
      const day = parseInt(t.date.split('-')[2], 10) || 1;
      dayMap.set(day, (dayMap.get(day) || 0) + Math.abs(t.amount));
    });

    for (let day = 1; day <= 31; day++) {
      const spent = dayMap.get(day) || 0;
      cumulative += spent;
      daysData.push({ day, spent, cumulative: Number(cumulative.toFixed(2)) });
    }
    return daysData;
  }

  const [year, monthStr] = selectedMonth.split('-');
  const daysInMonth = new Date(parseInt(year, 10), parseInt(monthStr, 10), 0).getDate();
  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth) && t.amount < 0);

  const dayMap = new Map<number, number>();
  monthTransactions.forEach(t => {
    const day = parseInt(t.date.split('-')[2], 10);
    dayMap.set(day, (dayMap.get(day) || 0) + Math.abs(t.amount));
  });

  const pacingData = [];
  let cumulative = 0;
  const budgetPerDay = monthlyBudget > 0 ? monthlyBudget / daysInMonth : 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const spent = dayMap.get(day) || 0;
    cumulative += spent;
    const budgetTrajectory = Number((budgetPerDay * day).toFixed(2));

    pacingData.push({
      day: `J${day}`,
      dayNumber: day,
      dailySpent: Number(spent.toFixed(2)),
      cumulativeSpent: Number(cumulative.toFixed(2)),
      budgetTrajectory,
    });
  }

  return pacingData;
}

export function calculateTopPayees(transactions: Transaction[], limit: number = 8) {
  const payeeMap = new Map<string, { amount: number; count: number; category: string }>();

  transactions.filter(t => t.amount < 0).forEach(tx => {
    // Simplify label (e.g., "CARTE X0374 14/07 ADEO*LEROY MERLIN" -> "Leroy Merlin")
    let cleanName = tx.label;
    if (cleanName.includes('ADEO*LEROY MERLIN')) cleanName = 'Leroy Merlin';
    else if (cleanName.includes('AUCHAN')) cleanName = 'Auchan';
    else if (cleanName.includes('RELAIS LEZENNES')) cleanName = 'Relais Lezennes (Carburant)';
    else if (cleanName.includes('RELAIS LILLE DOREZ')) cleanName = 'Relais Lille Dorez';
    else if (cleanName.includes('STATIONNEM HOROD')) cleanName = 'Stationnement Horodateur';
    else if (cleanName.includes('CASH SERVICES') || cleanName.includes('RETRAIT DAB')) cleanName = 'Retraits DAB / Distributeurs';
    else if (cleanName.includes('WEB AMENDE')) cleanName = 'Amendes & Contraventions';
    else if (cleanName.includes('SFR')) cleanName = 'SFR Télécom';
    else if (cleanName.includes('COMPTOIR BOUCHER')) cleanName = 'Comptoir Boucher';
    else if (cleanName.includes('BOULANGERIE')) cleanName = 'Boulangerie';
    else if (cleanName.includes('NORAUTO')) cleanName = 'Norauto';
    else if (cleanName.includes('DOCTO CAR')) cleanName = 'Docto Car (Santé)';
    else if (cleanName.includes('CHEZ BOUALEM')) cleanName = 'Chez Boualem';
    else if (cleanName.includes('SAMI GHALLEB')) cleanName = 'Virement Sami Ghalleb';
    else if (cleanName.includes('FORF P.STAT')) cleanName = 'Forfait Stationnement Web';
    else if (cleanName.includes('PAIRIDAIZA')) cleanName = 'Pairi Daiza (Loisirs)';
    else if (cleanName.includes('NOUVELAIR')) cleanName = 'Nouvelair';
    else if (cleanName.includes('Opodo')) cleanName = 'Opodo';
    else if (cleanName.includes('TUNISAIR')) cleanName = 'Tunisair';

    const current = payeeMap.get(cleanName) || { amount: 0, count: 0, category: tx.category };
    current.amount += Math.abs(tx.amount);
    current.count += 1;
    payeeMap.set(cleanName, current);
  });

  return Array.from(payeeMap.entries())
    .map(([name, data]) => ({
      name,
      amount: Number(data.amount.toFixed(2)),
      count: data.count,
      category: data.category,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

/**
 * Calculates the standard 50/30/20 financial benchmark:
 * - 50% Needs (Essential living costs: housing, essential groceries, transport, healthcare, telecom)
 * - 30% Wants (Discretionary lifestyle: leisure, shopping, outings, travel, non-essential cash)
 * - 20% Savings (Financial cushion, debt repayment buffer, investments, positive cash-flow)
 */
export function calculate503020Rule(
  transactions: Transaction[],
  categories: BudgetCategory[],
  totalIncome: number,
  totalExpense: number
): Rule503020Data {
  const essentialCatNames = new Set(
    categories.filter(c => c.isEssential).map(c => c.name.toLowerCase())
  );

  let needsAmount = 0;
  let wantsAmount = 0;

  transactions.filter(t => t.amount < 0).forEach(tx => {
    const catNameLower = (tx.category || '').toLowerCase();
    const abs = Math.abs(tx.amount);

    if (
      essentialCatNames.has(catNameLower) ||
      catNameLower.includes('logement') ||
      catNameLower.includes('vie quotidienne') ||
      catNameLower.includes('auto') ||
      catNameLower.includes('santé') ||
      catNameLower.includes('abonnement') ||
      catNameLower.includes('service')
    ) {
      needsAmount += abs;
    } else {
      wantsAmount += abs;
    }
  });

  const baseIncome = totalIncome > 0 ? totalIncome : (needsAmount + wantsAmount);
  const netSavings = Math.max(0, totalIncome - totalExpense);

  const needsPercent = baseIncome > 0 ? (needsAmount / baseIncome) * 100 : 0;
  const wantsPercent = baseIncome > 0 ? (wantsAmount / baseIncome) * 100 : 0;
  const savingsPercent = baseIncome > 0 ? (netSavings / baseIncome) * 100 : 0;

  const targetNeeds = baseIncome * 0.50;
  const targetWants = baseIncome * 0.30;
  const targetSavings = baseIncome * 0.20;

  return {
    needs: {
      amount: Number(needsAmount.toFixed(2)),
      percent: Number(needsPercent.toFixed(1)),
      targetPercent: 50,
      targetAmount: Number(targetNeeds.toFixed(2)),
      difference: Number((needsAmount - targetNeeds).toFixed(2)),
      status: needsPercent <= 50 ? 'optimal' : needsPercent <= 60 ? 'warning' : 'excess',
    },
    wants: {
      amount: Number(wantsAmount.toFixed(2)),
      percent: Number(wantsPercent.toFixed(1)),
      targetPercent: 30,
      targetAmount: Number(targetWants.toFixed(2)),
      difference: Number((wantsAmount - targetWants).toFixed(2)),
      status: wantsPercent <= 30 ? 'optimal' : wantsPercent <= 38 ? 'warning' : 'excess',
    },
    savings: {
      amount: Number(netSavings.toFixed(2)),
      percent: Number(savingsPercent.toFixed(1)),
      targetPercent: 20,
      targetAmount: Number(targetSavings.toFixed(2)),
      difference: Number((netSavings - targetSavings).toFixed(2)),
      status: savingsPercent >= 20 ? 'optimal' : savingsPercent >= 10 ? 'warning' : 'deficit',
    },
  };
}

/**
 * Calculates budget variance (Budget - Actual Spent) per category.
 * Positive variance indicates surplus / budget saved.
 * Negative variance indicates budget overrun.
 */
export function calculateBudgetVarianceList(categoriesSpending: CategorySpending[]): BudgetVarianceData[] {
  return categoriesSpending
    .filter(c => c.budget > 0 || c.spent > 0)
    .map(c => {
      const variance = c.budget > 0 ? c.budget - c.spent : -c.spent;
      const percentUsed = c.budget > 0 ? (c.spent / c.budget) * 100 : 100;
      return {
        category: c.category,
        budget: Number(c.budget.toFixed(2)),
        spent: Number(c.spent.toFixed(2)),
        variance: Number(variance.toFixed(2)),
        percentUsed: Number(percentUsed.toFixed(1)),
        color: c.color,
      };
    })
    .sort((a, b) => a.variance - b.variance); // Show most exceeded/critical categories first
}

/**
 * Aggregates expenditures across days of the week (Lundi à Dimanche)
 * to uncover habitual spending rhythms and peak spending days.
 */
export function calculateDayOfWeekSpending(transactions: Transaction[]): DayOfWeekData[] {
  const daysMeta = [
    { index: 1, short: 'Lun', full: 'Lundi' },
    { index: 2, short: 'Mar', full: 'Mardi' },
    { index: 3, short: 'Mer', full: 'Mercredi' },
    { index: 4, short: 'Jeu', full: 'Jeudi' },
    { index: 5, short: 'Ven', full: 'Vendredi' },
    { index: 6, short: 'Sam', full: 'Samedi' },
    { index: 0, short: 'Dim', full: 'Dimanche' },
  ];

  const map = new Map<number, { total: number; count: number }>();
  daysMeta.forEach(d => map.set(d.index, { total: 0, count: 0 }));

  let grandTotal = 0;

  transactions.filter(t => t.amount < 0).forEach(tx => {
    if (!tx.date) return;
    const parts = tx.date.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      const dayIdx = d.getDay(); // 0 is Sunday, 1 is Monday
      const current = map.get(dayIdx) || { total: 0, count: 0 };
      const abs = Math.abs(tx.amount);
      current.total += abs;
      current.count += 1;
      grandTotal += abs;
      map.set(dayIdx, current);
    }
  });

  return daysMeta.map(d => {
    const data = map.get(d.index) || { total: 0, count: 0 };
    return {
      dayIndex: d.index,
      dayShort: d.short,
      dayFull: d.full,
      totalSpent: Number(data.total.toFixed(2)),
      count: data.count,
      avgPerTx: data.count > 0 ? Number((data.total / data.count).toFixed(2)) : 0,
      percent: grandTotal > 0 ? Number(((data.total / grandTotal) * 100).toFixed(1)) : 0,
    };
  });
}

/**
 * Calculates Fixed Charges (recurring obligations like housing, subscriptions, bills)
 * vs Variable Discretionary living expenses, and the resulting "Reste à vivre".
 */
export function calculateFixedVsVariable(
  transactions: Transaction[],
  categories: BudgetCategory[],
  totalIncome: number
): FixedVsVariableData {
  let fixedAmount = 0;
  let fixedExpenseCount = 0;
  let variableAmount = 0;
  let variableExpenseCount = 0;

  transactions.filter(t => t.amount < 0).forEach(tx => {
    const catLower = (tx.category || '').toLowerCase();
    const labelLower = (tx.label || '').toLowerCase();
    const abs = Math.abs(tx.amount);

    // Common fixed contractual bills: rent, utilities, subscriptions, insurance, loans
    const isFixed =
      catLower.includes('logement') ||
      catLower.includes('abonnement') ||
      labelLower.includes('sfr') ||
      labelLower.includes('edf') ||
      labelLower.includes('assurance') ||
      labelLower.includes('loyer') ||
      labelLower.includes('forfait') ||
      (catLower.includes('services') && !labelLower.includes('frais'));

    if (isFixed) {
      fixedAmount += abs;
      fixedExpenseCount += 1;
    } else {
      variableAmount += abs;
      variableExpenseCount += 1;
    }
  });

  const totalExp = fixedAmount + variableAmount;
  const fixedPercent = totalExp > 0 ? (fixedAmount / totalExp) * 100 : 0;
  const variablePercent = totalExp > 0 ? (variableAmount / totalExp) * 100 : 0;
  const disposableIncome = Math.max(0, totalIncome - fixedAmount);

  return {
    fixedAmount: Number(fixedAmount.toFixed(2)),
    fixedPercent: Number(fixedPercent.toFixed(1)),
    variableAmount: Number(variableAmount.toFixed(2)),
    variablePercent: Number(variablePercent.toFixed(1)),
    disposableIncome: Number(disposableIncome.toFixed(2)),
    fixedExpenseCount,
    variableExpenseCount,
  };
}
