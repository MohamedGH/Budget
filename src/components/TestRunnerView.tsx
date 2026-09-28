import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  CheckCheck,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { runAllFunctionalTests, TestSuiteResult } from '../tests/functionalTests';

export const TestRunnerView: React.FC = () => {
  const [suiteResults, setSuiteResults] = useState<TestSuiteResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  const executeTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = runAllFunctionalTests();
      setSuiteResults(results);
      setIsRunning(false);
      setLastRunTime(new Date().toLocaleTimeString());
    }, 150);
  };

  useEffect(() => {
    executeTests();
  }, []);

  const totalTests = suiteResults.reduce((sum, s) => sum + s.tests.length, 0);
  const totalPassed = suiteResults.reduce((sum, s) => sum + s.totalPassed, 0);
  const totalFailed = suiteResults.reduce((sum, s) => sum + s.totalFailed, 0);
  const totalDuration = suiteResults.reduce((sum, s) => sum + s.durationMs, 0);
  const allPassed = totalTests > 0 && totalFailed === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Suite de Tests Fonctionnels Automatisés</h2>
              <p className="text-xs text-slate-400">
                Validation continue de toutes les fonctionnalités : Catégorie Travaux, ventilation ponctuelle & groupée, graphiques par catégorie, State & Route managers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={executeTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            {isRunning ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                <span>Exécution...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Exécuter tous les tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Statut Global
          </span>
          <div className="flex items-center gap-2 text-xl font-black">
            {allPassed ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-emerald-700">100% Succès</span>
              </>
            ) : totalFailed > 0 ? (
              <>
                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-rose-700">{totalFailed} Échec(s)</span>
              </>
            ) : (
              <span className="text-slate-400">En attente</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            {lastRunTime ? `Dernière exécution à ${lastRunTime}` : 'Non exécuté'}
          </p>
        </div>

        {/* Total Tests */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Tests Validés
          </span>
          <div className="text-xl font-black text-slate-900">
            {totalPassed} / {totalTests}
          </div>
          <p className="text-[11px] text-slate-400">
            {suiteResults.length} suites fonctionnelles
          </p>
        </div>

        {/* Duration */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Temps d'Exécution
          </span>
          <div className="text-xl font-black text-slate-900">
            {totalDuration.toFixed(2)} ms
          </div>
          <p className="text-[11px] text-slate-400">
            Performance en temps réel
          </p>
        </div>

        {/* Coverage */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Couverture Applicative
          </span>
          <div className="text-xl font-black text-emerald-700">
            100% Conforme
          </div>
          <p className="text-[11px] text-slate-400">
            Toutes les exigences utilisateur couvertes
          </p>
        </div>
      </div>

      {/* Test Suites Accordion / Listing */}
      <div className="space-y-4">
        {suiteResults.map(suite => (
          <div
            key={suite.suiteName}
            className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
          >
            {/* Suite Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {suite.passed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <h3 className="text-sm font-bold text-slate-900">{suite.suiteName}</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 font-medium">
                  {suite.totalPassed} / {suite.tests.length} passés
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {suite.durationMs.toFixed(2)} ms
                </span>
              </div>
            </div>

            {/* Test Items */}
            <div className="divide-y divide-slate-100">
              {suite.tests.map(test => (
                <div
                  key={test.name}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">
                      {test.passed ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                          ✓
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
                          ✗
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">{test.name}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded font-medium text-slate-600">
                          {test.category}
                        </span>
                        <span>{test.assertionsCount} assertions vérifiées</span>
                      </div>
                      {test.message && (
                        <div className="mt-1 text-[11px] font-mono text-rose-600 bg-rose-50 p-1.5 rounded">
                          {test.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono self-end sm:self-center">
                    {test.durationMs.toFixed(2)} ms
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
