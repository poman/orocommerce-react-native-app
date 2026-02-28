import { Slot } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ConfigProvider, useConfig } from '@/src/context/ConfigContext';
import { ShopProvider } from '@/src/context/ShopContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import Toast from 'react-native-toast-message';
import { createToastConfig } from '@/src/libs/toastConfig';

const InitialLayout = () => {
  const { getValidAccessToken } = useAuth();
  const { isReady, baseUrl } = useConfig();

  useEffect(() => {
    if (baseUrl) {
      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);
    }
  }, [baseUrl, getValidAccessToken]);

  if (!isReady) return null;

  return <Slot />;
};

const ThemedToast = () => {
  const { toastColors } = useTheme();
  const config = useMemo(() => createToastConfig(toastColors), [toastColors]);
  return <Toast config={config} position="top" topOffset={60} />;
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ConfigProvider>
        <AuthProvider>
          <ShopProvider>
            <InitialLayout />
            <ThemedToast />
          </ShopProvider>
        </AuthProvider>
      </ConfigProvider>
    </ThemeProvider>
  );
}
