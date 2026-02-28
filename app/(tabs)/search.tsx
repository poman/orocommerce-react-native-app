import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { X, Search as SearchIcon, ArrowLeft } from '@/src/libs/Icon';
import { useTheme } from '@/src/context/ThemeContext';
import { useConfig } from '@/src/context/ConfigContext';
import { useProductSearch } from '@/src/api/hooks/useProductSearch';
import { ProductCard } from '@/src/components/ProductCard';
import { TopMainMenu } from '@/src/components/TopMainMenu';
import { getResponsiveLayout } from '@/src/utils/responsive';
import { ThemeColors } from '@/src/themes/types';

export default function SearchScreen() {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const { baseUrl } = useConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [layout, setLayout] = useState(getResponsiveLayout());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setLayout(getResponsiveLayout());
    });

    return () => subscription?.remove();
  }, []);

  const { loading, products } = useProductSearch({
    searchQuery: debouncedQuery,
    page: { number: 1, size: 20 },
    sort: 'relevance',
  });

  const renderProduct = ({ item }: { item: any }) => {
    return <ProductCard product={item} baseUrl={baseUrl} width={layout.cardWidth} />;
  };

  const renderEmptyState = () => {
    if (loading) return null;

    if (!debouncedQuery) {
      return (
        <View style={styles.emptyState}>
          <SearchIcon size={64} color={ShopColors.textSecondary} />
          <Text style={styles.emptyStateTitle}>Search Products</Text>
          <Text style={styles.emptyStateText}>Enter a product name, SKU, or keyword to search</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No results found</Text>
        <Text style={styles.emptyStateText}>Try searching with different keywords</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          {/* Custom Header with Back Button and Title */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <ArrowLeft size={24} color={ShopColors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Search</Text>
            <TopMainMenu />
          </View>

          {/* Search Input */}
          <View style={styles.searchInputContainer}>
            <View style={styles.searchContainer}>
              <SearchIcon size={20} color={ShopColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={ShopColors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                  accessibilityLabel="Clear search"
                  accessibilityRole="button"
                >
                  <X size={20} color={ShopColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Results */}
          {loading && debouncedQuery ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ShopColors.primary} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={item => item.id}
              numColumns={layout.columns}
              key={`grid-${layout.columns}`}
              columnWrapperStyle={layout.columns > 1 ? styles.columnWrapper : undefined}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyState}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
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
  contentWrapper: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ShopColors.border,
    backgroundColor: ShopColors.background,
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ShopColors.text,
    flex: 1,
  },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: ShopColors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ShopColors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ShopColors.text,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  columnWrapper: {
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: ShopColors.text,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    textAlign: 'center',
  },
});
