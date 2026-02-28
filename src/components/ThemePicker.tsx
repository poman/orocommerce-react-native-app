/**
 * Theme Picker Component
 *
 * Displays available themes as selectable cards with color previews.
 * Only intended for use in demo mode (Settings page).
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { Check } from '@/src/libs/Icon';
import { ThemeColors } from '@/src/themes/types';
import { getTheme } from '@/src/themes';
import { showToast } from '@/src/utils/toast';

export const ThemePicker: React.FC = () => {
  const { colors, themeId, setThemeById, availableThemes } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSelect = async (id: string) => {
    if (id === themeId) return;
    await setThemeById(id);
    const selected = getTheme(id);
    showToast(`Theme switched to "${selected.meta.name}"`, 'success');
  };

  return (
    <View style={styles.container}>
      {availableThemes.map((item) => {
        const isActive = item.id === themeId;
        const theme = getTheme(item.id);
        const previewColors = theme.colors;

        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              isActive && { borderColor: colors.primary, borderWidth: 2 },
            ]}
            onPress={() => handleSelect(item.id)}
            activeOpacity={0.7}
          >
            {/* Color swatch row */}
            <View style={styles.swatchRow}>
              <View style={[styles.swatch, { backgroundColor: previewColors.primary }]} />
              <View style={[styles.swatch, { backgroundColor: previewColors.secondary }]} />
              <View style={[styles.swatch, { backgroundColor: previewColors.success }]} />
              <View style={[styles.swatch, { backgroundColor: previewColors.error }]} />
              <View style={[styles.swatch, { backgroundColor: previewColors.text }]} />
            </View>

            {/* Theme info */}
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, isActive && { color: colors.primary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                    <Check size={12} color="#FFFFFF" />
                  </View>
                )}
              </View>
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            </View>

            {/* Full-width color bar preview */}
            <View style={styles.colorBar}>
              <View style={[styles.colorBarSegment, { backgroundColor: previewColors.primary, flex: 3 }]} />
              <View style={[styles.colorBarSegment, { backgroundColor: previewColors.secondary, flex: 2 }]} />
              <View style={[styles.colorBarSegment, { backgroundColor: previewColors.background, flex: 1, borderRightWidth: 1, borderColor: previewColors.border }]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    swatchRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
    },
    swatch: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    info: {
      paddingHorizontal: 14,
      paddingBottom: 12,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    activeBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    description: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    colorBar: {
      flexDirection: 'row',
      height: 4,
    },
    colorBarSegment: {
      height: '100%',
    },
  });
