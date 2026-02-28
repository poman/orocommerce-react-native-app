/**
 * Homepage Section Banner Component
 * Supports multiple banner types: feature, image, and promo-bar
 */

import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { HomepageSectionBanner, ThemeColors } from '@/src/themes/types';
import { useTheme } from '@/src/context/ThemeContext';
import * as Icon from '@/src/libs/Icon';

interface SectionBannerProps {
  banner: HomepageSectionBanner;
  width: number;
}

const getIconComponent = (iconName: string) => {
  const pascalCase = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  return (Icon as any)[pascalCase];
};

export const SectionBanner: React.FC<SectionBannerProps> = ({ banner, width }) => {
  const { colors: ShopColors } = useTheme();
  const styles = useMemo(() => createStyles(ShopColors), [ShopColors]);
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isSmallScreen = screenWidth < 460;

  // Feature Banner (icons with text)
  if (banner.type === 'feature') {
    return (
      <View style={[styles.container, { maxWidth: width }]}>
        <View
          style={[
            styles.featureBanner,
            {
              backgroundColor: banner.backgroundColor || '#F9FAFB',
            },
          ]}
        >
          {banner.features.map((feature, index) => {
            const IconComponent = getIconComponent(feature.iconName);

            return (
              <View
                key={index}
                style={[styles.featureItem, isSmallScreen && styles.featureItemSmall]}
              >
                {IconComponent && (
                  <IconComponent
                    size={20}
                    color={banner.iconColor || banner.textColor || '#1F2937'}
                  />
                )}
                <Text
                  style={[
                    styles.featureText,
                    isSmallScreen && styles.featureTextSmall,
                    { color: banner.textColor || '#1F2937' },
                  ]}
                >
                  {feature.text}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // Image Banner (with title, subtitle, CTA)
  if (banner.type === 'image') {
    const handlePress = () => {
      if (banner.ctaLink) {
        if (banner.ctaLink.startsWith('/')) {
          router.push(banner.ctaLink as any);
        } else {
          router.push(`/landing-page/${banner.ctaLink}` as any);
        }
      }
    };

    return (
      <View style={[styles.container, { maxWidth: width }]}>
        <TouchableOpacity
          style={styles.imageBannerWrapper}
          onPress={handlePress}
          activeOpacity={banner.ctaLink ? 0.9 : 1}
          disabled={!banner.ctaLink}
        >
          <Image
            source={{ uri: banner.image }}
            style={styles.imageBannerImage}
            resizeMode="cover"
          />
          {(banner.title || banner.subtitle || banner.ctaText) && (
            <View
              style={[
                styles.imageBannerOverlay,
                banner.backgroundColor && {
                  backgroundColor: banner.backgroundColor,
                },
              ]}
            >
              {banner.title && (
                <Text style={[styles.imageBannerTitle, { color: banner.textColor || '#FFFFFF' }]}>
                  {banner.title}
                </Text>
              )}
              {banner.subtitle && (
                <Text
                  style={[styles.imageBannerSubtitle, { color: banner.textColor || '#FFFFFF' }]}
                >
                  {banner.subtitle}
                </Text>
              )}
              {banner.ctaText && (
                <View style={styles.imageBannerCTA}>
                  <Text style={styles.imageBannerCTAText}>{banner.ctaText}</Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // Promo Bar Banner
  if (banner.type === 'promo-bar') {
    const handlePress = () => {
      if (banner.link) {
        if (banner.link.startsWith('/')) {
          router.push(banner.link as any);
        } else {
          router.push(`/landing-page/${banner.link}` as any);
        }
      }
    };

    return (
      <View style={[styles.container, { maxWidth: width, marginBottom: 16 }]}>
        <TouchableOpacity
          style={[
            styles.promoBar,
            {
              backgroundColor: banner.backgroundColor,
              height: banner.height || 32,
            },
          ]}
          onPress={handlePress}
          activeOpacity={banner.link ? 0.8 : 1}
          disabled={!banner.link}
        >
          <Text style={[styles.promoBarText, { color: banner.textColor }]}>{banner.text}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

const createStyles = (ShopColors: ThemeColors) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 24,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  // Feature Banner Styles
  featureBanner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    justifyContent: 'space-around',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
  },
  featureItemSmall: {
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  featureTextSmall: {
    flex: 0,
    textAlign: 'center',
    fontSize: 11,
  },
  // Image Banner Styles
  imageBannerWrapper: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageBannerImage: {
    width: '100%',
    height: '100%',
  },
  imageBannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  imageBannerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  imageBannerSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.9,
  },
  imageBannerCTA: {
    backgroundColor: ShopColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  imageBannerCTAText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Promo Bar Styles
  promoBar: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  promoBarText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
