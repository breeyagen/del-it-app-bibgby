
export interface PhotoAsset {
  id: string;
  uri: string;
  filename: string;
  width: number;
  height: number;
  creationTime: number;
  modificationTime?: number;
  mediaType: 'photo' | 'video';
  duration?: number;
  mediaSubtypes?: string[];
}

export interface DuplicateGroup {
  id: string;
  assets: PhotoAsset[];
  bestQuality: PhotoAsset;
}

export interface ScanResult {
  duplicates: DuplicateGroup[];
  whatsappImages: PhotoAsset[];
  screenshots: PhotoAsset[];
  totalScanned: number;
}

export interface DeletedItem {
  asset: PhotoAsset;
  deletedAt: number;
  category: 'duplicate' | 'whatsapp' | 'screenshot';
}
