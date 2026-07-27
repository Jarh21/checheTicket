import React, { createContext, useContext, useEffect, useState } from 'react';
import { MikroTikConfig } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from '@/services/storage';

const DEFAULT_CONFIG: MikroTikConfig = {
  ip: '192.168.88.1',
  user: 'admin',
  password: '',
  hotspotServer: 'hotspot1',
  wifiName: 'WiFi Hotspot',
};

interface ConfigContextType {
  config: MikroTikConfig;
  isConfigured: boolean;
  saveConfig: (config: MikroTikConfig) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<MikroTikConfig>(DEFAULT_CONFIG);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getItem<MikroTikConfig>(STORAGE_KEYS.MIKROTIK_CONFIG);
      if (stored) {
        setConfig(stored);
        setIsConfigured(!!stored.ip && !!stored.user);
      }
    })();
  }, []);

  async function saveConfig(newConfig: MikroTikConfig): Promise<void> {
    await setItem(STORAGE_KEYS.MIKROTIK_CONFIG, newConfig);
    setConfig(newConfig);
    setIsConfigured(!!newConfig.ip && !!newConfig.user);
  }

  return (
    <ConfigContext.Provider value={{ config, isConfigured, saveConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
