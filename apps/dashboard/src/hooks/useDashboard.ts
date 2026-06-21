import { useState, useEffect } from 'react';
import { dashboardApi } from '../lib/api';
import type { UnifiedDashboard, CallItem } from '@auditor/shared-types';

/** Fetch unified or personal dashboard KPIs */
export function useDashboardKPIs() {
  const [data, setData] = useState<UnifiedDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    // Try unified first (for supervisor+), fall back to personal (for agents)
    dashboardApi.getUnified()
      .then(result => { if (!cancelled) setData(result); })
      .catch(() => dashboardApi.getMyDashboard()
        .then(result => { if (!cancelled) setData(result); })
        .catch(err => { if (!cancelled) setError(err.message); })
      )
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}

/** Fetch calls for the kanban board */
export function useDashboardCalls() {
  const [data, setData] = useState<CallItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    dashboardApi.getCalls()
      .then(calls => { if (!cancelled) setData(calls); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
