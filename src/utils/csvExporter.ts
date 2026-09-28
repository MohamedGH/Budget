import { Transaction, BudgetCategory, CategorySpending, MonthlyCashFlow } from '../types';

interface ExportOptions {
  delimiter?: ';' | ',';
  includeQuotes?: boolean;
  filename?: string;
}

// Helper to escape CSV cell value
function formatCsvCell(val: string | number | boolean | undefined | null, delimiter: string): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Download helper with UTF-8 BOM for Microsoft Excel compatibility
function triggerDownload(csvContent: string, filename: string) {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export 1: Filtered Transactions CSV
export function exportTransactionsToCsv(
  transactions: Transaction[],
  options: ExportOptions = {}
): string {
  const delimiter = options.delimiter || ';';
  const filename = options.filename || `transactions_report_${new Date().toISOString().split('T')[0]}.csv`;

  const headers = [
    'Date',
    'Date comptabilisation',
    'Compte',
    'Libellé opération',
    'Détail / Motif',
    'Catégorie',
    'Sous-Catégorie',
    'Type',
    'Montant (€)',
    'Rapprochée (Pointée)',
    'Devise',
    'Notes'
  ];

  const rows = transactions.map(tx => [
    tx.date,
    tx.bookingDate || tx.date,
    tx.accountLabel || tx.accountNumber || 'Compte Bancaire',
    tx.label,
    tx.rawDescription || '',
    tx.category,
    tx.subCategory || '',
    tx.amount >= 0 ? 'Revenu' : 'Dépense',
    delimiter === ';' ? tx.amount.toFixed(2).replace('.', ',') : tx.amount.toFixed(2),
    tx.isPointed ? 'Oui' : 'Non',
    tx.currency || 'EUR',
    tx.notes || ''
  ]);

  const csvContent = [
    headers.map(h => formatCsvCell(h, delimiter)).join(delimiter),
    ...rows.map(row => row.map(cell => formatCsvCell(cell, delimiter)).join(delimiter))
  ].join('\r\n');

  triggerDownload(csvContent, filename);
  return csvContent;
}

// Export 2: Budget Performance & Category Summary CSV
export function exportBudgetSummaryReport(
  categoriesSpending: CategorySpending[],
  categories: BudgetCategory[],
  periodLabel: string,
  totalIncome: number,
  totalExpense: number,
  options: ExportOptions = {}
): string {
  const delimiter = options.delimiter || ';';
  const filename = options.filename || `budget_performance_report_${periodLabel.replace(/\s+/g, '_')}.csv`;

  const metaRows = [
    ['RAPPORT DE PERFORMANCE BUDGÉTAIRE ET ANALYTIQUE', ''],
    ['Période analysée', periodLabel],
    ['Généré le', new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR')],
    ['Revenus Totaux (€)', delimiter === ';' ? totalIncome.toFixed(2).replace('.', ',') : totalIncome.toFixed(2)],
    ['Dépenses Totales (€)', delimiter === ';' ? totalExpense.toFixed(2).replace('.', ',') : totalExpense.toFixed(2)],
    ['Épargne Nette (€)', delimiter === ';' ? (totalIncome - totalExpense).toFixed(2).replace('.', ',') : (totalIncome - totalExpense).toFixed(2)],
    ['Taux d\'épargne', `${totalIncome > 0 ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : '0'} %`],
    ['', '']
  ];

  const headers = [
    'Catégorie',
    'Budget Alloué (€)',
    'Dépenses Réelles (€)',
    'Écart / Reste (€)',
    'Utilisation (%)',
    'Statut Budget',
    'Nombre d\'opérations'
  ];

  const categoryRows = categoriesSpending.map(cat => {
    const remaining = cat.budget - cat.spent;
    let status = 'Dans les clous';
    if (cat.budget > 0) {
      if (cat.percentage >= 100) status = 'DÉPASSÉ';
      else if (cat.percentage >= 80) status = 'Attention (>80%)';
    } else {
      status = 'Sans budget';
    }

    return [
      cat.category,
      delimiter === ';' ? cat.budget.toFixed(2).replace('.', ',') : cat.budget.toFixed(2),
      delimiter === ';' ? cat.spent.toFixed(2).replace('.', ',') : cat.spent.toFixed(2),
      delimiter === ';' ? remaining.toFixed(2).replace('.', ',') : remaining.toFixed(2),
      cat.budget > 0 ? `${cat.percentage.toFixed(1)} %` : 'N/A',
      status,
      cat.transactionCount
    ];
  });

  const csvContent = [
    ...metaRows.map(row => row.map(c => formatCsvCell(c, delimiter)).join(delimiter)),
    headers.map(h => formatCsvCell(h, delimiter)).join(delimiter),
    ...categoryRows.map(row => row.map(cell => formatCsvCell(cell, delimiter)).join(delimiter))
  ].join('\r\n');

  triggerDownload(csvContent, filename);
  return csvContent;
}

// Export 3: Monthly Cash Flow & Trend CSV
export function exportCashFlowReport(
  monthlyFlows: MonthlyCashFlow[],
  options: ExportOptions = {}
): string {
  const delimiter = options.delimiter || ';';
  const filename = options.filename || `cashflow_trend_report_${new Date().toISOString().split('T')[0]}.csv`;

  const headers = [
    'Mois',
    'Revenus (€)',
    'Dépenses (€)',
    'Solde Net (€)',
    'Épargne Cumulée (€)',
    'Taux d\'Épargne (%)'
  ];

  const rows = monthlyFlows.map(flow => {
    const rate = flow.income > 0 ? ((flow.net / flow.income) * 100).toFixed(1) : '0';
    return [
      flow.label,
      delimiter === ';' ? flow.income.toFixed(2).replace('.', ',') : flow.income.toFixed(2),
      delimiter === ';' ? flow.expense.toFixed(2).replace('.', ',') : flow.expense.toFixed(2),
      delimiter === ';' ? flow.net.toFixed(2).replace('.', ',') : flow.net.toFixed(2),
      delimiter === ';' ? flow.cumulativeSavings.toFixed(2).replace('.', ',') : flow.cumulativeSavings.toFixed(2),
      `${rate} %`
    ];
  });

  const csvContent = [
    headers.map(h => formatCsvCell(h, delimiter)).join(delimiter),
    ...rows.map(row => row.map(cell => formatCsvCell(cell, delimiter)).join(delimiter))
  ].join('\r\n');

  triggerDownload(csvContent, filename);
  return csvContent;
}
