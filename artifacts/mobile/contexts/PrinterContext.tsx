import React, { createContext, useContext, useEffect, useState } from 'react';
import { BluetoothPrinter } from '@/services/bluetooth-printer';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';

interface PrinterContextType {
  selectedPrinter: BluetoothPrinter | null;
  isLoading: boolean;
  saveSelectedPrinter: (printer: BluetoothPrinter) => Promise<void>;
  clearSelectedPrinter: () => Promise<void>;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export function PrinterProvider({ children }: { children: React.ReactNode }) {
  const [selectedPrinter, setSelectedPrinter] = useState<BluetoothPrinter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getItem<BluetoothPrinter>(STORAGE_KEYS.BLUETOOTH_PRINTER);
      setSelectedPrinter(stored);
      setIsLoading(false);
    })();
  }, []);

  async function saveSelectedPrinter(printer: BluetoothPrinter): Promise<void> {
    await setItem(STORAGE_KEYS.BLUETOOTH_PRINTER, printer);
    setSelectedPrinter(printer);
  }

  async function clearSelectedPrinter(): Promise<void> {
    await setItem(STORAGE_KEYS.BLUETOOTH_PRINTER, null);
    setSelectedPrinter(null);
  }

  return (
    <PrinterContext.Provider
      value={{ selectedPrinter, isLoading, saveSelectedPrinter, clearSelectedPrinter }}
    >
      {children}
    </PrinterContext.Provider>
  );
}

export function usePrinter() {
  const context = useContext(PrinterContext);
  if (!context) throw new Error('usePrinter must be used within PrinterProvider');
  return context;
}