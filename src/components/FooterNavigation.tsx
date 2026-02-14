/**
 * Footer Navigation Component
 * Reusable bottom navigation bar with main menu tabs
 * Used in auth pages and standalone screens
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ShopColors } from '@/src/constants/theme';

interface FooterNavigationProps {
  activeTab?: 'home' | 'orders' | 'lists' | 'wishlist' | 'profile';
}

export const FooterNavigation: React.FC<FooterNavigationProps> = ({ activeTab = 'profile' }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tabs = [
    { key: 'home', icon: 'home', label: 'Home', route: '/(tabs)' },
    { key: 'orders', icon: 'truck', label: 'My Orders', route: '/(tabs)/orders' },
    { key: 'lists', icon: 'shopping-cart', label: 'Lists', route: '/(tabs)/shopping-lists' },
    { key: 'wishlist', icon: 'heart', label: 'Wishlist', route: '/(tabs)/wishlist' },
    { key: 'profile', icon: 'user', label: 'Profile', route: '/(tabs)/profile' },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
        {tabs.map(tab => {
          const isActive = tab.key === activeTab;
          const color = isActive ? ShopColors.primary : ShopColors.tabIconDefault;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => router.push(tab.route as any)}
              activeOpacity={0.7}
            >
              <Feather name={tab.icon as any} size={24} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderTopColor: ShopColors.border,
    borderTopWidth: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      maxWidth: 1200,
      alignSelf: 'center' as any,
      width: '100%',
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
