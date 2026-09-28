import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, get, update, onValue, off } from 'firebase/database';
import { StoreState } from '../types/store';
import { INITIAL_STORE_STATE } from './constants';

export const firebaseConfig = {
  apiKey: "AIzaSyBAYjxxM9v4m2F3_393iNhb3UmhYXUicys",
  authDomain: "portfolio-art-2d73d.firebaseapp.com",
  databaseURL: "https://portfolio-art-2d73d-default-rtdb.firebaseio.com",
  projectId: "portfolio-art-2d73d",
  storageBucket: "portfolio-art-2d73d.firebasestorage.app",
  messagingSenderId: "405478167539",
  appId: "1:405478167539:web:e1155b4ad7418b698c3886"
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const STORE_PATH = 'apexstore';

export async function fetchStoreFromFirebase(): Promise<StoreState> {
  const storeRef = ref(db, STORE_PATH);
  const snapshot = await get(storeRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    return {
      products: data.products || INITIAL_STORE_STATE.products,
      promos: data.promos || INITIAL_STORE_STATE.promos,
      orders: data.orders || INITIAL_STORE_STATE.orders,
      sections: data.sections || INITIAL_STORE_STATE.sections,
      gallery: data.gallery || INITIAL_STORE_STATE.gallery,
      galleryEnabled: data.galleryEnabled !== false,
      bannerImage: data.bannerImage !== undefined ? data.bannerImage : INITIAL_STORE_STATE.bannerImage,
      launchPool: data.launchPool || INITIAL_STORE_STATE.launchPool,
      nextLaunchProductId: data.nextLaunchProductId !== undefined ? data.nextLaunchProductId : INITIAL_STORE_STATE.nextLaunchProductId,
      launchConfig: {
        ...INITIAL_STORE_STATE.launchConfig,
        ...(data.launchConfig || {})
      },
      globalLayout: data.globalLayout || INITIAL_STORE_STATE.globalLayout,
      paymentMethods: {
        ...INITIAL_STORE_STATE.paymentMethods,
        ...(data.paymentMethods || {})
      },
      customPaymentMethods: data.customPaymentMethods || INITIAL_STORE_STATE.customPaymentMethods,
      notifications: data.notifications || INITIAL_STORE_STATE.notifications,
      transcriptSettings: {
        ...INITIAL_STORE_STATE.transcriptSettings,
        ...(data.transcriptSettings || {})
      },
      storeSettings: {
        ...INITIAL_STORE_STATE.storeSettings,
        ...(data.storeSettings || {})
      },
      announcementSettings: {
        ...INITIAL_STORE_STATE.announcementSettings,
        ...(data.announcementSettings || {})
      },
      updatedAt: data.updatedAt || Date.now()
    };
  } else {
    // If not existing yet, seed with initial store state
    await set(storeRef, INITIAL_STORE_STATE);
    return INITIAL_STORE_STATE;
  }
}

export async function syncStoreToFirebase(state: StoreState): Promise<void> {
  const storeRef = ref(db, STORE_PATH);
  await set(storeRef, {
    ...state,
    updatedAt: Date.now()
  });
}

export async function updateFirebasePartial(partial: Partial<StoreState>): Promise<void> {
  const storeRef = ref(db, STORE_PATH);
  await update(storeRef, {
    ...partial,
    updatedAt: Date.now()
  });
}

export function subscribeToFirebaseStore(onData: (state: StoreState) => void, onError?: (err: Error) => void) {
  const storeRef = ref(db, STORE_PATH);
  
  const unsubscribe = onValue(
    storeRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const merged: StoreState = {
          products: data.products || INITIAL_STORE_STATE.products,
          promos: data.promos || INITIAL_STORE_STATE.promos,
          orders: data.orders || INITIAL_STORE_STATE.orders,
          sections: data.sections || INITIAL_STORE_STATE.sections,
          gallery: data.gallery || INITIAL_STORE_STATE.gallery,
          galleryEnabled: data.galleryEnabled !== false,
          bannerImage: data.bannerImage !== undefined ? data.bannerImage : INITIAL_STORE_STATE.bannerImage,
          launchPool: data.launchPool || INITIAL_STORE_STATE.launchPool,
          nextLaunchProductId: data.nextLaunchProductId !== undefined ? data.nextLaunchProductId : INITIAL_STORE_STATE.nextLaunchProductId,
          launchConfig: {
            ...INITIAL_STORE_STATE.launchConfig,
            ...(data.launchConfig || {})
          },
          globalLayout: data.globalLayout || INITIAL_STORE_STATE.globalLayout,
          paymentMethods: {
            ...INITIAL_STORE_STATE.paymentMethods,
            ...(data.paymentMethods || {})
          },
          customPaymentMethods: data.customPaymentMethods || INITIAL_STORE_STATE.customPaymentMethods,
          notifications: data.notifications || INITIAL_STORE_STATE.notifications,
          transcriptSettings: {
            ...INITIAL_STORE_STATE.transcriptSettings,
            ...(data.transcriptSettings || {})
          },
          storeSettings: {
            ...INITIAL_STORE_STATE.storeSettings,
            ...(data.storeSettings || {})
          },
          announcementSettings: {
            ...INITIAL_STORE_STATE.announcementSettings,
            ...(data.announcementSettings || {})
          },
          updatedAt: data.updatedAt || Date.now()
        };
        onData(merged);
      }
    },
    (error) => {
      console.error("Firebase Realtime Database subscription error:", error);
      if (onError) onError(error);
    }
  );

  return () => {
    off(storeRef);
  };
}
