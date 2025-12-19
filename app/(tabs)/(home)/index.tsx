
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { PhotoScanner } from '@/utils/photoScanner';
import { ScanResult } from '@/types/photo';

export default function HomeScreen() {
  const router = useRouter();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);

  useEffect(() => {
    console.log('Permission status:', permissionResponse?.status);
  }, [permissionResponse]);

  const handleAgreeToTerms = () => {
    setHasAgreedToTerms(true);
  };

  const handleRequestPermission = async () => {
    try {
      console.log('Requesting media library permission...');
      const result = await requestPermission();
      console.log('Permission result:', result);
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const handleScanPhotos = async () => {
    if (permissionResponse?.status !== 'granted') {
      console.log('Permission not granted, requesting...');
      await handleRequestPermission();
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setScanMessage('Starting scan...');

    try {
      const result = await PhotoScanner.scanPhotos(
        (progress, message) => {
          setScanProgress(progress);
          setScanMessage(message);
        }
      );

      setScanResult(result);
      console.log('Scan complete:', result);
    } catch (error) {
      console.error('Error scanning photos:', error);
      setScanMessage('Error scanning photos. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const navigateToCategory = (category: 'duplicates' | 'whatsapp' | 'screenshots') => {
    if (!scanResult) return;
    
    router.push({
      pathname: '/(tabs)/(home)/category',
      params: { 
        category,
        data: JSON.stringify(scanResult),
      },
    });
  };

  if (!hasAgreedToTerms) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeContainer}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="trash.circle.fill"
              android_material_icon_name="delete"
              size={80}
              color={colors.primary}
            />
          </View>

          <Text style={commonStyles.title}>Welcome to Del It</Text>
          
          <Text style={[commonStyles.text, styles.welcomeText]}>
            A privacy-first photo cleanup app that helps you safely identify and delete unwanted photos from your phone.
          </Text>

          <View style={styles.featureCard}>
            <View style={styles.featureRow}>
              <IconSymbol
                ios_icon_name="checkmark.shield.fill"
                android_material_icon_name="verified_user"
                size={24}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>100% Private - All processing happens on your device</Text>
            </View>
            
            <View style={styles.featureRow}>
              <IconSymbol
                ios_icon_name="hand.raised.fill"
                android_material_icon_name="back_hand"
                size={24}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>Manual Control - Nothing deleted without your approval</Text>
            </View>
            
            <View style={styles.featureRow}>
              <IconSymbol
                ios_icon_name="clock.arrow.circlepath"
                android_material_icon_name="restore"
                size={24}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>30-Day Recovery - Restore deleted items anytime</Text>
            </View>
          </View>

          <View style={styles.safetyCard}>
            <Text style={styles.safetyTitle}>Safety Guarantees</Text>
            <Text style={styles.safetyText}>
              - Never deletes anything automatically{'\n'}
              - Never deletes favorites or system files{'\n'}
              - Always requires your confirmation{'\n'}
              - Always shows a preview before deletion
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={buttonStyles.primaryButton}
              onPress={handleAgreeToTerms}
            >
              <Text style={buttonStyles.primaryButtonText}>I Agree - Continue</Text>
            </TouchableOpacity>

            <Text style={[commonStyles.textSecondary, styles.termsText]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (permissionResponse?.status !== 'granted') {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <IconSymbol
            ios_icon_name="photo.on.rectangle"
            android_material_icon_name="photo_library"
            size={80}
            color={colors.primary}
          />

          <Text style={commonStyles.title}>Photo Access Needed</Text>
          
          <Text style={[commonStyles.text, styles.permissionText]}>
            Del It needs access to your photos to help you find and remove duplicates, WhatsApp images, and screenshots.
          </Text>

          <View style={styles.permissionCard}>
            <Text style={styles.permissionCardTitle}>Why we need this permission:</Text>
            <Text style={styles.permissionCardText}>
              - Scan your photo library for duplicates{'\n'}
              - Identify WhatsApp images{'\n'}
              - Find old screenshots{'\n'}
              - Allow you to safely delete unwanted photos
            </Text>
          </View>

          <View style={styles.privacyNote}>
            <IconSymbol
              ios_icon_name="lock.shield.fill"
              android_material_icon_name="security"
              size={24}
              color={colors.accent}
            />
            <Text style={styles.privacyNoteText}>
              All scanning happens on your device. Your photos never leave your phone.
            </Text>
          </View>

          <TouchableOpacity
            style={buttonStyles.primaryButton}
            onPress={handleRequestPermission}
          >
            <Text style={buttonStyles.primaryButtonText}>Grant Photo Access</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.mainContainer}>
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="sparkles"
            android_material_icon_name="auto_awesome"
            size={40}
            color={colors.primary}
          />
          <Text style={commonStyles.title}>Del It</Text>
          <Text style={commonStyles.textSecondary}>
            Clean up your photo library safely
          </Text>
        </View>

        {!scanResult && !isScanning && (
          <View style={styles.scanPrompt}>
            <IconSymbol
              ios_icon_name="magnifyingglass.circle.fill"
              android_material_icon_name="search"
              size={60}
              color={colors.primary}
            />
            <Text style={[commonStyles.text, styles.scanPromptText]}>
              Tap the button below to scan your photos and find items you can safely delete.
            </Text>
          </View>
        )}

        {isScanning && (
          <View style={styles.scanningContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.scanningText}>{scanMessage}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${scanProgress * 100}%` }]} />
            </View>
            <Text style={commonStyles.textSecondary}>
              {Math.round(scanProgress * 100)}% complete
            </Text>
          </View>
        )}

        {scanResult && !isScanning && (
          <View style={styles.resultsContainer}>
            <Text style={commonStyles.subtitle}>Scan Results</Text>
            <Text style={commonStyles.textSecondary}>
              Scanned {scanResult.totalScanned} photos
            </Text>

            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => navigateToCategory('duplicates')}
            >
              <View style={styles.categoryHeader}>
                <IconSymbol
                  ios_icon_name="doc.on.doc.fill"
                  android_material_icon_name="content_copy"
                  size={32}
                  color={colors.primary}
                />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>Duplicate Photos</Text>
                  <Text style={styles.categoryCount}>
                    {scanResult.duplicates.length} groups found
                  </Text>
                </View>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => navigateToCategory('whatsapp')}
            >
              <View style={styles.categoryHeader}>
                <IconSymbol
                  ios_icon_name="message.fill"
                  android_material_icon_name="chat"
                  size={32}
                  color={colors.secondary}
                />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>WhatsApp Images</Text>
                  <Text style={styles.categoryCount}>
                    {scanResult.whatsappImages.length} images found
                  </Text>
                </View>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.categoryCard}
              onPress={() => navigateToCategory('screenshots')}
            >
              <View style={styles.categoryHeader}>
                <IconSymbol
                  ios_icon_name="camera.viewfinder"
                  android_material_icon_name="screenshot"
                  size={32}
                  color={colors.accent}
                />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>Screenshots</Text>
                  <Text style={styles.categoryCount}>
                    {scanResult.screenshots.length} screenshots found
                  </Text>
                </View>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttonStyles.secondaryButton, styles.rescanButton]}
              onPress={handleScanPhotos}
            >
              <Text style={buttonStyles.secondaryButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isScanning && (
          <View style={styles.actionContainer}>
            {!scanResult && (
              <TouchableOpacity
                style={buttonStyles.primaryButton}
                onPress={handleScanPhotos}
              >
                <Text style={buttonStyles.primaryButtonText}>Scan Photos</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 48 : 20,
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  welcomeText: {
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  safetyCard: {
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
  },
  termsText: {
    marginTop: 12,
    fontSize: 12,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    marginVertical: 20,
  },
  permissionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  permissionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  permissionCardText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  privacyNoteText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  mainContainer: {
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scanPrompt: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    width: '100%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  scanPromptText: {
    marginTop: 16,
  },
  scanningContainer: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 32,
    width: '100%',
    marginBottom: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  scanningText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: 16,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.highlight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  resultsContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginTop: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryInfo: {
    marginLeft: 16,
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  rescanButton: {
    marginTop: 20,
    width: '100%',
  },
  actionContainer: {
    width: '100%',
  },
});
