import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { AppState, AppStateStatus } from 'react-native';
import { useConfig } from './ConfigContext';

const AUTH_STORAGE_KEY = 'app.auth';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number; // timestamp when token expires
}

interface UserData {
  email: string;
  id?: string;
  name?: string;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  getValidAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { baseUrl, oauthClientId, oauthClientSecret } = useConfig();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const tokensRef = useRef<AuthTokens | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const isRefreshingRef = useRef<boolean>(false);

  useEffect(() => {
    tokensRef.current = tokens;
  }, [tokens]);

  useEffect(() => {
    loadAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup app state listener to handle token refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      const currentTokens = tokensRef.current;
      if (currentTokens && isAuthenticated) {
        const now = Date.now();
        const timeUntilExpiry = currentTokens.expiresAt - now;

        if (timeUntilExpiry < 30000) {
          if (!oauthClientId || !oauthClientSecret) {
            let attempts = 0;
            const maxAttempts = 30;
            while ((!oauthClientId || !oauthClientSecret) && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 100));
              attempts++;
            }
          }

          const success = await refreshAccessToken();

          if (!success) {
            await clearAuthState();
          }
        }
      }
    }

    appState.current = nextAppState;
  };

  // Setup automatic token refresh
  useEffect(() => {
    if (tokens && isAuthenticated) {
      scheduleTokenRefresh(tokens);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, isAuthenticated]);

  const scheduleTokenRefresh = (authTokens: AuthTokens) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const now = Date.now();
    const expiresAt = authTokens.expiresAt;
    const timeUntilExpiry = expiresAt - now;

    const refreshTime = Math.max(0, timeUntilExpiry - 10000);

    refreshTimeoutRef.current = setTimeout(async () => {
      if (!oauthClientId || !oauthClientSecret) {
        let attempts = 0;
        const maxAttempts = 50;
        while ((!oauthClientId || !oauthClientSecret) && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
      }

      const success = await refreshAccessToken();

      if (!success) {
        if (oauthClientId && oauthClientSecret) {
          setTimeout(() => refreshAccessToken(), 5000);
        }
      }
    }, refreshTime);
  };

  const loadAuthState = async () => {
    try {
      const saved = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const authData = JSON.parse(saved);
        const savedTokens: AuthTokens = authData.tokens;
        const savedUser: UserData = authData.user;

        const now = Date.now();
        const timeUntilExpiry = savedTokens.expiresAt - now;

        setTokens(savedTokens);
        tokensRef.current = savedTokens;
        setUser(savedUser);
        setIsAuthenticated(true);

        if (timeUntilExpiry < 30000) {
          let attempts = 0;
          const maxAttempts = 50;
          while ((!oauthClientId || !oauthClientSecret) && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }

          if (!oauthClientId || !oauthClientSecret) {
            scheduleTokenRefresh(savedTokens);
          } else {
            const success = await refreshAccessToken();

            if (!success) {
              await clearAuthState();
            }
          }
        } else {
          scheduleTokenRefresh(savedTokens);
        }
      }
    } catch (_error) {
      await clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = async (
    authTokens: AuthTokens,
    userData: UserData,
    silent: boolean = false
  ) => {
    try {
      const authData = {
        tokens: authTokens,
        user: userData,
      };
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));

      tokensRef.current = authTokens;

      if (!silent) {
        setTokens(authTokens);
        setUser(userData);
        setIsAuthenticated(true);
      }

      scheduleTokenRefresh(authTokens);
    } catch (_error) {
      // Silent fail
    }
  };

  const clearAuthState = async () => {
    try {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setTokens(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (_error) {
      // Silent fail
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!oauthClientId || !oauthClientSecret) {
        return {
          success: false,
          error:
            'OAuth credentials not configured. Please configure Client ID and Secret in Settings.',
        };
      }

      const requestData = {
        grant_type: 'password',
        client_id: oauthClientId,
        client_secret: oauthClientSecret,
        username: email,
        password: password,
      };

      const response = await axios.post(`${baseUrl}oauth2-token`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { access_token, refresh_token, token_type, expires_in } = response.data;

      const authTokens: AuthTokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenType: token_type,
        expiresIn: expires_in,
        expiresAt: Date.now() + expires_in * 1000,
      };

      const userData: UserData = {
        email,
      };

      await saveAuthState(authTokens, userData);

      return { success: true };
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 401) {
          if (data?.error === 'invalid_client') {
            return {
              success: false,
              error:
                'Invalid OAuth credentials. Please verify Client ID and Secret in OroCommerce admin.',
            };
          } else if (data?.error === 'invalid_grant') {
            return { success: false, error: 'Invalid email or password' };
          } else if (data?.error === 'no_encryption_key') {
            return {
              success: false,
              error:
                'OAuth encryption key not configured in OroCommerce. Run: php bin/console oro:oauth-server:generate-key',
            };
          } else {
            return {
              success: false,
              error: 'Authentication failed. Please check your credentials.',
            };
          }
        } else if (status === 400) {
          return {
            success: false,
            error: data?.error_description || 'Invalid request. Please check your input.',
          };
        }
      } else if (error.request) {
        return {
          success: false,
          error: 'No response from server. Please check your connection and base URL.',
        };
      }

      return {
        success: false,
        error: error.message || 'Login failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    await clearAuthState();
  };

  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      return false;
    }

    const currentTokens = tokensRef.current;

    if (!currentTokens?.refreshToken) {
      return false;
    }

    if (!oauthClientId || !oauthClientSecret) {
      return false;
    }

    try {
      isRefreshingRef.current = true;

      const response = await axios.post(
        `${baseUrl}oauth2-token`,
        {
          grant_type: 'refresh_token',
          client_id: oauthClientId,
          client_secret: oauthClientSecret,
          refresh_token: currentTokens.refreshToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const { access_token, refresh_token, token_type, expires_in } = response.data;

      const newTokens: AuthTokens = {
        accessToken: access_token,
        refreshToken: refresh_token || currentTokens.refreshToken,
        tokenType: token_type,
        expiresIn: expires_in,
        expiresAt: Date.now() + expires_in * 1000,
      };

      if (user) {
        await saveAuthState(newTokens, user, true);
      }

      return true;
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 400) {
        await clearAuthState();
      }

      return false;
    } finally {
      isRefreshingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, baseUrl, oauthClientId, oauthClientSecret]);

  const getValidAccessToken = useCallback(async (): Promise<string | null> => {
    const currentTokens = tokensRef.current;

    if (!currentTokens) {
      return null;
    }

    const now = Date.now();
    const bufferTime = 5 * 1000;

    if (currentTokens.expiresAt - now < bufferTime) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }
      return tokensRef.current?.accessToken || null;
    }

    return currentTokens.accessToken;
  }, [refreshAccessToken]);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    user,
    tokens,
    login,
    logout,
    refreshAccessToken,
    getValidAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
