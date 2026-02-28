import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { AlertCircle, CheckCircle, X } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { isDemoMode, isDemoUrl, AppConfig } from '@/src/themes/config';
import { useConfig } from '@/src/context/ConfigContext';
import { ThemeColors } from '@/src/themes/types';

interface ConfigWizardProps {
  visible: boolean;
  onComplete?: () => void;
  canDismiss?: boolean;
  reason?: 'missing_config' | 'api_error';
}

export const ConfigWizard: React.FC<ConfigWizardProps> = ({
  visible,
  onComplete,
  canDismiss = false,
  reason = 'missing_config',
}) => {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const { baseUrl, oauthClientId, oauthClientSecret, setBaseUrl, setOAuthCredentials } =
    useConfig();

  const isUsingDemoUrl = isDemoMode() && isDemoUrl(baseUrl);

  const displayUrl = isUsingDemoUrl ? '' : baseUrl;
  const displayClientId = isUsingDemoUrl ? '' : oauthClientId;
  const displayClientSecret = isUsingDemoUrl ? '' : oauthClientSecret;

  const [localBaseUrl, setLocalBaseUrl] = useState(displayUrl);
  const [localClientId, setLocalClientId] = useState(displayClientId);
  const [localClientSecret, setLocalClientSecret] = useState(displayClientSecret);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{
    baseUrl?: string;
    clientId?: string;
    clientSecret?: string;
  }>({});

  const validateUrl = (url: string): boolean => {
    if (isDemoMode() && (!url || url.trim() === '')) {
      return true;
    }
    if (!url || url.trim() === '') {
      return false;
    }
    try {
      const urlPattern = /^https?:\/\/.+/i;
      return urlPattern.test(url.trim());
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    const newErrors: typeof errors = {};

    const urlToSave = localBaseUrl.trim() || (isDemoMode() ? AppConfig.demo.url : '');
    const clientIdToSave = localClientId.trim() || oauthClientId;
    const clientSecretToSave = localClientSecret.trim() || oauthClientSecret;

    if (!validateUrl(urlToSave)) {
      newErrors.baseUrl = 'Please enter a valid URL (e.g., http://your-domain.com)';
    }

    if (!clientIdToSave) {
      newErrors.clientId = 'Client ID is required';
    }

    if (!clientSecretToSave) {
      newErrors.clientSecret = 'Client Secret is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await setBaseUrl(urlToSave);
      await setOAuthCredentials(clientIdToSave, clientSecretToSave);
      onComplete?.();
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getTitle = () => {
    switch (reason) {
      case 'api_error':
        return 'API Configuration Issue';
      case 'missing_config':
      default:
        return 'Configure OroCommerce Connection';
    }
  };

  const getDescription = () => {
    switch (reason) {
      case 'api_error':
        return 'We received a 401 Unauthorized response from the API. This usually means:\n\n1. The API credentials are incorrect\n2. Guest Storefront API is disabled in OroCommerce\n\nPlease verify your configuration and ensure that "Enable Guest Storefront API" is enabled under System Configuration → System Configuration → General Setup → Application Settings in your OroCommerce admin panel.\n\nNote: If Guest API is disabled, you will need to sign in to browse products.';
      case 'missing_config':
      default:
        return 'Please configure your OroCommerce connection to continue. You can find these credentials in your OroCommerce admin panel.';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={canDismiss ? onComplete : undefined}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              {reason === 'api_error' ? (
                <AlertCircle size={32} color={ShopColors.error} />
              ) : (
                <AlertCircle size={32} color={ShopColors.primary} />
              )}
            </View>
            <Text style={styles.title}>{getTitle()}</Text>
            {canDismiss && (
              <TouchableOpacity style={styles.closeButton} onPress={onComplete}>
                <X size={24} color={ShopColors.text} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            <Text style={styles.description}>{getDescription()}</Text>

            {reason === 'api_error' && (
              <View style={styles.warningBox}>
                <AlertCircle size={20} color={ShopColors.error} />
                <Text style={styles.warningText}>
                  If credentials are correct, verify Guest Storefront API is enabled. Otherwise,
                  you&apos;ll need to sign in.
                </Text>
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  OroCommerce Base URL <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.baseUrl && styles.inputError]}
                  placeholder="http://your-domain.com"
                  value={localBaseUrl}
                  onChangeText={text => {
                    setLocalBaseUrl(text);
                    if (errors.baseUrl) {
                      setErrors({ ...errors, baseUrl: undefined });
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
                {errors.baseUrl && <Text style={styles.errorText}>{errors.baseUrl}</Text>}
                <Text style={styles.hint}>The base URL of your OroCommerce installation</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  OAuth Client ID <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.clientId && styles.inputError]}
                  placeholder="Enter client ID"
                  value={localClientId}
                  onChangeText={text => {
                    setLocalClientId(text);
                    if (errors.clientId) {
                      setErrors({ ...errors, clientId: undefined });
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.clientId && <Text style={styles.errorText}>{errors.clientId}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  OAuth Client Secret <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.clientSecret && styles.inputError]}
                  placeholder="Enter client secret"
                  value={localClientSecret}
                  onChangeText={text => {
                    setLocalClientSecret(text);
                    if (errors.clientSecret) {
                      setErrors({ ...errors, clientSecret: undefined });
                    }
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                />
                {errors.clientSecret && <Text style={styles.errorText}>{errors.clientSecret}</Text>}
              </View>

              <View style={styles.infoBox}>
                <CheckCircle size={20} color={ShopColors.primary} />
                <Text style={styles.infoText}>
                  You can find OAuth credentials in OroCommerce admin:{'\n'}
                  System → User Management → OAuth Applications
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
    height: Math.min(screenHeight * 0.9, 800),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: ShopColors.text,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  description: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: ShopColors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: ShopColors.error,
    marginLeft: 8,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: ShopColors.primary + '15',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: ShopColors.textSecondary,
    marginLeft: 8,
    lineHeight: 18,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  required: {
    color: ShopColors.error,
  },
  input: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: ShopColors.text,
    backgroundColor: ShopColors.background,
  },
  inputError: {
    borderColor: ShopColors.error,
  },
  errorText: {
    fontSize: 12,
    color: ShopColors.error,
  },
  hint: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
  },
  saveButton: {
    backgroundColor: ShopColors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
