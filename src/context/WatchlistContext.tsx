import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  MediaType,
  WatchlistItem,
  WatchlistStats,
  WatchStatus,
} from '../types';
import { fetchMediaDetails, getUserRegion, setUserRegion } from '../services/tmdbApi';
import {
  getAuthUser,
  syncWatchlistToCloud,
  fetchWatchlistFromCloud,
} from '../services/cloudSync';
import { updateNativeStatusBar, triggerHaptic } from '../services/nativeService';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export type ThemeMode = 'system' | 'light' | 'dark';

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  setWatchlist: React.Dispatch<React.SetStateAction<WatchlistItem[]>>;
  reloadFromCloud: () => Promise<boolean>;
  activeTab: 'watchlist' | 'releases' | 'stats';
  setActiveTab: (tab: 'watchlist' | 'releases' | 'stats') => void;
  selectedItem: WatchlistItem | null;
  isAddModalOpen: boolean;
  addModalPrefill: string;
  isSettingsModalOpen: boolean;
  toasts: ToastMessage[];
  stats: WatchlistStats;
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  region: string;
  setRegion: (region: string) => void;
  openDetailModal: (item: WatchlistItem) => void;
  closeDetailModal: () => void;
  openAddModal: (prefillTitle?: string) => void;
  closeAddModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  addToWatchlist: (
    itemData: Partial<WatchlistItem> & { title: string; mediaType: MediaType },
    initialStatus?: WatchStatus
  ) => Promise<boolean>;
  removeFromWatchlist: (id: string) => void;
  updateWatchlistItem: (id: string, updates: Partial<WatchlistItem>) => void;
  isInWatchlist: (tmdbId?: number, title?: string) => boolean;
  getWatchlistItem: (tmdbId?: number, title?: string) => WatchlistItem | undefined;
  exportWatchlistAsJSON: () => void;
  importWatchlistFromJSON: (jsonString: string) => boolean;
  resetToDefaultWatchlist: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const STORAGE_KEY = 'frame_vault_v1';
