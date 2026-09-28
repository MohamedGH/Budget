import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { Transaction } from '../types';
import { parseBankStatement, ParseResult } from '../utils/bankParser';
import { RAW_SAMPLE_STATEMENT } from '../data/defaultData';
import { formatCurrency, formatDate } from '../utils/budgetCalculations';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (imported: Transaction[], replaceAll: boolean) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [replaceAll, setReplaceAll] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setFileName(file.name);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        processCsvText(text);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erreur lors de la lecture du fichier.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const processCsvText = (text: string) => {
    try {
      const result = parseBankStatement(text);
      if (result.transactions.length === 0) {
        setErrorMsg('Aucune transaction valide n\'a pu être extraite. Vérifiez le format du fichier.');
        setParseResult(null);
      } else {
        setParseResult(result);
        setErrorMsg('');
      }
    } catch {
      setErrorMsg('Erreur lors du traitement du fichier.');
      setParseResult(null);
    }
  };

  const handlePasteChange = (val: string) => {
    setPastedText(val);
    if (val.trim().length > 10) {
      processCsvText(val);
    } else {
      setParseResult(null);
    }
  };

  const loadPresetSample = () => {
    setPastedText(RAW_SAMPLE_STATEMENT);
    processCsvText(RAW_SAMPLE_STATEMENT);
    setActiveTab('paste');
  };

  const handleConfirmImport = () => {
    if (parseResult && parseResult.transactions.length > 0) {
      onImportSuccess(parseResult.transactions, replaceAll);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Importer un Relevé Bancaire</h3>
              <p className="text-xs text-slate-500">
                Supporte les formats bancaires français (point-virgule ';') et CSV standard
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
          {/* Mode switch */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Déposer un Fichier</span>
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Coller le Texte</span>
              </button>
            </div>

            <button
              onClick={loadPresetSample}
              className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors cursor-pointer self-start sm:self-auto"
              title="Charger les transactions de test réelles"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Charger relevé exemple</span>
            </button>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-800">
                Glissez & déposez votre fichier bancaire ici
              </p>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Formats acceptés : .CSV, .TXT, relevés bancaires (Crédit Agricole, BNP, SG, Boursorama, etc.)
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors">
                <span>Parcourir mes fichiers</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFile(e.target.files[0]);
                    }
                  }}
                />
              </label>

              {fileName && (
                <div className="mt-3 text-xs font-medium text-blue-700 bg-blue-50 py-1 px-2.5 rounded-lg border border-blue-200 inline-block">
                  Fichier sélectionné : {fileName}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct Paste */}
          {activeTab === 'paste' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Collez les lignes de votre relevé (avec en-têtes ou séparateur ';' / ',') :
              </label>
              <textarea
                rows={6}
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="Date transaction;Libellé opération;Catégorie;Montant;..."
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parse Result Preview */}
          {parseResult && (
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    {parseResult.transactions.length} opération{parseResult.transactions.length > 1 ? 's' : ''} détectée{parseResult.transactions.length > 1 ? 's' : ''} avec succès
                  </span>
                </div>
                <span className="text-[11px] font-medium bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                  Format: {parseResult.detectedFormat}
                </span>
              </div>

              {/* Sample preview table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-40 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Libellé</th>
                      <th className="p-2">Catégorie</th>
                      <th className="p-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseResult.transactions.slice(0, 4).map((tx) => (
                      <tr key={tx.id}>
                        <td className="p-2 text-slate-600">{formatDate(tx.date)}</td>
                        <td className="p-2 font-medium text-slate-900 truncate max-w-[180px]">
                          {tx.label}
                        </td>
                        <td className="p-2 text-slate-600">{tx.category}</td>
                        <td
                          className={`p-2 text-right font-bold ${
                            tx.amount >= 0 ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import options */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceAll}
                    onChange={(e) => setReplaceAll(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                  />
                  <span>
                    <strong>Remplacer toutes les opérations actuelles</strong> (sinon, ajouter à la suite)
                  </span>
                </label>
              </div>
            </div>
          )}
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
            id="btn-confirm-import"
            disabled={!parseResult || parseResult.transactions.length === 0}
            onClick={handleConfirmImport}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Confirmer l'importation ({parseResult?.transactions.length || 0})
          </button>
        </div>
      </div>
    </div>
  );
};
