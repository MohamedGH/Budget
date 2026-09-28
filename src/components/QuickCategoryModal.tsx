import React, { useState, useEffect } from 'react';
import { X, Check, HelpCircle, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { Transaction, BudgetCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/budgetCalculations';
import { getCategoryColor, CategoryIcon } from './CategoryIcon';

interface QuickCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categories: BudgetCategory[];
  onSave: (txUpdate: Partial<Transaction> & { id: string }) => void;
}

export const QuickCategoryModal: React.FC<QuickCategoryModalProps> = ({
  isOpen,
  onClose,
  transaction,
  categories,
  onSave,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Travaux');
  const [subCategory, setSubCategory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isPointed, setIsPointed] = useState<boolean>(true);

  useEffect(() => {
    if (transaction) {
      setSelectedCategory(transaction.category || 'Travaux');
      setSubCategory(transaction.subCategory || '');
      setNotes(transaction.notes || '');
      setIsPointed(transaction.isPointed);
    }
  }, [transaction, isOpen]);

  if (!isOpen || !transaction) return null;

  const isAtmWithdrawal =
    transaction.category === 'Retraits' ||
    transaction.label.toLowerCase().includes('retrait') ||
    transaction.label.toLowerCase().includes('dab');

  const suggestedUsages = [
    { label: 'Travaux & Bricolage', cat: 'Travaux', sub: 'Matériaux / Outillage', note: 'Achats fournitures travaux en espèces' },
    { label: 'Alimentation & Marché', cat: 'Vie quotidienne', sub: 'Marché / Primeur', note: 'Courses alimentaires en espèces' },
    { label: 'Sorties & Restauration', cat: 'Loisirs', sub: 'Restaurants & Sorties', note: 'Règlement restaurant / bar' },
    { label: 'Cadeau & Dépannage', cat: 'Autres dépenses', sub: 'Cadeaux', note: 'Cadeau ou dépannage ponctuel' },
    { label: 'Santé & Pharmacie', cat: 'Santé', sub: 'Pharmacie', note: 'Frais médicaux non remboursés' },
  ];

  const handleApplyPreset = (preset: typeof suggestedUsages[0]) => {
    setSelectedCategory(preset.cat);
    setSubCategory(preset.sub);
    setNotes(preset.note);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: transaction.id,
      category: selectedCategory,
      subCategory: subCategory.trim() || undefined,
      notes: notes.trim() || undefined,
      isPointed,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-200">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Affectation & Justificatif de l'Opération
              </h3>
              <p className="text-[11px] text-slate-500">
                Indiquez la destination des fonds et modifiez la catégorie
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

        {/* Transaction Summary Card */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5 max-w-[280px]">
            <span className="text-[10px] text-blue-300 uppercase font-semibold">
              {formatDate(transaction.date)}
            </span>
            <h4 className="text-sm font-bold truncate" title={transaction.label}>
              {transaction.label}
            </h4>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Catégorie actuelle :</span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 font-semibold border border-slate-700">
                {transaction.category}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-white">
              {formatCurrency(transaction.amount)}
            </div>
          </div>
        </div>

        {/* Quick Presets for ATM / Withdrawals */}
        {isAtmWithdrawal && (
          <div className="px-5 pt-3 pb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggestions rapides d'affectation pour ce retrait :</span>
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {suggestedUsages.slice(0, 4).map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50/70 hover:border-blue-300 text-left transition-colors cursor-pointer text-xs"
                >
                  <div className="font-semibold text-slate-800">{p.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{p.cat}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catégorie de Réaffectation *
            </label>
            <select
              id="select-quick-category"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sous-catégorie
            </label>
            <input
              id="input-quick-subcategory"
              type="text"
              placeholder="Ex: Bricolage & Matériaux, Alimentation, Décoration..."
              value={subCategory}
              onChange={e => setSubCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fund Usage Note / À quoi a servi l'argent */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              🎯 À quoi a servi cet argent ? (Usage / Justificatif)
            </label>
            <input
              id="input-quick-notes"
              type="text"
              placeholder="Ex: Achat d'outils et peinture pour la rénovation du salon"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
            />
          </div>

          {/* Pointed status */}
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPointed}
              onChange={e => setIsPointed(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
            />
            <span>
              <strong>Opération validée & pointée</strong>
            </span>
          </label>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="btn-save-quick-category"
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Valider l'affectation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
