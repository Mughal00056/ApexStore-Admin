import React from 'react';

interface HeaderProps {
  currentTab: string;
  tabTitle: string;
  tabIcon: string;
  syncStatus: 'synced' | 'saving' | 'offline' | 'error';
  onForceSync: () => void;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  tabTitle,
  tabIcon,
  syncStatus,
  onForceSync,
  onToggleSidebar
}) => {
  const syncConfig = {
    synced: {
      color: 'bg-emerald-500 text-white shadow-emerald-200',
      icon: 'fa-cloud-arrow-up',
      text: 'Synced'
    },
    saving: {
      color: 'bg-amber-500 text-white shadow-amber-200',
      icon: 'fa-spinner fa-spin',
      text: 'Saving...'
    },
    offline: {
      color: 'bg-slate-500 text-white',
      icon: 'fa-wifi',
      text: 'Offline'
    },
    error: {
      color: 'bg-rose-500 text-white shadow-rose-200',
      icon: 'fa-triangle-exclamation',
      text: 'Sync Error'
    }
  }[syncStatus];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-3">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="lg:hidden p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold shadow-xs">
              <i className={`fa-solid ${tabIcon}`}></i>
            </div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {tabTitle}
            </h1>
          </div>
        </div>

        {/* Right: Sync Status & Actions */}
        <div className="flex items-center gap-2">
          {/* Sync badge */}
          <div
            className={`text-xs font-black px-3 py-1.5 rounded-full shadow flex items-center gap-1.5 transition-all duration-300 ${syncConfig.color}`}
          >
            <i className={`fa-solid ${syncConfig.icon}`}></i>
            <span className="hidden sm:inline">{syncConfig.text}</span>
          </div>

          {/* Force sync */}
          <button
            onClick={onForceSync}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
            title="Force Sync with Firebase"
          >
            <i className="fa-solid fa-rotate text-sm"></i>
          </button>

          {/* Storefront view button */}
          <button
            onClick={() => {
              window.open('#preview', '_self');
            }}
            className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-indigo-100"
          >
            <i className="fa-solid fa-store"></i>
            <span>ApexStore</span>
          </button>
        </div>
      </div>
    </header>
  );
};
