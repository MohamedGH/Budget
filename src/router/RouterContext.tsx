import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppRoute, RouteState } from './types';

interface RouterContextType {
  currentRoute: AppRoute;
  params: Record<string, string>;
  navigate: (route: AppRoute, params?: Record<string, string>) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

// Pure functional parser of the window hash
export function parseHash(hashString: string): RouteState {
  const clean = (hashString || '').replace(/^#\/?/, '');
  const [routePart, queryPart] = clean.split('?');
  
  let route: AppRoute = 'dashboard';
  const segments = (routePart || '').split('/');
  const baseRoute = segments[0] as AppRoute;

  if (['dashboard', 'transactions', 'analytics', 'category-chart', 'budgets', 'tests'].includes(baseRoute)) {
    route = baseRoute;
  }

  const params: Record<string, string> = {};
  
  // URL sub-segment params (e.g. #/category-chart/Travaux)
  if (segments.length > 1 && segments[1]) {
    params.category = decodeURIComponent(segments[1]);
  }

  // URL query params (e.g. ?category=Travaux&search=retrait)
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  return { route, params, hash: hashString };
}

// Pure functional serializer
export function formatHash(route: AppRoute, params?: Record<string, string>): string {
  let hash = `#/${route}`;
  if (!params || Object.keys(params).length === 0) return hash;

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) queryParams.set(k, v);
  });
  const queryString = queryParams.toString();
  return queryString ? `${hash}?${queryString}` : hash;
}

export const RouterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routeState, setRouteState] = useState<RouteState>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return parseHash(window.location.hash);
    }
    return { route: 'dashboard', params: {}, hash: '#/dashboard' };
  });

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(parseHash(window.location.hash));
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial hash if empty
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((route: AppRoute, params?: Record<string, string>) => {
    const newHash = formatHash(route, params);
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    } else {
      setRouteState({ route, params: params || {}, hash: newHash });
    }
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('dashboard');
    }
  }, [navigate]);

  return (
    <RouterContext.Provider
      value={{
        currentRoute: routeState.route,
        params: routeState.params,
        navigate,
        goBack,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export const useAppRoute = (): RouterContextType => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useAppRoute must be used within a RouterProvider');
  }
  return context;
};
