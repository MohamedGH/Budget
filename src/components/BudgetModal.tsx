import React, { useState } from 'react';
import { X, Check, Sliders, Sparkles, RefreshCw } from 'lucide-react';
import { BudgetCategory, Transaction } from '../types';
import { formatCurrency } from '../utils/budgetCalculations';
import { CategoryIcon } from './CategoryIcon';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  transactions: Transaction[];
  onSaveBudgets: (updatedCategories: BudgetCategory[]) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  transactions,
  onSaveBudgets,
}) => {
  const [limits, setLimits] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    categories.forEach((cat) => {
      map[cat.id] = cat.monthlyLimit || 0;
    });
    return map;
  });

  if (!isOpen) return null;

  const totalBudget = Object.keys(limits).reduce((sum: number, key: string) => sum + (limits[key] || 0), 0);

  const handleLimitChange = (catId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setLimits((prev) => ({ ...prev, [catId]: Math.max(0, num) }));
  };

  // Preset: Auto-calculate limits based on average past 6 months spending + 10% safety buffer
  const applyAutoAverages = () => {
    const catSpentMap: Record<string, number> = {};
    const months = new Set<string>();

    transactions
      .filter((t) => t.amount < 0)
      .forEach((tx) => {
        months.add(tx.date.substring(0, 7));
        catSpentMap[tx.category] = (catSpentMap[tx.category] || 0) + Math.abs(tx.amount);
      });

    const monthCount = Math.max(1, months.size);
    const newLimits: Record<string, number> = {};

    categories.forEach((cat) => {
      const totalSpent = catSpentMap[cat.name] || 0;
      const avg = totalSpent / monthCount;
      // Round to nearest 10 with 10% buffer
      const rounded = Math.ceil((avg * 1.1) / 10) * 10;
      newLimits[cat.id] = rounded > 0 ? rounded : cat.monthlyLimit || 100;
    });

    setLimits(newLimits);
  };

  // Preset: Strict savings mode (-15% on non-essential)
  const applyStrictSavings = () => {
    const newLimits: Record<string, number> = {};
    categories.forEach((cat) => {
      const current = limits[cat.id] || cat.monthlyLimit || 0;
      if (cat.isEssential) {
        newLimits[cat.id] = current;
      } else {
        newLimits[cat.id] = Math.max(20, Math.round(current * 0.85));
      }
    });
    setLimits(newLimits);
  };

  const handleSave = () => {
    const updated = categories.map((cat) => ({
      ...cat,
      monthlyLimit: limits[cat.id] ?? cat.monthlyLimit,
    }));
    onSaveBudgets(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Plafonds Budgétaires Mensuels
              </h3>
              <p className="text-xs text-slate-500">
                Définissez vos objectifs de dépenses cibles par catégorie
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick presets & Total summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-slate-600">Plafond mensuel total alloué :</span>
              <div className="text-xl font-bold text-slate-900">
                {formatCurrency(totalBudget)} / mois
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={applyAutoAverages}
                className="text-xs font-semibold bg-white text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ajuster automatiquement d'après l'historique des relevés"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Baser sur moyenne réelle</span>
              </button>
              <button
                type="button"
                onClick={applyStrictSavings}
                className="text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Réduire de 15% les dépenses non-essentielles"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Mode Économies (-15%)</span>
              </button>
            </div>
          </div>

          {/* Category Limit Inputs */}
          <div className="space-y-3">
            {categories
              .filter((c) => !['Allocations', 'Virements reçus'].includes(c.name))
              .map((cat) => {
                const currentLimit = limits[cat.id] ?? cat.monthlyLimit ?? 0;

                return (
                  <div
                    key={cat.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name="Tag" className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{cat.name}</div>
                        <span className="text-[10px] text-slate-400">
                          {cat.isEssential ? 'Dépense essentielle' : 'Dépense discrétionnaire'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="1500"
                        step="10"
                        value={currentLimit}
                        onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                        className="w-32 sm:w-44 accent-blue-600 cursor-pointer"
                      />
                      <div className="relative w-28">
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={currentLimit}
                          onChange={(e) => handleLimitChange(cat.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-right bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          €
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Appliquer les Plafonds</span>
          </button>
        </div>
      </div>
    </div>
  );
};
