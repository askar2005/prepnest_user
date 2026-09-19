import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Modal & Overlay handler stack
const modalHandlers: Array<() => void> = [];

/**
 * Register a modal/drawer close callback.
 * When Android Back is pressed, the top-most registered modal handler is executed first.
 */
export function registerModalHandler(onClose: () => void): () => void {
  modalHandlers.push(onClose);
  return () => {
    const idx = modalHandlers.lastIndexOf(onClose);
    if (idx !== -1) {
      modalHandlers.splice(idx, 1);
    }
  };
}

/**
 * Hook to register a modal/drawer with Android Back button handling.
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const unregister = registerModalHandler(() => {
      onCloseRef.current();
    });
    return unregister;
  }, [isOpen]);
}

/**
 * Pops and executes the top-most registered modal handler if available.
 * Returns true if a modal was closed, false otherwise.
 */
export function popAndCloseModal(): boolean {
  if (modalHandlers.length > 0) {
    const handler = modalHandlers.pop();
    if (handler) {
      try {
        handler();
      } catch (err) {
        console.error('[BackButton] Error executing modal close handler:', err);
      }
      return true;
    }
  }
  return false;
}

/**
 * Check if running inside native Android / Capacitor environment.
 */
export function isCapacitorAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android';
}

// Track whether listener is already registered to avoid duplicates
let isListenerRegistered = false;

/**
 * Custom React Hook to manage Android hardware/gesture Back button navigation.
 * Should be mounted inside <AppRouter /> wrapped by <BrowserRouter>.
 */
export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);

  navigateRef.current = navigate;
  locationRef.current = location;

  useEffect(() => {
    if (!isCapacitorAndroid() || isListenerRegistered) return;

    isListenerRegistered = true;
    let listenerHandle: any = null;

    const setupListener = async () => {
      try {
        listenerHandle = await App.addListener('backButton', (event) => {
          console.log('[BackButton Event] Android back pressed, event:', event);

          // 1. Check if any dismissible modal or drawer is open
          if (popAndCloseModal()) {
            console.log('[BackButton] Closed active modal/drawer.');
            return;
          }

          // 2. Check current path and history state
          const currentPath = locationRef.current.pathname;
          const historyIdx = (window.history.state && typeof window.history.state.idx === 'number')
            ? window.history.state.idx
            : 0;

          const isRootPath = currentPath === '/' || currentPath === '/login';

          // If on child page and history index > 0, navigate back in React Router history
          if (!isRootPath && historyIdx > 0) {
            console.log(`[BackButton] Navigating back from child route (${currentPath}), history index: ${historyIdx}`);
            navigateRef.current(-1);
            return;
          }

          // If on a child page with no history state or history index is 0, navigate to '/' root
          if (!isRootPath && historyIdx === 0) {
            console.log(`[BackButton] Child route (${currentPath}) with no prior history, navigating to root /`);
            navigateRef.current('/', { replace: true });
            return;
          }

          // If on root path ('/' or '/login'), allow normal Android app exit
          console.log('[BackButton] At root path, exiting app.');
          App.exitApp();
        });
      } catch (err) {
        console.error('[BackButton] Failed to add listener:', err);
      }
    };

    setupListener();

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
        isListenerRegistered = false;
      }
    };
  }, []);
}
