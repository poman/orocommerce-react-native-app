import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Theme,
  ThemeColors,
  ThemeToastColors,
  ThemeShopConfig,
  ThemeHtmlStyles,
  BannerPosition,
} from '@/src/themes/types';
import { themes, DEFAULT_THEME_ID, getTheme, getAvailableThemes } from '@/src/themes';
import { Banner } from '@/src/types';
import { buildEffectiveConfig, EffectiveConfig } from '@/src/utils/effectiveConfig';

const STORAGE_KEY_THEME = 'app.themeId';

interface ThemeContextType {
  /** The full active theme object */
  theme: Theme;
  /** Shortcut: active theme colors */
  colors: ThemeColors;
  /** Shortcut: active toast colors */
  toastColors: ThemeToastColors;
  /** Shortcut: shop branding config */
  shopConfig: ThemeShopConfig;
  /** Shortcut: HTML rendering styles */
  htmlStyles: ThemeHtmlStyles;
  /** Shortcut: homepage carousel banners */
  homepageBanners: Banner[];
  /** Shortcut: homepage section banners */
  homepageSectionBanners: BannerPosition[];
  /** AppConfig merged with theme configOverrides */
  effectiveConfig: EffectiveConfig;
  /** Current theme ID */
  themeId: string;
  /** Whether the theme context has finished loading from storage */
  isReady: boolean;
  /** Switch to a different theme by ID */
  setThemeById: (id: string) => Promise<void>;
  /** List of available themes (id, name, description) */
  availableThemes: Array<{ id: string; name: string; description: string }>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME_ID);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_THEME);
        if (stored && themes[stored]) {
          setThemeId(stored);
        }
      } catch {
        // Ignore storage errors, use default
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const setThemeById = useCallback(async (id: string) => {
    if (!themes[id]) {
      console.warn(`Theme "${id}" not found. Available: ${Object.keys(themes).join(', ')}`);
      return;
    }
    setThemeId(id);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_THEME, id);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const theme = useMemo(() => getTheme(themeId), [themeId]);
  const availableThemes = useMemo(() => getAvailableThemes(), []);
  const effectiveConfig = useMemo(() => buildEffectiveConfig(theme.configOverrides), [theme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      colors: theme.colors,
      toastColors: theme.toastColors,
      shopConfig: theme.shopConfig,
      htmlStyles: theme.htmlStyles,
      homepageBanners: theme.homepageBanners,
      homepageSectionBanners: theme.homepageSectionBanners,
      effectiveConfig,
      themeId,
      isReady,
      setThemeById,
      availableThemes,
    }),
    [theme, themeId, isReady, setThemeById, availableThemes, effectiveConfig]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Hook to access the current theme.
 *
 * Returns the full theme object plus convenience shortcuts for colors,
 * shopConfig, toastColors, htmlStyles, and banners.
 *
 * @example
 * ```tsx
 * const { colors, shopConfig } = useTheme();
 * return <Text style={{ color: colors.primary }}>{shopConfig.storeName}</Text>;
 * ```
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
