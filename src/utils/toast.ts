import Toast from 'react-native-toast-message';

type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * Show a toast notification
 * @param message - The message to display
 * @param type - The type of toast: 'success', 'error', 'info', or 'warning'
 * @param description - Optional secondary message
 * @param duration - Duration in ms (default: 3000)
 */
export const showToast = (
  message: string,
  type: ToastType = 'success',
  description?: string,
  duration: number = 3000
) => {
  Toast.show({
    type,
    text1: message,
    text2: description,
    visibilityTime: duration,
    autoHide: true,
    topOffset: 40, // Moved down to avoid native elements (status bar, notch, etc.)
    onPress: () => Toast.hide(),
  });
};

/**
 * Hide the currently visible toast
 */
export const hideToast = () => {
  Toast.hide();
};

export default {
  show: showToast,
  hide: hideToast,
};
