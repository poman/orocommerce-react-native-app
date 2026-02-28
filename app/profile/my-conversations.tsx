import React, { useState, useEffect, useMemo } from 'react';
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
import { ArrowLeft, Mail, ChevronRight } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { MainMenu } from '@/src/components/MainMenu';
import { showToast } from '@/src/utils/toast';
import api, { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import { ThemeColors } from '@/src/themes/types';

interface Conversation {
  id: string;
  type: string;
  attributes: {
    name?: string;
    status?: string;
    lastMessageDate?: string;
    messagesNumber?: number;
    createdAt?: string;
    updatedAt?: string;
    sourceTitle?: string;
    sourceUrl?: string;
  };
  relationships?: {
    customer?: any;
    owner?: any;
    messages?: any;
  };
}

export default function MyConversationsScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getValidAccessToken();
      if (!token) {
        router.replace('/(auth)/login?redirect=/profile/my-conversations');
        return;
      }

      initializeApi(baseUrl);
      setAuthTokenGetter(getValidAccessToken);

      try {
        const response = await api.get<{
          data: Conversation[];
          links?: any;
          meta?: any;
        }>('/conversations?page[number]=1&page[size]=50&sort=-id');

        if (response.data.data) {
          setConversations(response.data.data);
        } else {
          setConversations([]);
        }
      } catch (_apiError: any) {
        const statusCode = _apiError?.response?.status;

        if (statusCode === 404 || statusCode === 405 || !statusCode) {
          setError('conversations_not_available');
        } else {
          setConversations([]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
      showToast('Failed to load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversationId: string) => {
    router.push(`/profile/conversation/${conversationId}` as any);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return '';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'active':
        return ShopColors.success;
      case 'closed':
      case 'resolved':
        return ShopColors.textSecondary;
      case 'pending':
        return ShopColors.warning;
      default:
        return ShopColors.primary;
    }
  };

  const renderConversation = (conversation: Conversation) => {
    const statusColor = getStatusColor(conversation.attributes.status);

    return (
      <TouchableOpacity
        key={conversation.id}
        style={styles.conversationCard}
        onPress={() => handleConversationClick(conversation.id)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationIconContainer}>
          <Mail size={24} color={ShopColors.primary} />
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationSubject} numberOfLines={1}>
              {conversation.attributes.name || `Conversation #${conversation.id}`}
            </Text>
            {conversation.attributes.status && (
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {conversation.attributes.status}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.conversationMeta}>
            {conversation.attributes.messagesNumber !== undefined && (
              <Text style={styles.metaText}>
                {conversation.attributes.messagesNumber}{' '}
                {conversation.attributes.messagesNumber === 1 ? 'message' : 'messages'}
              </Text>
            )}
            {conversation.attributes.updatedAt && (
              <Text style={styles.metaText}>• {formatDate(conversation.attributes.updatedAt)}</Text>
            )}
          </View>
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Conversations</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ShopColors.primary} />
              <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Mail size={64} color={ShopColors.textSecondary} />
              {error === 'conversations_not_available' ? (
                <>
                  <Text style={styles.errorTitle}>Feature Not Available</Text>
                  <Text style={styles.errorText}>
                    The conversations feature is not available in your current OroCommerce version.
                    {'\n\n'}
                    Please contact your system administrator to enable this feature or upgrade to a
                    version that supports conversations.
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => router.push('/(tabs)/profile')}
                  >
                    <Text style={styles.retryButtonText}>Back to Profile</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.errorTitle}>Unable to Load Conversations</Text>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Mail size={64} color={ShopColors.textSecondary} />
              <Text style={styles.emptyTitle}>No Conversations</Text>
              <Text style={styles.emptyText}>
                You don&apos;t have any conversations yet. Contact support to start a conversation.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Mail size={20} color={ShopColors.primary} />
                  <Text style={styles.sectionTitle}>
                    All Conversations ({conversations.length})
                  </Text>
                </View>
              </View>

              <View style={styles.conversationsGrid}>{conversations.map(renderConversation)}</View>
            </>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

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
    lineHeight: 20,
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
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
  },
  conversationsGrid: {
    gap: 12,
  },
  conversationCard: {
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
  conversationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ShopColors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  conversationSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: ShopColors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  bottomSpacing: {
    height: 20,
  },
});
