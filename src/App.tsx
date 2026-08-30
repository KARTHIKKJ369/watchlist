import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WatchlistProvider, useWatchlist } from './context/WatchlistContext';
import { Navbar } from './components/Navbar';
import { StatsHeader } from './components/StatsHeader';
import { WatchlistGrid } from './components/WatchlistGrid';
import { ReleasesPage } from './components/ReleasesPage';
import { StatsPage } from './components/StatsPage';
import { DetailModal } from './components/DetailModal';
import { AddMediaModal } from './components/AddMediaModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/ToastContainer';
import { hideNativeSplash, registerBackButtonHandler, triggerHaptic } from './services/nativeService';

const MainApp: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedItem,
    closeDetailModal,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    isSettingsModalOpen,
    closeSettingsModal,
  } = useWatchlist();

  // Keep refs up-to-date for native back button callback
  const stateRef = useRef({
    selectedItem,
    isAddModalOpen,
    isSettingsModalOpen,
    activeTab,
  });

  useEffect(() => {
    stateRef.current = {
      selectedItem,
      isAddModalOpen,
      isSettingsModalOpen,
      activeTab,
    };
  }, [selectedItem, isAddModalOpen, isSettingsModalOpen, activeTab]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K / '/' for search, Esc to close)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        triggerHaptic('light');
        openAddModal();
      } else if (e.key === '/' && !selectedItem && !isAddModalOpen && !isSettingsModalOpen) {
        e.preventDefault();
        triggerHaptic('light');
        openAddModal();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [openAddModal, selectedItem, isAddModalOpen, isSettingsModalOpen]);

  useEffect(() => {
    // Hide native splash screen once UI is ready
    hideNativeSplash();

    // Register Android hardware / gesture back button handler
    const unregister = registerBackButtonHandler(() => {
      const { selectedItem, isAddModalOpen, isSettingsModalOpen, activeTab } = stateRef.current;

      if (selectedItem) {
        closeDetailModal();
        return true;
      }
      if (isAddModalOpen) {
        closeAddModal();
        return true;
      }
      if (isSettingsModalOpen) {
        closeSettingsModal();
        return true;
      }
      if (activeTab !== 'watchlist') {
        setActiveTab('watchlist');
        return true;
      }

      return false; // Let OS minimize or exit
    });

    return () => unregister();
  }, [closeDetailModal, closeAddModal, closeSettingsModal, setActiveTab]);

  return (
    <div className="app-layout">
      {/* Navigation Header & Mobile Bottom Bar */}
      <Navbar />

      {/* Main Content Area with Fluid Transitions */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === 'watchlist' && (
            <motion.div
              key="watchlist"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <StatsHeader />
              <WatchlistGrid />
            </motion.div>
          )}

          {activeTab === 'releases' && (
            <motion.div
              key="releases"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <ReleasesPage />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <StatsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Overlays & Modals */}
      <DetailModal />
      <AddMediaModal />
      <SettingsModal />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <WatchlistProvider>
      <MainApp />
    </WatchlistProvider>
  );
}

export default App;
