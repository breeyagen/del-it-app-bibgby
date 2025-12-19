
import { DeletedItem, PhotoAsset } from '@/types/photo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DELETED_ITEMS_KEY = '@del_it_deleted_items';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export class DeletedItemsManager {
  static async addDeletedItems(
    assets: PhotoAsset[],
    category: 'duplicate' | 'whatsapp' | 'screenshot'
  ): Promise<void> {
    try {
      const existingItems = await this.getDeletedItems();
      const now = Date.now();

      const newItems: DeletedItem[] = assets.map((asset) => ({
        asset,
        deletedAt: now,
        category,
      }));

      const allItems = [...existingItems, ...newItems];
      await AsyncStorage.setItem(DELETED_ITEMS_KEY, JSON.stringify(allItems));
      console.log(`Added ${newItems.length} items to deleted items`);
    } catch (error) {
      console.error('Error adding deleted items:', error);
    }
  }

  static async getDeletedItems(): Promise<DeletedItem[]> {
    try {
      const data = await AsyncStorage.getItem(DELETED_ITEMS_KEY);
      if (!data) return [];

      const items: DeletedItem[] = JSON.parse(data);
      
      // Filter out items older than 30 days
      const now = Date.now();
      const validItems = items.filter(
        (item) => now - item.deletedAt < THIRTY_DAYS_MS
      );

      // Save filtered items back if any were removed
      if (validItems.length !== items.length) {
        await AsyncStorage.setItem(
          DELETED_ITEMS_KEY,
          JSON.stringify(validItems)
        );
      }

      return validItems;
    } catch (error) {
      console.error('Error getting deleted items:', error);
      return [];
    }
  }

  static async clearDeletedItems(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DELETED_ITEMS_KEY);
      console.log('Cleared all deleted items');
    } catch (error) {
      console.error('Error clearing deleted items:', error);
    }
  }

  static async restoreItem(itemId: string): Promise<boolean> {
    try {
      const items = await this.getDeletedItems();
      const filteredItems = items.filter((item) => item.asset.id !== itemId);
      
      await AsyncStorage.setItem(
        DELETED_ITEMS_KEY,
        JSON.stringify(filteredItems)
      );
      
      console.log(`Restored item ${itemId}`);
      return true;
    } catch (error) {
      console.error('Error restoring item:', error);
      return false;
    }
  }

  static getDaysRemaining(deletedAt: number): number {
    const now = Date.now();
    const elapsed = now - deletedAt;
    const remaining = THIRTY_DAYS_MS - elapsed;
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  }
}
