
import * as MediaLibrary from 'expo-media-library';
import { PhotoAsset, DuplicateGroup, ScanResult } from '@/types/photo';

export class PhotoScanner {
  private static readonly WHATSAPP_PATTERNS = [
    'WhatsApp',
    'WA_',
    '.Statuses',
  ];

  private static readonly SCREENSHOT_SUBTYPES = ['screenshot'];

  static async scanPhotos(
    onProgress?: (progress: number, message: string) => void
  ): Promise<ScanResult> {
    try {
      console.log('Starting photo scan...');
      
      // Get all photos
      onProgress?.(0.1, 'Loading photos...');
      const assets = await this.getAllPhotos();
      console.log(`Found ${assets.length} total photos`);

      onProgress?.(0.3, 'Analyzing photos...');
      
      // Find duplicates
      const duplicates = await this.findDuplicates(assets);
      console.log(`Found ${duplicates.length} duplicate groups`);

      onProgress?.(0.6, 'Finding WhatsApp images...');
      
      // Find WhatsApp images
      const whatsappImages = this.findWhatsAppImages(assets);
      console.log(`Found ${whatsappImages.length} WhatsApp images`);

      onProgress?.(0.8, 'Finding screenshots...');
      
      // Find screenshots
      const screenshots = this.findScreenshots(assets);
      console.log(`Found ${screenshots.length} screenshots`);

      onProgress?.(1.0, 'Scan complete!');

      return {
        duplicates,
        whatsappImages,
        screenshots,
        totalScanned: assets.length,
      };
    } catch (error) {
      console.error('Error scanning photos:', error);
      throw error;
    }
  }

  private static async getAllPhotos(): Promise<PhotoAsset[]> {
    const assets: PhotoAsset[] = [];
    let hasNextPage = true;
    let endCursor: string | undefined;

    while (hasNextPage) {
      const result = await MediaLibrary.getAssetsAsync({
        first: 100,
        after: endCursor,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const mappedAssets = result.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        filename: asset.filename,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
        modificationTime: asset.modificationTime,
        mediaType: asset.mediaType as 'photo' | 'video',
        duration: asset.duration,
        mediaSubtypes: asset.mediaSubtypes,
      }));

      assets.push(...mappedAssets);
      hasNextPage = result.hasNextPage;
      endCursor = result.endCursor;
    }

    return assets;
  }

  private static async findDuplicates(
    assets: PhotoAsset[]
  ): Promise<DuplicateGroup[]> {
    const groups: Map<string, PhotoAsset[]> = new Map();

    // Group by filename (simple duplicate detection)
    for (const asset of assets) {
      const baseFilename = this.getBaseFilename(asset.filename);
      const existing = groups.get(baseFilename) || [];
      existing.push(asset);
      groups.set(baseFilename, existing);
    }

    // Filter groups with more than one asset
    const duplicateGroups: DuplicateGroup[] = [];
    let groupId = 0;

    for (const [filename, groupAssets] of groups.entries()) {
      if (groupAssets.length > 1) {
        // Find best quality (largest file)
        const bestQuality = groupAssets.reduce((best, current) => {
          const bestSize = best.width * best.height;
          const currentSize = current.width * current.height;
          return currentSize > bestSize ? current : best;
        });

        duplicateGroups.push({
          id: `dup_${groupId++}`,
          assets: groupAssets,
          bestQuality,
        });
      }
    }

    return duplicateGroups;
  }

  private static getBaseFilename(filename: string): string {
    // Remove common duplicate suffixes like (1), (2), _copy, etc.
    return filename
      .replace(/\s*\(\d+\)\s*/g, '')
      .replace(/\s*_copy\s*/gi, '')
      .replace(/\s*-\s*copy\s*/gi, '')
      .toLowerCase();
  }

  private static findWhatsAppImages(assets: PhotoAsset[]): PhotoAsset[] {
    return assets.filter((asset) => {
      const filename = asset.filename.toLowerCase();
      return this.WHATSAPP_PATTERNS.some((pattern) =>
        filename.includes(pattern.toLowerCase())
      );
    });
  }

  private static findScreenshots(assets: PhotoAsset[]): PhotoAsset[] {
    return assets.filter((asset) => {
      // Check media subtypes for screenshot
      if (asset.mediaSubtypes?.includes('screenshot')) {
        return true;
      }
      
      // Fallback: check filename
      const filename = asset.filename.toLowerCase();
      return (
        filename.includes('screenshot') ||
        filename.includes('screen_shot') ||
        filename.includes('screen shot')
      );
    });
  }
}
