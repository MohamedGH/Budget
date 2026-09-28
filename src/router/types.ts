export type AppRoute =
  | 'dashboard'
  | 'transactions'
  | 'analytics'
  | 'category-chart'
  | 'budgets'
  | 'tests';

export interface RouteState {
  route: AppRoute;
  params: Record<string, string>;
  hash: string;
}

export const ROUTE_CONFIG: Record<
  AppRoute,
  { label: string; icon: string; path: string; description: string }
> = {
  dashboard: {
    label: 'Tableau de bord',
    icon: 'LayoutDashboard',
    path: '#/dashboard',
    description: 'Synthèse financière globale, KPIs et alertes en temps réel',
  },
  transactions: {
    label: 'Opérations',
    icon: 'FileSpreadsheet',
    path: '#/transactions',
    description: 'Journal complet des écritures, ventilation et modification groupée',
  },
  analytics: {
    label: 'Analytique globale',
    icon: 'BarChart2',
    path: '#/analytics',
    description: 'Diagnostics 50/30/20, écarts budgétaires, trésorerie et pacing',
  },
  'category-chart': {
    label: 'Graphiques par Catégorie',
    icon: 'PieChart',
    path: '#/category-chart',
    description: 'Visualisation dédiée par catégorie (Travaux, Retraits, etc.) et drilldown',
  },
  budgets: {
    label: 'Plafonds Budgétaires',
    icon: 'SlidersHorizontal',
    path: '#/budgets',
    description: 'Configuration des limites mensuelles par poste de dépense',
  },
  tests: {
    label: 'Tests & Diagnostics',
    icon: 'CheckCheck',
    path: '#/tests',
    description: 'Suite de tests fonctionnels automatisés & validation continue',
  },
};
