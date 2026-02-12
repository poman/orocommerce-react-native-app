import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { ShopColors } from '@/src/constants/theme';
import { isDemoMode } from '@/src/constants/config';
import {
  User,
  ShoppingCart,
  Heart,
  MapPin,
  DollarSign,
  Settings,
  HelpCircle,
  ChevronRight,
  LogOut,
  Mail,
} from '@/src/libs/Icon';
import CustomAlert from '@/src/components/CustomAlert';
import { showToast } from '@/src/utils/toast';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout, isLoading: authLoading } = useAuth();

  // Alert modal state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'warning' as 'info' | 'success' | 'error' | 'warning',
    onConfirm: undefined as (() => void) | undefined,
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'warning' | 'info' = 'warning',
    onConfirm: () => void
  ) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const closeAlert = () => {
    const onConfirm = alertConfig.onConfirm;
    setAlertConfig({
      visible: false,
      title: '',
      message: '',
      type: 'warning',
      onConfirm: undefined,
    });
    if (onConfirm) {
      setTimeout(onConfirm, 100);
    }
  };

  const handleLogout = async () => {
    showAlert('Logout', 'Are you sure you want to logout?', 'warning', async () => {
      try {
        await logout();
        showToast('Logged out successfully', 'success');
      } catch (_error) {
        showToast('Failed to logout. Please try again.', 'error');
      }
    });
  };

  const handleLogin = () => {
    router.push('/(auth)/login?redirect=profile');
  };

  const quickLinks = [
    {
      icon: DollarSign,
      label: 'My Orders',
      route: '/(tabs)/orders',
      description: 'View and track your orders',
    },
    {
      icon: ShoppingCart,
      label: 'My Shopping Lists',
      route: '/(tabs)/shopping-lists',
      description: 'Manage your shopping lists',
    },
    {
      icon: Heart,
      label: 'My Wishlist',
      route: '/(tabs)/wishlist',
      description: 'View your saved items',
    },
    {
      icon: MapPin,
      label: 'My Addresses',
      route: '/profile/my-addresses' as any,
      description: 'Manage shipping addresses',
    },
    {
      icon: Mail,
      label: 'My Conversations',
      route: '/profile/my-conversations' as any,
      description: 'View your messages',
    },
    // Only show Settings in demo mode
    ...(isDemoMode()
      ? [
          {
            icon: Settings,
            label: 'Settings',
            route: '/profile/settings' as any,
            description: 'App configuration',
          },
        ]
      : []),
    {
      icon: HelpCircle,
      label: 'Help',
      route: '/profile/help' as any,
      description: 'Get help and support',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContentWrapper}>
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* Account Info Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <User size={20} color={ShopColors.primary} />
                <Text style={styles.sectionTitle}>Account Info</Text>
              </View>

              {authLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={ShopColors.primary} />
                </View>
              ) : isAuthenticated && user ? (
                <View style={styles.accountInfo}>
                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Email:</Text>
                    <Text style={styles.accountValue}>{user.email}</Text>
                  </View>
                  <View style={styles.accountRow}>
                    <Text style={styles.accountLabel}>Status:</Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                  >
                    <LogOut size={18} color={ShopColors.error} />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.guestContainer}>
                  <Text style={styles.guestMessage}>
                    Sign in to access your account and saved items
                  </Text>
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.loginButtonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quick Links Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Settings size={20} color={ShopColors.primary} />
                <Text style={styles.sectionTitle}>Quick Links</Text>
              </View>

              <View style={styles.quickLinksGrid}>
                {quickLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickLinkCard}
                      onPress={() => router.push(link.route)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.quickLinkIconContainer}>
                        <Icon size={24} color={ShopColors.primary} />
                      </View>
                      <View style={styles.quickLinkContent}>
                        <Text style={styles.quickLinkLabel}>{link.label}</Text>
                        <Text style={styles.quickLinkDescription}>{link.description}</Text>
                      </View>
                      <ChevronRight size={20} color={ShopColors.textSecondary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
        onConfirm={alertConfig.onConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: ShopColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: ShopColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  headerContentWrapper: {
    maxWidth: 1200,
    width: '100%',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ShopColors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  contentWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  accountInfo: {
    gap: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ShopColors.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: ShopColors.success,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ShopColors.error + '10',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ShopColors.error + '30',
    marginTop: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.error,
  },
  guestContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestMessage: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: '600',
  },
  quickLinksGrid: {
    gap: 12,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    gap: 12,
  },
  quickLinkIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShopColors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkContent: {
    flex: 1,
  },
  quickLinkLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 2,
  },
  quickLinkDescription: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  bottomSpacing: {
    height: 20,
  },
});
