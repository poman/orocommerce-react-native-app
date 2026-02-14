import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Check } from '@/src/libs/Icon';
import { ShopColors } from '@/src/constants/theme';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { MainMenu } from '@/src/components/MainMenu';
import { createCustomerAddress, getCountries, getRegions } from '@/src/api/helpers/checkout';
import { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import { showToast } from '@/src/utils/toast';

interface Country {
  id: string;
  name: string;
}

interface Region {
  id: string;
  code: string;
  name: string;
}

export default function NewAddressScreen() {
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingRegions, setLoadingRegions] = useState(false);

  const [label, setLabel] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [street, setStreet] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const e: { [k: string]: string } = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!street.trim()) e.street = 'Street address is required';
    if (!city.trim()) e.city = 'City is required';
    if (!postalCode.trim()) e.postalCode = 'Postal code is required';
    if (!selectedCountry) e.country = 'Country is required';
    setErrors(e);
  }, [firstName, lastName, street, city, postalCode, selectedCountry]);

  useEffect(() => {
    loadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadRegions(selectedCountry);
    } else {
      setRegions([]);
      setSelectedRegion('');
    }
  }, [selectedCountry]);

  const loadCountries = async () => {
    try {
      setLoadingCountries(true);

      const token = await getValidAccessToken();
      if (!token) {
        router.replace('/(auth)/login?redirect=/profile/my-addresses');
        return;
      }

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      const response = await getCountries();
      if (response.data) {
        setCountries(response.data);
        // Set US as default if available
        const usCountry = response.data.find(c => c.id === 'US');
        if (usCountry) {
          setSelectedCountry('US');
        }
      }
    } catch (_err: any) {
      showToast('Failed to load countries', 'error');
    } finally {
      setLoadingCountries(false);
    }
  };

  const loadRegions = async (countryCode: string) => {
    try {
      setLoadingRegions(true);
      setSelectedRegion('');

      const response = await getRegions(countryCode);
      if (response.data) {
        setRegions(response.data);
      } else {
        setRegions([]);
      }
    } catch (_err: any) {
      setRegions([]);
    } finally {
      setLoadingRegions(false);
    }
  };

  const validateForm = (showToasts = true): boolean => {
    const e: { [k: string]: string } = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!street.trim()) e.street = 'Street address is required';
    if (!city.trim()) e.city = 'City is required';
    if (!postalCode.trim()) e.postalCode = 'Postal code is required';
    if (!selectedCountry) e.country = 'Country is required';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      if (showToasts) {
        showToast(Object.values(e)[0], 'error');
      }
      return false;
    }
    return true;
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const token = await getValidAccessToken();
      if (!token) {
        showToast('Please login to create address', 'error');
        return;
      }

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      const addressData = {
        label: label.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        street: street.trim(),
        street2: street2.trim() || undefined,
        city: city.trim(),
        postalCode: postalCode.trim(),
        phone: phone.trim() || undefined,
        organization: organization.trim() || undefined,
        country: selectedCountry,
        region: selectedRegion || undefined,
      };

      const response = await createCustomerAddress(addressData);

      if (response.error) {
        showToast(response.error, 'error');
      } else {
        showToast('Address created successfully', 'success');
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (_err: any) {
      showToast(_err.message || 'Failed to create address', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Address</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingCountries ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ShopColors.primary} />
              <Text style={styles.loadingText}>Loading form...</Text>
            </View>
          ) : (
            <>
              {/* Label */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Label (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Home, Office"
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={label}
                  onChangeText={setLabel}
                  editable={!loading}
                />
              </View>

              {/* First Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  First Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter first name"
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!loading}
                />
                {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
              </View>

              {/* Last Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Last Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter last name"
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!loading}
                />
                {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
              </View>

              {/* Organization */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Organization (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter organization name"
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={organization}
                  onChangeText={setOrganization}
                  editable={!loading}
                />
              </View>

              {/* Street */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Street Address <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter street address"
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={street}
                  onChangeText={setStreet}
                  editable={!loading}
                />
                {errors.street ? <Text style={styles.errorText}>{errors.street}</Text> : null}
              </View>

              {/* Street 2 */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Street Address 2 (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Apartment, suite, etc."
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={street2}
                  onChangeText={setStreet2}
                  editable={!loading}
                />
              </View>

              {/* City */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  City <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={city}
                  onChangeText={setCity}
                  editable={!loading}
                />
                {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
              </View>

              {/* Country */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Country <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedCountry}
                    onValueChange={value => setSelectedCountry(value)}
                    enabled={!loading}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select country..." value="" />
                    {countries.map(country => (
                      <Picker.Item key={country.id} label={country.name} value={country.id} />
                    ))}
                  </Picker>
                </View>
                {errors.country ? <Text style={styles.errorText}>{errors.country}</Text> : null}
              </View>

              {/* Region/State */}
              {regions.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>State/Region</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedRegion}
                      onValueChange={value => setSelectedRegion(value)}
                      enabled={!loading && !loadingRegions}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select region..." value="" />
                      {regions.map(region => (
                        <Picker.Item key={region.id} label={region.name} value={region.id} />
                      ))}
                    </Picker>
                  </View>
                  {loadingRegions && (
                    <ActivityIndicator
                      size="small"
                      color={ShopColors.primary}
                      style={styles.regionLoader}
                    />
                  )}
                </View>
              )}

              {/* Postal Code */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Postal Code <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter postal code"
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={postalCode}
                  onChangeText={setPostalCode}
                  editable={!loading}
                />
                {errors.postalCode ? (
                  <Text style={styles.errorText}>{errors.postalCode}</Text>
                ) : null}
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Phone (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor={ShopColors.textSecondary + '80'}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.bottomSpacing} />
            </>
          )}
        </ScrollView>

        {/* Sticky Save Button */}
        {!loadingCountries && (
          <View style={[styles.stickyFooter, { bottom: 60 + Math.max(insets.bottom, 0) }]}>
            <View style={styles.footerButtonsRow}>
              <TouchableOpacity
                style={[styles.cancelButton]}
                onPress={() => handleCancel()}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (loading || Object.keys(errors).length > 0) && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={loading || Object.keys(errors).length > 0}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={ShopColors.cardBackground} />
                ) : (
                  <>
                    <Check size={20} color={ShopColors.cardBackground} />
                    <Text style={styles.saveButtonText}>Save Address</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer Navigation */}
        <MainMenu activeTab="/(tabs)/profile" />
      </View>
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
  placeholder: {
    width: 40,
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
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 8,
  },
  required: {
    color: ShopColors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: ShopColors.cardBackground,
    color: ShopColors.text,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    backgroundColor: ShopColors.cardBackground,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
  },
  picker: {
    height: Platform.OS === 'ios' ? 48 : 50,
    width: '100%',
    color: ShopColors.text,
    backgroundColor: ShopColors.cardBackground,
  },
  regionLoader: {
    marginTop: 8,
  },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: ShopColors.cardBackground,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  footerButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: ShopColors.cardBackground,
    borderWidth: 1,
    borderColor: ShopColors.border,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: ShopColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    backgroundColor: ShopColors.primary,
    paddingVertical: 16,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 80,
  },
  errorText: {
    color: ShopColors.error,
    marginTop: 6,
    fontSize: 13,
  },
});
