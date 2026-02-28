import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ShoppingBag, FileText, CheckCircle } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { ShopHeader } from '@/src/components/ShopHeader';
import { FooterNavigation } from '@/src/components/FooterNavigation';
import { ThemeColors } from '@/src/themes/types';

export default function ThankYouScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const { orderId, orderNumber } = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
  }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <ShopHeader showSearch={true} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <CheckCircle size={24} color={ShopColors.cardBackground} />
          </View>
        </View>

        {/* Thank You Message */}
        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.subtitle}>Your order has been placed successfully</Text>

        {/* Order Number */}
        {orderNumber && (
          <View style={styles.orderInfoCard}>
            <Text style={styles.orderLabel}>
              Order Number: <Text style={styles.orderNumber}>#{orderNumber}</Text>
            </Text>
          </View>
        )}

        {/* Confirmation Message */}
        <Text style={styles.confirmationText}>
          A confirmation email has been sent to your email address with order details and tracking
          information.
        </Text>

        {/* Action Buttons */}
        <View style={styles.buttonsWrapper}>
          <View style={styles.buttonsContainer}>
            {orderId && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push(`/order/${orderId}` as any)}
              >
                <FileText size={18} color={ShopColors.cardBackground} />
                <Text style={styles.primaryButtonText}>View Order</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/orders' as any)}
            >
              <Text style={styles.secondaryButtonText}>All Orders</Text>
            </TouchableOpacity>
          </View>

          {/* Continue Shopping Link */}
          <TouchableOpacity
            style={styles.continueShoppingLink}
            onPress={() => router.push('/' as any)}
          >
            <ShoppingBag size={18} color={ShopColors.primary} />
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text style={styles.helpText}>Need help? Contact our customer support team.</Text>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Footer Navigation Menu */}
      <FooterNavigation activeTab="orders" />
    </SafeAreaView>
  );
}

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShopColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ShopColors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  orderInfoCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ShopColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  orderLabel: {
    fontSize: 16,
    color: ShopColors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.primary,
  },
  confirmationText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 400,
  },
  buttonsWrapper: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: ShopColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: ShopColors.cardBackground,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ShopColors.primary,
  },
  secondaryButtonText: {
    color: ShopColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  continueShoppingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  continueShoppingText: {
    color: ShopColors.primary,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  helpText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    marginTop: 32,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});
