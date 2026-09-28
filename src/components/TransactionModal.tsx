import React, { useState, useEffect } from 'react';
import { X, Check, Tag } from 'lucide-react';
import { Transaction, BudgetCategory } from '../types';
import { guessCategory } from '../utils/bankParser';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>) => void;
  transactionToEdit?: Transaction | null;
  categories: BudgetCategory[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  categories,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [label, setLabel] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<string>('Vie quotidienne');
  const [subCategory, setSubCategory] = useState<string>('');
  const [accountLabel, setAccountLabel] = useState<string>('Compte Bancaire Principal');
  const [isPointed, setIsPointed] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (transactionToEdit) {
      setDate(transactionToEdit.date);
      setLabel(transactionToEdit.label);
      setAmountStr(Math.abs(transactionToEdit.amount).toString());
      setType(transactionToEdit.amount >= 0 ? 'income' : 'expense');
      setCategory(transactionToEdit.category || 'Vie quotidienne');
      setSubCategory(transactionToEdit.subCategory || '');
      setAccountLabel(transactionToEdit.accountLabel || 'Compte Bancaire Principal');
      setIsPointed(transactionToEdit.isPointed);
      setNotes(transactionToEdit.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setLabel('');
      setAmountStr('');
      setType('expense');
      setCategory('Vie quotidienne');
      setSubCategory('');
      setAccountLabel('Compte Bancaire Principal');
      setIsPointed(true);
      setNotes('');
    }
    setErrorMsg('');
  }, [transactionToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto-category trigger when label changes
  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    if (!transactionToEdit && newLabel.trim().length >= 3) {
      const guessed = guessCategory(newLabel);
      if (guessed.category && guessed.category !== 'Autres dépenses') {
        setCategory(guessed.category);
        if (guessed.subCategory) setSubCategory(guessed.subCategory);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setErrorMsg('Veuillez renseigner le libellé de l\'opération.');
      return;
    }

    const numAmount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Veuillez saisir un montant positif valide.');
      return;
    }

    const finalAmount = type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount);

    onSave({
      ...(transactionToEdit ? { id: transactionToEdit.id } : {}),
      date,
      label: label.trim(),
      amount: finalAmount,
      category,
      subCategory: subCategory.trim() || undefined,
      accountLabel,
      isPointed,
      notes: notes.trim() || undefined,
      currency: 'EUR',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {transactionToEdit ? 'Modifier l\'opération' : 'Ajouter une nouvelle opération'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Type Toggle: Dépense vs Revenu */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              - Dépense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + Revenu / Entrée
            </button>
          </div>

          {/* Label and Amount in a row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Libellé / Bénéficiaire *
              </label>
              <input
                id="input-tx-label"
                type="text"
                required
                placeholder="Ex: Auchan, EDF, Loyer, Restaurant..."
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Montant (€) *
              </label>
              <input
                id="input-tx-amount"
                type="text"
                required
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Date and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SubCategory and Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sous-catégorie (Optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: Alimentation, Carburant..."
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Compte</label>
              <input
                type="text"
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Commentaires
            </label>
            <input
              type="text"
              placeholder="Ajouter une note facultative..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Pointée Checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isPointed}
              onChange={(e) => setIsPointed(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
            />
            <span>
              <strong>Opération rapprochée / pointée</strong> (vérifiée sur le relevé bancaire)
            </span>
          </label>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="btn-save-transaction"
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{transactionToEdit ? 'Mettre à jour' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
