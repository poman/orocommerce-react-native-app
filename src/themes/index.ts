import { Theme } from './types';
import GoldenCarbonTheme from './golden-carbon';
import RefreshingTealsTheme from './refreshing-teals';
import RoyalIndigoTheme from './royal-indigo';
import SunsetEmberTheme from './sunset-ember';

export type {
  Theme,
  ThemeColors,
  ThemeToastColors,
  ThemeShopConfig,
  ThemeHtmlStyles,
  ThemeConfigOverrides,
  ThemeMeta,
  FeatureBanner,
  ImageBanner,
  PromoBarBanner,
  HomepageSectionBanner,
  BannerPosition,
} from './types';

/**
 * Registry of all available themes.
 * To add a new theme, import it and add it to this record.
 */
export const themes: Record<string, Theme> = {
  'golden-carbon': GoldenCarbonTheme,
  'refreshing-teals': RefreshingTealsTheme,
  'royal-indigo': RoyalIndigoTheme,
  'sunset-ember': SunsetEmberTheme,
};

/**
 * The default theme ID used when no theme has been selected.
 */
export const DEFAULT_THEME_ID = 'golden-carbon';

/**
 * Get a theme by its ID. Falls back to the default theme if not found.
 */
export function getTheme(id: string): Theme {
  return themes[id] ?? themes[DEFAULT_THEME_ID];
}

/**
 * Get a list of all available theme IDs.
 */
export function getAvailableThemeIds(): string[] {
  return Object.keys(themes);
}

/**
 * Get metadata for all available themes.
 */
export function getAvailableThemes(): Array<{ id: string; name: string; description: string }> {
  return Object.values(themes).map((t) => ({
    id: t.meta.id,
    name: t.meta.name,
    description: t.meta.description,
  }));
}

export { GoldenCarbonTheme, RefreshingTealsTheme, RoyalIndigoTheme, SunsetEmberTheme };
