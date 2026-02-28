import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemeColors } from '@/src/themes/types';

interface MainMenuProps {
  activeTab?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({ activeTab }) => {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Home', icon: 'home', route: '/(tabs)' },
    { name: 'My Orders', icon: 'truck', route: '/(tabs)/orders' },
    { name: 'Lists', icon: 'shopping-cart', route: '/(tabs)/shopping-lists' },
    { name: 'Wishlist', icon: 'heart', route: '/(tabs)/wishlist' },
    { name: 'Profile', icon: 'user', route: '/(tabs)/profile' },
  ];

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  const isActive = (route: string) => {
    if (activeTab) return activeTab === route;
    return pathname === route || pathname?.startsWith(route);
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      <View style={styles.container}>
        {tabs.map(tab => {
          const active = isActive(tab.route);
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tab}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <Feather
                name={tab.icon as any}
                size={24}
                color={active ? ShopColors.primary : ShopColors.tabIconDefault}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? ShopColors.primary : ShopColors.tabIconDefault },
                ]}
              >
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopColor: ShopColors.border,
    borderTopWidth: 1,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 60,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
      },
      default: {
        fontFamily: 'system-ui',
      },
    }),
  },
});
