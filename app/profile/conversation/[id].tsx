import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Mail, User } from '@/src/libs/Icon';
import { ShopColors } from '@/src/constants/theme';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { showToast } from '@/src/utils/toast';
import api, { initializeApi, setAuthTokenGetter } from '@/src/api/api';
import { TopMainMenu } from '@/src/components/TopMainMenu';

interface Message {
  id: string;
  type: string;
  attributes: {
    body?: string;
    subject?: string;
    createdAt?: string;
    isOwn?: boolean;
    authorName?: string;
  };
}

interface ConversationDetail {
  id: string;
  type: string;
  attributes: {
    name?: string;
    messagesNumber?: number;
    createdAt?: string;
    updatedAt?: string;
    sourceTitle?: string;
    sourceUrl?: string;
  };
  relationships?: {
    messages?: {
      data: Array<{ type: string; id: string }>;
    };
    status?: {
      data: { type: string; id: string } | null;
    };
  };
}

export default function ConversationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { getValidAccessToken } = useAuth();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadConversation = async () => {
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
          data: ConversationDetail;
          included?: any[];
        }>(`/conversations/${id}?include=messages,status`);

        if (response.data.data) {
          setConversation(response.data.data);

          if (response.data.included) {
            const messagesList = response.data.included.filter(
              (item: any) => item.type === 'conversationmessages'
            );
            setMessages(messagesList as Message[]);

            const statusItem = response.data.included.find(
              (item: any) => item.type === 'conversationstatuses'
            );
            if (statusItem) {
              setStatus(statusItem.id || statusItem.attributes?.name || '');
            }
          }

          if (response.data.data.relationships?.status?.data) {
            setStatus(response.data.data.relationships.status.data.id);
          }
        }
      } catch (_apiError: any) {
        setError('Conversation not found or not accessible');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load conversation');
      showToast('Failed to load conversation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const stripHtmlTags = (html?: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
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

  const renderMessage = (message: Message) => {
    const isOwn = message.attributes.isOwn;

    return (
      <View
        key={message.id}
        style={[styles.messageCard, isOwn ? styles.messageCardOwn : styles.messageCardOther]}
      >
        <View style={styles.messageHeader}>
          <View style={styles.messageAuthor}>
            <User size={16} color={isOwn ? ShopColors.primary : ShopColors.textSecondary} />
            <Text style={[styles.authorName, isOwn && styles.authorNameOwn]}>
              {message.attributes.authorName || (isOwn ? 'You' : 'Support')}
            </Text>
          </View>
          {message.attributes.createdAt && (
            <Text style={styles.messageTime}>{formatDate(message.attributes.createdAt)}</Text>
          )}
        </View>

        {message.attributes.body && (
          <Text style={styles.messageBody}>{stripHtmlTags(message.attributes.body)}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/profile/my-conversations')}
          >
            <ArrowLeft size={24} color={ShopColors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {conversation?.attributes.name || 'Conversation'}
          </Text>
          <TopMainMenu />
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
              <Text style={styles.loadingText}>Loading conversation...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Mail size={64} color={ShopColors.textSecondary} />
              <Text style={styles.errorTitle}>Unable to Load Conversation</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadConversation}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : conversation ? (
            <>
              {/* Conversation Info */}
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Subject:</Text>
                  <Text style={styles.infoValue}>
                    {conversation.attributes.name || `Conversation #${conversation.id}`}
                  </Text>
                </View>

                {status && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(status) + '20' },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                        {status}
                      </Text>
                    </View>
                  </View>
                )}

                {conversation.attributes.createdAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Created:</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(conversation.attributes.createdAt)}
                    </Text>
                  </View>
                )}

                {conversation.attributes.messagesNumber !== undefined && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Messages:</Text>
                    <Text style={styles.infoValue}>{conversation.attributes.messagesNumber}</Text>
                  </View>
                )}
              </View>

              {/* Messages */}
              {messages.length > 0 ? (
                <View style={styles.messagesContainer}>
                  <Text style={styles.messagesTitle}>Messages ({messages.length})</Text>
                  <View style={styles.messagesList}>{messages.map(renderMessage)}</View>
                </View>
              ) : (
                <View style={styles.noMessagesContainer}>
                  <Mail size={48} color={ShopColors.textSecondary} />
                  <Text style={styles.noMessagesText}>No messages in this conversation</Text>
                </View>
              )}
            </>
          ) : null}

          <View style={styles.bottomSpacing} />
        </ScrollView>
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
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
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
  infoCard: {
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
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  messagesContainer: {
    marginBottom: 16,
  },
  messagesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 16,
  },
  messagesList: {
    gap: 12,
  },
  messageCard: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: ShopColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageCardOwn: {
    backgroundColor: ShopColors.primary + '10',
    borderColor: ShopColors.primary + '30',
  },
  messageCardOther: {
    backgroundColor: ShopColors.cardBackground,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.textSecondary,
  },
  authorNameOwn: {
    color: ShopColors.primary,
  },
  messageTime: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  messageBody: {
    fontSize: 14,
    color: ShopColors.text,
    lineHeight: 20,
  },
  noMessagesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noMessagesText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    marginTop: 12,
  },
  bottomSpacing: {
    height: 20,
  },
});
