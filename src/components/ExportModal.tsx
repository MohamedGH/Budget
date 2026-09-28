import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Table,
  BarChart,
  Calendar
} from 'lucide-react';
import {
  Transaction,
  BudgetCategory,
  CategorySpending,
  MonthlyCashFlow
} from '../types';
import {
  exportTransactionsToCsv,
  exportBudgetSummaryReport,
  exportCashFlowReport
} from '../utils/csvExporter';
import { formatCurrency } from '../utils/budgetCalculations';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredTransactions: Transaction[];
  categoriesSpending: CategorySpending[];
  monthlyCashFlow: MonthlyCashFlow[];
  categories: BudgetCategory[];
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  filteredTransactions,
  categoriesSpending,
  monthlyCashFlow,
  categories,
  periodLabel,
  totalIncome,
  totalExpense,
}) => {
  const [reportType, setReportType] = useState<'transactions' | 'budget' | 'cashflow'>('transactions');
  const [delimiter, setDelimiter] = useState<';' | ','>(';');
  const [isExported, setIsExported] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = () => {
    if (reportType === 'transactions') {
      exportTransactionsToCsv(filteredTransactions, {
        delimiter,
        filename: `budgetcraft_operations_${new Date().toISOString().split('T')[0]}.csv`,
      });
    } else if (reportType === 'budget') {
      exportBudgetSummaryReport(
        categoriesSpending,
        categories,
        periodLabel,
        totalIncome,
        totalExpense,
        {
          delimiter,
          filename: `budgetcraft_rapport_performance_${periodLabel.replace(/\s+/g, '_')}.csv`,
        }
      );
    } else if (reportType === 'cashflow') {
      exportCashFlowReport(monthlyCashFlow, {
        delimiter,
        filename: `budgetcraft_flux_mensuels_${new Date().toISOString().split('T')[0]}.csv`,
      });
    }

    setIsExported(true);
    setTimeout(() => {
      setIsExported(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Exporter les Rapports au Format CSV</h3>
              <p className="text-xs text-slate-500">
                Compatible Excel, Google Sheets, Numbers (avec encodage UTF-8 BOM)
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
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Choice of report */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Type de rapport à générer
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1 */}
              <label
                onClick={() => setReportType('transactions')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  reportType === 'transactions'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  checked={reportType === 'transactions'}
                  onChange={() => setReportType('transactions')}
                  className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-blue-600" />
                      Journal des Opérations & Transactions
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {filteredTransactions.length} lignes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Export complet des opérations filtrées avec dates, libellés, catégories, montants et statut pointée.
                  </p>
                </div>
              </label>

              {/* Option 2 */}
              <label
                onClick={() => setReportType('budget')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  reportType === 'budget'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  checked={reportType === 'budget'}
                  onChange={() => setReportType('budget')}
                  className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <BarChart className="w-3.5 h-3.5 text-blue-600" />
                      Rapport de Performance Budgétaire & Écarts
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {periodLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tableau de bord synthétique comparant le budget alloué, les dépenses réelles et le taux de consommation par catégorie.
                  </p>
                </div>
              </label>

              {/* Option 3 */}
              <label
                onClick={() => setReportType('cashflow')}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  reportType === 'cashflow'
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="reportType"
                  checked={reportType === 'cashflow'}
                  onChange={() => setReportType('cashflow')}
                  className="mt-1 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Synthèse Mensuelle des Flux de Trésorerie
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {monthlyCashFlow.length} mois
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Évolution historique des revenus, dépenses, solde net et épargne cumulée mois par mois.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Delimiter configuration */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800">Séparateur de colonnes :</span>
              <p className="text-[11px] text-slate-500">
                Point-virgule (;) recommandé pour la version française d'Excel.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDelimiter(';')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  delimiter === ';'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Point-virgule (;) - FR
              </button>
              <button
                onClick={() => setDelimiter(',')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  delimiter === ','
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Virgule (,) - Standard
              </button>
            </div>
          </div>

          {/* Export metadata card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>Période ciblée :</span>
              <span className="text-blue-700">{periodLabel}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Revenus / Dépenses analysés :</span>
              <span className="font-medium text-slate-700">{formatCurrency(totalIncome)} / {formatCurrency(totalExpense)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Encodage du fichier :</span>
              <span className="font-medium text-slate-700">UTF-8 avec BOM (Accents préservés)</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
          <button
            id="btn-download-csv"
            onClick={handleExport}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isExported ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-blue-200" />
                <span>Téléchargement lancé !</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Télécharger le Rapport CSV</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
