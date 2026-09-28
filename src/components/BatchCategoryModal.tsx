import React, { useState } from 'react';
import { X, Check, Tags, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Transaction, BudgetCategory } from '../types';
import { formatCurrency } from '../utils/budgetCalculations';
import { getCategoryColor, CategoryIcon } from './CategoryIcon';

interface BatchCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransactions: Transaction[];
  categories: BudgetCategory[];
  onApplyBatch: (
    ids: string[],
    category: string,
    subCategory?: string,
    notes?: string,
    isPointed?: boolean
  ) => void;
}

export const BatchCategoryModal: React.FC<BatchCategoryModalProps> = ({
  isOpen,
  onClose,
  selectedTransactions,
  categories,
  onApplyBatch,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Travaux');
  const [subCategory, setSubCategory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [markAsPointed, setMarkAsPointed] = useState<boolean>(true);

  if (!isOpen || selectedTransactions.length === 0) return null;

  const totalAmount = selectedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const isExpense = totalAmount < 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ids = selectedTransactions.map(t => t.id);
    onApplyBatch(
      ids,
      selectedCategory,
      subCategory.trim() || undefined,
      notes.trim() || undefined,
      markAsPointed
    );
    onClose();
  };

  const quickCategories = ['Travaux', 'Vie quotidienne', 'Loisirs', 'Auto et Moto', 'Logement', 'Santé', 'Retraits'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-200">
              <Tags className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Modification Groupée de Catégorie
              </h3>
              <p className="text-[11px] text-slate-500">
                {selectedTransactions.length} opération{selectedTransactions.length > 1 ? 's' : ''} sélectionnée{selectedTransactions.length > 1 ? 's' : ''} ({formatCurrency(totalAmount)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Summary pill */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span>Total du groupe :</span>
              <span className={isExpense ? 'text-slate-900' : 'text-emerald-700'}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <p className="text-[11px] text-blue-700">
              Cette action réaffectera la catégorie et ajoutera une note justificative à toutes les opérations sélectionnées.
            </p>
          </div>

          {/* Quick category selection pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nouvelle Catégorie Cible *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickCategories.map(catName => {
                const isSelected = selectedCategory === catName;
                const catColor = getCategoryColor(catName);
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => setSelectedCategory(catName)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isSelected ? '#fff' : catColor }}
                    />
                    <span>{catName}</span>
                  </button>
                );
              })}
            </div>

            <select
              id="select-batch-category"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} ({cat.monthlyLimit > 0 ? `Plafond ${cat.monthlyLimit}€` : 'Sans plafond'})
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sous-catégorie (Optionnelle)
            </label>
            <input
              id="input-batch-subcategory"
              type="text"
              placeholder="Ex: Matériaux, Bricolage, Rénovation, Outillage..."
              value={subCategory}
              onChange={e => setSubCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Usage description / À quoi a servi l'argent */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>À quoi a servi l'argent ? (Justificatif / Note)</span>
              <span className="text-[10px] text-slate-400 font-normal">Optionnel</span>
            </label>
            <input
              id="input-batch-notes"
              type="text"
              placeholder="Ex: Retrait utilisé pour payer les fournitures de peinture / travaux maison..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mark pointed */}
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={markAsPointed}
              onChange={e => setMarkAsPointed(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
            />
            <span>
              Marquer automatiquement les <strong>{selectedTransactions.length} opérations</strong> comme <strong>pointées</strong>
            </span>
          </label>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="btn-confirm-batch-category"
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Appliquer au groupe ({selectedTransactions.length})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
