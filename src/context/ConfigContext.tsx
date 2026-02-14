import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { isDemoMode, AppConfig } from '@/src/constants/config';

const STORAGE_KEY_BASE_URL = 'app.baseUrl';
const STORAGE_KEY_CLIENT_ID = 'app.oauthClientId';
const STORAGE_KEY_CLIENT_SECRET = 'app.oauthClientSecret';

const isPlaceholder = (value: string | undefined): boolean => {
  return !value || value === '@.env' || value.trim() === '';
};

const getDefaultBaseUrl = (): string => {
  const envValue = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envValue && !isPlaceholder(envValue)) return envValue;

  const configValue = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  if (configValue && !isPlaceholder(configValue)) return configValue;

  if (isDemoMode()) {
    return AppConfig.demo.url;
  }

  return 'http://localhost/';
};

const getDefaultClientId = (): string => {
  const envValue = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID;
  if (envValue && !isPlaceholder(envValue)) return envValue;

  const configValue = Constants.expoConfig?.extra?.EXPO_PUBLIC_OAUTH_CLIENT_ID as
    | string
    | undefined;
  if (configValue && !isPlaceholder(configValue)) return configValue;

  return '';
};

const getDefaultClientSecret = (): string => {
  const envValue = process.env.EXPO_PUBLIC_OAUTH_CLIENT_SECRET;
  if (envValue && !isPlaceholder(envValue)) return envValue;

  const configValue = Constants.expoConfig?.extra?.EXPO_PUBLIC_OAUTH_CLIENT_SECRET as
    | string
    | undefined;
  if (configValue && !isPlaceholder(configValue)) return configValue;

  return '';
};

function normalizeBaseUrl(url: string): string {
  try {
    let u = url.trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) {
      u = 'http://' + u;
    }
    if (!u.endsWith('/')) u += '/';
    return u;
  } catch {
    return '';
  }
}

interface ConfigContextType {
  baseUrl: string;
  oauthClientId: string;
  oauthClientSecret: string;
  hasConfigured: boolean;
  isReady: boolean;
  isConfigValid: boolean;
  setBaseUrl: (url: string) => Promise<void>;
  setOAuthCredentials: (clientId: string, clientSecret: string) => Promise<void>;
  clearBaseUrl: () => Promise<void>;
  clearOAuthCredentials: () => Promise<void>;
  resetOAuthCredentials: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [baseUrl, setBaseUrlState] = useState<string>('');
  const [oauthClientId, setOAuthClientIdState] = useState<string>('');
  const [oauthClientSecret, setOAuthClientSecretState] = useState<string>('');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [hasConfigured, setHasConfigured] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const savedUrl = await AsyncStorage.getItem(STORAGE_KEY_BASE_URL);

        const isLocalhostUrl = savedUrl && savedUrl.includes('localhost');
        const shouldUseDefault = !savedUrl || (isDemoMode() && isLocalhostUrl);

        if (!shouldUseDefault && savedUrl) {
          setHasConfigured(true);
          setBaseUrlState(normalizeBaseUrl(savedUrl));
        } else {
          const defaultUrl = getDefaultBaseUrl();
          setBaseUrlState(defaultUrl);

          if (isDemoMode() && isLocalhostUrl) {
            await AsyncStorage.removeItem(STORAGE_KEY_BASE_URL);
          }
        }

        const savedClientId = await AsyncStorage.getItem(STORAGE_KEY_CLIENT_ID);
        const savedClientSecret = await AsyncStorage.getItem(STORAGE_KEY_CLIENT_SECRET);

        if (savedClientId) {
          setOAuthClientIdState(savedClientId);
        } else {
          setOAuthClientIdState(getDefaultClientId());
        }

        if (savedClientSecret) {
          setOAuthClientSecretState(savedClientSecret);
        } else {
          setOAuthClientSecretState(getDefaultClientSecret());
        }
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setBaseUrl = async (url: string) => {
    const normalized = normalizeBaseUrl(url);
    setBaseUrlState(normalized);
    if (normalized) {
      await AsyncStorage.setItem(STORAGE_KEY_BASE_URL, normalized);
      setHasConfigured(true);
    }
  };

  const setOAuthCredentials = async (clientId: string, clientSecret: string) => {
    setOAuthClientIdState(clientId);
    setOAuthClientSecretState(clientSecret);
    if (clientId) {
      await AsyncStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId);
    }
    if (clientSecret) {
      await AsyncStorage.setItem(STORAGE_KEY_CLIENT_SECRET, clientSecret);
    }
  };

  const clearBaseUrl = async () => {
    setBaseUrlState(getDefaultBaseUrl());
    setHasConfigured(false);
    await AsyncStorage.removeItem(STORAGE_KEY_BASE_URL);
  };

  const clearOAuthCredentials = async () => {
    setOAuthClientIdState('');
    setOAuthClientSecretState('');
    await AsyncStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    await AsyncStorage.removeItem(STORAGE_KEY_CLIENT_SECRET);
  };

  const resetOAuthCredentials = async () => {
    const defaultId = getDefaultClientId();
    const defaultSecret = getDefaultClientSecret();
    setOAuthClientIdState(defaultId);
    setOAuthClientSecretState(defaultSecret);
    if (defaultId) {
      await AsyncStorage.setItem(STORAGE_KEY_CLIENT_ID, defaultId);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_CLIENT_ID);
    }
    if (defaultSecret) {
      await AsyncStorage.setItem(STORAGE_KEY_CLIENT_SECRET, defaultSecret);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY_CLIENT_SECRET);
    }
  };

  const value = useMemo(() => {
    const isConfigValid = !!(
      baseUrl &&
      baseUrl !== 'http://localhost/' &&
      oauthClientId &&
      oauthClientSecret
    );

    return {
      baseUrl,
      oauthClientId,
      oauthClientSecret,
      hasConfigured,
      isReady,
      isConfigValid,
      setBaseUrl,
      setOAuthCredentials,
      clearBaseUrl,
      clearOAuthCredentials,
      resetOAuthCredentials,
    };
  }, [baseUrl, oauthClientId, oauthClientSecret, hasConfigured, isReady]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
};
