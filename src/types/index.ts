export type MediaType = 'movie' | 'tv';

export type WatchStatus = 'plan_to_watch' | 'watching' | 'completed' | 'on_hold' | 'dropped';

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface WatchProvider {
  id: number;
  name: string;
  logoPath: string;
  type: 'stream' | 'rent' | 'buy';
}

export interface VideoTrailer {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
}

export interface WatchlistItem {
  id: string;
  tmdbId?: number;
  title: string;
  originalTitle?: string;
  mediaType: MediaType;
  posterPath: string;
  backdropPath?: string;
  releaseYear: string | number;
  releaseDate?: string;
  genres: string[];
  overview: string;
  tagline?: string;
  certification?: string;
  voteAverage: number;
  voteCount?: number;
  runtime?: number; // in minutes
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  budget?: number;
  revenue?: number;
  language?: string;
  status: WatchStatus;
  userRating: number; // 0 to 10
  userNotes: string;
  rewatchCount: number;
  tags: string[];
  addedAt: string;
  updatedAt: string;
  streamingProviders?: WatchProvider[];
  director?: string;
  writers?: string;
  cinematographer?: string;
  composer?: string;
  productionCompanies?: string[];
  cast?: CastMember[];
  trailerKey?: string;
  isCustom?: boolean;
}

export interface MediaSearchResult {
  id: number;
  title: string;
  originalTitle?: string;
  mediaType: MediaType;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  releaseYear: string;
  overview: string;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  genres?: string[];
  popularity?: number;
}

export interface ReleaseNewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  category: 'OTT Premiere' | 'In Theaters' | 'Trailer Release' | 'Announcement' | 'New Season';
  platform?: 'Netflix' | 'Prime Video' | 'Disney+' | 'Apple TV+' | 'HBO Max' | 'Theaters' | 'Paramount+';
  summary: string;
  relatedMedia?: {
    title: string;
    mediaType: MediaType;
    tmdbId?: number;
    posterPath?: string;
    releaseDate?: string;
    genres?: string[];
  };
  sourceUrl?: string;
}

export interface OTTReleaseItem {
  id: number;
  title: string;
  mediaType: MediaType;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  platform: 'Netflix' | 'Prime Video' | 'Disney+' | 'Apple TV+' | 'HBO Max' | 'Theaters' | 'Paramount+';
  platformLogo?: string;
  voteAverage: number;
  overview: string;
  genres: string[];
}

export type SortOption =
  | 'date_added_desc'
  | 'date_added_asc'
  | 'rating_desc'
  | 'rating_asc'
  | 'release_date_desc'
  | 'release_date_asc'
  | 'title_asc'
  | 'title_desc';

export interface FilterState {
  status: 'all' | WatchStatus;
  mediaType: 'all' | MediaType;
  searchQuery: string;
  sortBy: SortOption;
  selectedGenre: string;
}

export interface WatchlistStats {
  totalCount: number;
  moviesCount: number;
  tvCount: number;
  completedCount: number;
  watchingCount: number;
  planToWatchCount: number;
  droppedCount: number;
  totalRuntimeMinutes: number;
  averageUserRating: number;
  topGenres: { genre: string; count: number }[];
}
