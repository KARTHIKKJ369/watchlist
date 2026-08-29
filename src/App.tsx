import React from 'react';
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

const MainApp: React.FC = () => {
  const { activeTab } = useWatchlist();

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
