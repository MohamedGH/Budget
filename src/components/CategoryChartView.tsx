import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  AreaChart,
  Area,
  ComposedChart,
} from 'recharts';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  Edit2,
  Filter,
  Sparkles,
  Hammer,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Transaction, BudgetCategory, CategorySpending } from '../types';
import { formatCurrency, formatDate, MONTH_NAMES_FR } from '../utils/budgetCalculations';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';

interface CategoryChartViewProps {
  categories: BudgetCategory[];
  transactions: Transaction[];
  categoriesSpending: CategorySpending[];
  initialCategoryName?: string;
  onOpenAddTx: () => void;
  onOpenBudgets: () => void;
  onQuickEditTx: (tx: Transaction) => void;
}

export const CategoryChartView: React.FC<CategoryChartViewProps> = ({
  categories,
  transactions,
  categoriesSpending,
  initialCategoryName = 'Travaux',
  onOpenAddTx,
  onOpenBudgets,
  onQuickEditTx,
}) => {
  // Active selected category
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>(() => {
    if (initialCategoryName && categories.some(c => c.name.toLowerCase() === initialCategoryName.toLowerCase())) {
      return initialCategoryName;
    }
    return categories.length > 0 ? categories[0].name : 'Travaux';
  });

  const selectedCategoryObj = useMemo(() => {
    return categories.find(c => c.name.toLowerCase() === selectedCategoryName.toLowerCase()) || categories[0];
  }, [categories, selectedCategoryName]);

  const selectedSpending = useMemo(() => {
    return (
      categoriesSpending.find(c => c.category.toLowerCase() === selectedCategoryName.toLowerCase()) || {
        category: selectedCategoryName,
        spent: 0,
        budget: selectedCategoryObj?.monthlyLimit || 0,
        percentage: 0,
        color: selectedCategoryObj?.color || '#ea580c',
        transactionCount: 0,
        subCategories: {},
      }
    );
  }, [categoriesSpending, selectedCategoryName, selectedCategoryObj]);

  // Transactions for this category
  const categoryTransactions = useMemo(() => {
    return transactions.filter(t => t.category.toLowerCase() === selectedCategoryName.toLowerCase());
  }, [transactions, selectedCategoryName]);

  // 1. Monthly History for this specific category
  const monthlyCategoryData = useMemo(() => {
    const monthMap = new Map<string, number>();

    // Init months
    const allMonths = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
    allMonths.forEach(m => monthMap.set(m, 0));

    categoryTransactions.forEach(tx => {
      const ym = tx.date.substring(0, 7);
      if (tx.amount < 0) {
        const current = monthMap.get(ym) || 0;
        monthMap.set(ym, current + Math.abs(tx.amount));
      }
    });

    const budgetLimit = selectedCategoryObj?.monthlyLimit || 0;

    return allMonths.map(ym => {
      const monthNum = parseInt(ym.split('-')[1], 10) - 1;
      const spent = monthMap.get(ym) || 0;
      return {
        monthKey: ym,
        monthLabel: `${MONTH_NAMES_FR[monthNum]}`,
        spent: Number(spent.toFixed(2)),
        budget: budgetLimit,
        variance: budgetLimit > 0 ? Number((budgetLimit - spent).toFixed(2)) : 0,
      };
    });
  }, [categoryTransactions, selectedCategoryObj]);

  // 2. Subcategories Breakdown Pie data
  const subCategoryPieData = useMemo(() => {
    const subMap: { [key: string]: number } = {};
    categoryTransactions.forEach(tx => {
      if (tx.amount < 0) {
        const sub = tx.subCategory?.trim() || 'Général / Non ventilé';
        subMap[sub] = (subMap[sub] || 0) + Math.abs(tx.amount);
      }
    });

    const colors = [
      selectedCategoryObj?.color || '#ea580c',
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899',
      '#06b6d4',
      '#64748b',
    ];

    return Object.entries(subMap)
      .map(([name, value], index) => ({
        name,
        value: Number(value.toFixed(2)),
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryTransactions, selectedCategoryObj]);

  // 3. Top Payees for this Category
  const topCategoryPayees = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    categoryTransactions.forEach(tx => {
      if (tx.amount < 0) {
        const key = tx.label.trim();
        const existing = map.get(key) || { count: 0, total: 0 };
        map.set(key, {
          count: existing.count + 1,
          total: existing.total + Math.abs(tx.amount),
        });
      }
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        amount: Number(data.total.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [categoryTransactions]);

  // Metrics
  const totalSpent = selectedSpending.spent;
  const budgetLimit = selectedCategoryObj?.monthlyLimit || 0;
  const isOverBudget = budgetLimit > 0 && totalSpent > budgetLimit;
  const avgTicket =
    selectedSpending.transactionCount > 0
      ? totalSpent / selectedSpending.transactionCount
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Category Selection Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-2xs"
              style={{ backgroundColor: getCategoryColor(selectedCategoryName) }}
            >
              <CategoryIcon name={selectedCategoryObj?.iconName || 'Tag'} className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Visualisation & Analyse : {selectedCategoryName}
              </h2>
              <p className="text-xs text-slate-500">
                Explorez l'évolution, les sous-postes et les bénéficiaires de cette catégorie
              </p>
            </div>
          </div>

          {/* Quick Category switcher */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="select-active-category-chart"
              value={selectedCategoryName}
              onChange={e => setSelectedCategoryName(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
            >
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name} {c.name === 'Travaux' ? '⭐ (Nouveau)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category quick buttons pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          {categories.map(c => {
            const isSelected = c.name.toLowerCase() === selectedCategoryName.toLowerCase();
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryName(c.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? '#fff' : c.color }}
                />
                <span>{c.name}</span>
                {c.name === 'Travaux' && (
                  <span className="text-[10px] bg-orange-500 text-white px-1 rounded-sm">★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI summary cards for this specific category */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Dépensé ({selectedCategoryName})
          </span>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(totalSpent)}
          </div>
          <p className="text-[11px] text-slate-400">
            Sur l'ensemble de la période filtrée
          </p>
        </div>

        {/* Budget Limit & Status */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Plafond Budgétaire
            </span>
            {budgetLimit > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isOverBudget ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isOverBudget ? 'Dépassement' : 'Conforme'}
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-slate-900">
            {budgetLimit > 0 ? formatCurrency(budgetLimit) : 'Sans plafond'}
          </div>
          <p className="text-[11px] text-slate-400">
            {budgetLimit > 0
              ? `${selectedSpending.percentage.toFixed(0)}% du plafond mensuel utilisé`
              : 'Cliquez sur Plafonds pour configurer une limite'}
          </p>
        </div>

        {/* Transaction count */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Nombre d'Écritures
          </span>
          <div className="text-2xl font-black text-slate-900">
            {selectedSpending.transactionCount}
          </div>
          <p className="text-[11px] text-slate-400">
            Opérations répertoriées dans {selectedCategoryName}
          </p>
        </div>

        {/* Average Ticket */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Panier Moyen / Transaction
          </span>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(avgTicket)}
          </div>
          <p className="text-[11px] text-slate-400">
            Montant moyen par acte de dépense
          </p>
        </div>
      </div>

      {/* Main Charts: Evolution Monthly Trend + Subcategory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Trend for Selected Category (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Évolution Mensuelle : {selectedCategoryName}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Comparatif des dépenses réelles par mois vs plafond budgétaire alloué
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: getCategoryColor(selectedCategoryName) }}
                />{' '}
                Dépenses Réelles
              </span>
              {budgetLimit > 0 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" /> Plafond
                </span>
              )}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyCategoryData}
                margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={v => `${v}€`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val)), 'Montant Dépensé']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="spent"
                  name="Dépensé"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                  fill={getCategoryColor(selectedCategoryName)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subcategories Breakdown Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Sous-Postes & Ventilation Interne
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Répartition par type d'achat au sein de {selectedCategoryName}
            </p>
          </div>

          {subCategoryPieData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 items-center">
              <div className="h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Dépense']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Pie
                      data={subCategoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {subCategoryPieData.map((entry, index) => (
                        <Cell key={`sub-pie-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs max-h-44 overflow-y-auto">
                {subCategoryPieData.map(item => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[170px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-700 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              Aucune dépense enregistrée dans cette catégorie
            </div>
          )}
        </div>
      </div>

      {/* Top Payees in Category & Recent Category Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Payees (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Commerçants Fréquentés ({selectedCategoryName})
            </h3>
            <span className="text-[11px] text-slate-400">Top 5</span>
          </div>

          <div className="space-y-2">
            {topCategoryPayees.length > 0 ? (
              topCategoryPayees.map((p, idx) => (
                <div key={p.name} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 truncate max-w-[180px]">
                      #{idx + 1} {p.name}
                    </span>
                    <span className="font-black text-slate-900">{formatCurrency(p.amount)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {p.count} transaction{p.count > 1 ? 's' : ''}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-4">
                Aucun commerce répertorié
              </div>
            )}
          </div>
        </div>

        {/* Transactions Table for this category (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Opérations de la Catégorie ({categoryTransactions.length})
              </h3>
              <p className="text-xs text-slate-500">
                Historique des écritures classées sous « {selectedCategoryName} »
              </p>
            </div>
            <button
              onClick={onOpenAddTx}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter une opération</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider sticky top-0">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Libellé</th>
                  <th className="p-2.5">Sous-catégorie / Notes</th>
                  <th className="p-2.5 text-right">Montant</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryTransactions.length > 0 ? (
                  categoryTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2.5 whitespace-nowrap font-medium text-slate-900">
                        {formatDate(tx.date)}
                      </td>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-900 truncate max-w-[200px]" title={tx.label}>
                          {tx.label}
                        </div>
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-500">
                        {tx.notes ? (
                          <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                            {tx.notes}
                          </span>
                        ) : (
                          tx.subCategory || '—'
                        )}
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap font-black text-slate-900">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => onQuickEditTx(tx)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Modifier la catégorie / note"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      Aucune transaction dans cette catégorie pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
