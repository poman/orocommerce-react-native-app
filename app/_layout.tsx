import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ConfigProvider, useConfig } from '@/src/context/ConfigContext';
import { ShopProvider } from '@/src/context/ShopContext';
import { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/src/libs/toastConfig';

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

export default function RootLayout() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <ShopProvider>
          <InitialLayout />
          <Toast config={toastConfig} position="top" topOffset={60} />
        </ShopProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
