import React, { createContext, useContext, useReducer, useEffect, useMemo, ReactNode } from 'react';
import { AppState, AppAction, INITIAL_FILTERS } from './types';
import { appReducer } from './reducer';
import { Transaction, BudgetCategory, FilterOptions, PeriodFilter, FinancialStats, CategorySpending, MonthlyCashFlow } from '../types';
import { INITIAL_CATEGORIES, RAW_SAMPLE_STATEMENT } from '../data/defaultData';
import { parseBankStatement } from '../utils/bankParser';
import {
  filterTransactions,
  calculateFinancialStats,
  calculateCategorySpending,
  calculateMonthlyCashFlow,
  MONTH_NAMES_FR,
} from '../utils/budgetCalculations';
import { errorManager } from '../errors/errorManager';

const STORAGE_KEY_TRANSACTIONS = 'budgetcraft_transactions_v3';
const STORAGE_KEY_CATEGORIES = 'budgetcraft_categories_v3';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Functional computed selectors
  filteredTransactions: Transaction[];
  financialStats: FinancialStats;
  categoriesSpending: CategorySpending[];
  monthlyCashFlow: MonthlyCashFlow[];
  periodLabel: string;
  // Functional Action helpers
  addTransaction: (tx: Partial<Transaction>) => void;
  updateTransaction: (tx: Partial<Transaction> & { id: string }) => void;
  deleteTransaction: (id: string) => void;
  togglePointed: (id: string) => void;
  batchUpdateCategory: (
    ids: string[],
    category: string,
    subCategory?: string,
    notes?: string,
    isPointed?: boolean
  ) => void;
  batchPoint: (ids: string[], isPointed: boolean) => void;
  batchDelete: (ids: string[]) => void;
  setCategories: (categories: BudgetCategory[]) => void;
  updateCategoryLimit: (categoryId: string, newLimit: number) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  setPeriod: (period: PeriodFilter) => void;
  setCategoryFilter: (cat: string) => void;
  resetToDemoData: () => void;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function getInitialState(): AppState {
  let initialTransactions: Transaction[] = [];
  let initialCategories: BudgetCategory[] = INITIAL_CATEGORIES;

  // 1. Transactions from localStorage
  if (typeof window !== 'undefined') {
    const savedTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    if (savedTx) {
      const parsed = errorManager.safeParse<Transaction[]>(savedTx, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        initialTransactions = parsed;
      }
    }
  }

  // Fallback to sample statement
  if (initialTransactions.length === 0) {
    const parsed = parseBankStatement(RAW_SAMPLE_STATEMENT);
    initialTransactions = parsed.transactions;
  }

  // 2. Categories from localStorage
  if (typeof window !== 'undefined') {
    const savedCats = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (savedCats) {
      const parsed = errorManager.safeParse<BudgetCategory[]>(savedCats, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure "Travaux" is present even for returning users
        const hasTravaux = parsed.some(c => c.name.toLowerCase() === 'travaux');
        if (!hasTravaux) {
          const travauxCat = INITIAL_CATEGORIES.find(c => c.name === 'Travaux');
          if (travauxCat) parsed.unshift(travauxCat);
        }
        initialCategories = parsed;
      }
    }
  }

  return {
    transactions: initialTransactions,
    categories: initialCategories,
    filters: INITIAL_FILTERS,
    toastMessage: null,
  };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);

  // Sync transactions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(state.transactions));
    } catch (err) {
      errorManager.report(err instanceof Error ? err : 'LocalStorage write error', 'warning');
    }
  }, [state.transactions]);

  // Sync categories to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(state.categories));
    } catch (err) {
      errorManager.report(err instanceof Error ? err : 'LocalStorage write error', 'warning');
    }
  }, [state.categories]);

  // Auto-hide toast after 3.5s
  useEffect(() => {
    if (state.toastMessage) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [state.toastMessage]);

  // --- Functional Selectors ---
  const filteredTransactions = useMemo(() => {
    return filterTransactions(state.transactions, state.filters);
  }, [state.transactions, state.filters]);

  const financialStats = useMemo(() => {
    return calculateFinancialStats(filteredTransactions, state.categories);
  }, [filteredTransactions, state.categories]);

  const categoriesSpending = useMemo(() => {
    return calculateCategorySpending(filteredTransactions, state.categories);
  }, [filteredTransactions, state.categories]);

  const monthlyCashFlow = useMemo(() => {
    return calculateMonthlyCashFlow(state.transactions);
  }, [state.transactions]);

  const periodLabel = useMemo(() => {
    const p = state.filters.period;
    if (p === 'all') return 'Toutes les opérations (2026)';
    if (p === 'last3months') return 'Derniers 3 mois';
    if (p === 'last6months') return 'Derniers 6 mois';
    if (p.startsWith('2026-')) {
      const monthNum = parseInt(p.split('-')[1], 10) - 1;
      return `${MONTH_NAMES_FR[monthNum]} 2026`;
    }
    return p;
  }, [state.filters.period]);

  // --- Dispatcher Actions ---
  const addTransaction = (tx: Partial<Transaction>) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: tx });
  };

  const updateTransaction = (tx: Partial<Transaction> & { id: string }) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: tx });
  };

  const deleteTransaction = (id: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: { id } });
  };

  const togglePointed = (id: string) => {
    dispatch({ type: 'TOGGLE_POINTED', payload: { id } });
  };

  const batchUpdateCategory = (
    ids: string[],
    category: string,
    subCategory?: string,
    notes?: string,
    isPointed?: boolean
  ) => {
    dispatch({
      type: 'BATCH_UPDATE_CATEGORY',
      payload: { ids, category, subCategory, notes, isPointed },
    });
  };

  const batchPoint = (ids: string[], isPointed: boolean) => {
    dispatch({ type: 'BATCH_POINT', payload: { ids, isPointed } });
  };

  const batchDelete = (ids: string[]) => {
    dispatch({ type: 'BATCH_DELETE', payload: { ids } });
  };

  const setCategories = (categories: BudgetCategory[]) => {
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  };

  const updateCategoryLimit = (categoryId: string, newLimit: number) => {
    dispatch({ type: 'UPDATE_CATEGORY_LIMIT', payload: { categoryId, newLimit } });
  };

  const setFilters = (filters: Partial<FilterOptions>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setPeriod = (period: PeriodFilter) => {
    dispatch({ type: 'SET_PERIOD', payload: period });
  };

  const setCategoryFilter = (cat: string) => {
    dispatch({ type: 'SET_CATEGORY_FILTER', payload: cat });
  };

  const resetToDemoData = () => {
    const parsed = parseBankStatement(RAW_SAMPLE_STATEMENT);
    dispatch({
      type: 'RESET_DATA',
      payload: {
        transactions: parsed.transactions,
        categories: INITIAL_CATEGORIES,
      },
    });
  };

  const showToast = (msg: string) => {
    dispatch({ type: 'SHOW_TOAST', payload: msg });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
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
        updateCategoryLimit,
        setFilters,
        setPeriod,
        setCategoryFilter,
        resetToDemoData,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
};
