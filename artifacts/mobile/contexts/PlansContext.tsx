import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Plan } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';

const DEFAULT_PLANS: Plan[] = [
  { id: 'plan_1h', name: '1 Hora', type: 'hours', duration: 1, price: 0.5, uploadSpeed: 5, downloadSpeed: 5 },
  { id: 'plan_2h', name: '2 Horas', type: 'hours', duration: 2, price: 1.0, uploadSpeed: 5, downloadSpeed: 5 },
  { id: 'plan_1d', name: '1 Día', type: 'days', duration: 1, price: 2.0, uploadSpeed: 5, downloadSpeed: 5 },
  { id: 'plan_7d', name: '1 Semana', type: 'days', duration: 7, price: 10.0, uploadSpeed: 5, downloadSpeed: 5 },
];

function generateId(): string {
  return 'plan_' + Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

interface PlansContextType {
  plans: Plan[];
  isLoading: boolean;
  addPlan: (plan: Omit<Plan, 'id'>) => Promise<void>;
  updatePlan: (id: string, plan: Partial<Omit<Plan, 'id'>>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export function PlansProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getItem<Plan[]>(STORAGE_KEYS.PLANS);
      if (stored && stored.length > 0) {
        setPlans(stored);
      } else {
        setPlans(DEFAULT_PLANS);
        await setItem(STORAGE_KEYS.PLANS, DEFAULT_PLANS);
      }
      setIsLoading(false);
    })();
  }, []);

  const save = useCallback(async (updated: Plan[]) => {
    setPlans(updated);
    await setItem(STORAGE_KEYS.PLANS, updated);
  }, []);

  async function addPlan(plan: Omit<Plan, 'id'>): Promise<void> {
    await save([...plans, { ...plan, id: generateId() }]);
  }

  async function updatePlan(id: string, partial: Partial<Omit<Plan, 'id'>>): Promise<void> {
    await save(plans.map((p) => (p.id === id ? { ...p, ...partial } : p)));
  }

  async function deletePlan(id: string): Promise<void> {
    await save(plans.filter((p) => p.id !== id));
  }

  return (
    <PlansContext.Provider value={{ plans, isLoading, addPlan, updatePlan, deletePlan }}>
      {children}
    </PlansContext.Provider>
  );
}

export function usePlans() {
  const ctx = useContext(PlansContext);
  if (!ctx) throw new Error('usePlans must be used within PlansProvider');
  return ctx;
}
