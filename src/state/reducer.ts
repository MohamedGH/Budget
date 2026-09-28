import { AppState, AppAction, INITIAL_FILTERS } from './types';
import { Transaction } from '../types';

export { INITIAL_FILTERS };

// Pure functional reducer
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };

    case 'ADD_TRANSACTION': {
      const newTx: Transaction = {
        id: action.payload.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: action.payload.date || new Date().toISOString().split('T')[0],
        bookingDate: action.payload.bookingDate,
        label: action.payload.label || 'Nouvelle opération',
        rawDescription: action.payload.rawDescription,
        category: action.payload.category || 'Vie quotidienne',
        subCategory: action.payload.subCategory,
        amount: action.payload.amount || 0,
        isPointed: action.payload.isPointed ?? true,
        accountNumber: action.payload.accountNumber,
        accountLabel: action.payload.accountLabel || 'Compte Bancaire Principal',
        currency: 'EUR',
        notes: action.payload.notes,
      };
      return {
        ...state,
        transactions: [newTx, ...state.transactions],
        toastMessage: 'Nouvelle opération enregistrée',
      };
    }

    case 'UPDATE_TRANSACTION': {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        transactions: state.transactions.map(tx =>
          tx.id === id ? ({ ...tx, ...updates } as Transaction) : tx
        ),
        toastMessage: 'Opération mise à jour avec succès',
      };
    }

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(tx => tx.id !== action.payload.id),
        toastMessage: 'Opération supprimée',
      };

    case 'TOGGLE_POINTED':
      return {
        ...state,
        transactions: state.transactions.map(tx =>
          tx.id === action.payload.id ? { ...tx, isPointed: !tx.isPointed } : tx
        ),
      };

    case 'BATCH_UPDATE_CATEGORY': {
      const { ids, category, subCategory, notes, isPointed } = action.payload;
      const targetIdsSet = new Set(ids);

      const updatedTransactions = state.transactions.map(tx => {
        if (!targetIdsSet.has(tx.id)) return tx;

        // Functional note composition
        let finalNotes = tx.notes;
        if (notes && notes.trim()) {
          finalNotes = tx.notes ? `${tx.notes} | ${notes.trim()}` : notes.trim();
        }

        return {
          ...tx,
          category,
          subCategory: subCategory !== undefined ? subCategory : tx.subCategory,
          notes: finalNotes,
          isPointed: isPointed !== undefined ? isPointed : tx.isPointed,
        };
      });

      return {
        ...state,
        transactions: updatedTransactions,
        toastMessage: `${ids.length} opération${ids.length > 1 ? 's' : ''} affectée${
          ids.length > 1 ? 's' : ''
        } à la catégorie « ${category} »`,
      };
    }

    case 'BATCH_POINT': {
      const { ids, isPointed } = action.payload;
      const targetIdsSet = new Set(ids);
      return {
        ...state,
        transactions: state.transactions.map(tx =>
          targetIdsSet.has(tx.id) ? { ...tx, isPointed } : tx
        ),
        toastMessage: `${ids.length} opération${ids.length > 1 ? 's' : ''} ${
          isPointed ? 'marquée(s) comme pointée(s)' : 'dépointée(s)'
        }`,
      };
    }

    case 'BATCH_DELETE': {
      const targetIdsSet = new Set(action.payload.ids);
      return {
        ...state,
        transactions: state.transactions.filter(tx => !targetIdsSet.has(tx.id)),
        toastMessage: `${action.payload.ids.length} opération${
          action.payload.ids.length > 1 ? 's' : ''
        } supprimée(s)`,
      };
    }

    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
        toastMessage: 'Catégories budgétaires mises à jour',
      };

    case 'UPDATE_CATEGORY_LIMIT': {
      const { categoryId, newLimit } = action.payload;
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === categoryId ? { ...cat, monthlyLimit: Math.max(0, newLimit) } : cat
        ),
        toastMessage: 'Plafond budgétaire mis à jour',
      };
    }

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'SET_PERIOD':
      return {
        ...state,
        filters: { ...state.filters, period: action.payload },
      };

    case 'SET_CATEGORY_FILTER':
      return {
        ...state,
        filters: { ...state.filters, category: action.payload },
      };

    case 'RESET_DATA':
      return {
        ...state,
        transactions: action.payload.transactions,
        categories: action.payload.categories,
        filters: INITIAL_FILTERS,
        toastMessage: 'Données réinitialisées avec succès',
      };

    case 'SHOW_TOAST':
      return {
        ...state,
        toastMessage: action.payload,
      };

    case 'HIDE_TOAST':
      return {
        ...state,
        toastMessage: null,
      };

    default:
      return state;
  }
}
