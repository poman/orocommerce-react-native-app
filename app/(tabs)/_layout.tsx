import { Tabs } from 'expo-router';
import React from 'react';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import { useTheme } from '@/src/context/ThemeContext';

export default function TabLayout() {
  const { colors: ShopColors } = useTheme();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        [role="tablist"] a {
          padding: 0 !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ShopColors.primary,
        tabBarInactiveTintColor: ShopColors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: ShopColors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          ...(Platform.OS === 'web' && {
            maxWidth: 1200,
            alignSelf: 'center' as any,
            width: '100%',
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        ...(Platform.OS === 'web' && {
          tabBarItemStyle: {
            flex: 1,
            maxWidth: 'none',
          } as any,
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarIcon: ({ color }) => <Feather name="truck" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shopping-lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color }) => <Feather name="shopping-cart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color }) => <Feather name="heart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hide from tab bar but keep the bottom navigation
        }}
      />
    </Tabs>
  );
}
