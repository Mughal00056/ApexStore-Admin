import React from 'react';

export type TabKey =
  | 'dashboard'
  | 'products'
  | 'heroimages'
  | 'categories'
  | 'promos'
  | 'orders'
  | 'notifications'
  | 'transcript'
  | 'launchpool'
  | 'layout'
  | 'payments'
  | 'store'
  | 'announcement';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isOpen: boolean;
  onClose: () => void;
  counts: {
    products: number;
    sections: number;
    promos: number;
    orders: number;
    notifications: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  counts
}) => {
  const handleNav = (tab: TabKey) => {
    onSelectTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <i className="fa-solid fa-bag-shopping text-base"></i>
            </div>
            <div>
              <p className="text-base font-black text-slate-900 tracking-tight">ApexStore</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wider">
                  Power Admin
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {/* Main group */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-1.5">
              Main
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('dashboard')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'dashboard' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-chart-pie w-5 text-indigo-600"></i>
                <span className="font-bold text-xs sm:text-sm">Dashboard</span>
              </button>

              <button
                onClick={() => handleNav('products')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'products' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-box w-5 text-indigo-600"></i>
                <span className="font-bold text-xs sm:text-sm">Products</span>
                <span className="ml-auto bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {counts.products}
                </span>
              </button>

              <button
                onClick={() => handleNav('heroimages')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'heroimages' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-images w-5 text-pink-500"></i>
                <span className="font-bold text-xs sm:text-sm">Hero Images</span>
              </button>

              <button
                onClick={() => handleNav('categories')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'categories' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-layer-group w-5 text-purple-600"></i>
                <span className="font-bold text-xs sm:text-sm">Sections</span>
                <span className="ml-auto bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {counts.sections}
                </span>
              </button>

              <button
                onClick={() => handleNav('promos')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'promos' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-tags w-5 text-amber-500"></i>
                <span className="font-bold text-xs sm:text-sm">Promo Codes</span>
                <span className="ml-auto bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {counts.promos}
                </span>
              </button>

              <button
                onClick={() => handleNav('orders')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'orders' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-receipt w-5 text-emerald-500"></i>
                <span className="font-bold text-xs sm:text-sm">Orders</span>
                <span className="ml-auto bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {counts.orders}
                </span>
              </button>
            </div>
          </div>

          {/* Engage group */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-1.5">
              Engage
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('notifications')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'notifications' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-bell w-5 text-rose-500"></i>
                <span className="font-bold text-xs sm:text-sm">Notifications</span>
                <span className="ml-auto bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {counts.notifications}
                </span>
              </button>

              <button
                onClick={() => handleNav('transcript')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'transcript' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-scroll w-5 text-purple-500"></i>
                <span className="font-bold text-xs sm:text-sm">Receipt Editor</span>
              </button>
            </div>
          </div>

          {/* Launch group */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-1.5">
              Launch
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('launchpool')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'launchpool' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-rocket w-5 text-rose-500"></i>
                <span className="font-bold text-xs sm:text-sm">Launch Control</span>
              </button>
            </div>
          </div>

          {/* Settings group */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 mb-1.5">
              Settings
            </p>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('layout')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'layout' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-table-columns w-5 text-indigo-600"></i>
                <span className="font-bold text-xs sm:text-sm">Layout & Display</span>
              </button>

              <button
                onClick={() => handleNav('payments')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'payments' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-credit-card w-5 text-indigo-600"></i>
                <span className="font-bold text-xs sm:text-sm">Payment Methods</span>
              </button>

              <button
                onClick={() => handleNav('store')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'store' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-gear w-5 text-indigo-600"></i>
                <span className="font-bold text-xs sm:text-sm">Store Settings</span>
              </button>

              <button
                onClick={() => handleNav('announcement')}
                className={`sidebar-link w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl text-left ${
                  currentTab === 'announcement' ? 'active' : 'text-slate-700'
                }`}
              >
                <i className="fa-solid fa-bullhorn w-5 text-rose-500"></i>
                <span className="font-bold text-xs sm:text-sm">Announcements</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User Card Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-800 truncate">Anees Abid</p>
              <p className="text-[10px] text-slate-400 font-semibold truncate">
                ownerofapexstore@gmail.com
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </aside>
    </>
  );
};
