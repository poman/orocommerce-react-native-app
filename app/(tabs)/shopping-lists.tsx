import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ShopColors } from '@/src/constants/theme';
import { AppConfig } from '@/src/constants/config';
import { useShoppingLists } from '@/src/api/hooks/useShoppingLists';
import { List, Plus, RefreshCw, X, ShoppingBag } from '@/src/libs/Icon';
import { useConfig } from '@/src/context/ConfigContext';
import { useAuth } from '@/src/context/AuthContext';
import { ShopHeader } from '@/src/components/ShopHeader';

export default function ShoppingListsScreen() {
  const router = useRouter();
  const { baseUrl } = useConfig();
  const { isAuthenticated, getValidAccessToken } = useAuth();
  const { loading, shoppingLists, refetch, createList } = useShoppingLists(
    {
      page: { number: 1, size: AppConfig.shoppingList.defaultPageSize },
      sort: 'id',
    },
    baseUrl,
    getValidAccessToken
  );
  const [creating, setCreating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [listName, setListName] = useState('');

  const handleCreateList = async () => {
    if (creating) return;

    const name = listName.trim() || 'Shopping List';

    try {
      setCreating(true);
      const newList = await createList({
        name,
        default: false,
      });

      if (newList) {
        Alert.alert('Success', 'Shopping list created successfully!');
        setModalVisible(false);
        setListName('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create shopping list');
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setListName('');
    setModalVisible(true);
  };

  const renderEmptyState = () => (
    <>
      <ShopHeader />
      <View style={styles.emptyContainer}>
        <ShoppingBag size={64} color={ShopColors.textSecondary} />
        <Text style={styles.emptyTitle}>No Shopping Lists</Text>
        <Text style={styles.emptyText}>
          Create your first shopping list to start organizing your products.
        </Text>
        <TouchableOpacity style={styles.createButton} onPress={openCreateModal} disabled={creating}>
          {creating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Plus size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Shopping List</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  // Guest View - Not Authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.container}>
          <Stack.Screen
            options={{
              headerShown: false,
            }}
          />

          <View style={styles.contentWrapper}>
            <ShopHeader />

            <View style={styles.guestContainer}>
              <ShoppingBag size={80} color={ShopColors.textSecondary} />
              <Text style={styles.guestTitle}>Sign in to manage shopping lists</Text>
              <Text style={styles.guestText}>
                Create and organize shopping lists, save items for later, and streamline your
                ordering process.
              </Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => router.push('/(auth)/login?redirect=shopping-lists')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginButtonText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
            title: 'Lists',
            headerShadowVisible: false,
          }}
        />

        <View style={styles.contentWrapper}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ShopColors.primary} />
              <Text style={styles.loadingText}>Loading shopping lists...</Text>
            </View>
          ) : shoppingLists.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>My Shopping Lists</Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={refetch}>
                    <RefreshCw size={20} color={ShopColors.primary} />
                  </TouchableOpacity>
                </View>

                {shoppingLists.map(list => (
                  <TouchableOpacity
                    key={list.id}
                    style={styles.listCard}
                    onPress={() => {
                      router.push(`/shopping-list/${list.id}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.listHeader}>
                      <View style={styles.listTitleContainer}>
                        <List size={24} color={ShopColors.primary} />
                        <Text style={styles.listName}>{list.attributes.name}</Text>
                        {list.attributes.default ? (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.listInfo}>
                      <View style={styles.listInfoRow}>
                        <Text style={styles.listInfoLabel}>Currency:</Text>
                        <Text style={styles.listInfoValue}>{list.attributes.currency}</Text>
                      </View>
                      <View style={styles.listInfoRow}>
                        <Text style={styles.listInfoLabel}>Total:</Text>
                        <Text style={styles.listInfoValue}>
                          {list.attributes.currency} {parseFloat(list.attributes.total).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.listInfoRow}>
                        <Text style={styles.listInfoLabel}>Items:</Text>
                        <Text style={styles.listInfoValue}>
                          {list.relationships?.items?.data?.length || 0}
                        </Text>
                      </View>
                    </View>

                    {list.attributes.notes ? (
                      <Text style={styles.listNotes}>{list.attributes.notes}</Text>
                    ) : null}

                    <Text style={styles.listDate}>
                      Created: {new Date(list.attributes.createdAt).toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={{ height: 80 }} />
              </ScrollView>

              <View style={styles.fabContainer}>
                <TouchableOpacity style={styles.fab} onPress={openCreateModal} disabled={creating}>
                  <Plus size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Create Shopping List Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setListName('');
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setModalVisible(false);
              setListName('');
            }}
          >
            <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Shopping List</Text>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setListName('');
                  }}
                  style={styles.closeButton}
                >
                  <X size={24} color={ShopColors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>List Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Shopping List"
                  placeholderTextColor={ShopColors.textSecondary}
                  value={listName}
                  onChangeText={setListName}
                  autoFocus={true}
                  editable={!creating}
                />
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setModalVisible(false);
                    setListName('');
                  }}
                  disabled={creating}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, creating && styles.submitButtonDisabled]}
                  onPress={handleCreateList}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
  contentWrapper: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  guestText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: ShopColors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: ShopColors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ShopColors.text,
  },
  refreshButton: {
    padding: 8,
  },
  listCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: ShopColors.text,
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: ShopColors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ShopColors.primary,
  },
  listInfo: {
    marginBottom: 12,
  },
  listInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listInfoLabel: {
    fontSize: 14,
    color: ShopColors.textSecondary,
  },
  listInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
  },
  listNotes: {
    fontSize: 14,
    color: ShopColors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  listDate: {
    fontSize: 12,
    color: ShopColors.textSecondary,
  },
  createNewContainer: {
    padding: 16,
  },
  createButton: {
    backgroundColor: ShopColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    zIndex: 1000,
  },
  fab: {
    backgroundColor: ShopColors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ShopColors.text,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ShopColors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: ShopColors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: ShopColors.text,
    backgroundColor: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: ShopColors.border,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ShopColors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ShopColors.text,
  },
  submitButton: {
    backgroundColor: ShopColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
