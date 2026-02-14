import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, X, Check, Settings as SettingsIcon } from '@/src/libs/Icon';
import { ShopColors } from '@/src/constants/theme';
import { isDemoMode, isDemoUrl, AppConfig, isProductionMode } from '@/src/constants/config';
import { useConfig } from '@/src/context/ConfigContext';
import { MainMenu } from '@/src/components/MainMenu';
import { showToast } from '@/src/utils/toast';
import { ConfigWizard } from '@/src/components/ConfigWizard';

export default function SettingsScreen() {
  const router = useRouter();
  const {
    baseUrl,
    oauthClientId,
    oauthClientSecret,
    setBaseUrl,
    setOAuthCredentials,
    resetOAuthCredentials,
  } = useConfig();

  const isUsingDemoUrl = isDemoMode() && isDemoUrl(baseUrl);

  const displayUrl = isUsingDemoUrl ? '' : baseUrl;
  const displayClientId = isUsingDemoUrl ? '' : oauthClientId;
  const displayClientSecret = isUsingDemoUrl ? '' : oauthClientSecret;

  const [url, setUrl] = useState(displayUrl);
  const [clientId, setClientId] = useState(displayClientId);
  const [clientSecret, setClientSecret] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingOAuth, setIsSavingOAuth] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (isProductionMode()) {
      router.replace('/(tabs)/profile');
    }
  }, [router]);

  useEffect(() => {
    const newDisplayUrl = isDemoMode() && isDemoUrl(baseUrl) ? '' : baseUrl;
    setUrl(newDisplayUrl);
  }, [baseUrl]);

  useEffect(() => {
    const isDemo = isDemoMode() && isDemoUrl(baseUrl);
    setClientId(isDemo ? '' : oauthClientId);
  }, [oauthClientId, oauthClientSecret, baseUrl]);

  const handleSave = async () => {
    const urlToSave = url.trim() || (isDemoMode() ? AppConfig.demo.url : '');

    if (!urlToSave) {
      showToast('URL cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await setBaseUrl(urlToSave);
      showToast('OroCommerce URL updated successfully', 'success');
    } catch (_error) {
      showToast('Failed to update URL', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setUrl(displayUrl);
    showToast('Changes reset', 'info');
  };

  const handleSaveOAuth = async () => {
    const clientIdToSave = clientId.trim() || oauthClientId;
    const clientSecretToSave = clientSecret.trim() || oauthClientSecret;

    if (!clientIdToSave) {
      showToast('Client ID cannot be empty', 'error');
      return;
    }

    setIsSavingOAuth(true);
    try {
      await setOAuthCredentials(clientIdToSave, clientSecretToSave);
      setClientSecret('');
      showToast('OAuth credentials updated successfully', 'success');
    } catch (_error) {
      showToast('Failed to update OAuth credentials', 'error');
    } finally {
      setIsSavingOAuth(false);
    }
  };

  const handleResetOAuth = async () => {
    setIsSavingOAuth(true);
    try {
      await resetOAuthCredentials();
      setClientSecret('');
      showToast('OAuth credentials reset to defaults', 'info');
    } catch (_error) {
      showToast('Failed to reset OAuth credentials', 'error');
    } finally {
      setIsSavingOAuth(false);
    }
  };

  const hasChanges = url !== displayUrl;
  const hasOAuthChanges =
    clientId !== displayClientId ||
    (clientSecret.trim() !== '' && clientSecret.trim() !== displayClientSecret);

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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* OroCommerce Configuration Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SettingsIcon size={20} color={ShopColors.primary} />
              <Text style={styles.sectionTitle}>OroCommerce Configuration</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Base URL</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com/"
                placeholderTextColor={ShopColors.textSecondary + '80'}
                autoCapitalize="none"
                autoCorrect={false}
                value={url}
                onChangeText={setUrl}
                editable={!isSaving}
              />
              <Text style={styles.hint}>Enter the base URL of your OroCommerce installation</Text>
            </View>

            {hasChanges && (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={handleReset}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <X size={18} color={ShopColors.text} />
                  <Text style={styles.buttonSecondaryText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.7}
                >
                  <Check size={18} color={ShopColors.cardBackground} />
                  <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* OAuth Configuration Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SettingsIcon size={20} color={ShopColors.primary} />
              <Text style={styles.sectionTitle}>OAuth Configuration</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Client ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter OAuth Client ID"
                placeholderTextColor={ShopColors.textSecondary + '80'}
                autoCapitalize="none"
                autoCorrect={false}
                value={clientId}
                onChangeText={setClientId}
                editable={!isSavingOAuth}
              />
              <Text style={styles.hint}>OAuth Client ID from OroCommerce</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Client Secret</Text>
              <TextInput
                style={styles.input}
                placeholder={displayClientSecret ? '••••••••••••' : 'Enter OAuth Client Secret'}
                placeholderTextColor={ShopColors.textSecondary + '80'}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={true}
                value={clientSecret}
                onChangeText={setClientSecret}
                editable={!isSavingOAuth}
                contextMenuHidden={true}
                selectTextOnFocus={false}
              />
              <Text style={styles.hint}>
                {displayClientSecret
                  ? 'Enter new secret to update, or leave empty to keep current'
                  : 'OAuth Client Secret from OroCommerce (masked for security)'}
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleResetOAuth}
                disabled={isSavingOAuth}
                activeOpacity={0.7}
              >
                <X size={18} color={ShopColors.text} />
                <Text style={styles.buttonSecondaryText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.buttonPrimary,
                  (!hasOAuthChanges || isSavingOAuth) && styles.buttonDisabled,
                ]}
                onPress={handleSaveOAuth}
                disabled={!hasOAuthChanges || isSavingOAuth}
                activeOpacity={0.7}
              >
                <Check size={18} color={ShopColors.cardBackground} />
                <Text style={styles.buttonText}>{isSavingOAuth ? 'Saving...' : 'Save OAuth'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Setup Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SettingsIcon size={20} color={ShopColors.primary} />
              <Text style={styles.sectionTitle}>Quick Setup</Text>
            </View>

            <Text style={styles.sectionDescription}>
              Use the guided wizard to configure all settings at once
            </Text>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, styles.fullWidthButton]}
              onPress={() => setShowWizard(true)}
              activeOpacity={0.7}
            >
              <SettingsIcon size={18} color={ShopColors.cardBackground} />
              <Text style={styles.buttonText}>Open Configuration Wizard</Text>
            </TouchableOpacity>
          </View>

          {/* Current Configuration Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SettingsIcon size={20} color={ShopColors.primary} />
              <Text style={styles.sectionTitle}>Current Configuration</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Active URL:</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                  {isUsingDemoUrl ? 'Demo environment' : baseUrl || 'Not configured'}
                </Text>
              </View>
              <View style={[styles.infoRow, { marginTop: 8 }]}>
                <Text style={styles.infoLabel}>Client ID:</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                  {isUsingDemoUrl ? '••••••••••••' : oauthClientId || 'Not configured'}
                </Text>
              </View>
              <View style={[styles.infoRow, { marginTop: 8 }]}>
                <Text style={styles.infoLabel}>Client Secret:</Text>
                <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                  {oauthClientSecret ? '••••••••••••' : 'Not configured'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Footer Navigation */}
        <MainMenu activeTab="/(tabs)/profile" />
      </View>

      {/* Configuration Wizard */}
      <ConfigWizard
        visible={showWizard}
        onComplete={() => {
          setShowWizard(false);
          // Reload values from config
          setUrl(baseUrl);
          setClientId(oauthClientId);
          setClientSecret('');
          showToast('Configuration updated successfully', 'success');
        }}
        canDismiss={true}
        reason="missing_config"
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
  sectionDescription: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: ShopColors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: ShopColors.background,
    color: ShopColors.text,
  },
  hint: {
    fontSize: 12,
    color: ShopColors.textSecondary,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonPrimary: {
    backgroundColor: ShopColors.primary,
  },
  buttonSecondary: {
    backgroundColor: ShopColors.background,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  buttonText: {
    color: ShopColors.cardBackground,
    fontWeight: '600',
    fontSize: 15,
  },
  buttonSecondaryText: {
    color: ShopColors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  fullWidthButton: {
    flex: 1,
    width: '100%',
  },
  infoCard: {
    backgroundColor: ShopColors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: ShopColors.text,
    flex: 1,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});
