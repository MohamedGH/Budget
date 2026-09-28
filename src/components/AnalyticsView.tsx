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
  ReferenceLine,
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Scale,
  Wallet,
  Sparkles,
  SlidersHorizontal,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Compass,
} from 'lucide-react';
import {
  CategorySpending,
  MonthlyCashFlow,
  FinancialStats,
  PeriodFilter,
  Transaction,
  BudgetCategory,
  Rule503020Data,
  DayOfWeekData,
  BudgetVarianceData,
  FixedVsVariableData,
} from '../types';
import {
  formatCurrency,
  calculateDailySpendingPacing,
  calculateTopPayees,
  calculate503020Rule,
  calculateBudgetVarianceList,
  calculateDayOfWeekSpending,
  calculateFixedVsVariable,
} from '../utils/budgetCalculations';
import { CategoryIcon } from './CategoryIcon';

interface AnalyticsViewProps {
  stats: FinancialStats;
  categoriesSpending: CategorySpending[];
  monthlyCashFlow: MonthlyCashFlow[];
  transactions: Transaction[];
  categories: BudgetCategory[];
  period: PeriodFilter;
  onSelectCategoryFilter: (cat: string) => void;
  onOpenBudgets: () => void;
}

type AnalyticsTab = 'all' | '50-30-20' | 'variance' | 'cashflow' | 'habits';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  categoriesSpending,
  monthlyCashFlow,
  transactions,
  categories,
  period,
  onSelectCategoryFilter,
  onOpenBudgets,
}) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('all');
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number | null>(null);
  const [selectedDonutCat, setSelectedDonutCat] = useState<CategorySpending | null>(
    categoriesSpending.length > 0 ? categoriesSpending[0] : null
  );
  const [varianceFilter, setVarianceFilter] = useState<'all' | 'over' | 'under'>('all');

  // 1. Calculate 50/30/20 Rule Data
  const rule503020 = useMemo<Rule503020Data>(() => {
    return calculate503020Rule(transactions, categories, stats.totalIncome, stats.totalExpense);
  }, [transactions, categories, stats.totalIncome, stats.totalExpense]);

  // Chart data for 50/30/20 comparative bars
  const ruleChartData = useMemo(() => [
    {
      pillar: 'Besoins Vitaux',
      targetPercent: 50,
      actualPercent: rule503020.needs.percent,
      actualAmount: rule503020.needs.amount,
      targetAmount: rule503020.needs.targetAmount,
      diffAmount: rule503020.needs.difference,
      fillActual: rule503020.needs.status === 'optimal' ? '#2563eb' : '#e11d48',
    },
    {
      pillar: 'Envies & Loisirs',
      targetPercent: 30,
      actualPercent: rule503020.wants.percent,
      actualAmount: rule503020.wants.amount,
      targetAmount: rule503020.wants.targetAmount,
      diffAmount: rule503020.wants.difference,
      fillActual: rule503020.wants.status === 'optimal' ? '#7c3aed' : '#f59e0b',
    },
    {
      pillar: 'Épargne Réelle',
      targetPercent: 20,
      actualPercent: rule503020.savings.percent,
      actualAmount: rule503020.savings.amount,
      targetAmount: rule503020.savings.targetAmount,
      diffAmount: rule503020.savings.difference,
      fillActual: rule503020.savings.status === 'optimal' ? '#10b981' : '#f43f5e',
    },
  ], [rule503020]);

  // 2. Budget Variance Data
  const allVariances = useMemo<BudgetVarianceData[]>(() => {
    return calculateBudgetVarianceList(categoriesSpending);
  }, [categoriesSpending]);

  const filteredVariances = useMemo(() => {
    if (varianceFilter === 'over') return allVariances.filter(v => v.variance < 0);
    if (varianceFilter === 'under') return allVariances.filter(v => v.variance > 0);
    return allVariances;
  }, [allVariances, varianceFilter]);

  // 3. Day of Week Habits Data
  const dayOfWeekData = useMemo<DayOfWeekData[]>(() => {
    return calculateDayOfWeekSpending(transactions);
  }, [transactions]);

  const peakDay = useMemo(() => {
    return [...dayOfWeekData].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  }, [dayOfWeekData]);

  const weekendSpend = useMemo(() => {
    const sat = dayOfWeekData.find(d => d.dayIndex === 6)?.totalSpent || 0;
    const sun = dayOfWeekData.find(d => d.dayIndex === 0)?.totalSpent || 0;
    return sat + sun;
  }, [dayOfWeekData]);

  const weekdaySpend = useMemo(() => {
    return dayOfWeekData
      .filter(d => d.dayIndex !== 0 && d.dayIndex !== 6)
      .reduce((sum, d) => sum + d.totalSpent, 0);
  }, [dayOfWeekData]);

  // 4. Fixed vs Variable Data
  const fixedVsVariable = useMemo<FixedVsVariableData>(() => {
    return calculateFixedVsVariable(transactions, categories, stats.totalIncome);
  }, [transactions, categories, stats.totalIncome]);

  // 5. Daily Pacing Curve
  const pacingData = useMemo(() => {
    return calculateDailySpendingPacing(
      transactions,
      period.startsWith('2026-') ? period : '2026-08',
      stats.totalBudget
    );
  }, [transactions, period, stats.totalBudget]);

  // 6. Top Payees
  const topPayees = useMemo(() => {
    return calculateTopPayees(transactions, 6);
  }, [transactions]);

  // 7. Pie / Donut Data
  const pieData = useMemo(() => {
    return categoriesSpending
      .filter(c => c.spent > 0)
      .map(c => ({
        name: c.category,
        value: Number(c.spent.toFixed(2)),
        color: c.color,
        count: c.transactionCount,
        budget: c.budget,
        percentage: c.percentage,
        subCategories: c.subCategories,
      }));
  }, [categoriesSpending]);

  const totalPieSpent = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      {/* Visual Analytics Navigation & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900">Analyses Disponibles :</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            id="tab-analytics-all"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            id="tab-analytics-50-30-20"
            onClick={() => setActiveTab('50-30-20')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === '50-30-20'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-blue-400" />
            <span>Règle 50/30/20</span>
          </button>
          <button
            id="tab-analytics-variance"
            onClick={() => setActiveTab('variance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'variance'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span>Écarts Réel vs Plafonds</span>
          </button>
          <button
            id="tab-analytics-cashflow"
            onClick={() => setActiveTab('cashflow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cashflow'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Trésorerie & Flux</span>
          </button>
          <button
            id="tab-analytics-habits"
            onClick={() => setActiveTab('habits')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'habits'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span>Habitudes & Pacing</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: 50/30/20 BENCHMARK & FINANCIAL HEALTH (Visible in 'all' or '50-30-20') */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === '50-30-20') && (
        <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Diagnostic d'Équilibre Financier (Méthode 50 / 30 / 20)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Comparaison de votre répartition budgétaire réelle face au standard financier préconisé
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Revenus de référence :</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(stats.totalIncome > 0 ? stats.totalIncome : stats.totalExpense)}
              </span>
            </div>
          </div>

          {/* 3 Metric Cards for Needs, Wants, Savings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Besoins */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                    Besoins Vitaux & Essentiels
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      rule503020.needs.status === 'optimal'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {rule503020.needs.status === 'optimal' ? 'Sous contrôle' : 'Seuil dépassé'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatCurrency(rule503020.needs.amount)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({rule503020.needs.percent.toFixed(1)}% / 50% max)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Logement, alimentation du quotidien, transports indispensables, santé et abonnements.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Cible théorique (50%) :</span>
                <span className="font-semibold text-slate-700">
                  {formatCurrency(rule503020.needs.targetAmount)}
                </span>
              </div>
            </div>

            {/* 2. Envies & Loisirs */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                    Envies, Loisirs & Confort
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      rule503020.wants.status === 'optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rule503020.wants.status === 'optimal' ? 'Équilibré' : 'Vigilance'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatCurrency(rule503020.wants.amount)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({rule503020.wants.percent.toFixed(1)}% / 30% max)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Sorties, restaurants, voyages, shopping, loisirs et dépenses discrétionnaires.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Cible théorique (30%) :</span>
                <span className="font-semibold text-slate-700">
                  {formatCurrency(rule503020.wants.targetAmount)}
                </span>
              </div>
            </div>

            {/* 3. Épargne & Investissements */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                    Épargne & Capacité d'Avenir
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      rule503020.savings.status === 'optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rule503020.savings.status === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {rule503020.savings.status === 'optimal'
                      ? 'Objectif atteint'
                      : rule503020.savings.status === 'warning'
                      ? 'Progression modérée'
                      : 'Déficit net'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatCurrency(rule503020.savings.amount)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({rule503020.savings.percent.toFixed(1)}% / 20% min)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Trésorerie non dépensée, épargne de précaution, investissements et désendettement.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">Cible théorique (20%) :</span>
                <span className="font-semibold text-slate-700">
                  {formatCurrency(rule503020.savings.targetAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Chart: Comparative Benchmark Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800">
                  Comparatif en % du Revenu : Réel vs Recommandation 50/30/20
                </span>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block" /> Benchmark Cible
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" /> Répartition Réelle
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ruleChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="pillar" stroke="#64748b" fontSize={12} tickLine={false} />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={v => `${v}%`}
                      domain={[0, Math.max(70, Math.round(rule503020.needs.percent + 10))]}
                    />
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => {
                        const isActual = name === 'actualPercent';
                        const label = isActual ? 'Réel' : 'Benchmark';
                        const amount = isActual ? item.payload.actualAmount : item.payload.targetAmount;
                        return [`${Number(val).toFixed(1)}% (${formatCurrency(amount)})`, label];
                      }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="targetPercent"
                      name="targetPercent"
                      fill="#cbd5e1"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    />
                    <Bar
                      dataKey="actualPercent"
                      name="actualPercent"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={38}
                    >
                      {ruleChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fillActual} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Diagnostic Advice & Synthesis */}
            <div className="lg:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bilan & Recommandation
                </h3>
              </div>

              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>Besoins :</strong> Vous consacrez{' '}
                  <span className="font-bold text-slate-900">{rule503020.needs.percent.toFixed(1)}%</span>{' '}
                  de vos revenus aux dépenses indispensables ({formatCurrency(rule503020.needs.amount)}).{' '}
                  {rule503020.needs.percent <= 50
                    ? 'Excellent : vos charges incompressibles respectent parfaitement le seuil de sécurité de 50%.'
                    : `Attention : vos charges obligatoires excèdent le seuil recommandé de ${(rule503020.needs.percent - 50).toFixed(1)}%.`}
                </p>

                <p>
                  <strong>Envies :</strong> Les dépenses discrétionnaires s'élèvent à{' '}
                  <span className="font-bold text-slate-900">{rule503020.wants.percent.toFixed(1)}%</span>{' '}
                  ({formatCurrency(rule503020.wants.amount)}).{' '}
                  {rule503020.wants.percent <= 30
                    ? 'Vos loisirs et dépenses de confort restent équilibrés.'
                    : 'Un réajustement des sorties ou abonnements permettrait de renforcer votre trésorerie.'}
                </p>

                <p>
                  <strong>Épargne :</strong> Taux effectif de{' '}
                  <span className="font-bold text-emerald-700">{rule503020.savings.percent.toFixed(1)}%</span>{' '}
                  ({formatCurrency(rule503020.savings.amount)}).
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <button
                  onClick={onOpenBudgets}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Ajuster mes plafonds pour optimiser</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: BUDGET VARIANCE ANALYSIS (Visible in 'all' or 'variance') */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'variance') && (
        <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Analyse des Écarts Budgétaires (Réel vs Plafond alloué)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Visualisez instantanément où vous réalisez des économies et où se produisent les dépassements
                  </p>
                </div>
              </div>
            </div>

            {/* Filter pills for variance */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setVarianceFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  varianceFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Tous ({allVariances.length})
              </button>
              <button
                onClick={() => setVarianceFilter('over')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  varianceFilter === 'over' ? 'bg-rose-50 text-rose-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Dépassements ({allVariances.filter(v => v.variance < 0).length})
              </button>
              <button
                onClick={() => setVarianceFilter('under')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  varianceFilter === 'under' ? 'bg-emerald-50 text-emerald-700 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Économies ({allVariances.filter(v => v.variance > 0).length})
              </button>
            </div>
          </div>

          {/* Grouped Comparative Bar Chart (Real Spent vs Budget Limit) */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredVariances}
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={v => `${v}€`}
                />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => {
                    const isSpent = name === 'spent';
                    const label = isSpent ? 'Dépenses Réelles' : 'Plafond Budgété';
                    const variance = item.payload.variance;
                    const varText =
                      variance >= 0
                        ? `(+${formatCurrency(variance)} d'économies)`
                        : `(-${formatCurrency(Math.abs(variance))} dépassé)`;
                    return [
                      `${formatCurrency(Number(value))} ${isSpent ? varText : ''}`,
                      label,
                    ];
                  }}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Bar
                  dataKey="budget"
                  name="Plafond Budgété"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                />
                <Bar
                  dataKey="spent"
                  name="Dépensé Réel"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                >
                  {filteredVariances.map((entry, index) => (
                    <Cell
                      key={`var-cell-${index}`}
                      fill={entry.variance < 0 ? '#f43f5e' : entry.color || '#2563eb'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Variance Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {filteredVariances.slice(0, 4).map(v => {
              const isOver = v.variance < 0;
              return (
                <div
                  key={v.category}
                  onClick={() => onSelectCategoryFilter(v.category)}
                  className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate" title={v.category}>
                      {v.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOver ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOver ? `-${formatCurrency(Math.abs(v.variance))}` : `+${formatCurrency(v.variance)}`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-2 text-[11px] text-slate-500">
                    <span>Réel : {formatCurrency(v.spent)}</span>
                    <span>Plafond : {formatCurrency(v.budget)}</span>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOver ? 'bg-rose-500' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(100, v.percentUsed)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION C: CASH FLOW, RUNNING BALANCE & FIXED VS VARIABLE (Visible in 'all' or 'cashflow') */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'cashflow') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cash Flow Evolution & Cumulative Savings Area Chart (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Flux de Trésorerie & Évolution du Solde Cumulé
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inflows (Revenus), Outflows (Dépenses) et Accumulation d'Épargne dans le temps
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" /> Revenus
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" /> Dépenses
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 rounded-full bg-emerald-600 inline-block" /> Solde Cumulé
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={monthlyCashFlow}
                  margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={val => `${val}€`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value)),
                      name === 'income'
                        ? 'Revenus'
                        : name === 'expense'
                        ? 'Dépenses'
                        : name === 'net'
                        ? 'Solde Net Mensuel'
                        : 'Épargne Cumulée',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="income" name="income" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Area
                    type="monotone"
                    dataKey="cumulativeSavings"
                    name="cumulativeSavings"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">Solde net cumulé généré sur l'historique :</span>
              <span className="text-sm font-extrabold text-emerald-700">
                +{formatCurrency(monthlyCashFlow[monthlyCashFlow.length - 1]?.cumulativeSavings || 0)}
              </span>
            </div>
          </div>

          {/* Fixed vs Variable & Reste à Vivre (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Charges Fixes & Reste à Vivre</h2>
              </div>
              <p className="text-xs text-slate-500">
                Poids des engagements contractuels incompressibles vs marge disponible
              </p>
            </div>

            <div className="space-y-3">
              {/* Fixed vs Variable Stacked Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Charges Fixes ({fixedVsVariable.fixedPercent.toFixed(0)}%)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(fixedVsVariable.fixedAmount)}</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="bg-indigo-600 h-full"
                    style={{ width: `${fixedVsVariable.fixedPercent}%` }}
                    title={`Fixes: ${fixedVsVariable.fixedPercent}%`}
                  />
                  <div
                    className="bg-sky-400 h-full"
                    style={{ width: `${fixedVsVariable.variablePercent}%` }}
                    title={`Variables: ${fixedVsVariable.variablePercent}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Dépenses variables : {fixedVsVariable.variablePercent.toFixed(0)}%</span>
                  <span>{formatCurrency(fixedVsVariable.variableAmount)}</span>
                </div>
              </div>

              {/* Reste à vivre metric box */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-1">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                  Reste à Vivre Disponible
                </span>
                <div className="text-xl font-black text-emerald-950">
                  {formatCurrency(fixedVsVariable.disposableIncome)}
                </div>
                <p className="text-[11px] text-emerald-800 leading-tight">
                  Montant disponible après déduction des charges fixes (Loyer, forfaits, abonnements).
                </p>
              </div>

              {/* Info summary */}
              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <div className="flex items-center justify-between">
                  <span>Opérations fixes récurrentes :</span>
                  <span className="font-semibold text-slate-800">{fixedVsVariable.fixedExpenseCount} prélèvements</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Opérations courantes :</span>
                  <span className="font-semibold text-slate-800">{fixedVsVariable.variableExpenseCount} transactions</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Un taux de charges fixes inférieur à 40% des revenus garantit une grande flexibilité financière.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION D: DAY OF WEEK HABITS & DAILY PACING (Visible in 'all' or 'habits') */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'habits') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Day of Week Spending Profile (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Dépenses par Jour de la Semaine (Lundi - Dimanche)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identification des pics de consommation et habitudes hebdomadaires
                </p>
              </div>

              {peakDay && (
                <div className="bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200 text-xs font-semibold self-start sm:self-auto">
                  Pic : {peakDay.dayFull} ({formatCurrency(peakDay.totalSpent)})
                </div>
              )}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="dayShort" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={v => `${v}€`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${formatCurrency(Number(val))} (${item.payload.count} transactions, moyenne: ${formatCurrency(item.payload.avgPerTx)}/tx)`,
                      'Total Dépensé',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="totalSpent"
                    name="totalSpent"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  >
                    {dayOfWeekData.map((entry, index) => (
                      <Cell
                        key={`dow-cell-${index}`}
                        fill={entry.dayIndex === peakDay?.dayIndex ? '#2563eb' : '#94a3b8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekend vs Weekday breakdown cards */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">En Semaine (Lun - Ven)</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {formatCurrency(weekdaySpend)}
                </div>
                <span className="text-[11px] text-slate-400">
                  {((weekdaySpend / (weekdaySpend + weekendSpend || 1)) * 100).toFixed(0)}% du budget
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500">Week-end (Sam - Dim)</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {formatCurrency(weekendSpend)}
                </div>
                <span className="text-[11px] text-slate-400">
                  {((weekendSpend / (weekdaySpend + weekendSpend || 1)) * 100).toFixed(0)}% du budget
                </span>
              </div>
            </div>
          </div>

          {/* Daily Pacing Trajectory & Top Payees (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pacing Line Chart */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-900">Rythme des Dépenses (Pacing)</h3>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Dépenses réelles cumulées vs trajectoire cible
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-1 bg-blue-600 inline-block rounded" /> Réel
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-1 border-t border-dashed border-slate-400 inline-block" /> Cible
                  </span>
                </div>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pacingData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} tickFormatter={v => `${v}€`} />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        formatCurrency(Number(value)),
                        name === 'cumulativeSpent' ? 'Dépensé cumulé' : 'Trajectoire cible',
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeSpent"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="budgetTrajectory"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Payees ranking */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-900">Principaux Bénéficiaires</h3>
                </div>
                <span className="text-[11px] text-slate-400">Par montant</span>
              </div>

              <div className="space-y-2.5">
                {topPayees.map((payee, idx) => {
                  const maxPayee = topPayees[0]?.amount || 1;
                  const barPercent = Math.min(100, (payee.amount / maxPayee) * 100);

                  return (
                    <div key={payee.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                          <span className="text-[10px] font-bold text-slate-400 w-3.5">#{idx + 1}</span>
                          <span className="font-semibold text-slate-800 truncate" title={payee.name}>
                            {payee.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">{payee.count}x</span>
                          <span className="font-bold text-slate-900 text-xs">{formatCurrency(payee.amount)}</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                          style={{ width: `${barPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION E: CATEGORY REPARTITION DONUT & LIVE GAUGES (Always visible in 'all') */}
      {/* ========================================================================= */}
      {activeTab === 'all' && (
        <>
          {/* Category Breakdown & Donut */}
          <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Répartition des Dépenses par Catégorie & Sous-Postes
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliquez ou survolez une tranche pour explorer les postes détaillés
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
                Total des sorties : {formatCurrency(totalPieSpent)}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Donut Graphic */}
              <div className="lg:col-span-5 h-64 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val: any) => [`${formatCurrency(Number(val))}`, 'Dépense']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, index) => {
                        setActiveCategoryIndex(index);
                        setSelectedDonutCat(categoriesSpending[index] || null);
                      }}
                      onClick={(_, index) => {
                        const item = categoriesSpending[index];
                        if (item) onSelectCategoryFilter(item.category);
                      }}
                      className="cursor-pointer"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={entry.color}
                          stroke={activeCategoryIndex === index ? '#0f172a' : 'transparent'}
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[11px] font-medium text-slate-400">Total</span>
                  <span className="text-xs font-bold text-slate-900">
                    {formatCurrency(totalPieSpent)}
                  </span>
                </div>
              </div>

              {/* Selected category detail panel */}
              <div className="lg:col-span-7 bg-slate-50 rounded-xl p-4 border border-slate-200">
                {selectedDonutCat ? (
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: selectedDonutCat.color }}
                        />
                        <span className="text-sm font-bold text-slate-900">
                          {selectedDonutCat.category}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(selectedDonutCat.spent)}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                      Détail des opérations et sous-catégories :
                    </span>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
                      {Object.entries(selectedDonutCat.subCategories || {}).map(([sub, amt]) => (
                        <div
                          key={sub}
                          className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white transition-colors"
                        >
                          <span className="truncate text-slate-600">{sub || 'Divers'}</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(Number(amt))}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => onSelectCategoryFilter(selectedDonutCat.category)}
                      className="mt-3 w-full py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
                    >
                      <span>Afficher toutes les transactions de {selectedDonutCat.category}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-8">
                    Survolez ou cliquez sur une tranche pour voir le détail
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Plafonds Budgétaires & Suivi en Temps Réel */}
          <div className="bg-white rounded-xl p-5 lg:p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Plafonds Budgétaires & Suivi en Temps Réel
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jauges de consommation par catégorie avec indicateurs de dépassement
                </p>
              </div>
              <button
                onClick={onOpenBudgets}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ajuster les plafonds</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoriesSpending
                .filter(cat => cat.budget > 0 || cat.spent > 0)
                .map(cat => {
                  const hasBudget = cat.budget > 0;
                  const isOver = hasBudget && cat.spent > cat.budget;
                  const isWarning = hasBudget && !isOver && cat.percentage >= 80;
                  const remaining = cat.budget - cat.spent;

                  return (
                    <div
                      key={cat.category}
                      className="bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl p-4 border border-slate-200 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
                              style={{ backgroundColor: cat.color }}
                            >
                              <CategoryIcon name="Tag" className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-xs font-bold text-slate-800 truncate" title={cat.category}>
                              {cat.category}
                            </span>
                          </div>

                          {hasBudget ? (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                                isOver
                                  ? 'bg-rose-100 text-rose-800'
                                  : isWarning
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isOver ? (
                                <>
                                  <AlertTriangle className="w-3 h-3" /> +{formatCurrency(Math.abs(remaining))}
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Reste {formatCurrency(remaining)}
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                              Non plafonné
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between mt-2 text-xs">
                          <span className="font-extrabold text-slate-900">
                            {formatCurrency(cat.spent)}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {hasBudget
                              ? `sur ${formatCurrency(cat.budget)} (${cat.percentage.toFixed(0)}%)`
                              : `${cat.transactionCount} opérations`}
                          </span>
                        </div>

                        {hasBudget && (
                          <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOver ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-blue-600'
                              }`}
                              style={{ width: `${Math.min(100, cat.percentage)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{cat.transactionCount} transactions</span>
                        <button
                          onClick={() => onSelectCategoryFilter(cat.category)}
                          className="text-blue-700 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
                        >
                          Détails →
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
