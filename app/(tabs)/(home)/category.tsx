
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
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { ScanResult, PhotoAsset, DuplicateGroup } from '@/types/photo';
import { DeletedItemsManager } from '@/utils/deletedItemsManager';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 60) / 3;

export default function CategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const category = params.category as 'duplicates' | 'whatsapp' | 'screenshots';
  const scanResult: ScanResult = params.data ? JSON.parse(params.data as string) : null;

  if (!scanResult) {
    return (
      <View style={styles.container}>
        <Text style={commonStyles.text}>No data available</Text>
      </View>
    );
  }

  const getCategoryData = () => {
    switch (category) {
      case 'duplicates':
        return {
          title: 'Duplicate Photos',
          icon: 'doc.on.doc.fill' as const,
          androidIcon: 'content_copy' as const,
          items: scanResult.duplicates,
          description: 'Select duplicates to delete. The best quality version will be kept.',
        };
      case 'whatsapp':
        return {
          title: 'WhatsApp Images',
          icon: 'message.fill' as const,
          androidIcon: 'chat' as const,
          items: scanResult.whatsappImages,
          description: 'Select WhatsApp images to delete.',
        };
      case 'screenshots':
        return {
          title: 'Screenshots',
          icon: 'camera.viewfinder' as const,
          androidIcon: 'screenshot' as const,
          items: scanResult.screenshots,
          description: 'Select screenshots to delete.',
        };
    }
  };

  const categoryData = getCategoryData();

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const selectAll = () => {
    const allIds = new Set<string>();
    
    if (category === 'duplicates') {
      (categoryData.items as DuplicateGroup[]).forEach((group) => {
        group.assets.forEach((asset) => {
          if (asset.id !== group.bestQuality.id) {
            allIds.add(asset.id);
          }
        });
      });
    } else {
      (categoryData.items as PhotoAsset[]).forEach((asset) => {
        allIds.add(asset.id);
      });
    }
    
    setSelectedItems(allIds);
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) {
      Alert.alert('No Selection', 'Please select items to delete.');
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete ${selectedItems.size} item(s)? They can be restored within 30 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const assetsToDelete: PhotoAsset[] = [];

              if (category === 'duplicates') {
                (categoryData.items as DuplicateGroup[]).forEach((group) => {
                  group.assets.forEach((asset) => {
                    if (selectedItems.has(asset.id)) {
                      assetsToDelete.push(asset);
                    }
                  });
                });
              } else {
                (categoryData.items as PhotoAsset[]).forEach((asset) => {
                  if (selectedItems.has(asset.id)) {
                    assetsToDelete.push(asset);
                  }
                });
              }

              // Save to deleted items manager
              await DeletedItemsManager.addDeletedItems(
                assetsToDelete,
                category === 'duplicates' ? 'duplicate' : category
              );

              // Delete from media library
              const assetIds = assetsToDelete.map((a) => a.id);
              await MediaLibrary.deleteAssetsAsync(assetIds);

              console.log(`Deleted ${assetIds.length} items`);

              Alert.alert(
                'Success',
                `Deleted ${assetIds.length} item(s). You can restore them within 30 days from the Profile tab.`,
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error) {
              console.error('Error deleting items:', error);
              Alert.alert('Error', 'Failed to delete items. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderDuplicateGroup = (group: DuplicateGroup, index: number) => {
    return (
      <View key={group.id} style={styles.duplicateGroup}>
        <Text style={styles.groupTitle}>Group {index + 1}</Text>
        <View style={styles.imageGrid}>
          {group.assets.map((asset) => {
            const isSelected = selectedItems.has(asset.id);
            const isBestQuality = asset.id === group.bestQuality.id;

            return (
              <TouchableOpacity
                key={asset.id}
                style={styles.imageContainer}
                onPress={() => !isBestQuality && toggleSelection(asset.id)}
                disabled={isBestQuality}
              >
                <Image source={{ uri: asset.uri }} style={styles.image} />
                {isBestQuality && (
                  <View style={styles.bestQualityBadge}>
                    <Text style={styles.bestQualityText}>Best</Text>
                  </View>
                )}
                {!isBestQuality && (
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && (
                      <IconSymbol
                        ios_icon_name="checkmark"
                        android_material_icon_name="check"
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderPhotoGrid = (items: PhotoAsset[]) => {
    return (
      <View style={styles.imageGrid}>
        {items.map((asset) => {
          const isSelected = selectedItems.has(asset.id);

          return (
            <TouchableOpacity
              key={asset.id}
              style={styles.imageContainer}
              onPress={() => toggleSelection(asset.id)}
            >
              <Image source={{ uri: asset.uri }} style={styles.image} />
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && (
                  <IconSymbol
                    ios_icon_name="checkmark"
                    android_material_icon_name="check"
                    size={16}
                    color="#FFFFFF"
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="chevron_left"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <IconSymbol
            ios_icon_name={categoryData.icon}
            android_material_icon_name={categoryData.androidIcon}
            size={32}
            color={colors.primary}
          />
          <Text style={styles.headerTitle}>{categoryData.title}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={[commonStyles.textSecondary, styles.description]}>
          {categoryData.description}
        </Text>

        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedItems.size} selected
          </Text>
          <View style={styles.selectionButtons}>
            <TouchableOpacity onPress={selectAll} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deselectAll} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Deselect All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {category === 'duplicates'
          ? (categoryData.items as DuplicateGroup[]).map((group, index) =>
              renderDuplicateGroup(group, index)
            )
          : renderPhotoGrid(categoryData.items as PhotoAsset[])}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            buttonStyles.dangerButton,
            styles.deleteButton,
            (selectedItems.size === 0 || isDeleting) && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={selectedItems.size === 0 || isDeleting}
        >
          <Text style={buttonStyles.dangerButtonText}>
            {isDeleting ? 'Deleting...' : `Delete ${selectedItems.size} Item(s)`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.highlight,
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  description: {
    marginBottom: 16,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.highlight,
    borderRadius: 8,
  },
  selectionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  duplicateGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  checkbox: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  bestQualityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestQualityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    borderTopWidth: 1,
    borderTopColor: colors.highlight,
  },
  deleteButton: {
    width: '100%',
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});
