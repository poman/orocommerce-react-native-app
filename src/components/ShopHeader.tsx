import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Search } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemeColors } from '@/src/themes/types';

interface ShopHeaderProps {
  showSearch?: boolean;
  onSearchPress?: () => void;
  showTabs?: boolean;
  activeTab?: 'home' | 'catalog';
  onTabChange?: (tab: 'home' | 'catalog') => void;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({
  showSearch = true,
  onSearchPress,
  showTabs = false,
  activeTab = 'home',
  onTabChange,
}) => {
  const { colors: ShopColors, shopConfig: ShopConfig } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      router.push('/(tabs)/search');
    }
  };

  const handleLogoPress = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.headerWrapper}>
      <View style={styles.contentWrapper}>
        <View style={styles.container}>
          {/* Logo */}
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={handleLogoPress}
            activeOpacity={0.7}
            accessibilityLabel="Go to home"
            accessibilityRole="button"
          >
            {ShopConfig.LogoComponent ? (
              <ShopConfig.LogoComponent
                width={ShopConfig.logoWidth}
                height={ShopConfig.logoHeight}
              />
            ) : ShopConfig.logo ? (
              <Image
                source={ShopConfig.logo}
                style={[
                  styles.logo,
                  {
                    width: ShopConfig.logoWidth,
                    height: ShopConfig.logoHeight,
                  },
                ]}
                contentFit="contain"
              />
            ) : null}
          </TouchableOpacity>

          {/* Right side - Search Icon */}
          {showSearch && (
            <View style={styles.rightContainer}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleSearchPress}
                accessibilityLabel="Search"
                accessibilityRole="button"
              >
                <Search size={24} color={ShopColors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabs */}
        {showTabs && (
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'home' && styles.activeTab]}
              onPress={() => onTabChange?.('home')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'home' && styles.activeTabText]}>
                HOME
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'catalog' && styles.activeTab]}
              onPress={() => onTabChange?.('catalog')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'catalog' && styles.activeTabText]}>
                CATALOG
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  headerWrapper: {
    backgroundColor: ShopColors.background,
  },
  contentWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: ShopColors.background,
    borderBottomColor: ShopColors.border,
    minHeight: 64,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logo: {
    resizeMode: 'contain',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: ShopColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: ShopColors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: ShopColors.primary,
  },
});
