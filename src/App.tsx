import React, { useState, useEffect, useRef } from 'react';
import {
  StoreState,
  Product,
  Promo,
  Order,
  OrderStatus,
  Section,
  LaunchPoolProduct,
  LaunchConfig,
  ProductLayoutType,
  CustomPaymentMethod,
  NotificationItem,
  TranscriptSettings,
  StoreSettings,
  AnnouncementSettings
} from './types/store';
import { INITIAL_STORE_STATE } from './lib/constants';
import {
  fetchStoreFromFirebase,
  syncStoreToFirebase,
  updateFirebasePartial,
  subscribeToFirebaseStore
} from './lib/firebase';
import { Sidebar, TabKey } from './components/Sidebar';
import { Header } from './components/Header';

// Tabs
import { DashboardTab } from './components/tabs/DashboardTab';
import { ProductsTab } from './components/tabs/ProductsTab';
import { HeroImagesTab } from './components/tabs/HeroImagesTab';
import { SectionsTab } from './components/tabs/SectionsTab';
import { PromosTab } from './components/tabs/PromosTab';
import { OrdersTab } from './components/tabs/OrdersTab';
import { NotificationsTab } from './components/tabs/NotificationsTab';
import { ReceiptTab } from './components/tabs/ReceiptTab';
import { LaunchControlTab } from './components/tabs/LaunchControlTab';
import { LayoutTab } from './components/tabs/LayoutTab';
import { PaymentsTab } from './components/tabs/PaymentsTab';
import { StoreSettingsTab } from './components/tabs/StoreSettingsTab';
import { AnnouncementsTab } from './components/tabs/AnnouncementsTab';

// Modals
import { ProductModal } from './components/modals/ProductModal';
import { PromoModal } from './components/modals/PromoModal';
import { SectionModal } from './components/modals/SectionModal';
import { OrderDetailModal } from './components/modals/OrderDetailModal';
import { PaymentMethodModal } from './components/modals/PaymentMethodModal';
import { AddToPoolModal } from './components/modals/AddToPoolModal';
import { PoolPickerModal } from './components/modals/PoolPickerModal';
import { StorePreviewModal } from './components/modals/StorePreviewModal';

