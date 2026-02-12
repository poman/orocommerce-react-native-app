import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShopColors } from '@/src/constants/theme';
import { AppConfig, isDemoMode } from '@/src/constants/config';
import { useAuth } from '@/src/context/AuthContext';
import { showToast } from '@/src/utils/toast';
import { ArrowLeft, Search } from '@/src/libs/Icon';
import { TopMainMenu } from '@/src/components/TopMainMenu';
import { FooterNavigation } from '@/src/components/FooterNavigation';

export default function LoginScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleBack = () => {
    if (redirect === 'profile') {
      router.replace('/(tabs)/profile');
    } else if (redirect === 'orders') {
      router.replace('/(tabs)/orders');
    } else if (redirect === 'shopping-lists') {
      router.replace('/(tabs)/shopping-lists');
    } else if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError('');
    return true;
  };

  const validatePassword = (password: string): boolean => {
    if (!password.trim()) {
      setPasswordError('Password is required');
      return false;
    }

    setPasswordError('');
    return true;
  };

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password);

      if (result.success) {
        showToast('Logged in successfully', 'success');
        setTimeout(() => {
          router.replace('/(tabs)/profile');
        }, 500);
      } else {
        showToast(result.error || 'Please check your credentials and try again.', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'An unexpected error occurred. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Sticky Header */}
        <View style={styles.stickyHeaderWrapper}>
          <View style={styles.stickyHeader}>
            <TouchableOpacity style={styles.headerButton} onPress={handleBack} disabled={isLoading}>
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Log In</Text>

            <View style={styles.headerRightButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/(tabs)/search')}
                disabled={isLoading}
              >
                <Search size={24} color={ShopColors.text} />
              </TouchableOpacity>

              <TopMainMenu />
            </View>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formContainer}>
                <View style={styles.header}>
                  <Text style={styles.title}>Log In to Continue</Text>
                  <Text style={styles.subtitle}>
                    Your personalized B2B shopping experience awaits
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      testID="email-input"
                      style={[styles.input, emailError ? styles.inputError : null]}
                      placeholder="your@email.com"
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      value={email}
                      onChangeText={text => {
                        setEmail(text);
                        if (emailError) setEmailError('');
                      }}
                      onBlur={() => {
                        if (email.trim()) validateEmail(email);
                      }}
                      editable={!isLoading}
                      returnKeyType="next"
                    />
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      testID="password-input"
                      style={[styles.input, passwordError ? styles.inputError : null]}
                      placeholder="Enter your password"
                      placeholderTextColor="#999"
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={password}
                      onChangeText={text => {
                        setPassword(text);
                        if (passwordError) setPasswordError('');
                      }}
                      onBlur={() => {
                        if (password.trim()) validatePassword(password);
                      }}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={styles.forgotPasswordButton}
                    onPress={() => router.push('/(auth)/forgot-password')}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="sign-in-button"
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Sign In</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.replace('/(tabs)/profile')}
                    disabled={isLoading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  {isDemoMode() && (
                    <TouchableOpacity
                      style={styles.demoLoginBadge}
                      onPress={() => {
                        setEmail(AppConfig.demo.testEmail);
                        setPassword(AppConfig.demo.testPassword);
                        setEmailError('');
                        setPasswordError('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.demoLoginBadgeText}>Try demo account →</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        {/* Footer Navigation */}
        <FooterNavigation activeTab="profile" />
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
  stickyHeaderWrapper: {
    backgroundColor: ShopColors.background,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  stickyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ShopColors.text,
    flex: 1,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contentWrapper: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingBottom: 24,
  },
  formContainer: {
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: ShopColors.text,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: ShopColors.error,
    borderWidth: 2,
  },
  errorText: {
    color: ShopColors.error,
    fontSize: 12,
    marginTop: 4,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: ShopColors.primary,
    fontWeight: '600',
  },
  button: {
    backgroundColor: ShopColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
  },
  footerText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    color: ShopColors.primary,
    fontWeight: '600',
  },
  demoLoginBadge: {
    alignSelf: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  demoLoginBadgeText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Footer Navigation
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopColor: ShopColors.border,
    borderTopWidth: 1,
    paddingTop: 8,
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
