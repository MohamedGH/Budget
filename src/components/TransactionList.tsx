import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Plus,
  ArrowUpDown,
  Download,
  Filter,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Info,
  Tags,
  Tag
} from 'lucide-react';
import { Transaction, FilterOptions, BudgetCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/budgetCalculations';
import { getCategoryColor } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  allCategories: BudgetCategory[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onTogglePointed: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBatchDelete: (ids: string[]) => void;
  onBatchPoint: (ids: string[], isPointed: boolean) => void;
  onExportSelected: (transactions: Transaction[]) => void;
  onOpenAddTx: () => void;
  onQuickCategorize?: (tx: Transaction) => void;
  onBatchCategorize?: (selectedTransactions: Transaction[]) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  allCategories,
  filters,
  onFilterChange,
  onTogglePointed,
  onEditTransaction,
  onDeleteTransaction,
  onBatchDelete,
  onBatchPoint,
  onExportSelected,
  onOpenAddTx,
  onQuickCategorize,
  onBatchCategorize,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map(t => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(transactions.length / itemsPerPage));
  const validPage = Math.min(currentPage, totalPages);
  const displayedTransactions = transactions.slice(
    (validPage - 1) * itemsPerPage,
    validPage * itemsPerPage
  );

  const selectedCount = selectedIds.size;
  const isAllSelected = transactions.length > 0 && selectedCount === transactions.length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* 1. Filter and search toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-transactions"
              type="text"
              placeholder="Rechercher par commerçant, mot-clé, montant..."
              value={filters.search}
              onChange={e => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-4 py-2 bg-white text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ ...filters, search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type tabs */}
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => onFilterChange({ ...filters, type: 'all' })}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filters.type === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => onFilterChange({ ...filters, type: 'expense' })}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filters.type === 'expense'
                    ? 'bg-rose-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dépenses
              </button>
              <button
                onClick={() => onFilterChange({ ...filters, type: 'income' })}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filters.type === 'income'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Revenus
              </button>
            </div>

            {/* Category select */}
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-category-filter"
                value={filters.category}
                onChange={e => onFilterChange({ ...filters, category: e.target.value })}
                className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="all">Toutes catégories</option>
                {allCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reconciled / Pointée select */}
            <select
              id="select-reconciled-filter"
              value={filters.reconciledStatus}
              onChange={e =>
                onFilterChange({
                  ...filters,
                  reconciledStatus: e.target.value as 'all' | 'reconciled' | 'pending',
                })
              }
              className="bg-white border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Toutes (Pointées & Non)</option>
              <option value="reconciled">✓ Pointées uniquement</option>
              <option value="pending">○ Non pointées</option>
            </select>

            {/* Sort Field */}
            <button
              onClick={() =>
                onFilterChange({
                  ...filters,
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                })
              }
              className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              title={`Tri: ${filters.sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{filters.sortOrder === 'asc' ? 'Plus ancien' : 'Plus récent'}</span>
            </button>
          </div>
        </div>

        {/* 2. Batch actions bar when items are selected */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center justify-between bg-blue-50/90 border border-blue-200 rounded-lg p-2.5 gap-2 text-xs">
            <span className="font-semibold text-blue-900">
              {selectedCount} opération{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {onBatchCategorize && (
                <button
                  id="btn-batch-change-category"
                  onClick={() => {
                    const toCategorize = transactions.filter(t => selectedIds.has(t.id));
                    onBatchCategorize(toCategorize);
                  }}
                  className="px-2.5 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Tags className="w-3.5 h-3.5" />
                  <span>Changer la catégorie ({selectedCount})</span>
                </button>
              )}
              <button
                onClick={() => {
                  onBatchPoint(Array.from(selectedIds), true);
                  setSelectedIds(new Set());
                }}
                className="px-2.5 py-1 bg-white text-blue-700 border border-blue-300 rounded font-medium hover:bg-blue-100/60 transition-colors cursor-pointer"
              >
                Marquer Pointées
              </button>
              <button
                onClick={() => {
                  const toExport = transactions.filter(t => selectedIds.has(t.id));
                  onExportSelected(toExport);
                }}
                className="px-2.5 py-1 bg-white text-slate-700 border border-slate-300 rounded font-medium hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Exporter ({selectedCount})</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm(`Supprimer les ${selectedCount} opérations sélectionnées ?`)) {
                    onBatchDelete(Array.from(selectedIds));
                    setSelectedIds(new Set());
                  }
                }}
                className="px-2.5 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3 w-10 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Tout sélectionner"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3 w-28">Date</th>
              <th className="p-3">Libellé / Bénéficiaire</th>
              <th className="p-3 w-40">Catégorie</th>
              <th className="p-3 w-32 text-right">Montant</th>
              <th className="p-3 w-20 text-center">Pointée</th>
              <th className="p-3 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700">Aucune opération trouvée</p>
                    <p className="text-xs text-slate-400">
                      Essayez de réinitialiser vos filtres ou d'importer un nouveau relevé.
                    </p>
                    <button
                      onClick={onOpenAddTx}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 cursor-pointer shadow-sm shadow-blue-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter une opération</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              displayedTransactions.map(tx => {
                const isSelected = selectedIds.has(tx.id);
                const isIncome = tx.amount >= 0;
                const catColor = getCategoryColor(tx.category);

                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleSelectOne(tx.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="p-3 font-medium text-slate-900 whitespace-nowrap">
                      {formatDate(tx.date)}
                      {tx.bookingDate && tx.bookingDate !== tx.date && (
                        <div className="text-[10px] text-slate-400">
                          Val: {formatDate(tx.bookingDate)}
                        </div>
                      )}
                    </td>

                    {/* Label & Description */}
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{tx.label}</div>
                      {tx.rawDescription && tx.rawDescription !== tx.label && (
                        <div
                          className="text-[11px] text-slate-400 truncate max-w-sm"
                          title={tx.rawDescription}
                        >
                          {tx.rawDescription}
                        </div>
                      )}
                      {tx.notes && (
                        <div className="text-[10px] text-blue-700 bg-blue-50 rounded px-1.5 py-0.5 mt-0.5 inline-block border border-blue-200/60">
                          Note: {tx.notes}
                        </div>
                      )}
                    </td>

                    {/* Category badge */}
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => onQuickCategorize && onQuickCategorize(tx)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer transition-colors"
                        title="Cliquer pour changer la catégorie ou ajouter un justificatif"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: catColor }}
                        />
                        <span className="truncate max-w-[120px]">{tx.category}</span>
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                      </button>
                      {tx.subCategory && (
                        <div className="text-[10px] text-slate-400 pl-3.5 mt-0.5 truncate">
                          {tx.subCategory}
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <span
                        className={`text-sm font-extrabold ${
                          isIncome ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isIncome ? '+' : ''}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>

                    {/* Pointée / Reconciled status */}
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onTogglePointed(tx.id)}
                        className="cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"
                        title={tx.isPointed ? 'Opération pointée / validée' : 'Cliquer pour pointer'}
                      >
                        {tx.isPointed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {onQuickCategorize && (
                          <button
                            onClick={() => onQuickCategorize(tx)}
                            className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Changer la catégorie / justificatif (retrait)"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Modifier l'opération"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Supprimer cette opération ?')) {
                              onDeleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Pagination & Summary footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
        <div>
          Affichage de <span className="font-semibold text-slate-800">{displayedTransactions.length}</span> sur{' '}
          <span className="font-semibold text-slate-800">{transactions.length}</span> opération{transactions.length > 1 ? 's' : ''}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2 self-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {validPage} sur {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
