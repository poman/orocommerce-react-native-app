import { useState, useEffect } from 'react';
import { useConfig } from '@/src/context/ConfigContext';

export interface ApiErrorState {
  hasError: boolean;
  isUnauthorized: boolean;
  showWizard: boolean;
  showSignInPrompt: boolean;
  wizardReason: 'missing_config' | 'api_error' | null;
}

/**
 * Hook to manage API error state and configuration wizard
 */
export const useApiErrorHandler = () => {
  const { isConfigValid, isReady } = useConfig();
  const [errorState, setErrorState] = useState<ApiErrorState>({
    hasError: false,
    isUnauthorized: false,
    showWizard: false,
    showSignInPrompt: false,
    wizardReason: null,
  });

  // Check if we need to show wizard on mount
  useEffect(() => {
    if (isReady && !isConfigValid) {
      setErrorState({
        hasError: true,
        isUnauthorized: false,
        showWizard: true,
        showSignInPrompt: false,
        wizardReason: 'missing_config',
      });
    }
  }, [isReady, isConfigValid]);

  /**
   * Handle 401 Unauthorized error
   */
  const handle401Error = () => {
    if (isConfigValid) {
      setErrorState({
        hasError: true,
        isUnauthorized: true,
        showWizard: true,
        showSignInPrompt: false,
        wizardReason: 'api_error',
      });
    } else {
      // Config is missing
      setErrorState({
        hasError: true,
        isUnauthorized: true,
        showWizard: true,
        showSignInPrompt: false,
        wizardReason: 'missing_config',
      });
    }
  };

  /**
   * Handle any API error
   */
  const handleApiError = (error: any) => {
    if (error?.response?.status === 401) {
      handle401Error();
    } else {
      setErrorState(prev => ({
        ...prev,
        hasError: true,
      }));
    }
  };

  /**
   * Reset error state
   */
  const resetError = () => {
    setErrorState({
      hasError: false,
      isUnauthorized: false,
      showWizard: false,
      showSignInPrompt: false,
      wizardReason: null,
    });
  };

  /**
   * Close wizard
   */
  const closeWizard = () => {
    setErrorState(prev => ({
      ...prev,
      showWizard: false,
    }));
  };

  const showSignIn = () => {
    setErrorState(prev => ({
      ...prev,
      hasError: true,
      isUnauthorized: true,
      showWizard: false,
      showSignInPrompt: true,
    }));
  };

  /**
   * Dismiss sign in prompt
   */
  const dismissSignIn = () => {
    setErrorState(prev => ({
      ...prev,
      showSignInPrompt: false,
    }));
  };

  return {
    errorState,
    handle401Error,
    handleApiError,
    resetError,
    closeWizard,
    showSignIn,
    dismissSignIn,
  };
};
