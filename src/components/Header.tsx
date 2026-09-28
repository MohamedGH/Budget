import React from 'react';
import {
  Upload,
  Download,
  Plus,
  Sliders,
  RotateCcw,
  Calendar,
  Wallet,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  PieChart,
  CheckCheck,
  Menu,
  X,
  Hammer
} from 'lucide-react';
import { PeriodFilter } from '../types';
import { AppRoute } from '../router/types';

interface HeaderProps {
  period: PeriodFilter;
  onPeriodChange: (p: PeriodFilter) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenAddTx: () => void;
  onOpenBudgets: () => void;
  onResetData: () => void;
  activeView: AppRoute;
  onViewChange: (view: AppRoute) => void;
  totalTransactionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  period,
  onPeriodChange,
  onOpenImport,
  onOpenExport,
  onOpenAddTx,
  onOpenBudgets,
  onResetData,
  activeView,
  onViewChange,
  totalTransactionsCount,
}) => {
  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top bar: Brand + Quick Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => onViewChange('dashboard')}
                  className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-200 cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1
                      onClick={() => onViewChange('dashboard')}
                      className="text-lg font-bold text-slate-900 tracking-tight cursor-pointer"
                    >
                      BudgetCraft
                    </h1>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200/60 uppercase tracking-wider">
                      Executive
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 hidden sm:block">
                    Pilotage budgétaire temps réel, ventilation des retraits & graphiques par catégorie
                  </p>
                </div>
              </div>

              {/* Mobile Quick Action Buttons */}
              <div className="flex items-center gap-1.5 md:hidden">
                <button
                  id="btn-mobile-add"
                  onClick={onOpenAddTx}
                  className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 cursor-pointer"
                  title="Ajouter transaction"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  id="btn-mobile-import"
                  onClick={onOpenImport}
                  className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200 cursor-pointer"
                  title="Importer relevé"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Toolbar Desktop */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-add-transaction"
                onClick={onOpenAddTx}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm shadow-blue-200 transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nouvelle Transaction</span>
              </button>

              <button
                id="btn-import-statement"
                onClick={onOpenImport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold border border-slate-200 transition-all duration-150 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Importer Relevé</span>
              </button>

              <button
                id="btn-export-reports"
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-semibold border border-slate-200 transition-all duration-150 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exporter CSV</span>
              </button>

              <button
                id="btn-budget-settings"
                onClick={onOpenBudgets}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                title="Configurer les plafonds budgétaires"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Plafonds</span>
              </button>

              <button
                id="btn-reset-demo"
                onClick={onResetData}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                title="Réinitialiser avec le relevé de démonstration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Bar: Page Router tabs & Period selector */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-2 border-t border-slate-100 gap-2.5">
            {/* Main Navigation tabs */}
            <div className="flex items-center overflow-x-auto gap-1 bg-slate-100 p-1 rounded-lg self-start border border-slate-200/60 max-w-full">
              <button
                id="nav-dashboard"
                onClick={() => onViewChange('dashboard')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tableau de bord
              </button>
              <button
                id="nav-transactions"
                onClick={() => onViewChange('transactions')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'transactions'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                <span>Opérations ({totalTransactionsCount})</span>
              </button>
              <button
                id="nav-analytics"
                onClick={() => onViewChange('analytics')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'analytics'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Analytique Globale</span>
              </button>
              <button
                id="nav-category-chart"
                onClick={() => onViewChange('category-chart')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'category-chart'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold text-orange-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-3.5 h-3.5 text-orange-600" />
                <span>Graphiques par Catégorie</span>
              </button>
              <button
                id="nav-budgets"
                onClick={() => onViewChange('budgets')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'budgets'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                <span>Plafonds</span>
              </button>
              <button
                id="nav-tests"
                onClick={() => onViewChange('tests')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'tests'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold text-emerald-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tests Automatisés</span>
              </button>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-2 self-start lg:self-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Période:</span>
              </div>
              <select
                id="select-period-filter"
                value={period}
                onChange={e => onPeriodChange(e.target.value as PeriodFilter)}
                className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">Toutes les opérations (2026)</option>
                <option value="2026-08">Août 2026</option>
                <option value="2026-07">Juillet 2026</option>
                <option value="2026-06">Juin 2026</option>
                <option value="2026-05">Mai 2026</option>
                <option value="2026-04">Avril 2026</option>
                <option value="2026-03">Mars 2026</option>
                <option value="2026-02">Février 2026</option>
                <option value="last3months">Derniers 3 mois (Juin - Août 2026)</option>
                <option value="last6months">Derniers 6 mois (Mar - Août 2026)</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around">
        <button
          onClick={() => onViewChange('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
            activeView === 'dashboard' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Accueil</span>
        </button>

        <button
          onClick={() => onViewChange('transactions')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
            activeView === 'transactions' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Opérations</span>
        </button>

        <button
          onClick={() => onViewChange('category-chart')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
            activeView === 'category-chart' ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Catégories</span>
        </button>

        <button
          onClick={() => onViewChange('analytics')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
            activeView === 'analytics' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Analyses</span>
        </button>

        <button
          onClick={() => onViewChange('tests')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
            activeView === 'tests' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Tests</span>
        </button>
      </nav>
    </>
  );
};
