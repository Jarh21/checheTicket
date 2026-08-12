import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getPlanProfileName, Plan } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';

const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_1h',
    name: '1 Hora',
    type: 'hours',
    duration: 1,
    price: 0.5,
    uploadSpeed: 5,
    downloadSpeed: 5,
    mikrotikProfile: getPlanProfileName('plan_1h'),
    synced: false,
  },
  {
    id: 'plan_2h',
    name: '2 Horas',
    type: 'hours',
    duration: 2,
    price: 1.0,
    uploadSpeed: 5,
    downloadSpeed: 5,
    mikrotikProfile: getPlanProfileName('plan_2h'),
    synced: false,
  },
  {
    id: 'plan_1d',
    name: '1 Día',
    type: 'days',
    duration: 1,
    price: 2.0,
    uploadSpeed: 5,
    downloadSpeed: 5,
    mikrotikProfile: getPlanProfileName('plan_1d'),
    synced: false,
  },
  {
    id: 'plan_7d',
    name: '1 Semana',
    type: 'days',
    duration: 7,
    price: 10.0,
    uploadSpeed: 5,
    downloadSpeed: 5,
    mikrotikProfile: getPlanProfileName('plan_7d'),
    synced: false,
  },
];

function generateId(): string {
  return 'plan_' + Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

interface PlansContextType {
  plans: Plan[];
  isLoading: boolean;
  addPlan: (plan: Omit<Plan, 'id'>) => Promise<Plan>;
  updatePlan: (id: string, plan: Partial<Omit<Plan, 'id'>>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export function PlansProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Ref always holds the latest plans so async callbacks never use a stale closure
  const plansRef = useRef<Plan[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await getItem<Plan[]>(STORAGE_KEYS.PLANS);
      if (stored && stored.length > 0) {
        const normalized = stored.map((plan) => ({
          ...plan,
          mikrotikProfile: plan.mikrotikProfile || getPlanProfileName(plan.id),
          // Backward compat: plans stored before synced field was added are treated as synced
          synced: plan.synced ?? true,
        }));
        plansRef.current = normalized;
        setPlans(normalized);
        await setItem(STORAGE_KEYS.PLANS, normalized);
      } else {
        plansRef.current = DEFAULT_PLANS;
        setPlans(DEFAULT_PLANS);
        await setItem(STORAGE_KEYS.PLANS, DEFAULT_PLANS);
      }
      setIsLoading(false);
    })();
  }, []);

  const save = useCallback(async (updated: Plan[]) => {
    plansRef.current = updated;
    setPlans(updated);
    await setItem(STORAGE_KEYS.PLANS, updated);
  }, []);

  async function addPlan(plan: Omit<Plan, 'id'>): Promise<Plan> {
    const newId = generateId();
    const created: Plan = {
      ...plan,
      id: newId,
      mikrotikProfile: plan.mikrotikProfile || getPlanProfileName(newId),
      synced: false,
    };
    await save([...plansRef.current, created]);
    return created;
  }

  async function updatePlan(id: string, partial: Partial<Omit<Plan, 'id'>>): Promise<void> {
    await save(
      plansRef.current.map((p) =>
        p.id === id
          ? { ...p, ...partial, mikrotikProfile: partial.mikrotikProfile || p.mikrotikProfile || getPlanProfileName(id) }
          : p,
      ),
    );
  }

  async function deletePlan(id: string): Promise<void> {
    await save(plansRef.current.filter((p) => p.id !== id));
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