interface Toast {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [state, setState] = useState<StoreState>(INITIAL_STORE_STATE);
  const [currentTab, setCurrentTab] = useState<TabKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>('saving');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [editingPromoIndex, setEditingPromoIndex] = useState<number | null>(null);

  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<CustomPaymentMethod | null>(null);
  const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null);

  const [addToPoolModalOpen, setAddToPoolModalOpen] = useState(false);
  const [editingPoolProduct, setEditingPoolProduct] = useState<LaunchPoolProduct | null>(null);
  const [editingPoolIndex, setEditingPoolIndex] = useState<number | null>(null);

  const [poolPickerModalOpen, setPoolPickerModalOpen] = useState(false);
  const [storePreviewModalOpen, setStorePreviewModalOpen] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Toast Helper
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // 1. Initial Load & Firebase Realtime Subscription
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        setSyncStatus('saving');
        const initialData = await fetchStoreFromFirebase();
        if (isMounted) {
          setState(initialData);
          setSyncStatus('synced');
        }
      } catch (err) {
        console.error('Initial Firebase load error:', err);
        if (isMounted) setSyncStatus('offline');
      }
    }

    init();

    // Subscribe to live changes
    const unsubscribe = subscribeToFirebaseStore(
      (remoteState) => {
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            ...remoteState,
            launchConfig: {
              ...prev.launchConfig,
              ...remoteState.launchConfig,
              // Keep local timer tick if running
              secondsLeft: prev.launchConfig.isRunning
                ? prev.launchConfig.secondsLeft
                : (remoteState.launchConfig?.secondsLeft ?? prev.launchConfig.secondsLeft)
            }
          }));
          setSyncStatus('synced');
        }
      },
      (err) => {
        console.error('Firebase subscription error:', err);
        if (isMounted) setSyncStatus('offline');
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync helper that updates state and writes to Firebase
  const applyStateUpdate = async (updater: (prev: StoreState) => StoreState, successMsg?: string) => {
    const newState = updater(stateRef.current);
    setState(newState);
    setSyncStatus('saving');

    try {
      await syncStoreToFirebase(newState);
      setSyncStatus('synced');
      if (successMsg) showToast(successMsg, 'success');
    } catch (err) {
      console.error('Firebase save error:', err);
      setSyncStatus('error');
      showToast('Firebase sync failed. Retrying in background...', 'error');
    }
  };

  // Force sync
  const handleForceSync = async () => {
    setSyncStatus('saving');
    try {
      await syncStoreToFirebase(stateRef.current);
      setSyncStatus('synced');
      showToast('All records synced with Firebase!');
    } catch (e) {
      setSyncStatus('error');
      showToast('Sync error', 'error');
    }
  };

  // 2. Launch Countdown Timer Engine
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (state.launchConfig.isRunning) {
      timer = setInterval(() => {
        setState((prev) => {
          const currentLeft = prev.launchConfig.secondsLeft;
          if (currentLeft <= 1) {
            // Timer expired!
            if (prev.launchConfig.autoLaunch) {
              // Trigger auto-launch
              handleDropNextProduct();
            }
            return {
              ...prev,
              launchConfig: {
                ...prev.launchConfig,
                isRunning: false,
                secondsLeft: prev.launchConfig.totalSeconds
              }
            };
          }
          return {
            ...prev,
            launchConfig: {
              ...prev.launchConfig,
              secondsLeft: currentLeft - 1
            }
          };
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state.launchConfig.isRunning]);

  // Product Actions
  const handleSaveProduct = (productData: Partial<Product>, editId?: number) => {
    applyStateUpdate((prev) => {
      if (editId) {
        return {
          ...prev,
          products: prev.products.map((p) => (p.id === editId ? ({ ...p, ...productData } as Product) : p))
        };
      } else {
        const nextId = prev.products.length > 0 ? Math.max(...prev.products.map((p) => p.id)) + 1 : 1;
        const newProduct: Product = {
          id: nextId,
          name: productData.name || 'New Product',
          category: productData.category || 'Audio',
          price: productData.price || 0,
          oldPrice: productData.oldPrice || null,
          rating: productData.rating || 4.5,
          reviews: productData.reviews || 0,
          badge: productData.badge || null,
          stock: productData.stock || 10,
          public: productData.public !== false,
          image: productData.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
          description: productData.description || ''
        };
        return {
          ...prev,
          products: [newProduct, ...prev.products]
        };
      }
    }, editId ? 'Product updated' : 'Product added successfully');
    setProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: number) => {
    if (!window.confirm('Delete this product permanently?')) return;
    applyStateUpdate(
      (prev) => ({
        ...prev,
        products: prev.products.filter((p) => p.id !== productId)
      }),
      'Product deleted'
    );
  };

  const handleToggleProductPublic = (productId: number) => {
    applyStateUpdate((prev) => {
      const p = prev.products.find((x) => x.id === productId);
      const isPublic = p?.public !== false;
      return {
        ...prev,
        products: prev.products.map((item) =>
          item.id === productId ? { ...item, public: !isPublic } : item
        )
      };
    }, 'Product visibility updated');
  };

  // Hero Banner & Gallery Actions
  const handleSaveBanner = (url: string) => {
    applyStateUpdate(
      (prev) => ({ ...prev, bannerImage: url }),
      'Storefront banner saved'
    );
  };

  const handleClearBanner = () => {
    applyStateUpdate(
      (prev) => ({ ...prev, bannerImage: null }),
      'Banner removed'
    );
  };

  const handleToggleGallery = (enabled: boolean) => {
    applyStateUpdate(
      (prev) => ({ ...prev, galleryEnabled: enabled }),
      `Gallery slider ${enabled ? 'enabled' : 'disabled'}`
    );
  };

  const handleAddGalleryImage = (url: string) => {
    applyStateUpdate(
      (prev) => ({ ...prev, gallery: [...prev.gallery, url] }),
      'Slide added to gallery'
    );
  };

  const handleRemoveGalleryImage = (index: number) => {
    applyStateUpdate(
      (prev) => ({
        ...prev,
        gallery: prev.gallery.filter((_, i) => i !== index)
      }),
      'Slide removed'
    );
  };

  // Sections Actions
  const handleSaveSection = (sectionData: Partial<Section>, editId?: number) => {
    applyStateUpdate((prev) => {
      if (editId) {
        return {
          ...prev,
          sections: prev.sections.map((s) => (s.id === editId ? ({ ...s, ...sectionData } as Section) : s))
        };
      } else {
        const nextId = prev.sections.length > 0 ? Math.max(...prev.sections.map((s) => s.id)) + 1 : 1;
        const newSec: Section = {
          id: nextId,
          title: sectionData.title || 'NEW SECTION',
          filter: sectionData.filter || 'all',
          layout: sectionData.layout || '',
          order: sectionData.order || prev.sections.length + 1,
          active: sectionData.active !== false
        };
        return {
          ...prev,
          sections: [...prev.sections, newSec]
        };
      }
    }, editId ? 'Section updated' : 'New section added');
    setSectionModalOpen(false);
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: number) => {
    if (!window.confirm('Delete this homepage section?')) return;
    applyStateUpdate((prev) => {
      const remaining = prev.sections.filter((s) => s.id !== sectionId);
      return {
        ...prev,
        sections: remaining.map((s, idx) => ({ ...s, order: idx + 1 }))
      };
    }, 'Section deleted');
  };

  const handleToggleSectionActive = (sectionId: number, active: boolean) => {
    applyStateUpdate((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, active } : s))
    }));
  };

  const handleReorderSections = (newSections: Section[]) => {
    applyStateUpdate(
      (prev) => ({ ...prev, sections: newSections }),
      'Sections reordered'
    );
  };

  const handleResetSections = () => {
    if (!window.confirm('Reset homepage sections to default?')) return;
    applyStateUpdate(
      (prev) => ({ ...prev, sections: INITIAL_STORE_STATE.sections }),
      'Sections reset to default'
    );
  };

  // Promos Actions
  const handleSavePromo = (promo: Promo, editIndex: number | null) => {
    applyStateUpdate((prev) => {
      if (editIndex !== null && editIndex >= 0) {
        const updated = [...prev.promos];
        updated[editIndex] = promo;
        return { ...prev, promos: updated };
      } else {
        return { ...prev, promos: [promo, ...prev.promos] };
      }
    }, editIndex !== null ? 'Promo updated' : 'Promo code created');
    setPromoModalOpen(false);
    setEditingPromo(null);
    setEditingPromoIndex(null);
  };

  const handleDeletePromo = (index: number) => {
    if (!window.confirm('Delete this promo code?')) return;
    applyStateUpdate(
      (prev) => ({
        ...prev,
        promos: prev.promos.filter((_, i) => i !== index)
      }),
      'Promo deleted'
    );
  };

  const handleTogglePromoActive = (index: number, active: boolean) => {
    applyStateUpdate((prev) => {
      const updated = [...prev.promos];
      if (updated[index]) {
        updated[index] = { ...updated[index], active };
      }
      return { ...prev, promos: updated };
    });
  };

  // Orders Actions
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    applyStateUpdate(
      (prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === orderId ? { ...o, status } : o))
      }),
      `Order #${orderId} marked ${status}`
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!window.confirm(`Delete order #${orderId}?`)) return;
    applyStateUpdate(
      (prev) => ({
        ...prev,
        orders: prev.orders.filter((o) => o.id !== orderId)
      }),
      'Order record deleted'
    );
  };

  const handleClearAllOrders = () => {
    if (!window.confirm('Are you sure you want to delete ALL orders?')) return;
    applyStateUpdate(
      (prev) => ({ ...prev, orders: [] }),
      'All orders cleared'
    );
  };

  // Notifications Actions
  const handleSendNotification = (notifData: Omit<NotificationItem, 'id' | 'time'>) => {
    const newNotif: NotificationItem = {
      ...notifData,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      time: Date.now()
    };
    applyStateUpdate(
      (prev) => ({
        ...prev,
        notifications: [newNotif, ...prev.notifications].slice(0, 100)
      }),
      '🚀 Broadcast sent to all users!'
    );
  };

  const handleDeleteNotification = (id: string) => {
    applyStateUpdate(
      (prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n.id !== id)
      }),
      'Notification deleted'
    );
  };

  const handleClearAllNotifications = () => {
    if (!window.confirm('Clear all notification history?')) return;
    applyStateUpdate(
      (prev) => ({ ...prev, notifications: [] }),
      'History cleared'
    );
  };

  // Receipt Settings
  const handleSaveReceiptSettings = (newSettings: TranscriptSettings) => {
    applyStateUpdate(
      (prev) => ({ ...prev, transcriptSettings: newSettings }),
      'Receipt settings saved'
    );
  };

  const handleResetReceiptSettings = () => {
    if (!window.confirm('Reset receipt settings to defaults?')) return;
    applyStateUpdate(
      (prev) => ({ ...prev, transcriptSettings: INITIAL_STORE_STATE.transcriptSettings }),
      'Receipt reset to defaults'
    );
  };

  // Launch Control Actions
  const handleUpdateLaunchConfig = (partial: Partial<LaunchConfig>) => {
    applyStateUpdate((prev) => ({
      ...prev,
      launchConfig: { ...prev.launchConfig, ...partial }
    }));
  };

  const handleSelectNextProduct = (productId: string | number) => {
    applyStateUpdate(
      (prev) => ({ ...prev, nextLaunchProductId: productId }),
      'Next launch item selected'
    );
    setPoolPickerModalOpen(false);
  };

  const handleSavePoolProduct = (data: Partial<LaunchPoolProduct>, editIndex: number | null) => {
    applyStateUpdate((prev) => {
      if (editIndex !== null && editIndex >= 0) {
        const updated = [...prev.launchPool];
        updated[editIndex] = { ...updated[editIndex], ...data } as LaunchPoolProduct;
        return { ...prev, launchPool: updated };
      } else {
        const newPoolItem: LaunchPoolProduct = {
          id: 'lp_' + Date.now(),
          name: data.name || 'Drop Product',
          category: data.category || 'Audio',
          price: data.price || 0,
          oldPrice: data.oldPrice || null,
          stock: data.stock || 20,
          rating: 4.9,
          reviews: 0,
          badge: 'NEW',
          image: data.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
          description: data.description || ''
        };
        const newPool = [...prev.launchPool, newPoolItem];
        return {
          ...prev,
          launchPool: newPool,
          nextLaunchProductId: prev.nextLaunchProductId || newPoolItem.id
        };
      }
    }, editIndex !== null ? 'Pool item updated' : 'Added to launch pool');
    setAddToPoolModalOpen(false);
    setEditingPoolProduct(null);
    setEditingPoolIndex(null);
  };

  const handleDeletePoolProduct = (index: number) => {
    if (!window.confirm('Remove product from launch pool?')) return;
    applyStateUpdate((prev) => {
      const removed = prev.launchPool[index];
      const remaining = prev.launchPool.filter((_, i) => i !== index);
      return {
        ...prev,
        launchPool: remaining,
        nextLaunchProductId: prev.nextLaunchProductId === removed?.id ? remaining[0]?.id || null : prev.nextLaunchProductId
      };
    }, 'Product removed from pool');
  };

  const handleMovePoolProductToNext = (index: number) => {
    if (index === 0) return;
    applyStateUpdate((prev) => {
      const pool = [...prev.launchPool];
      const [item] = pool.splice(index, 1);
      pool.unshift(item);
      return {
        ...prev,
        launchPool: pool,
        nextLaunchProductId: item.id
      };
    }, 'Moved to front of queue');
  };

  const handleDropNextProduct = () => {
    const pool = stateRef.current.launchPool;
    const nextId = stateRef.current.nextLaunchProductId;
    const product = pool.find((p) => p.id === nextId) || pool[0];

    if (!product) {
      showToast('Launch pool is empty', 'error');
      return;
    }

    applyStateUpdate((prev) => {
      const nextIdNum = prev.products.length > 0 ? Math.max(...prev.products.map((p) => p.id)) + 1 : 1;
      const newProduct: Product = {
        id: nextIdNum,
        name: product.name,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice,
        stock: product.stock,
        rating: product.rating || 4.9,
        reviews: product.reviews || 0,
        badge: 'NEW',
        image: product.image,
        description: product.description || '',
        public: prev.launchConfig.mode === 'public'
      };

      const updatedPool = prev.launchPool.filter((p) => p.id !== product.id);
      return {
        ...prev,
        products: [newProduct, ...prev.products],
        launchPool: updatedPool,
        nextLaunchProductId: updatedPool[0]?.id || null
      };
    }, `🚀 LAUNCHED: ${product.name}!`);
  };

  // Layout Actions
  const handleSelectGlobalLayout = (layout: ProductLayoutType) => {
    setState((prev) => ({ ...prev, globalLayout: layout }));
  };

  const handleSaveGlobalLayout = () => {
    applyStateUpdate(
      (prev) => ({ ...prev, globalLayout: prev.globalLayout }),
      'Global layout preference saved'
    );
  };

  const handleUpdateSectionLayout = (sectionId: number, layout: ProductLayoutType | '') => {
    applyStateUpdate(
      (prev) => ({
        ...prev,
        sections: prev.sections.map((s) => (s.id === sectionId ? { ...s, layout } : s))
      }),
      'Section layout updated'
    );
  };

  // Payment Methods Actions
  const handleSavePaymentMethods = (methods: any) => {
    applyStateUpdate(
      (prev) => ({ ...prev, paymentMethods: methods }),
      'Payment methods updated'
    );
  };

  const handleSaveCustomPayment = (data: Partial<CustomPaymentMethod>, editIndex: number | null) => {
    applyStateUpdate((prev) => {
      if (editIndex !== null && editIndex >= 0) {
        const updated = [...prev.customPaymentMethods];
        updated[editIndex] = { ...updated[editIndex], ...data } as CustomPaymentMethod;
        return { ...prev, customPaymentMethods: updated };
      } else {
        const nextId = prev.customPaymentMethods.length > 0 ? Math.max(...prev.customPaymentMethods.map((m) => m.id)) + 1 : 1;
        const newMethod: CustomPaymentMethod = {
          id: nextId,
          name: data.name || 'Custom Method',
          desc: data.desc || '',
          account: data.account || '',
          accountName: data.accountName || '',
          icon: data.icon || 'fa-wallet',
          color: data.color || 'emerald',
          active: data.active !== false
        };
        return {
          ...prev,
          customPaymentMethods: [...prev.customPaymentMethods, newMethod]
        };
      }
    }, editIndex !== null ? 'Method updated' : 'Custom payment method added');
    setPaymentMethodModalOpen(false);
    setEditingPaymentMethod(null);
    setEditingPaymentIndex(null);
  };

  const handleDeleteCustomPayment = (index: number) => {
    if (!window.confirm('Delete this custom payment method?')) return;
    applyStateUpdate(
      (prev) => ({
        ...prev,
        customPaymentMethods: prev.customPaymentMethods.filter((_, i) => i !== index)
      }),
      'Payment method deleted'
    );
  };

  const handleToggleCustomPayment = (index: number, active: boolean) => {
    applyStateUpdate((prev) => {
      const updated = [...prev.customPaymentMethods];
      if (updated[index]) {
        updated[index] = { ...updated[index], active };
      }
      return { ...prev, customPaymentMethods: updated };
    });
  };

  // Store & Announcement Settings
  const handleSaveStoreSettings = (newSettings: StoreSettings) => {
    applyStateUpdate(
      (prev) => ({ ...prev, storeSettings: newSettings }),
      'Store settings saved'
    );
  };

  const handleSaveAnnouncements = (newSettings: AnnouncementSettings) => {
    applyStateUpdate(
      (prev) => ({ ...prev, announcementSettings: newSettings }),
      'Announcement marquee settings saved'
    );
  };

  // Tab Titles and Icons lookup
  const tabMetadata: Record<TabKey, { title: string; icon: string }> = {
    dashboard: { title: 'Dashboard', icon: 'fa-chart-pie' },
    products: { title: 'Products Catalog', icon: 'fa-box' },
    heroimages: { title: 'Hero Images & Carousel', icon: 'fa-images' },
    categories: { title: 'Homepage Sections', icon: 'fa-layer-group' },
    promos: { title: 'Promo Codes', icon: 'fa-tags' },
    orders: { title: 'Orders & Payments', icon: 'fa-receipt' },
    notifications: { title: 'Notification Broadcasts', icon: 'fa-bell' },
    transcript: { title: 'Receipt & Transcript Editor', icon: 'fa-scroll' },
    launchpool: { title: 'Launch Control Center', icon: 'fa-rocket' },
    layout: { title: 'Storefront Layout & Display', icon: 'fa-table-columns' },
    payments: { title: 'Payment Gateways & Accounts', icon: 'fa-credit-card' },
    store: { title: 'Store Identity Settings', icon: 'fa-gear' },
    announcement: { title: 'Announcements & Marquee', icon: 'fa-bullhorn' }
  };

  const currentMeta = tabMetadata[currentTab] || tabMetadata.dashboard;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        counts={{
          products: state.products.length,
          sections: state.sections.length,
          promos: state.promos.length,
          orders: state.orders.length,
          notifications: state.notifications.length
        }}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        {/* Header */}
        <Header
          currentTab={currentTab}
          tabTitle={currentMeta.title}
          tabIcon={currentMeta.icon}
          syncStatus={syncStatus}
          onForceSync={handleForceSync}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Tab Views */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <DashboardTab
              state={state}
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenProductModal={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              onViewOrder={(order) => {
                setSelectedOrder(order);
                setOrderDetailOpen(true);
              }}
            />
          )}

          {currentTab === 'products' && (
            <ProductsTab
              products={state.products}
              onAddProduct={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setProductModalOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onTogglePublic={handleToggleProductPublic}
            />
          )}

          {currentTab === 'heroimages' && (
            <HeroImagesTab
              bannerImage={state.bannerImage}
              gallery={state.gallery}
              galleryEnabled={state.galleryEnabled}
              products={state.products}
              onSaveBanner={handleSaveBanner}
              onClearBanner={handleClearBanner}
              onToggleGallery={handleToggleGallery}
              onAddGalleryImage={handleAddGalleryImage}
              onRemoveGalleryImage={handleRemoveGalleryImage}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setProductModalOpen(true);
              }}
            />
          )}

          {currentTab === 'categories' && (
            <SectionsTab
              sections={state.sections}
              products={state.products}
              onAddSection={() => {
                setEditingSection(null);
                setSectionModalOpen(true);
              }}
              onEditSection={(sec) => {
                setEditingSection(sec);
                setSectionModalOpen(true);
              }}
              onDeleteSection={handleDeleteSection}
              onToggleActive={handleToggleSectionActive}
              onReorderSections={handleReorderSections}
              onResetSections={handleResetSections}
            />
          )}

          {currentTab === 'promos' && (
            <PromosTab
              promos={state.promos}
              onAddPromo={() => {
                setEditingPromo(null);
                setEditingPromoIndex(null);
                setPromoModalOpen(true);
              }}
              onEditPromo={(promo, index) => {
                setEditingPromo(promo);
                setEditingPromoIndex(index);
                setPromoModalOpen(true);
              }}
              onDeletePromo={handleDeletePromo}
              onToggleActive={handleTogglePromoActive}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersTab
              orders={state.orders}
              onUpdateStatus={handleUpdateOrderStatus}
              onViewOrder={(order) => {
                setSelectedOrder(order);
                setOrderDetailOpen(true);
              }}
              onDeleteOrder={handleDeleteOrder}
              onClearAllOrders={handleClearAllOrders}
            />
          )}

          {currentTab === 'notifications' && (
            <NotificationsTab
              notifications={state.notifications}
              onSendNotification={handleSendNotification}
              onDeleteNotification={handleDeleteNotification}
              onClearAllNotifications={handleClearAllNotifications}
            />
          )}

          {currentTab === 'transcript' && (
            <ReceiptTab
              settings={state.transcriptSettings}
              onSaveSettings={handleSaveReceiptSettings}
              onResetSettings={handleResetReceiptSettings}
            />
          )}

          {currentTab === 'launchpool' && (
            <LaunchControlTab
              config={state.launchConfig}
              pool={state.launchPool}
              nextProductId={state.nextLaunchProductId}
              onUpdateConfig={handleUpdateLaunchConfig}
              onPickNextProduct={() => setPoolPickerModalOpen(true)}
              onOpenAddToPool={() => {
                setEditingPoolProduct(null);
                setEditingPoolIndex(null);
                setAddToPoolModalOpen(true);
              }}
              onEditPoolProduct={(p, idx) => {
                setEditingPoolProduct(p);
                setEditingPoolIndex(idx);
                setAddToPoolModalOpen(true);
              }}
              onDeletePoolProduct={handleDeletePoolProduct}
              onMovePoolProductToNext={handleMovePoolProductToNext}
              onDropNow={handleDropNextProduct}
            />
          )}

          {currentTab === 'layout' && (
            <LayoutTab
              globalLayout={state.globalLayout}
              sections={state.sections}
              onSelectGlobalLayout={handleSelectGlobalLayout}
              onSaveGlobalLayout={handleSaveGlobalLayout}
              onUpdateSectionLayout={handleUpdateSectionLayout}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsTab
              paymentMethods={state.paymentMethods}
              customPaymentMethods={state.customPaymentMethods}
              onSavePaymentMethods={handleSavePaymentMethods}
              onOpenCustomModal={() => {
                setEditingPaymentMethod(null);
                setEditingPaymentIndex(null);
                setPaymentMethodModalOpen(true);
              }}
              onEditCustomMethod={(m, idx) => {
                setEditingPaymentMethod(m);
                setEditingPaymentIndex(idx);
                setPaymentMethodModalOpen(true);
              }}
              onDeleteCustomMethod={handleDeleteCustomPayment}
              onToggleCustomMethod={handleToggleCustomPayment}
            />
          )}

          {currentTab === 'store' && (
            <StoreSettingsTab
              settings={state.storeSettings}
              onSaveSettings={handleSaveStoreSettings}
            />
          )}

          {currentTab === 'announcement' && (
            <AnnouncementsTab
              settings={state.announcementSettings}
              onSaveSettings={handleSaveAnnouncements}
            />
          )}
        </main>
      </div>

      {/* Floating Action / Live Preview Trigger */}
      <div className="fixed bottom-6 left-6 z-30 hidden sm:block">
        <button
          onClick={() => setStorePreviewModalOpen(true)}
          className="bg-indigo-900/90 hover:bg-slate-900 text-white text-xs font-black px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2.5 transition hover:scale-105 border border-indigo-700/50"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <i className="fa-solid fa-store"></i>
          <span>Live Storefront Preview</span>
        </button>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={productModalOpen}
        product={editingProduct}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      <PromoModal
        isOpen={promoModalOpen}
        promo={editingPromo}
        editIndex={editingPromoIndex}
        onClose={() => {
          setPromoModalOpen(false);
          setEditingPromo(null);
          setEditingPromoIndex(null);
        }}
        onSave={handleSavePromo}
      />

      <SectionModal
        isOpen={sectionModalOpen}
        section={editingSection}
        onClose={() => {
          setSectionModalOpen(false);
          setEditingSection(null);
        }}
        onSave={handleSaveSection}
      />

      <OrderDetailModal
        isOpen={orderDetailOpen}
        order={selectedOrder}
        onClose={() => {
          setOrderDetailOpen(false);
          setSelectedOrder(null);
        }}
        onUpdateStatus={(status) => {
          if (selectedOrder) {
            handleUpdateOrderStatus(selectedOrder.id, status);
          }
        }}
      />

      <PaymentMethodModal
        isOpen={paymentMethodModalOpen}
        paymentMethod={editingPaymentMethod}
        editIndex={editingPaymentIndex}
        onClose={() => {
          setPaymentMethodModalOpen(false);
          setEditingPaymentMethod(null);
          setEditingPaymentIndex(null);
        }}
        onSave={handleSaveCustomPayment}
      />

      <AddToPoolModal
        isOpen={addToPoolModalOpen}
        product={editingPoolProduct}
        editIndex={editingPoolIndex}
        onClose={() => {
          setAddToPoolModalOpen(false);
          setEditingPoolProduct(null);
          setEditingPoolIndex(null);
        }}
        onSave={handleSavePoolProduct}
      />

      <PoolPickerModal
        isOpen={poolPickerModalOpen}
        pool={state.launchPool}
        selectedId={state.nextLaunchProductId}
        onClose={() => setPoolPickerModalOpen(false)}
        onSelect={handleSelectNextProduct}
      />

      <StorePreviewModal
        isOpen={storePreviewModalOpen}
        state={state}
        onClose={() => setStorePreviewModalOpen(false)}
      />

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-admin pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold ${
              toast.type === 'error'
                ? 'bg-rose-600 text-white'
                : toast.type === 'info'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-white'
            }`}
          >
            <i
              className={`fa-solid ${
                toast.type === 'error'
                  ? 'fa-circle-exclamation'
                  : toast.type === 'info'
                  ? 'fa-circle-info'
                  : 'fa-circle-check text-emerald-400'
              }`}
            ></i>
            <span>{toast.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
