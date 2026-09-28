import React, { useState } from 'react';
import { Transaction, BudgetCategory, PeriodFilter } from './types';
import { ErrorBoundary } from './errors/ErrorBoundary';
import { RouterProvider, useAppRoute } from './router/RouterContext';
import { AppProvider, useAppStore } from './state/AppContext';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { AnalyticsView } from './components/AnalyticsView';
import { CategoryChartView } from './components/CategoryChartView';
import { TransactionList } from './components/TransactionList';
import { TestRunnerView } from './components/TestRunnerView';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { BatchCategoryModal } from './components/BatchCategoryModal';
import { QuickCategoryModal } from './components/QuickCategoryModal';
import { formatCurrency } from './utils/budgetCalculations';
import { exportTransactionsToCsv } from './utils/csvExporter';
import {
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  BarChart2,
  Upload,
  Plus,
  PieChart,
  Hammer,
  Sliders,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';

function AppContent() {
  const {
    state,
    filteredTransactions,
    financialStats,
    categoriesSpending,
    monthlyCashFlow,
    periodLabel,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    togglePointed,
    batchUpdateCategory,
    batchPoint,
    batchDelete,
    setCategories,
    setFilters,
    setPeriod,
    setCategoryFilter,
    resetToDemoData,
    showToast,
  } = useAppStore();

  const { currentRoute, params, navigate } = useAppRoute();

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState<boolean>(false);
  const [isBudgetsOpen, setIsBudgetsOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Category change modals
  const [quickCatTransaction, setQuickCatTransaction] = useState<Transaction | null>(null);
  const [batchCatTransactions, setBatchCatTransactions] = useState<Transaction[]>([]);

  // Selected Category for Category Chart view
  const activeCategoryForChart = params.category || 'Travaux';

  const handleSaveTransaction = (txData: Partial<Transaction>) => {
    if (txData.id) {
      updateTransaction(txData as Partial<Transaction> & { id: string });
    } else {
      addTransaction(txData);
    }
  };

  const handleExportSelected = (selectedTx: Transaction[]) => {
    exportTransactionsToCsv(selectedTx, {
      delimiter: ';',
      filename: `selection_operations_${new Date().toISOString().split('T')[0]}.csv`,
    });
    showToast(`${selectedTx.length} opérations exportées au format CSV`);
  };

  const handleImportSuccess = (imported: Transaction[], replaceAll: boolean) => {
    if (replaceAll) {
      state.transactions = imported;
      showToast(`${imported.length} opérations importées (remplacement total)`);
    } else {
      // Merge unique
      const existingKeys = new Set(state.transactions.map(t => `${t.date}_${t.label}_${t.amount}`));
      const newItems = imported.filter(t => !existingKeys.has(`${t.date}_${t.label}_${t.amount}`));
      newItems.forEach(tx => addTransaction(tx));
      showToast(`${newItems.length} nouvelles opérations ajoutées (${imported.length - newItems.length} doublons ignorés)`);
    }
  };

  const handleSelectCategoryFilter = (catName: string) => {
    setCategoryFilter(catName);
    navigate('transactions');
    showToast(`Filtre activé : ${catName}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white pb-16 md:pb-0">
      {/* Toast Notification */}
      {state.toastMessage && (
        <div className="fixed bottom-16 md:bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{state.toastMessage}</span>
        </div>
      )}

      {/* Header with Integrated Page Router & Period Controls */}
      <Header
        period={state.filters.period}
        onPeriodChange={(p: PeriodFilter) => setPeriod(p)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAddTx={() => {
          setEditingTransaction(null);
          setIsAddTxOpen(true);
        }}
        onOpenBudgets={() => setIsBudgetsOpen(true)}
        onResetData={() => {
          if (window.confirm('Voulez-vous recharger le relevé bancaire initial de démonstration (Fév - Août 2026) avec la catégorie Travaux ?')) {
            resetToDemoData();
          }
        }}
        activeView={currentRoute}
        onViewChange={(view) => navigate(view)}
        totalTransactionsCount={state.transactions.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Real-time KPI Metric Cards */}
        <MetricCards stats={financialStats} periodLabel={periodLabel} />

        {/* 1. ROUTE: DASHBOARD */}
        {currentRoute === 'dashboard' && (
          <div className="space-y-6">
            {/* Quick Diagnostic Banner */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
              <div className="relative z-10 space-y-1">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  Diagnostic Financier en Temps Réel
                </span>
                <h3 className="text-lg font-bold tracking-tight">
                  {financialStats.netSavings >= 0
                    ? `Capacité d'épargne nette : ${formatCurrency(financialStats.netSavings)} sur ${periodLabel}`
                    : `Attention : Dépassement budgétaire net de ${formatCurrency(Math.abs(financialStats.netSavings))}`}
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl">
                  {financialStats.savingsRate >= 20
                    ? `Excellent taux d'épargne (${financialStats.savingsRate.toFixed(1)}%). Vos dépenses indispensables et projets (Travaux, Logement) sont maîtrisés.`
                    : `Votre taux d'épargne est de ${financialStats.savingsRate.toFixed(1)}%. Ajustez vos plafonds par catégorie pour équilibrer vos flux.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 relative z-10">
                <button
                  onClick={() => navigate('category-chart', { category: 'Travaux' })}
                  className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Hammer className="w-3.5 h-3.5" />
                  <span>Visualiser Catégorie Travaux</span>
                </button>
                <button
                  onClick={() => navigate('analytics')}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Analytique Complète</span>
                </button>
              </div>
            </div>

            {/* Visual Analytics Preview */}
            <AnalyticsView
              stats={financialStats}
              categoriesSpending={categoriesSpending}
              monthlyCashFlow={monthlyCashFlow}
              transactions={filteredTransactions}
              categories={state.categories}
              period={state.filters.period}
              onSelectCategoryFilter={handleSelectCategoryFilter}
              onOpenBudgets={() => setIsBudgetsOpen(true)}
            />

            {/* Recent Transactions Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Dernières Opérations Bancaires
                  </h3>
                  <p className="text-xs text-slate-500">
                    Journal des transactions pour {periodLabel}
                  </p>
                </div>
                <button
                  onClick={() => navigate('transactions')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Voir toutes les opérations ({filteredTransactions.length}) →
                </button>
              </div>

              <TransactionList
                transactions={filteredTransactions}
                allCategories={state.categories}
                filters={state.filters}
                onFilterChange={setFilters}
                onTogglePointed={togglePointed}
                onEditTransaction={tx => {
                  setEditingTransaction(tx);
                  setIsAddTxOpen(true);
                }}
                onDeleteTransaction={deleteTransaction}
                onBatchDelete={batchDelete}
                onBatchPoint={batchPoint}
                onExportSelected={handleExportSelected}
                onOpenAddTx={() => {
                  setEditingTransaction(null);
                  setIsAddTxOpen(true);
                }}
                onQuickCategorize={tx => setQuickCatTransaction(tx)}
                onBatchCategorize={selected => setBatchCatTransactions(selected)}
              />
            </div>
          </div>
        )}

        {/* 2. ROUTE: TRANSACTIONS */}
        {currentRoute === 'transactions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  Journal Complet des Opérations
                </h2>
                <p className="text-xs text-slate-500">
                  Modifiez les catégories à la volée (ex: retraits DAB), appliquez des notes justificatives ou réaffectez par lot.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setIsAddTxOpen(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une opération</span>
              </button>
            </div>

            <TransactionList
              transactions={filteredTransactions}
              allCategories={state.categories}
              filters={state.filters}
              onFilterChange={setFilters}
              onTogglePointed={togglePointed}
              onEditTransaction={tx => {
                setEditingTransaction(tx);
                setIsAddTxOpen(true);
              }}
              onDeleteTransaction={deleteTransaction}
              onBatchDelete={batchDelete}
              onBatchPoint={batchPoint}
              onExportSelected={handleExportSelected}
              onOpenAddTx={() => {
                setEditingTransaction(null);
                setIsAddTxOpen(true);
              }}
              onQuickCategorize={tx => setQuickCatTransaction(tx)}
              onBatchCategorize={selected => setBatchCatTransactions(selected)}
            />
          </div>
        )}

        {/* 3. ROUTE: ANALYTICS */}
        {currentRoute === 'analytics' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  Centre d'Analyses & Graphiques Financiers
                </h2>
                <p className="text-xs text-slate-500">
                  Règle 50/30/20, écarts réels vs plafonds, trésorerie et habitudes hebdomadaires
                </p>
              </div>
            </div>

            <AnalyticsView
              stats={financialStats}
              categoriesSpending={categoriesSpending}
              monthlyCashFlow={monthlyCashFlow}
              transactions={filteredTransactions}
              categories={state.categories}
              period={state.filters.period}
              onSelectCategoryFilter={handleSelectCategoryFilter}
              onOpenBudgets={() => setIsBudgetsOpen(true)}
            />
          </div>
        )}

        {/* 4. ROUTE: CATEGORY CHART (Visualisation chart par catégorie) */}
        {currentRoute === 'category-chart' && (
          <CategoryChartView
            categories={state.categories}
            transactions={state.transactions}
            categoriesSpending={categoriesSpending}
            initialCategoryName={activeCategoryForChart}
            onOpenAddTx={() => {
              setEditingTransaction(null);
              setIsAddTxOpen(true);
            }}
            onOpenBudgets={() => setIsBudgetsOpen(true)}
            onQuickEditTx={tx => setQuickCatTransaction(tx)}
          />
        )}

        {/* 5. ROUTE: BUDGETS */}
        {currentRoute === 'budgets' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Gestion des Plafonds Budgétaires
                    </h2>
                    <p className="text-xs text-slate-500">
                      Définissez les limites mensuelles allouées à chaque catégorie (ex: Travaux 350€, Vie quotidienne 600€)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBudgetsOpen(true)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  Ouvrir l'éditeur de plafonds
                </button>
              </div>

              {/* Grid of categories with limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {state.categories.map(cat => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-bold text-slate-800 text-xs truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">
                        {cat.monthlyLimit > 0 ? `${cat.monthlyLimit} €/mois` : 'Revenu / Libre'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>{cat.isEssential ? 'Besoin essentiel (50%)' : 'Discrétionnaire'}</span>
                      <button
                        onClick={() => navigate('category-chart', { category: cat.name })}
                        className="text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        Visualiser le chart →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. ROUTE: TESTS (Tests automatisés fonctionnels) */}
        {currentRoute === 'tests' && <TestRunnerView />}
      </main>

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        filteredTransactions={filteredTransactions}
        categoriesSpending={categoriesSpending}
        monthlyCashFlow={monthlyCashFlow}
        categories={state.categories}
        periodLabel={periodLabel}
        totalIncome={financialStats.totalIncome}
        totalExpense={financialStats.totalExpense}
      />

      <TransactionModal
        isOpen={isAddTxOpen}
        onClose={() => {
          setIsAddTxOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={editingTransaction}
        categories={state.categories}
      />

      <BudgetModal
        isOpen={isBudgetsOpen}
        onClose={() => setIsBudgetsOpen(false)}
        categories={state.categories}
        transactions={state.transactions}
        onSaveBudgets={updated => setCategories(updated)}
      />

      {/* Quick Category Modal for Single Transaction (e.g. ATM withdrawal / Carte bleu retrait) */}
      <QuickCategoryModal
        isOpen={!!quickCatTransaction}
        onClose={() => setQuickCatTransaction(null)}
        transaction={quickCatTransaction}
        categories={state.categories}
        onSave={updatedTx => updateTransaction(updatedTx)}
      />

      {/* Batch Category Modal for Groups of Transactions */}
      <BatchCategoryModal
        isOpen={batchCatTransactions.length > 0}
        onClose={() => setBatchCatTransactions([])}
        selectedTransactions={batchCatTransactions}
        categories={state.categories}
        onApplyBatch={(ids, category, subCategory, notes, isPointed) =>
          batchUpdateCategory(ids, category, subCategory, notes, isPointed)
        }
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>BudgetCraft © 2026 — Gestion budgétaire & Visualisations par Catégorie</span>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <button onClick={() => navigate('tests')} className="hover:text-blue-600 hover:underline cursor-pointer">
              Diagnostics & Tests
            </button>
            <span>•</span>
            <span>Export CSV certifié Excel (BOM UTF-8)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </RouterProvider>
    </ErrorBoundary>
  );
}
