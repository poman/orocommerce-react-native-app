import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { ThemeColors } from '@/src/themes/types';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export default function CustomAlert({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  type = 'info',
}: CustomAlertProps) {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const getAccentColor = () => {
    switch (type) {
      case 'success':
        return ShopColors.success;
      case 'error':
        return ShopColors.error;
      case 'warning':
        return ShopColors.warning;
      default:
        return ShopColors.primary;
    }
  };

  const handleConfirm = () => {
    onClose();
    if (onConfirm) {
      setTimeout(() => {
        onConfirm();
      }, 100);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={[styles.accentBar, { backgroundColor: getAccentColor() }]} />

              <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                <View style={styles.buttonContainer}>
                  {onConfirm && (
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={handleCancel}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelButtonText}>{cancelText}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.confirmButton,
                      { backgroundColor: getAccentColor() },
                    ]}
                    onPress={handleConfirm}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: ShopColors.text,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 16,
    color: ShopColors.textSecondary,
    lineHeight: 24,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButton: {
    shadowColor: ShopColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: ShopColors.background,
    borderWidth: 1.5,
    borderColor: ShopColors.border,
  },
  confirmButtonText: {
    color: ShopColors.cardBackground,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cancelButtonText: {
    color: ShopColors.text,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
