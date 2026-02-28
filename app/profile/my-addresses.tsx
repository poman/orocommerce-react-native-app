import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Plus, Edit2, Trash2, MapPin } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { MainMenu } from '@/src/components/MainMenu';
import { getCustomerAddresses, ICustomerAddress } from '@/src/api/helpers/checkout';
import api, { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import { showToast } from '@/src/utils/toast';
import CustomAlert from '@/src/components/CustomAlert';
import { ThemeColors } from '@/src/themes/types';

export default function MyAddressesScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();

  const [addresses, setAddresses] = useState<ICustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    addressId: null as string | null,
  });

  const showDeleteAlert = (addressId: string, label: string) => {
    setAlertConfig({
      visible: true,
      title: 'Delete Address',
      message: `Are you sure you want to delete "${label}"?`,
      addressId,
    });
  };

  const closeAlert = () => {
    setAlertConfig({ visible: false, title: '', message: '', addressId: null });
  };

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getValidAccessToken();
      if (!token) {
        router.replace('/(auth)/login?redirect=my-addresses');
        return;
      }

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      const response = await getCustomerAddresses();
      if (response.error) {
        setError(response.error);
      } else {
        setAddresses(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const addressId = alertConfig.addressId;
    if (!addressId) return;

    closeAlert();

    try {
      setDeletingId(addressId);

      const token = await getValidAccessToken();
      if (!token) {
        showToast('Please login to delete addresses', 'error');
        return;
      }

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      // Delete address using API directly
      await api.delete(`/customeraddresses/${addressId}`);
      showToast('Address deleted successfully', 'success');

      // Reload addresses
      loadAddresses();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete address', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewAddress = (addressId: string) => {
    router.push(`/profile/address/${addressId}/edit` as any);
  };

  const handleEditAddress = (addressId: string) => {
    router.push(`/profile/address/${addressId}/edit` as any);
  };

  const handleAddNew = () => {
    router.push('/profile/address/new' as any);
  };

  const renderAddress = (address: ICustomerAddress) => {
    const isDeleting = deletingId === address.id;

    return (
      <TouchableOpacity
        key={address.id}
        style={styles.addressCard}
        onPress={() => handleViewAddress(address.id)}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <View style={styles.addressHeader}>
          <View style={styles.addressTitleRow}>
            <MapPin size={20} color={ShopColors.primary} />
            <Text style={styles.addressLabel}>{address.attributes.label || 'Address'}</Text>
          </View>
          <View style={styles.addressActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={e => {
                e.stopPropagation();
                handleEditAddress(address.id);
              }}
              disabled={isDeleting}
            >
              <Edit2 size={18} color={ShopColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={e => {
                e.stopPropagation();
                showDeleteAlert(address.id, address.attributes.label || 'this address');
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={ShopColors.error} />
              ) : (
                <Trash2 size={18} color={ShopColors.error} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.addressContent}>
          <Text style={styles.addressText}>
            {address.attributes.firstName} {address.attributes.lastName}
          </Text>
          <Text style={styles.addressText}>{address.attributes.street}</Text>
          <Text style={styles.addressText}>
            {address.attributes.city}, {address.attributes.postalCode}
          </Text>
          {address.attributes.regionText && (
            <Text style={styles.addressText}>{address.attributes.regionText}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Addresses</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Plus size={24} color={ShopColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ShopColors.primary} />
              <Text style={styles.loadingText}>Loading addresses...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error loading addresses</Text>
              <Text style={styles.errorDetail}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadAddresses}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MapPin size={64} color={ShopColors.textSecondary} />
              <Text style={styles.emptyTitle}>No Addresses</Text>
              <Text style={styles.emptyText}>You haven&apos;t added any addresses yet</Text>
              <TouchableOpacity style={styles.addFirstButton} onPress={handleAddNew}>
                <Plus size={20} color={ShopColors.cardBackground} />
                <Text style={styles.addFirstButtonText}>Add Your First Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressesGrid}>{addresses.map(renderAddress)}</View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <MainMenu activeTab="/(tabs)/profile" />
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type="warning"
        onClose={closeAlert}
        onConfirm={handleDeleteConfirm}
      />
    </SafeAreaView>
  );
}

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: ShopColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: ShopColors.textSecondary,
  },
  errorContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.error,
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ShopColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 15,
    fontWeight: '600',
  },
  addressesGrid: {
    gap: 16,
  },
  addressCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: ShopColors.text,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: ShopColors.background,
  },
  addressContent: {
    gap: 4,
  },
  addressText: {
    fontSize: 14,
    color: ShopColors.text,
    lineHeight: 20,
  },
});
