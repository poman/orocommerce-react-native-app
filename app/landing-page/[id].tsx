import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { useLandingPage } from '@/src/api/hooks/useLandingPage';
import { ArrowLeft, Search, RefreshCw } from '@/src/libs/Icon';
import { TopMainMenu } from '@/src/components/TopMainMenu';
import { FooterNavigation } from '@/src/components/FooterNavigation';
import { ThemeColors } from '@/src/themes/types';

let WebView: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WebView = require('react-native-webview').WebView;
}

export default function LandingPageScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const params = useLocalSearchParams();
  const landingPageId = params.id as string;
  const { baseUrl } = useConfig();
  const { getValidAccessToken, refreshAccessToken } = useAuth();

  const { loading, error, landingPage, refetch } = useLandingPage(
    landingPageId,
    baseUrl,
    getValidAccessToken,
    refreshAccessToken
  );

  const htmlDocument = React.useMemo(() => {
    if (!landingPage?.attributes?.content) return '';

    let content = landingPage.attributes.content;

    if (baseUrl) {
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');

      content = content.replace(/src="\/([^"]+)"/g, `src="${cleanBaseUrl}/$1"`);
      content = content.replace(/href="\/([^"]+)"/g, `href="${cleanBaseUrl}/$1"`);

      content = content.replace(/srcset="([^"]*)"/g, (match, srcsetContent) => {
        const replaced = srcsetContent
          .split(',')
          .map((src: string) => {
            const trimmed = src.trim();
            if (trimmed.startsWith('/')) {
              const parts = trimmed.split(/\s+/);
              const path = parts[0].substring(1);
              const sizeDescriptor = parts[1] || '';
              return `${cleanBaseUrl}/${path}${sizeDescriptor ? ' ' + sizeDescriptor : ''}`;
            }
            return src;
          })
          .join(', ');
        return `srcset="${replaced}"`;
      });
    }

    // language=HTML
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      color: ${ShopColors.text};
      padding: 0;
      background-color: ${ShopColors.background};
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 12px 0;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      color: ${ShopColors.text};
      margin: 16px 0 12px 0;
      line-height: 1.3;
    }
    h2 {
      font-size: 24px;
      font-weight: 700;
      color: ${ShopColors.text};
      margin: 16px 0 12px 0;
      line-height: 1.3;
    }
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: ${ShopColors.text};
      margin: 12px 0 8px 0;
    }
    h4 {
      font-size: 18px;
      font-weight: 600;
      color: ${ShopColors.text};
      margin: 12px 0 8px 0;
    }
    h5 {
      font-size: 16px;
      font-weight: 600;
      color: ${ShopColors.text};
      margin: 12px 0 8px 0;
    }
    h6 {
      font-size: 14px;
      font-weight: 600;
      color: ${ShopColors.text};
      margin: 8px 0;
    }
    p {
      margin-bottom: 12px;
      color: ${ShopColors.textSecondary};
    }
    a {
      color: ${ShopColors.primary};
      text-decoration: underline;
    }
    ul, ol {
      margin: 8px 0 12px 20px;
      padding-left: 20px;
    }
    li {
      margin-bottom: 6px;
      color: ${ShopColors.textSecondary};
    }
    strong, b {
      font-weight: 700;
      color: ${ShopColors.text};
    }
    em, i {
      font-style: italic;
    }
    blockquote {
      border-left: 4px solid ${ShopColors.primary};
      padding-left: 16px;
      margin: 16px 0;
      font-style: italic;
      color: ${ShopColors.textSecondary};
    }
    code {
      background-color: ${ShopColors.border};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
    }
    pre {
      background-color: ${ShopColors.border};
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 12px 0;
    }
    pre code {
      padding: 0;
      background: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      border: 1px solid ${ShopColors.border};
    }
    th {
      background-color: ${ShopColors.border};
      padding: 8px;
      font-weight: 700;
      border: 1px solid ${ShopColors.border};
      text-align: left;
    }
    td {
      padding: 8px;
      border: 1px solid ${ShopColors.border};
    }
    figure {
      margin: 16px 0;
    }
    figcaption {
      font-size: 14px;
      color: ${ShopColors.textSecondary};
      margin-top: 8px;
      font-style: italic;
    }
    .grid {
      display: block;
      width: 100%;
    }
    .grid > div {
      margin-bottom: 16px;
    }
    /* Responsive adjustments */
    @media (max-width: 768px) {
      body {
        font-size: 14px;
      }
      h1 { font-size: 24px; }
      h2 { font-size: 20px; }
      h3 { font-size: 18px; }
      h4 { font-size: 16px; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
    `.trim();
  }, [landingPage, baseUrl, ShopColors]);

  const [webViewHeight, setWebViewHeight] = React.useState(600);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Header */}
        <View style={styles.stickyHeaderWrapper}>
          <View style={styles.stickyHeader}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle} numberOfLines={1}>
              {landingPage?.attributes?.title || 'Landing Page'}
            </Text>

            <View style={styles.headerRightButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Search size={24} color={ShopColors.text} />
              </TouchableOpacity>

              <TopMainMenu />
            </View>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={ShopColors.primary} />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              )}

              {error && !loading && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Error loading page</Text>
                  <Text style={styles.errorDetail}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                    <RefreshCw size={16} color="#FFFFFF" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}

              {landingPage && !loading && !error && (
                <View style={styles.pageContent}>
                  {landingPage.attributes.title && (
                    <Text style={styles.pageTitle}>{landingPage.attributes.title}</Text>
                  )}

                  {htmlDocument && (
                    <View style={styles.htmlContent}>
                      {Platform.OS === 'web' ? (
                        <>
                          <style
                            dangerouslySetInnerHTML={{
                              __html: `
                            .landing-page-content img {
                              max-width: 100%;
                              height: auto;
                              display: block;
                              margin: 12px 0;
                            }
                            .landing-page-content h1 {
                              font-size: 28px;
                              font-weight: 700;
                              color: ${ShopColors.text};
                              margin: 16px 0 12px 0;
                              line-height: 1.3;
                            }
                            .landing-page-content h2 {
                              font-size: 24px;
                              font-weight: 700;
                              color: ${ShopColors.text};
                              margin: 16px 0 12px 0;
                              line-height: 1.3;
                            }
                            .landing-page-content h3 {
                              font-size: 20px;
                              font-weight: 600;
                              color: ${ShopColors.text};
                              margin: 12px 0 8px 0;
                            }
                            .landing-page-content h4,
                            .landing-page-content h5,
                            .landing-page-content h6 {
                              font-size: 18px;
                              font-weight: 600;
                              color: ${ShopColors.text};
                              margin: 12px 0 8px 0;
                            }
                            .landing-page-content p {
                              margin-bottom: 12px;
                              color: ${ShopColors.textSecondary};
                            }
                            .landing-page-content a {
                              color: ${ShopColors.primary};
                              text-decoration: underline;
                            }
                            .landing-page-content ul,
                            .landing-page-content ol {
                              margin: 8px 0 12px 20px;
                              padding-left: 20px;
                            }
                            .landing-page-content li {
                              margin-bottom: 6px;
                              color: ${ShopColors.textSecondary};
                            }
                            .landing-page-content strong,
                            .landing-page-content b {
                              font-weight: 700;
                              color: ${ShopColors.text};
                            }
                            .landing-page-content em,
                            .landing-page-content i {
                              font-style: italic;
                            }
                            .landing-page-content table {
                              width: 100%;
                              border-collapse: collapse;
                              margin: 16px 0;
                              border: 1px solid ${ShopColors.border};
                            }
                            .landing-page-content th {
                              background-color: ${ShopColors.border};
                              padding: 8px;
                              font-weight: 700;
                              border: 1px solid ${ShopColors.border};
                              text-align: left;
                            }
                            .landing-page-content td {
                              padding: 8px;
                              border: 1px solid ${ShopColors.border};
                            }
                            .landing-page-content blockquote {
                              border-left: 4px solid ${ShopColors.primary};
                              padding-left: 16px;
                              margin: 16px 0;
                              font-style: italic;
                              color: ${ShopColors.textSecondary};
                            }
                            .landing-page-content code {
                              background-color: ${ShopColors.border};
                              padding: 2px 6px;
                              border-radius: 4px;
                              font-family: 'Courier New', monospace;
                              font-size: 14px;
                            }
                            .landing-page-content pre {
                              background-color: ${ShopColors.border};
                              padding: 12px;
                              border-radius: 8px;
                              overflow-x: auto;
                              margin: 12px 0;
                            }
                            .landing-page-content figure {
                              margin: 16px 0;
                            }
                            .landing-page-content figcaption {
                              font-size: 14px;
                              color: ${ShopColors.textSecondary};
                              margin-top: 8px;
                              font-style: italic;
                            }
                          `,
                            }}
                          />
                          <div
                            className="landing-page-content"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                              fontSize: '15px',
                              lineHeight: '1.6',
                              color: ShopColors.text,
                            }}
                            dangerouslySetInnerHTML={{
                              __html: (() => {
                                if (!baseUrl) {
                                  return landingPage.attributes.content || '';
                                }

                                const cleanBaseUrl = baseUrl.replace(/\/$/, '');

                                let content = landingPage.attributes.content || '';

                                content = content.replace(
                                  /src="\/([^"]+)"/g,
                                  `src="${cleanBaseUrl}/$1"`
                                );
                                content = content.replace(
                                  /href="\/([^"]+)"/g,
                                  `href="${cleanBaseUrl}/$1"`
                                );

                                content = content.replace(
                                  /srcset="([^"]*)"/g,
                                  (match, srcsetContent) => {
                                    const replaced = srcsetContent
                                      .split(',')
                                      .map((src: string) => {
                                        const trimmed = src.trim();
                                        if (trimmed.startsWith('/')) {
                                          const parts = trimmed.split(/\s+/);
                                          const path = parts[0].substring(1);
                                          const sizeDescriptor = parts[1] || '';
                                          return `${cleanBaseUrl}/${path}${sizeDescriptor ? ' ' + sizeDescriptor : ''}`;
                                        }
                                        return src;
                                      })
                                      .join(', ');
                                    return `srcset="${replaced}"`;
                                  }
                                );

                                return content;
                              })(),
                            }}
                          />
                        </>
                      ) : (
                        <View style={{ height: webViewHeight }}>
                          <WebView
                            originWhitelist={['*']}
                            source={{ html: htmlDocument }}
                            style={styles.webView}
                            scrollEnabled={false}
                            onMessage={(event: any) => {
                              const height = Number(event.nativeEvent.data);
                              if (height) {
                                setWebViewHeight(height + 20);
                              }
                            }}
                            injectedJavaScript={`
                              function sendHeight() {
                                const height = document.documentElement.scrollHeight;
                                window.ReactNativeWebView.postMessage(String(height));
                              }
                              sendHeight();
                              window.addEventListener('load', sendHeight);
                              setTimeout(sendHeight, 500);
                              setTimeout(sendHeight, 1000);
                            `}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            startInLoadingState={true}
                          />
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        <FooterNavigation activeTab="home" />
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
    marginHorizontal: 12,
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
  scrollView: {
    flex: 1,
  },
  content: {
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
    paddingVertical: 40,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: ShopColors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pageContent: {
    paddingVertical: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 24,
    lineHeight: 36,
  },
  htmlContent: {
    marginTop: 8,
  },
  webView: {
    backgroundColor: 'transparent',
  },
});
