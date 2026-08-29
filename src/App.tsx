import React, { useEffect, useRef } from 'react';
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
import { hideNativeSplash, registerBackButtonHandler } from './services/nativeService';

const MainApp: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedItem,
    closeDetailModal,
    isAddModalOpen,
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

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'watchlist' && (
          <>
            <StatsHeader />
            <WatchlistGrid />
          </>
        )}

        {activeTab === 'releases' && <ReleasesPage />}

        {activeTab === 'stats' && <StatsPage />}
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
