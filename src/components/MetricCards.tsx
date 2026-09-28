import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  Flame,
  Wallet
} from 'lucide-react';
import { FinancialStats } from '../types';
import { formatCurrency } from '../utils/budgetCalculations';

interface MetricCardsProps {
  stats: FinancialStats;
  periodLabel: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ stats, periodLabel }) => {
  const isPositiveSavings = stats.netSavings >= 0;
  const isBudgetWarning = stats.budgetUtilization > 85;
  const isBudgetExceeded = stats.budgetUtilization >= 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {/* Card 1: Net Savings / Solde */}
      <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Solde Net / Épargne
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isPositiveSavings ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {isPositiveSavings ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl lg:text-3xl font-bold tracking-tight ${
                isPositiveSavings ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositiveSavings ? '+' : ''}
              {formatCurrency(stats.netSavings)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Taux d'épargne</span>
            <span
              className={`font-semibold ${
                stats.savingsRate >= 20
                  ? 'text-emerald-600'
                  : stats.savingsRate > 0
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}
            >
              {stats.savingsRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.savingsRate >= 20 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, stats.savingsRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Card 2: Total Income */}
      <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Revenus
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalIncome)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{periodLabel}</span>
            <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded text-[11px]">
              {stats.totalIncome > 0 ? 'Entrées' : '0€'}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate">
            Salaires, virements, remboursements
          </div>
        </div>
      </div>

      {/* Card 3: Total Expenses */}
      <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Dépenses
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(stats.totalExpense)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3 h-3 text-slate-400" />
              Moyenne / jour
            </span>
            <span className="font-semibold text-slate-700">
              {formatCurrency(stats.dailyAverageExpense)}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 truncate" title={stats.largestExpense?.label}>
            Max: {stats.largestExpense ? `${formatCurrency(stats.largestExpense.amount)} (${stats.largestExpense.label.substring(0, 16)}...)` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Card 4: Budget Utilization */}
      <div className="bg-white p-5 lg:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consommation Budget
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isBudgetExceeded
                  ? 'bg-rose-50 text-rose-600'
                  : isBudgetWarning
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              {isBudgetExceeded ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
              {stats.budgetUtilization.toFixed(0)}%
            </span>
            <span className="text-xs font-medium text-slate-500">
              sur {formatCurrency(stats.totalBudget)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Statut</span>
            <span
              className={`font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                isBudgetExceeded
                  ? 'bg-rose-100 text-rose-800'
                  : isBudgetWarning
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isBudgetExceeded ? 'Dépassement' : isBudgetWarning ? 'Attention' : 'Maîtrisé'}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isBudgetExceeded
                  ? 'bg-rose-600'
                  : isBudgetWarning
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, stats.budgetUtilization)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
