import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { ToastConfig } from 'react-native-toast-message';
import { ThemeToastColors } from '@/src/themes/types';

interface CustomToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
  hide: () => void;
  props?: {
    icon?: string;
  };
}

const CustomToastBase = ({
  text1,
  text2,
  hide,
  type,
  themeToastColors,
}: CustomToastProps & { type: 'success' | 'error' | 'warning' | 'info'; themeToastColors: ThemeToastColors }) => {
  const colors = themeToastColors[type];
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    // Slide in from right when toast appears
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [slideAnim]);

  const handleHide = () => {
    // Slide out to right before hiding
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      hide();
    });
  };

  return (
    <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
      <View style={[styles.container, { backgroundColor: colors.background, borderColor: themeToastColors.common.borderColor }]}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
          <Text style={[styles.icon, { color: colors.accent }]}>{colors.icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          {text1 && (
            <Text style={[styles.message, { color: colors.textColor }]} numberOfLines={2}>
              {text1}
            </Text>
          )}
          {text2 && (
            <Text style={[styles.subMessage, { color: colors.subTextColor }]} numberOfLines={2}>
              {text2}
            </Text>
          )}
        </View>

        {/* Close button */}
        <TouchableOpacity
          onPress={handleHide}
          style={[styles.closeButton, { backgroundColor: themeToastColors.common.closeButtonBackground }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.closeIcon, { color: themeToastColors.common.closeIconColor }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

/**
 * Factory function to create a toast config bound to theme colors.
 * Call this whenever the theme changes so toasts pick up the new palette.
 */
export const createToastConfig = (themeToastColors: ThemeToastColors): ToastConfig => ({
  success: props => <CustomToastBase {...props} type="success" themeToastColors={themeToastColors} />,
  error: props => <CustomToastBase {...props} type="error" themeToastColors={themeToastColors} />,
  warning: props => <CustomToastBase {...props} type="warning" themeToastColors={themeToastColors} />,
  info: props => <CustomToastBase {...props} type="info" themeToastColors={themeToastColors} />,
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: 12,
    paddingLeft: 0,
    paddingRight: 14,
    borderRadius: 10,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    maxWidth: Platform.OS === 'web' ? 400 : '85%',
    minHeight: 52,
    overflow: 'hidden',
    borderWidth: 1,
  },
  accentBar: {
    width: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
    marginRight: 12,
  },
  icon: {
    fontSize: 14,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    paddingVertical: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  subMessage: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  closeButton: {
    marginLeft: 12,
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 12,
    fontWeight: '500',
  },
});
