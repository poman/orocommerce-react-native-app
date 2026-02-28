import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useConfig } from '@/src/context/ConfigContext';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemeColors } from '@/src/themes/types';

export default function IndexScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const { isReady } = useConfig();

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isReady, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={ShopColors.primary} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
