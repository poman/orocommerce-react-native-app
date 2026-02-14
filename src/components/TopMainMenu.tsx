import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { MoreVertical, Home, ShoppingBag, Heart, User, Truck } from '@/src/libs/Icon';
import { ShopColors } from '@/src/constants/theme';

interface TopMainMenuProps {
  iconColor?: string;
  iconSize?: number;
}

export const TopMainMenu: React.FC<TopMainMenuProps> = ({
  iconColor = ShopColors.text,
  iconSize = 24,
}) => {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };

  const handleMenuItemPress = (route: string) => {
    setShowMenu(false);
    router.push(route as any);
  };

  return (
    <View>
      <TouchableOpacity onPress={handleMenuPress} style={styles.menuButton} activeOpacity={0.7}>
        <MoreVertical size={iconSize} color={iconColor} />
      </TouchableOpacity>

      <Modal
        visible={showMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.dropdownMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('/(tabs)')}
              activeOpacity={0.7}
            >
              <Home size={20} color={ShopColors.text} />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('/(tabs)/orders')}
              activeOpacity={0.7}
            >
              <Truck size={20} color={ShopColors.text} />
              <Text style={styles.menuItemText}>My Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('/(tabs)/shopping-lists')}
              activeOpacity={0.7}
            >
              <ShoppingBag size={20} color={ShopColors.text} />
              <Text style={styles.menuItemText}>Shopping Lists</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('/(tabs)/wishlist')}
              activeOpacity={0.7}
            >
              <Heart size={20} color={ShopColors.text} />
              <Text style={styles.menuItemText}>Wishlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <User size={20} color={ShopColors.text} />
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 60 : 64,
    paddingRight: 16,
  },
  dropdownMenu: {
    backgroundColor: ShopColors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ShopColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: ShopColors.text,
    fontWeight: '500',
  },
});
