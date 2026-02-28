import React, { useState, useEffect, useMemo } from 'react';
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
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { MainMenu } from '@/src/components/MainMenu';
import { getCountries, getRegions, ICustomerAddress } from '@/src/api/helpers/checkout';
import api, { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import { showToast } from '@/src/utils/toast';
import { ThemeColors } from '@/src/themes/types';

interface Country {
  id: string;
  name: string;
}

interface Region {
  id: string;
  code: string;
  name: string;
}

export default function EditAddressScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(true);
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
    if (id) {
      loadAddress();
      loadCountries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (selectedCountry) {
      loadRegions(selectedCountry);
    } else {
      setRegions([]);
      setSelectedRegion('');
    }
  }, [selectedCountry]);

  useEffect(() => {
    const newErrors = { ...errors };
    if (firstName.trim() && newErrors.firstName) delete newErrors.firstName;
    if (lastName.trim() && newErrors.lastName) delete newErrors.lastName;
    if (street.trim() && newErrors.street) delete newErrors.street;
    if (city.trim() && newErrors.city) delete newErrors.city;
    if (postalCode.trim() && newErrors.postalCode) delete newErrors.postalCode;
    if (selectedCountry && newErrors.country) delete newErrors.country;
    setErrors(newErrors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, street, city, postalCode, selectedCountry]);

  const loadAddress = async () => {
    try {
      setLoadingAddress(true);

      const token = await getValidAccessToken();
      if (!token) {
        router.replace('/(auth)/login?redirect=/profile/my-addresses');
        return;
      }

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      const response = await api.get<{ data: ICustomerAddress }>(
        `/customeraddresses/${id}?include=country,region`
      );

      if (response.data.data) {
        const address = response.data.data;
        setLabel(address.attributes.label || '');
        setFirstName(address.attributes.firstName || '');
        setLastName(address.attributes.lastName || '');
        setStreet(address.attributes.street || '');
        setStreet2(address.attributes.street2 || '');
        setCity(address.attributes.city || '');
        setPostalCode(address.attributes.postalCode || '');
        setPhone(address.attributes.phone || '');
        setOrganization(address.attributes.organization || '');

        if (address.relationships?.country?.data) {
          setSelectedCountry(address.relationships.country.data.id);
        }
        if (address.relationships?.region?.data) {
          setSelectedRegion(address.relationships.region.data.id);
        }
      }
    } catch (_err: any) {
      showToast('Failed to load address', 'error');
    } finally {
      setLoadingAddress(false);
    }
  };

  const loadCountries = async () => {
    try {
      setLoadingCountries(true);

      const token = await getValidAccessToken();
      if (!token) return;

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      const response = await getCountries();
      if (response.data) {
        setCountries(response.data);
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
      if (showToasts) showToast(Object.values(e)[0], 'error');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const token = await getValidAccessToken();
      if (!token) {
        showToast('Please login to update address', 'error');
        return;
      }

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      const payload = {
        data: {
          type: 'customeraddresses',
          id: id,
          attributes: {
            label: label.trim() || undefined,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            street: street.trim(),
            street2: street2.trim() || undefined,
            city: city.trim(),
            postalCode: postalCode.trim(),
            phone: phone.trim() || undefined,
            organization: organization.trim() || undefined,
          },
          relationships: {
            country: {
              data: {
                type: 'countries',
                id: selectedCountry,
              },
            },
            ...(selectedRegion && {
              region: {
                data: {
                  type: 'regions',
                  id: selectedRegion,
                },
              },
            }),
          },
        },
      };

      await api.patch(`/customeraddresses/${id}`, payload);
      showToast('Address updated successfully', 'success');
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      showToast(err.message || 'Failed to update address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
          <Text style={styles.headerTitle}>Edit Address</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loadingAddress || loadingCountries ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ShopColors.primary} />
              <Text style={styles.loadingText}>Loading address...</Text>
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
                {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
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
                {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
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
                {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
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
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
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
                {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
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
                {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
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

        {/* Sticky Save/Cancel Buttons */}
        {!loadingAddress && !loadingCountries && (
          <View style={[styles.stickyFooter, { bottom: 60 + Math.max(insets.bottom, 0) }]}>
            <View style={styles.footerButtonsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
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
                    <Text style={styles.saveButtonText}>Save Changes</Text>
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
  errorText: {
    color: ShopColors.error,
    marginTop: 6,
    fontSize: 13,
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
});
