import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

export const isNative = Capacitor.isNativePlatform();

/**
 * Configure and update Android / iOS native status bar to match active theme
 */
export async function updateNativeStatusBar(theme: 'light' | 'dark'): Promise<void> {
  if (!isNative) return;
  try {
    if (theme === 'light') {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#f6f5f2' });
    } else {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0a0a0c' });
    }
  } catch (err) {
    console.debug('StatusBar adjustment error:', err);
  }
}

/**
 * Native Haptic Feedback triggers
 */
export async function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' | 'selection' = 'light'): Promise<void> {
  if (!isNative) return;
  try {
    switch (type) {
      case 'light':
        await Haptics.impact({ style: ImpactStyle.Light });
        break;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'selection':
        await Haptics.selectionStart();
        break;
    }
  } catch (err) {
    console.debug('Haptics trigger error:', err);
  }
}

/**
 * Hide native splash screen once React UI has fully mounted
 */
export async function hideNativeSplash(): Promise<void> {
  if (!isNative) return;
  try {
    await SplashScreen.hide();
  } catch (err) {
    console.debug('SplashScreen hide error:', err);
  }
}

/**
 * Register hardware back button listener for Android
 */
export function registerBackButtonHandler(
  handler: () => boolean | Promise<boolean>
): () => void {
  if (!isNative) return () => {};

  const listenerPromise = App.addListener('backButton', async (event) => {
    // If handler returns true, it handled the back action (e.g. closed a modal)
    const handled = await handler();
    if (!handled && !event.canGoBack) {
      // Minimize app if at root
      try {
        await App.minimizeApp();
      } catch {
        await App.exitApp();
      }
    }
  });

  return () => {
    listenerPromise.then((handle) => handle.remove()).catch(() => {});
  };
}
