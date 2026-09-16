import React, { useEffect, useState } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
} from '@capacitor-community/admob';
import { initAdMob, getBannerAdUnitId, isAdMobTestMode } from '../lib/admob';

interface AdBannerProps {
  className?: string;
  position?: BannerAdPosition;
  margin?: number;
}

export const AdBanner: React.FC<AdBannerProps> = ({
  className = '',
  position = BannerAdPosition.BOTTOM_CENTER,
  margin = 0,
}) => {
  const [adLoaded, setAdLoaded] = useState(false);
  const [, setAdError] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    let isMounted = true;
    let loadedListener: PluginListenerHandle | null = null;
    let failedListener: PluginListenerHandle | null = null;

    const setupBanner = async () => {
      try {
        await initAdMob();
        if (!isMounted) return;

        const adId = getBannerAdUnitId();
        const isTesting = isAdMobTestMode();

        loadedListener = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          if (isMounted) {
            setAdLoaded(true);
            setAdError(null);
          }
        });

        failedListener = await AdMob.addListener(
          BannerAdPluginEvents.FailedToLoad,
          (err) => {
            console.warn('[AdMob Banner Load Failed]', err);
            if (isMounted) {
              setAdLoaded(false);
              setAdError(err?.message || 'Failed to load ad');
            }
          }
        );

        await AdMob.showBanner({
          adId,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position,
          margin,
          isTesting,
        });
      } catch (err: any) {
        console.warn('[AdMob Banner Exception]', err);
        if (isMounted) {
          setAdLoaded(false);
          setAdError(err?.message || 'AdMob plugin error');
        }
      }
    };

    setupBanner();

    return () => {
      isMounted = false;
      if (loadedListener) loadedListener.remove();
      if (failedListener) failedListener.remove();
      if (isNative) {
        AdMob.removeBanner().catch(() => {});
      }
    };
  }, [isNative, position, margin]);

  // Web fallback: non-disruptive card container for web previews
  if (!isNative) {
    return (
      <div
        className={`w-full max-w-4xl mx-auto my-4 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 select-none ${className}`}
      >
        <span className="font-semibold text-slate-500">Kathir Academy Mobile Ads</span>
        <p className="text-[11px] text-slate-400 mt-0.5">
          AdMob Banner Ads will render here in the Android Mobile App.
        </p>
      </div>
    );
  }

  // Native layout spacer so native bottom overlay doesn't obstruct UI buttons
  return (
    <div
      className={`w-full transition-all duration-300 ${
        adLoaded ? 'h-[52px]' : 'h-0'
      } ${className}`}
      aria-hidden="true"
    />
  );
};