const THEME_KEY = 'frame_theme';

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading watchlist from localStorage', e);
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<'watchlist' | 'releases' | 'stats'>('watchlist');
  const [selectedItem, setSelectedItem] = useState<WatchlistItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalPrefill, setAddModalPrefill] = useState<string>('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Theme Management (Default: system preference)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [systemIsLight, setSystemIsLight] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  // Listen to OS system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsLight(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' = useMemo(() => {
    if (theme === 'system') {
      return systemIsLight ? 'light' : 'dark';
    }
    return theme;
  }, [theme, systemIsLight]);

  // Apply theme to document root & native status bar
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    updateNativeStatusBar(resolvedTheme);
  }, [resolvedTheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setTheme(mode);
    localStorage.setItem(THEME_KEY, mode);
  };

  // User Region (Country for OTT / Streaming)
  const [region, setRegionState] = useState<string>(() => getUserRegion());

  const setRegion = (newRegion: string) => {
    setUserRegion(newRegion);
    setRegionState(newRegion.toUpperCase());
    showToast(`Streaming region updated to ${newRegion.toUpperCase()}`, 'info');
  };

  const toggleTheme = () => {
    triggerHaptic('light');
    const nextTheme: 'light' | 'dark' = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
    } catch (e) {
      console.error('Failed to save watchlist to localStorage', e);
    }
  }, [watchlist]);

  // 1. Initial Cloud Sync on mount (Cloud is canonical source of truth for logged-in user)
  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      fetchWatchlistFromCloud().then((res) => {
        if (res.success && Array.isArray(res.items)) {
          setWatchlist(res.items);
        }
      });
    }
  }, []);

  // 2. Real-time background sync when watchlist changes (debounced 600ms)
  useEffect(() => {
    const user = getAuthUser();
    if (!user) return;
    const timer = setTimeout(() => {
      syncWatchlistToCloud(watchlist);
    }, 600);
    return () => clearTimeout(timer);
  }, [watchlist]);

  // 3. Cross-device re-fetch on window focus (syncs immediately when switching back to device)
  useEffect(() => {
    const onFocus = () => {
      const user = getAuthUser();
      if (user) {
        fetchWatchlistFromCloud().then((res) => {
          if (res.success && Array.isArray(res.items)) {
            setWatchlist(res.items);
          }
        });
      }
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const reloadFromCloud = async (): Promise<boolean> => {
    const res = await fetchWatchlistFromCloud();
    if (res.success && res.items) {
      setWatchlist(res.items);
      return true;
    }
    return false;
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const isInWatchlist = (tmdbId?: number, title?: string): boolean => {
    return watchlist.some((item) => {
      if (tmdbId && item.tmdbId === tmdbId) return true;
      if (title && item.title.toLowerCase() === title.toLowerCase()) return true;
      return false;
    });
  };

  const getWatchlistItem = (tmdbId?: number, title?: string): WatchlistItem | undefined => {
    return watchlist.find((item) => {
      if (tmdbId && item.tmdbId === tmdbId) return true;
      if (title && item.title.toLowerCase() === title.toLowerCase()) return true;
      return false;
    });
  };

  const addToWatchlist = async (
    itemData: Partial<WatchlistItem> & { title: string; mediaType: MediaType },
    initialStatus: WatchStatus = 'plan_to_watch'
  ): Promise<boolean> => {
    if (isInWatchlist(itemData.tmdbId, itemData.title)) {
      showToast(`"${itemData.title}" is already in your collection`, 'info');
      return false;
    }

    const now = new Date().toISOString();
    const uniqueId = itemData.tmdbId
      ? `${itemData.mediaType}-${itemData.tmdbId}`
      : `custom-${Date.now()}`;

    const newItem: WatchlistItem = {
      id: uniqueId,
      tmdbId: itemData.tmdbId,
      title: itemData.title,
      originalTitle: itemData.originalTitle || itemData.title,
      mediaType: itemData.mediaType,
      posterPath: itemData.posterPath || '',
      backdropPath: itemData.backdropPath || '',
      releaseYear: itemData.releaseYear || new Date().getFullYear().toString(),
      releaseDate: itemData.releaseDate,
      genres: itemData.genres || [],
      overview: itemData.overview || 'No synopsis added.',
      voteAverage: itemData.voteAverage || 0,
      voteCount: itemData.voteCount,
      runtime: itemData.runtime,
      numberOfSeasons: itemData.numberOfSeasons,
      numberOfEpisodes: itemData.numberOfEpisodes,
      status: initialStatus,
      userRating: itemData.userRating || 0,
      userNotes: itemData.userNotes || '',
      rewatchCount: 0,
      tags: itemData.tags || [],
      addedAt: now,
      updatedAt: now,
      streamingProviders: itemData.streamingProviders || [],
      director: itemData.director,
      cast: itemData.cast || [],
      trailerKey: itemData.trailerKey,
      isCustom: itemData.isCustom || false,
    };

    if (itemData.tmdbId) {
      fetchMediaDetails(itemData.tmdbId, itemData.mediaType).then((details) => {
        setWatchlist((prev) =>
          prev.map((w) => {
            if (w.id === uniqueId) {
              return {
                ...w,
                cast: details.cast && details.cast.length > 0 ? details.cast : w.cast,
                streamingProviders:
                  details.streamingProviders && details.streamingProviders.length > 0
                    ? details.streamingProviders
                    : w.streamingProviders,
                trailerKey: details.trailerKey || w.trailerKey,
                director: details.director || w.director,
                writers: details.writers || w.writers,
                cinematographer: details.cinematographer || w.cinematographer,
                composer: details.composer || w.composer,
                productionCompanies: details.productionCompanies || w.productionCompanies,
                certification: details.certification || w.certification,
                tagline: details.tagline || w.tagline,
                budget: details.budget || w.budget,
                revenue: details.revenue || w.revenue,
                language: details.language || w.language,
                runtime: details.runtime || w.runtime,
                numberOfSeasons: details.numberOfSeasons || w.numberOfSeasons,
                numberOfEpisodes: details.numberOfEpisodes || w.numberOfEpisodes,
                genres: details.genres && details.genres.length > 0 ? details.genres : w.genres,
                backdropPath: details.backdropPath || w.backdropPath,
                posterPath: details.posterPath || w.posterPath,
                overview: details.overview || w.overview,
                voteAverage: details.voteAverage || w.voteAverage,
                voteCount: details.voteCount || w.voteCount,
              };
            }
            return w;
          })
        );
      });
    }

    const nextList = [newItem, ...watchlist];
    setWatchlist(nextList);
    triggerHaptic('success');
    showToast(`Added "${newItem.title}" to collection`, 'success');
    if (getAuthUser()) {
      syncWatchlistToCloud(nextList);
    }
    return true;
  };

  const removeFromWatchlist = (id: string) => {
    const item = watchlist.find((w) => w.id === id);
    const nextList = watchlist.filter((w) => w.id !== id);
    setWatchlist(nextList);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    triggerHaptic('warning');
    showToast(`Removed "${item?.title || 'Title'}"`, 'info');
    if (getAuthUser()) {
      syncWatchlistToCloud(nextList);
    }
  };

  const updateWatchlistItem = (id: string, updates: Partial<WatchlistItem>) => {
    let nextList = watchlist.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    const exists = watchlist.some((w) => w.id === id);
    if (!exists && selectedItem && selectedItem.id === id) {
      const newItem: WatchlistItem = {
        ...selectedItem,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      nextList = [newItem, ...watchlist];
      triggerHaptic('success');
      showToast(`Added "${newItem.title}" to collection`, 'success');
    } else {
      if (updates.status === 'completed') {
        triggerHaptic('success');
      } else {
        triggerHaptic('light');
      }
    }

    setWatchlist(nextList);

    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null));
    }

    if (getAuthUser()) {
      syncWatchlistToCloud(nextList);
    }
  };

  const openDetailModal = async (item: WatchlistItem) => {
    triggerHaptic('selection');
    setSelectedItem(item);

    if (item.tmdbId) {
      fetchMediaDetails(item.tmdbId, item.mediaType).then((details) => {
        if (!details) return;
        const enriched: WatchlistItem = {
          ...item,
          cast: details.cast && details.cast.length > 0 ? details.cast : item.cast,
          streamingProviders:
            details.streamingProviders && details.streamingProviders.length > 0
              ? details.streamingProviders
              : item.streamingProviders,
          trailerKey: details.trailerKey || item.trailerKey,
          director: details.director || item.director,
          writers: details.writers || item.writers,
          cinematographer: details.cinematographer || item.cinematographer,
          composer: details.composer || item.composer,
          productionCompanies: details.productionCompanies || item.productionCompanies,
          certification: details.certification || item.certification,
          tagline: details.tagline || item.tagline,
          budget: details.budget || item.budget,
          revenue: details.revenue || item.revenue,
          language: details.language || item.language,
          runtime: details.runtime || item.runtime,
          numberOfSeasons: details.numberOfSeasons || item.numberOfSeasons,
          numberOfEpisodes: details.numberOfEpisodes || item.numberOfEpisodes,
          genres: details.genres && details.genres.length > 0 ? details.genres : item.genres,
          backdropPath: details.backdropPath || item.backdropPath,
          posterPath: details.posterPath || item.posterPath,
          overview: details.overview || item.overview,
          voteAverage: details.voteAverage || item.voteAverage,
          voteCount: details.voteCount || item.voteCount,
        };
        setSelectedItem((current) => (current?.id === item.id ? enriched : current));
        setWatchlist((prev) => prev.map((w) => (w.id === item.id ? enriched : w)));
      });
    }
  };

  const closeDetailModal = () => {
    setSelectedItem(null);
  };

  const openAddModal = (prefillTitle?: string) => {
    setAddModalPrefill(prefillTitle || '');
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setAddModalPrefill('');
  };

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const exportWatchlistAsJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(watchlist, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `frame-vault-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Vault exported successfully', 'success');
  };

  const importWatchlistFromJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].title) {
        setWatchlist(parsed);
        showToast(`Imported ${parsed.length} titles into your collection`, 'success');
        return true;
      }
      showToast('Invalid JSON format', 'error');
      return false;
    } catch (e) {
      showToast('Failed to parse JSON file', 'error');
      return false;
    }
  };

  const resetToDefaultWatchlist = () => {
    setWatchlist([]);
    showToast('Vault collection cleared', 'info');
  };

  // Compute stats
  const stats: WatchlistStats = useMemo(() => {
    const totalCount = watchlist.length;
    const moviesCount = watchlist.filter((w) => w.mediaType === 'movie').length;
    const tvCount = watchlist.filter((w) => w.mediaType === 'tv').length;
    const completedCount = watchlist.filter((w) => w.status === 'completed').length;
    const watchingCount = watchlist.filter((w) => w.status === 'watching').length;
    const planToWatchCount = watchlist.filter((w) => w.status === 'plan_to_watch').length;
    const droppedCount = watchlist.filter((w) => w.status === 'dropped').length;

    let totalRuntimeMinutes = 0;
    let ratedCount = 0;
    let totalRatingSum = 0;
    const genreCounts: Record<string, number> = {};

    watchlist.forEach((item) => {
      if (item.runtime) {
        totalRuntimeMinutes += item.runtime;
      } else if (item.mediaType === 'tv' && item.numberOfEpisodes) {
        totalRuntimeMinutes += item.numberOfEpisodes * 50;
      }

      if (item.userRating && item.userRating > 0) {
        ratedCount++;
        totalRatingSum += item.userRating;
      }

      (item.genres || []).forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    const averageUserRating =
      ratedCount > 0 ? Number((totalRatingSum / ratedCount).toFixed(1)) : 0;
    const topGenres = Object.entries(genreCounts)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCount,
      moviesCount,
      tvCount,
      completedCount,
      watchingCount,
      planToWatchCount,
      droppedCount,
      totalRuntimeMinutes,
      averageUserRating,
      topGenres,
    };
  }, [watchlist]);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        setWatchlist,
        reloadFromCloud,
        activeTab,
        setActiveTab,
        selectedItem,
        isAddModalOpen,
        addModalPrefill,
        isSettingsModalOpen,
        toasts,
        stats,
        theme,
        resolvedTheme,
        toggleTheme,
        setThemeMode,
        region,
        setRegion,
        openDetailModal,
        closeDetailModal,
        openAddModal,
        closeAddModal,
        openSettingsModal,
        closeSettingsModal,
        addToWatchlist,
        removeFromWatchlist,
        updateWatchlistItem,
        isInWatchlist,
        getWatchlistItem,
        exportWatchlistAsJSON,
        importWatchlistFromJSON,
        resetToDefaultWatchlist,
        showToast,
        removeToast,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};
