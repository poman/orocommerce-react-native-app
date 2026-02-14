import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, ChevronRight, FileText } from '@/src/libs/Icon';
import { ShopColors } from '@/src/constants/theme';
import { useConfig } from '@/src/context/ConfigContext';
import { MainMenu } from '@/src/components/MainMenu';
import { showToast } from '@/src/utils/toast';
import api, { initializeApi } from '@/src/api/api';

interface LandingPage {
  id: string;
  type: string;
  attributes: {
    title: string;
    slug?: string;
    metaDescription?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export default function HelpScreen() {
  const router = useRouter();
  const { baseUrl } = useConfig();

  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLandingPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      initializeApi(baseUrl);

      const response = await api.get<{
        data: LandingPage[];
        links?: any;
        meta?: any;
      }>('/landingpages?page[number]=1&page[size]=100&sort=id');

      if (response.data.data) {
        const filteredPages = response.data.data.filter(page => page.id !== '1');
        setLandingPages(filteredPages);
      } else {
        setLandingPages([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load help pages');
      showToast('Failed to load help pages', 'error');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    loadLandingPages();
  }, [loadLandingPages]);

  const handlePageClick = (pageId: string) => {
    router.push(`/landing-page/${pageId}` as any);
  };

  const renderLandingPage = (page: LandingPage) => {
    return (
      <TouchableOpacity
        key={page.id}
        style={styles.pageCard}
        onPress={() => handlePageClick(page.id)}
        activeOpacity={0.7}
      >
        <View style={styles.pageIconContainer}>
          <FileText size={24} color={ShopColors.primary} />
        </View>
        <View style={styles.pageContent}>
          <Text style={styles.pageTitle}>{page.attributes.title}</Text>
        </View>
        <ChevronRight size={20} color={ShopColors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={ShopColors.primary} />
                <Text style={styles.loadingText}>Loading help pages...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <HelpCircle size={64} color={ShopColors.textSecondary} />
                <Text style={styles.errorTitle}>Unable to Load Help Pages</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadLandingPages}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : landingPages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <HelpCircle size={64} color={ShopColors.textSecondary} />
                <Text style={styles.emptyTitle}>No Help Pages Available</Text>
                <Text style={styles.emptyText}>There are currently no help pages to display</Text>
              </View>
            ) : (
              <>
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <HelpCircle size={20} color={ShopColors.primary} />
                    <Text style={styles.sectionTitle}>Help Pages ({landingPages.length})</Text>
                  </View>
                  <Text style={styles.sectionDescription}>
                    Browse our help articles and guides to get the most out of the app
                  </Text>
                </View>

                <View style={styles.pagesGrid}>{landingPages.map(renderLandingPage)}</View>
              </>
            )}

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>

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
  headerContainer: {
    backgroundColor: ShopColors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
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
  contentWrapper: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
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
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
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
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    lineHeight: 20,
  },
  pagesGrid: {
    gap: 12,
  },
  pageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShopColors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 4,
  },
  pageDescription: {
    fontSize: 13,
    color: ShopColors.textSecondary,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 20,
  },
});
