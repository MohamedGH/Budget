import { Transaction, BudgetCategory, FilterOptions } from '../types';
import { INITIAL_CATEGORIES } from '../data/defaultData';
import { parseBankStatement, guessCategory, normalizeAmount, normalizeDate } from '../utils/bankParser';
import {
  calculateFinancialStats,
  calculateCategorySpending,
  calculate503020Rule,
  calculateBudgetVarianceList,
  filterTransactions,
  formatCurrency,
} from '../utils/budgetCalculations';
import { appReducer, INITIAL_FILTERS } from '../state/reducer';
import { AppState } from '../state/types';
import { Result } from '../errors/result';
import { errorManager } from '../errors/errorManager';
import { parseHash, formatHash } from '../router/RouterContext';

export interface TestCaseResult {
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  durationMs: number;
  assertionsCount: number;
}

export interface TestSuiteResult {
  suiteName: string;
  passed: boolean;
  tests: TestCaseResult[];
  totalPassed: number;
  totalFailed: number;
  durationMs: number;
}

function expect(condition: boolean, errorMsg: string) {
  if (!condition) {
    throw new Error(errorMsg);
  }
}

export function runAllFunctionalTests(): TestSuiteResult[] {
  const suites: TestSuiteResult[] = [];

  // =========================================================================
  // SUITE 1: Catégorie "Travaux" & Détection Automatique
  // =========================================================================
  {
    const suiteStart = performance.now();
    const tests: TestCaseResult[] = [];

    // Test 1.1: Présence de Travaux dans les catégories initiales
    {
      const tStart = performance.now();
      let passed = true;
      let msg = '';
      try {
        const travaux = INITIAL_CATEGORIES.find(c => c.name === 'Travaux');
        expect(!!travaux, 'La catégorie Travaux doit exister dans INITIAL_CATEGORIES');
        expect(travaux!.monthlyLimit > 0, 'La catégorie Travaux doit avoir un plafond budgétaire positif');
        expect(travaux!.color === '#ea580c', 'La catégorie Travaux doit avoir la couleur orange #ea580c');
      } catch (e: any) {
        passed = false;
        msg = e.message;
      }
      tests.push({
        name: 'Catégorie "Travaux" configurée avec plafond et couleur',
        category: 'Catégorie Travaux',
        passed,
        message: msg,
        durationMs: performance.now() - tStart,
        assertionsCount: 3,
      });
    }

    // Test 1.2: Détection automatique des enseignes de bricolage
    {
      const tStart = performance.now();
      let passed = true;
      let msg = '';
      try {
        const leroy = guessCategory('CARTE X0374 ADEO*LEROY MERLIN');
        expect(leroy.category === 'Travaux', 'ADEO*LEROY MERLIN doit être classé dans "Travaux"');

        const casto = guessCategory('CARTE CASTORAMA BRICOLAGE');
        expect(casto.category === 'Travaux', 'CASTORAMA doit être classé dans "Travaux"');

        const virementTravaux = guessCategory('VIR RECU DE: GHALLEB', 'MOTIF: Travaux aménagement');
        expect(virementTravaux.category === 'Travaux', 'Virement avec motif Travaux doit être classé dans "Travaux"');
      } catch (e: any) {
        passed = false;
        msg = e.message;
      }
      tests.push({
        name: 'Détection automatique intelligente des enseignes Travaux (Leroy Merlin, Castorama)',
        category: 'Catégorie Travaux',
        passed,
        message: msg,
        durationMs: performance.now() - tStart,
        assertionsCount: 3,
      });
    }

    suites.push({
      suiteName: '1. Catégorie « Travaux » & Moteur de Reconnaissance',
      passed: tests.every(t => t.passed),
      tests,
      totalPassed: tests.filter(t => t.passed).length,
      totalFailed: tests.filter(t => !t.passed).length,
      durationMs: performance.now() - suiteStart,
    });
  }

  // =========================================================================
  // SUITE 2: Modification de Catégorie Ponctuelle & Destination des Fonds ("À quoi a servi l'argent")
  // =========================================================================
  {
    const suiteStart = performance.now();
    const tests: TestCaseResult[] = [];

    // Test 2.1: Réaffectation d'un retrait DAB vers "Travaux" avec justificatif
    {
      const tStart = performance.now();
      let passed = true;
      let msg = '';
      try {
        const initialState: AppState = {
          transactions: [
            {
              id: 'tx-retrait-1',
              date: '2026-07-22',
              label: 'CARTE X0374 RETRAIT DAB CASH SERVICES',
              category: 'Retraits',
              amount: -300,
              isPointed: false,
              currency: 'EUR',
            },
          ],
          categories: INITIAL_CATEGORIES,
          filters: INITIAL_FILTERS,
          toastMessage: null,
        };

        const updatedState = appReducer(initialState, {
          type: 'UPDATE_TRANSACTION',
          payload: {
            id: 'tx-retrait-1',
            category: 'Travaux',
            subCategory: 'Matériaux / Peinture',
            notes: 'Achat outillage et peinture en espèces pour le salon',
            isPointed: true,
          },
        });

        const tx = updatedState.transactions[0];
        expect(tx.category === 'Travaux', 'La catégorie doit être mise à jour vers "Travaux"');
        expect(tx.subCategory === 'Matériaux / Peinture', 'La sous-catégorie doit être mise à jour');
        expect(tx.notes?.includes('salon') ?? false, 'La note d\'usage doit être enregistrée');
        expect(tx.isPointed === true, 'Le statut pointé doit être mis à jour');
      } catch (e: any) {
        passed = false;
        msg = e.message;
      }
      tests.push({
        name: 'Ventilation ponctuelle d\'un retrait DAB vers "Travaux" avec justificatif d\'usage',
        category: 'Action Ponctuelle',
        passed,
        message: msg,
        durationMs: performance.now() - tStart,
        assertionsCount: 4,
      });
    }

    suites.push({
      suiteName: '2. Modification Ponctuelle & Justificatif de Retrait',
      passed: tests.every(t => t.passed),
      tests,
      totalPassed: tests.filter(t => t.passed).length,
      totalFailed: tests.filter(t => !t.passed).length,
      durationMs: performance.now() - suiteStart,
    });
  }

  // =========================================================================
  // SUITE 3: Modification Groupée (Batch Category Update)
  // =========================================================================
  {
    const suiteStart = performance.now();
    const tests: TestCaseResult[] = [];

    // Test 3.1: Réaffectation de 3 opérations à la fois
    {
      const tStart = performance.now();
      let passed = true;
      let msg = '';
      try {
        const initialState: AppState = {
          transactions: [
            { id: 't1', date: '2026-07-01', label: 'Retrait 1', category: 'Retraits', amount: -70, isPointed: false, currency: 'EUR' },
            { id: 't2', date: '2026-07-02', label: 'Retrait 2', category: 'Retraits', amount: -70, isPointed: false, currency: 'EUR' },
            { id: 't3', date: '2026-07-03', label: 'Courses 1', category: 'Vie quotidienne', amount: -50, isPointed: false, currency: 'EUR' },
          ],
          categories: INITIAL_CATEGORIES,
          filters: INITIAL_FILTERS,
          toastMessage: null,
        };

        const updatedState = appReducer(initialState, {
          type: 'BATCH_UPDATE_CATEGORY',
          payload: {
            ids: ['t1', 't2'],
            category: 'Travaux',
            subCategory: 'Rénovation',
            notes: 'Acomptes artisan travaux',
            isPointed: true,
          },
        });

        const t1 = updatedState.transactions.find(t => t.id === 't1')!;
        const t2 = updatedState.transactions.find(t => t.id === 't2')!;
        const t3 = updatedState.transactions.find(t => t.id === 't3')!;

        expect(t1.category === 'Travaux', 't1 doit être dans Travaux');
        expect(t2.category === 'Travaux', 't2 doit être dans Travaux');
        expect(t3.category === 'Vie quotidienne', 't3 ne doit pas être modifié');
        expect(t1.notes === 'Acomptes artisan travaux', 'Note de lot enregistrée sur t1');
        expect(t1.isPointed === true && t2.isPointed === true, 't1 et t2 doivent être pointées');
      } catch (e: any) {
        passed = false;
        msg = e.message;
      }
      tests.push({
        name: 'Modification groupée (Batch) d\'un lot d\'opérations avec note collective',
        category: 'Action Groupée',
        passed,
        message: msg,
        durationMs: performance.now() - tStart,
        assertionsCount: 5,
      });
    }

    suites.push({
      suiteName: '3. Modification Groupée de Catégorie (Batch Actions)',
      passed: tests.every(t => t.passed),
      tests,
      totalPassed: tests.filter(t => t.passed).length,
      totalFailed: tests.filter(t => !t.passed).length,
      durationMs: performance.now() - suiteStart,
    });
  }

  // =========================================================================
  // SUITE 4: Calculs Financiers, Statistiques & Graphiques par Catégorie
  // =========================================================================
  {
    const suiteStart = performance.now();
    const tests: TestCaseResult[] = [];

    // Test 4.1: Calcul précis des KPIs
    {
      const tStart = performance.now();
      let passed = true;
      let msg = '';
      try {
        const txList: Transaction[] = [
          { id: '1', date: '2026-08-01', label: 'Salaire', category: 'Virements reçus', amount: 2000, isPointed: true, currency: 'EUR' },
          { id: '2', date: '2026-08-02', label: 'Loyer', category: 'Logement', amount: -600, isPointed: true, currency: 'EUR' },
          { id: '3', date: '2026-08-03', label: 'Bricolage', category: 'Travaux', amount: -200, isPointed: true, currency: 'EUR' },
        ];

        const stats = calculateFinancialStats(txList, INITIAL_CATEGORIES);
        expect(stats.totalIncome === 2000, 'Revenus totaux doivent être 2000€');
        expect(stats.totalExpense === 800, 'Dépenses totales doivent être 800€');
        expect(stats.netSavings === 1200, 'Capacité d\'épargne nette doit être 1200€');
        expect(stats.savingsRate === 60, 'Taux d\'épargne doit être 60%');
      } catch (e: any) {
        passed = false;
        msg = e.message;
      }
      tests.push({
        name: 'Calcul exact des métriques clés (Revenus, Dépenses, Épargne, Taux d\'épargne)',
        category: 'Analytics & Calculs',
        passed,
        message: msg,
        durationMs: performance.now() - tStart,
        assertionsCount: 4,
      });
    }

    // Test 4.2: Matrice de dépenses par catégorie
    {
      const tStart = performance.now();
      let passed = true;
      let msg = '';
      try {
        const txList: Transaction[] = [
          { id: '1', date: '2026-08-01', label: 'Leroy Merlin', category: 'Travaux', subCategory: 'Peinture', amount: -150, isPointed: true, currency: 'EUR' },
          { id: '2', date: '2026-08-05', label: 'Castorama', category: 'Travaux', subCategory: 'Outillage', amount: -50, isPointed: true, currency: 'EUR' },
        ];

        const spending = calculateCategorySpending(txList, INITIAL_CATEGORIES);
        const travauxSpending = spending.find(s => s.category === 'Travaux')!;
        expect(travauxSpending.spent === 200, 'Total dépensé dans Travaux doit être 200€');
        expect(travauxSpending.transactionCount === 2, 'Nombre d\'opérations Travaux doit être 2');
        expect(travauxSpending.subCategories['Peinture'] === 150, 'Sous-catégorie Peinture = 150€');
        expect(travauxSpending.subCategories['Outillage'] === 50, 'Sous-catégorie Outillage = 50€');
      } catch (e: any) {
        passed = false;
        msg = e.message;
      }
      tests.push({
        name: 'Agrégation des graphiques par catégorie et sous-postes',
        category: 'Analytics & Calculs',
        passed,
        message: msg,
        durationMs: performance.now() - tStart,
        assertionsCount: 4,
      });
    }

    suites.push({
      suiteName: '4. Moteur de Calcul & Agrégations par Catégorie',
      passed: tests.every(t => t.passed),
      tests,
      totalPassed: tests.filter(t => t.passed).length,
      totalFailed: tests.filter(t => !t.passed).length,
      durationMs: performance.now() - suiteStart,
    });
  }

  // =========================================================================
  // SUITE 5: Route Manager & Navigation par Page
  // =========================================================================
  {
    const suiteStart = performance.now();
    const tests: TestCaseResult[] = [];

    // Test 5.1: Analyse du Hash URL
    {
      const tStart = performance.now();
      let passed = true;
      let msg = '';
      try {
        const r1 = parseHash('#/category-chart?category=Travaux');
        expect(r1.route === 'category-chart', 'Route doit être "category-chart"');
        expect(r1.params.category === 'Travaux', 'Paramètre category doit être "Travaux"');

        const formatted = formatHash('category-chart', { category: 'Travaux' });
        expect(formatted === '#/category-chart?category=Travaux', 'Formatage du hash conforme');
      } catch (e: any) {
        passed = false;
        msg = e.message;
      }
      tests.push({
        name: 'Parser & Formateur de Routes Hash avec paramètres d\'URL',
        category: 'Route Manager',
        passed,
        message: msg,
        durationMs: performance.now() - tStart,
        assertionsCount: 3,
      });
    }

    suites.push({
      suiteName: '5. Gestionnaire de Navigation & Routage SPA',
      passed: tests.every(t => t.passed),
      tests,
      totalPassed: tests.filter(t => t.passed).length,
      totalFailed: tests.filter(t => !t.passed).length,
      durationMs: performance.now() - suiteStart,
    });
  }

  // =========================================================================
  // SUITE 6: Error Manager & Functional Result Type
  // =========================================================================
  {
    const suiteStart = performance.now();
    const tests: TestCaseResult[] = [];

    // Test 6.1: Result monad
    {
      const tStart = performance.now();
      let passed = true;
      let msg = '';
      try {
        const okRes = Result.ok(42);
        expect(Result.isOk(okRes) && okRes.value === 42, 'Result.ok fonctionne');

        const mapped = Result.map(okRes, n => n * 2);
        expect(Result.isOk(mapped) && mapped.value === 84, 'Result.map fonctionne');

        const tryRes = Result.fromTry(() => {
          throw new Error('Boom');
        });
        expect(Result.isErr(tryRes) && tryRes.error.message === 'Boom', 'Result.fromTry intercepte l\'erreur');
      } catch (e: any) {
        passed = false;
        msg = e.message;
      }
      tests.push({
        name: 'Pattern fonctionnel Result<T, E> et gestion d\'exceptions sans crash',
        category: 'Error Manager',
        passed,
        message: msg,
        durationMs: performance.now() - tStart,
        assertionsCount: 3,
      });
    }

    suites.push({
      suiteName: '6. Gestionnaire d\'Erreurs & Robustesse Fonctionnelle',
      passed: tests.every(t => t.passed),
      tests,
      totalPassed: tests.filter(t => t.passed).length,
      totalFailed: tests.filter(t => !t.passed).length,
      durationMs: performance.now() - suiteStart,
    });
  }

  return suites;
}
