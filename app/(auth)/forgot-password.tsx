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
import { useRouter, Stack } from 'expo-router';
import { ShopColors } from '@/src/constants/theme';
import { showToast } from '@/src/utils/toast';
import { ArrowLeft, Search } from '@/src/libs/Icon';
import { TopMainMenu } from '@/src/components/TopMainMenu';
import { FooterNavigation } from '@/src/components/FooterNavigation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleResetPassword = async () => {
    setEmailError('');

    const isEmailValid = validateEmail(email);

    if (!isEmailValid) {
      return;
    }

    setIsLoading(true);
    try {
      showToast(
        'If an account exists with this email, you will receive a password reset link shortly.',
        'success'
      );

      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      showToast(error.message || 'Failed to send reset link. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.container}>
        <View style={styles.stickyHeaderWrapper}>
          <View style={styles.stickyHeader}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Reset Password</Text>

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
                  <Text style={styles.title}>Reset Password</Text>
                  <Text style={styles.subtitle}>
                    Enter your email address and we will send you a link to reset your password
                  </Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
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
                      returnKeyType="send"
                      onSubmitEditing={handleResetPassword}
                    />
                    {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleResetPassword}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Send Reset Link</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                    disabled={isLoading}
                  >
                    <Text style={styles.backButtonText}>Back to Login</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Remember your password?{' '}
                    <Text style={styles.footerLink} onPress={() => router.back()}>
                      Sign In
                    </Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

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
  backButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButtonText: {
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
