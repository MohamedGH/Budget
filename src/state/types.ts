import { Transaction, BudgetCategory, FilterOptions, PeriodFilter } from '../types';

export interface AppState {
  transactions: Transaction[];
  categories: BudgetCategory[];
  filters: FilterOptions;
  toastMessage: string | null;
}

export const INITIAL_FILTERS: FilterOptions = {
  period: 'all',
  category: 'all',
  type: 'all',
  search: '',
  reconciledStatus: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};

export type AppAction =
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Partial<Transaction> }
  | { type: 'UPDATE_TRANSACTION'; payload: Partial<Transaction> & { id: string } }
  | { type: 'DELETE_TRANSACTION'; payload: { id: string } }
  | { type: 'TOGGLE_POINTED'; payload: { id: string } }
  | {
      type: 'BATCH_UPDATE_CATEGORY';
      payload: {
        ids: string[];
        category: string;
        subCategory?: string;
        notes?: string;
        isPointed?: boolean;
      };
    }
  | { type: 'BATCH_POINT'; payload: { ids: string[]; isPointed: boolean } }
  | { type: 'BATCH_DELETE'; payload: { ids: string[] } }
  | { type: 'SET_CATEGORIES'; payload: BudgetCategory[] }
  | { type: 'UPDATE_CATEGORY_LIMIT'; payload: { categoryId: string; newLimit: number } }
  | { type: 'SET_FILTERS'; payload: Partial<FilterOptions> }
  | { type: 'SET_PERIOD'; payload: PeriodFilter }
  | { type: 'SET_CATEGORY_FILTER'; payload: string }
  | { type: 'RESET_DATA'; payload: { transactions: Transaction[]; categories: BudgetCategory[] } }
  | { type: 'SHOW_TOAST'; payload: string }
  | { type: 'HIDE_TOAST' };
