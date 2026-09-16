import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

let isInitialized = false;
let initPromise: Promise<void> | null = null;

// Official Google AdMob Test Banner Unit ID for Android
export const TEST_BANNER_AD_UNIT_ID = 'ca-app-pub-3940256099942544/6300978111';

// Production AdMob Banner Unit ID for Kathir Academy
export const PROD_BANNER_AD_UNIT_ID = 'ca-app-pub-1449197008846085/5165343483';

/**
 * Returns true if test ads should be forced.
 * Uses test ads in DEV environment or when VITE_ADMOB_TEST_MODE is true.
 */
export function isAdMobTestMode(): boolean {
  if (import.meta.env.DEV) return true;
  if (import.meta.env.VITE_ADMOB_TEST_MODE === 'false') return false;
  return true; // Safe default for dev/debug builds
}

/**
 * Retrieves the appropriate Banner Ad Unit ID (Test vs Production).
 */
export function getBannerAdUnitId(): string {
  if (isAdMobTestMode()) {
    return TEST_BANNER_AD_UNIT_ID;
  }
  return import.meta.env.VITE_ADMOB_BANNER_ID || PROD_BANNER_AD_UNIT_ID;
}

/**
 * Safely initializes the Google Mobile Ads (AdMob) SDK on native Android devices.
 */
export async function initAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await AdMob.initialize({
        initializeForTesting: isAdMobTestMode(),
      });
      isInitialized = true;
    } catch (err) {
      console.warn('[AdMob Init Error]', err);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}
