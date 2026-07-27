import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Ticket } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';

function generateId(): string {
  return 'ticket_' + Date.now().toString() + Math.random().toString(36).substring(2, 7);
}

export function isTicketExpired(ticket: Ticket): boolean {
  return new Date(ticket.expiresAt) < new Date();
}

interface TicketsContextType {
  tickets: Ticket[];
  isLoading: boolean;
  addTicket: (ticket: Omit<Ticket, 'id'>) => Promise<Ticket>;
  deleteTicket: (id: string) => Promise<void>;
  cleanExpired: () => Promise<number>;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export function TicketsProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getItem<Ticket[]>(STORAGE_KEYS.TICKETS);
      setTickets(stored ?? []);
      setIsLoading(false);
    })();
  }, []);

  const save = useCallback(async (updated: Ticket[]) => {
    setTickets(updated);
    await setItem(STORAGE_KEYS.TICKETS, updated);
  }, []);

  async function addTicket(data: Omit<Ticket, 'id'>): Promise<Ticket> {
    const ticket: Ticket = { ...data, id: generateId() };
    await save([ticket, ...tickets]);
    return ticket;
  }

  async function deleteTicket(id: string): Promise<void> {
    await save(tickets.filter((t) => t.id !== id));
  }

  async function cleanExpired(): Promise<number> {
    const active = tickets.filter((t) => !isTicketExpired(t));
    const removed = tickets.length - active.length;
    await save(active);
    return removed;
  }

  return (
    <TicketsContext.Provider value={{ tickets, isLoading, addTicket, deleteTicket, cleanExpired }}>
      {children}
    </TicketsContext.Provider>
  );
}

export function useTickets() {
  const ctx = useContext(TicketsContext);
  if (!ctx) throw new Error('useTickets must be used within TicketsProvider');
  return ctx;
}
