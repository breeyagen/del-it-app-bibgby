
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { DeletedItemsManager } from '@/utils/deletedItemsManager';
import { DeletedItem } from '@/types/photo';

export default function ProfileScreen() {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = async () => {
    setIsLoading(true);
    try {
      const items = await DeletedItemsManager.getDeletedItems();
      setDeletedItems(items);
      console.log(`Loaded ${items.length} deleted items`);
    } catch (error) {
      console.error('Error loading deleted items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (item: DeletedItem) => {
    Alert.alert(
      'Restore Item',
      'Do you want to restore this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            const success = await DeletedItemsManager.restoreItem(item.asset.id);
            if (success) {
              Alert.alert('Success', 'Item restored successfully');
              loadDeletedItems();
            } else {
              Alert.alert('Error', 'Failed to restore item');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to permanently clear all deleted items? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await DeletedItemsManager.clearDeletedItems();
            Alert.alert('Success', 'All deleted items cleared');
            loadDeletedItems();
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'duplicate':
        return { ios: 'doc.on.doc.fill' as const, android: 'content_copy' as const };
      case 'whatsapp':
        return { ios: 'message.fill' as const, android: 'chat' as const };
      case 'screenshot':
        return { ios: 'camera.viewfinder' as const, android: 'screenshot' as const };
      default:
        return { ios: 'photo' as const, android: 'photo' as const };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol
          ios_icon_name="person.circle.fill"
          android_material_icon_name="account_circle"
          size={40}
          color={colors.primary}
        />
        <Text style={commonStyles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="clock.arrow.circlepath"
              android_material_icon_name="restore"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>Deleted Items</Text>
          </View>

          <Text style={[commonStyles.textSecondary, styles.sectionDescription]}>
            Items deleted in the last 30 days can be restored here.
          </Text>

          {isLoading ? (
            <View style={styles.emptyState}>
              <Text style={commonStyles.textSecondary}>Loading...</Text>
            </View>
          ) : deletedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={60}
                color={colors.secondary}
              />
              <Text style={[commonStyles.text, styles.emptyText]}>
                No deleted items
              </Text>
              <Text style={commonStyles.textSecondary}>
                Items you delete will appear here for 30 days
              </Text>
            </View>
          ) : (
            <React.Fragment>
              <View style={styles.itemsList}>
                {deletedItems.map((item, index) => {
                  const daysRemaining = DeletedItemsManager.getDaysRemaining(item.deletedAt);
                  const categoryIcon = getCategoryIcon(item.category);

                  return (
                    <View key={index} style={styles.deletedItemCard}>
                      <Image source={{ uri: item.asset.uri }} style={styles.thumbnail} />
                      <View style={styles.itemInfo}>
                        <View style={styles.itemHeader}>
                          <IconSymbol
                            ios_icon_name={categoryIcon.ios}
                            android_material_icon_name={categoryIcon.android}
                            size={16}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.itemCategory}>
                            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                          </Text>
                        </View>
                        <Text style={styles.itemFilename} numberOfLines={1}>
                          {item.asset.filename}
                        </Text>
                        <Text style={styles.itemDays}>
                          {daysRemaining} days remaining
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.restoreButton}
                        onPress={() => handleRestore(item)}
                      >
                        <IconSymbol
                          ios_icon_name="arrow.uturn.backward.circle.fill"
                          android_material_icon_name="restore"
                          size={32}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[buttonStyles.secondaryButton, styles.clearButton]}
                onPress={handleClearAll}
              >
                <Text style={buttonStyles.secondaryButtonText}>Clear All</Text>
              </TouchableOpacity>
            </React.Fragment>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.primary}
            />
            <Text style={styles.sectionTitle}>About Del It</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Del It is a privacy-first photo cleanup app that helps you safely identify and delete unwanted photos.
            </Text>
            <Text style={styles.infoText}>
              All scanning happens on your device. Your photos never leave your phone.
            </Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>100% Private</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>Manual Control</Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check_circle"
                size={20}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>30-Day Recovery</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  sectionDescription: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.card,
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  itemsList: {
    marginBottom: 16,
  },
  deletedItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  itemFilename: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  itemDays: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500',
  },
  restoreButton: {
    marginLeft: 8,
  },
  clearButton: {
    width: '100%',
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginLeft: 8,
  },
});
