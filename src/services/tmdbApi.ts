import type {
  CastMember,
  MediaSearchResult,
  MediaType,
  OTTReleaseItem,
  WatchlistItem,
  WatchProvider,
} from '../types';

const DEFAULT_FALLBACK_API_KEY = '4e44d9029b1270a757cddc766a1bcb63';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Read Access Token (v4 Bearer Token) from .env or localStorage
export const getReadAccessToken = (): string => {
  return (
    (import.meta as any).env?.VITE_TMDB_READ_ACCESS_TOKEN ||
    localStorage.getItem('frame_tmdb_read_access_token') ||
    ''
  );
};

// API Key (v3) from .env or localStorage
export const getApiKey = (): string => {
  return (
    (import.meta as any).env?.VITE_TMDB_API_KEY ||
    localStorage.getItem('frame_tmdb_api_key') ||
    DEFAULT_FALLBACK_API_KEY
  );
};

export const getUserRegion = (): string => {
  const saved = localStorage.getItem('frame_region');
  if (saved) return saved.toUpperCase();

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) return 'IN';
    if (tz.includes('London')) return 'GB';
    if (tz.includes('Toronto') || tz.includes('Vancouver')) return 'CA';
    if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'AU';
    if (tz.includes('Berlin')) return 'DE';
    if (tz.includes('Paris')) return 'FR';
    if (tz.includes('Tokyo')) return 'JP';
    if (tz.includes('Sao_Paulo')) return 'BR';
  } catch {}

  const lang = (navigator.language || '').toUpperCase();
  if (lang.endsWith('-IN') || lang.startsWith('HI')) return 'IN';
  if (lang.endsWith('-GB')) return 'GB';
  if (lang.endsWith('-CA')) return 'CA';
  if (lang.endsWith('-AU')) return 'AU';

  return 'US';
};

export const setUserRegion = (region: string) => {
  if (region && region.trim()) {
    localStorage.setItem('frame_region', region.trim().toUpperCase());
  }
};

export const setCustomApiKey = (key: string) => {
  if (key.trim()) {
    localStorage.setItem('frame_tmdb_api_key', key.trim());
  } else {
    localStorage.removeItem('frame_tmdb_api_key');
  }
};

export const setCustomReadAccessToken = (token: string) => {
  if (token.trim()) {
    localStorage.setItem('frame_tmdb_read_access_token', token.trim());
  } else {
    localStorage.removeItem('frame_tmdb_read_access_token');
  }
};

// Unified fetch handler supporting both v3 API Key & v4 Read Access Token (Bearer)
const tmdbFetch = async (endpoint: string, searchParams: Record<string, string> = {}): Promise<Response> => {
  const readToken = getReadAccessToken();
  const apiKey = getApiKey();

  const url = new URL(`${TMDB_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
  Object.entries(searchParams).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (readToken) {
    headers['Authorization'] = `Bearer ${readToken}`;
  } else {
    url.searchParams.set('api_key', apiKey);
  }

  return fetch(url.toString(), { headers });
};

export const getImageUrl = (
  path: string | null | undefined,
  size: 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'
): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  return `${TMDB_IMAGE_BASE}/${size}${path.startsWith('/') ? path : `/${path}`}`;
};

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

// Search Movies & TV Shows across TMDB with TVMaze fallback
export const searchMedia = async (query: string): Promise<MediaSearchResult[]> => {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await tmdbFetch('/search/multi', {
      query: query.trim(),
      include_adult: 'false',
      page: '1',
    });

    if (res.ok) {
      const data = await res.json();
      const results: MediaSearchResult[] = (data.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => {
          const isMovie = item.media_type === 'movie';
          const releaseDate = isMovie ? item.release_date || '' : item.first_air_date || '';
          const releaseYear = releaseDate ? releaseDate.split('-')[0] : '';
          const genreNames = (item.genre_ids || [])
            .map((id: number) => GENRE_MAP[id])
            .filter(Boolean);

          return {
            id: item.id,
            title: isMovie ? item.title : item.name,
            originalTitle: isMovie ? item.original_title : item.original_name,
            mediaType: isMovie ? 'movie' : 'tv',
            posterPath: item.poster_path ? getImageUrl(item.poster_path, 'w500') : null,
            backdropPath: item.backdrop_path ? getImageUrl(item.backdrop_path, 'w1280') : null,
            releaseDate,
            releaseYear,
            overview: item.overview || 'No synopsis available.',
            voteAverage: Number((item.vote_average || 0).toFixed(1)),
            voteCount: item.vote_count || 0,
            genreIds: item.genre_ids || [],
            genres: genreNames,
            popularity: item.popularity || 0,
          };
        });

      if (results.length > 0) return results;
    }
  } catch (error) {
    console.warn('TMDB search failed, falling back to TVMaze', error);
  }

  // Fallback to TVMaze
  try {
    const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      return (data || []).slice(0, 10).map((entry: any) => {
        const show = entry.show;
        const cleanSummary = (show.summary || '').replace(/<[^>]*>?/gm, '');
        return {
          id: show.id,
          title: show.name,
          mediaType: 'tv' as MediaType,
          posterPath: show.image?.medium || show.image?.original || null,
          backdropPath: show.image?.original || null,
          releaseDate: show.premiered || '',
          releaseYear: show.premiered ? show.premiered.split('-')[0] : '',
          overview: cleanSummary || 'No synopsis available.',
          voteAverage: show.rating?.average ? Number(show.rating.average.toFixed(1)) : 7.0,
          voteCount: 100,
          genreIds: [],
          genres: show.genres || [],
          popularity: 50,
        };
      });
    }
  } catch (tvError) {
    console.error('TVMaze search failed', tvError);
  }

  return [];
};

// Fetch Trending Media
export const fetchTrending = async (timeWindow: 'day' | 'week' = 'week'): Promise<MediaSearchResult[]> => {
  try {
    const res = await tmdbFetch(`/trending/all/${timeWindow}`);
    if (res.ok) {
      const data = await res.json();
      return (data.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => {
          const isMovie = item.media_type === 'movie';
          const releaseDate = isMovie ? item.release_date || '' : item.first_air_date || '';
          const releaseYear = releaseDate ? releaseDate.split('-')[0] : '';
          const genreNames = (item.genre_ids || [])
            .map((id: number) => GENRE_MAP[id])
            .filter(Boolean);

          return {
            id: item.id,
            title: isMovie ? item.title : item.name,
            originalTitle: isMovie ? item.original_title : item.original_name,
            mediaType: isMovie ? 'movie' : 'tv',
            posterPath: item.poster_path ? getImageUrl(item.poster_path, 'w500') : null,
            backdropPath: item.backdrop_path ? getImageUrl(item.backdrop_path, 'w1280') : null,
            releaseDate,
            releaseYear,
            overview: item.overview || 'No synopsis available.',
            voteAverage: Number((item.vote_average || 0).toFixed(1)),
            voteCount: item.vote_count || 0,
            genreIds: item.genre_ids || [],
            genres: genreNames,
            popularity: item.popularity || 0,
          };
        });
    }
  } catch (err) {
    console.warn('Failed to fetch trending', err);
  }
  return [];
};

// Fetch full details of a Movie or TV Show
export const fetchMediaDetails = async (
  tmdbId: number,
  mediaType: MediaType
): Promise<{
  runtime?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  genres: string[];
  director?: string;
  writers?: string;
  cinematographer?: string;
  composer?: string;
  productionCompanies?: string[];
  certification?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  language?: string;
  cast: CastMember[];
  streamingProviders: WatchProvider[];
  trailerKey?: string;
  backdropPath?: string;
  posterPath?: string;
  overview?: string;
  voteAverage?: number;
  voteCount?: number;
}> => {
  const appendParam =
    mediaType === 'movie'
      ? 'credits,videos,release_dates,watch/providers'
      : 'credits,videos,content_ratings,watch/providers';

  try {
    const res = await tmdbFetch(`/${mediaType}/${tmdbId}`, {
      append_to_response: appendParam,
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    let director = '';
    let writers = '';
    let cinematographer = '';
    let composer = '';

    if (mediaType === 'movie') {
      const directors = (data.credits?.crew || [])
        .filter((c: any) => c.job === 'Director')
        .map((c: any) => c.name);
      director = directors.join(', ');

      const writerList = (data.credits?.crew || [])
        .filter((c: any) => c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story')
        .map((c: any) => c.name);
      writers = Array.from(new Set(writerList)).slice(0, 3).join(', ');

      const dop = (data.credits?.crew || []).find(
        (c: any) => c.job === 'Director of Photography' || c.job === 'Cinematography'
      );
      cinematographer = dop?.name || '';

      const comp = (data.credits?.crew || []).find(
        (c: any) => c.job === 'Original Music Composer' || c.job === 'Music'
      );
      composer = comp?.name || '';
    } else {
      director = (data.created_by || []).map((c: any) => c.name).join(', ');
      if (!director) {
        const ep = (data.credits?.crew || []).find((c: any) => c.job === 'Executive Producer');
        director = ep?.name || '';
      }
    }

    const cast: CastMember[] = (data.credits?.cast || []).slice(0, 16).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character || 'Cast',
      profilePath: c.profile_path ? getImageUrl(c.profile_path, 'w185') : null,
    }));

    const trailers = (data.videos?.results || []).filter(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    const trailerKey = trailers.length > 0 ? trailers[0].key : undefined;

    const userRegion = getUserRegion();
    let certification = '';
    if (mediaType === 'movie') {
      const releaseResults = data.release_dates?.results || [];
      const regionalRelease =
        releaseResults.find((r: any) => r.iso_3166_1 === userRegion) ||
        releaseResults.find((r: any) => r.iso_3166_1 === 'US') ||
        releaseResults[0];
      const certObj = regionalRelease?.release_dates?.find((d: any) => d.certification);
      certification = certObj?.certification || '';
    } else {
      const ratingResults = data.content_ratings?.results || [];
      const regionalRating =
        ratingResults.find((r: any) => r.iso_3166_1 === userRegion) ||
        ratingResults.find((r: any) => r.iso_3166_1 === 'US') ||
        ratingResults[0];
      certification = regionalRating?.rating || '';
    }

    const providerResults = data['watch/providers']?.results || {};
    const providerData =
      providerResults[userRegion] ||
      providerResults['US'] ||
      providerResults['GB'] ||
      providerResults['IN'] ||
      (Object.values(providerResults)[0] as any);

    const streamingProviders: WatchProvider[] = [];
    if (providerData?.flatrate) {
      providerData.flatrate.forEach((p: any) => {
        streamingProviders.push({
          id: p.provider_id,
          name: p.provider_name,
          logoPath: getImageUrl(p.logo_path, 'w185'),
          type: 'stream',
        });
      });
    }

    const genres = (data.genres || []).map((g: any) => g.name);
    const productionCompanies = (data.production_companies || [])
      .slice(0, 3)
      .map((p: any) => p.name);

    const spokenLang = data.spoken_languages?.[0]?.english_name || data.original_language?.toUpperCase();

    return {
      runtime: mediaType === 'movie' ? data.runtime : data.episode_run_time?.[0] || undefined,
      numberOfSeasons: mediaType === 'tv' ? data.number_of_seasons : undefined,
      numberOfEpisodes: mediaType === 'tv' ? data.number_of_episodes : undefined,
      genres,
      director,
      writers,
      cinematographer,
      composer,
      productionCompanies,
      certification,
      tagline: data.tagline,
      budget: data.budget || undefined,
      revenue: data.revenue || undefined,
      language: spokenLang,
      cast,
      streamingProviders,
      trailerKey,
      backdropPath: data.backdrop_path ? getImageUrl(data.backdrop_path, 'w1280') : undefined,
      posterPath: data.poster_path ? getImageUrl(data.poster_path, 'w500') : undefined,
      overview: data.overview,
      voteAverage: data.vote_average ? Number(data.vote_average.toFixed(1)) : undefined,
      voteCount: data.vote_count,
    };
  } catch (error) {
    console.warn('Failed to fetch detailed media info from TMDB', error);
    return {
      genres: [],
      cast: [],
      streamingProviders: [],
    };
  }
};

// Map platform query IDs dynamically across US, India, UK, and Global regions
const getPlatformProviderQuery = (platform: string, region: string): { providerIds: string; networkId?: string } => {
  switch (platform) {
    case 'netflix':
      return { providerIds: '8', networkId: '213' };
    case 'prime':
      // 9 is Prime US/Global, 119 is Amazon Prime Video in India & Asia
      return { providerIds: region === 'IN' ? '119|9' : '9|119', networkId: '1024' };
    case 'disney':
      // 337 is Disney+, 122 is Disney+ Hotstar (India / SE Asia)
      return { providerIds: region === 'IN' ? '122|337' : '337|122', networkId: '2739' };
    case 'apple':
      return { providerIds: '350|2', networkId: '2552' };
    case 'max':
      // 1899 (Max), 384 (HBO Max), 49 (HBO), 220 (JioCinema in IN), 39 (Now/Sky in GB)
      if (region === 'IN') return { providerIds: '220|1899|384|49', networkId: '49' };
      if (region === 'GB') return { providerIds: '39|1899|384|49', networkId: '49' };
      return { providerIds: '1899|384|49', networkId: '49' };
    default:
      return { providerIds: '8|9|119|337|122|350|1899|384|220|39|15' };
  }
};

// Fetch Live OTT Streaming Releases & In Theaters from TMDB
export const fetchPlatformReleases = async (
  platform: 'all' | 'netflix' | 'prime' | 'disney' | 'apple' | 'max' | 'theaters'
): Promise<OTTReleaseItem[]> => {
  const platformNameMap: Record<string, 'Netflix' | 'Prime Video' | 'Disney+' | 'Apple TV+' | 'HBO Max' | 'Theaters'> = {
    netflix: 'Netflix',
    prime: 'Prime Video',
    disney: 'Disney+',
    apple: 'Apple TV+',
    max: 'HBO Max',
    theaters: 'Theaters',
  };

  try {
    const userRegion = getUserRegion();

    if (platform === 'theaters') {
      const res = await tmdbFetch('/movie/now_playing', { page: '1', region: userRegion });
      if (res.ok) {
        const data = await res.json();
        return (data.results || []).slice(0, 24).map((item: any) => ({
          id: item.id,
          title: item.title || item.name,
          mediaType: 'movie',
          posterPath: item.poster_path ? getImageUrl(item.poster_path, 'w500') : null,
          backdropPath: item.backdrop_path ? getImageUrl(item.backdrop_path, 'w1280') : null,
          releaseDate: item.release_date || new Date().toISOString().split('T')[0],
          platform: 'Theaters',
          voteAverage: Number((item.vote_average || 0).toFixed(1)),
          overview: item.overview || 'No synopsis available.',
          genres: (item.genre_ids || []).map((id: number) => GENRE_MAP[id]).filter(Boolean),
        }));
      }
    } else {
      const { providerIds, networkId } = getPlatformProviderQuery(platform, userRegion);
      const mappedPlatform = platform === 'all' ? 'Netflix' : platformNameMap[platform] || 'Netflix';

      // 1. Fetch latest movies and TV series with user's specific region & providers
      const [moviesRes, tvRes] = await Promise.all([
        tmdbFetch('/discover/movie', {
          sort_by: 'popularity.desc',
          with_watch_providers: providerIds,
          watch_region: userRegion,
          page: '1',
        }),
        tmdbFetch('/discover/tv', {
          sort_by: 'popularity.desc',
          with_watch_providers: providerIds,
          watch_region: userRegion,
          page: '1',
        }),
      ]);

      let moviesData = moviesRes.ok ? await moviesRes.json() : { results: [] };
      let tvData = tvRes.ok ? await tvRes.json() : { results: [] };

      // 2. Global Fallback: If region-specific query yielded 0 results (e.g. Max / Disney in region with unique distribution), query globally
      if ((moviesData.results?.length || 0) === 0 && (tvData.results?.length || 0) === 0) {
        const [fallbackMovies, fallbackTv] = await Promise.all([
          tmdbFetch('/discover/movie', {
            sort_by: 'popularity.desc',
            with_watch_providers: providerIds,
            watch_region: 'US',
            page: '1',
          }),
          tmdbFetch('/discover/tv', {
            sort_by: 'popularity.desc',
            ...(networkId ? { with_networks: networkId } : { with_watch_providers: providerIds, watch_region: 'US' }),
            page: '1',
          }),
        ]);

        if (fallbackMovies.ok) moviesData = await fallbackMovies.json();
        if (fallbackTv.ok) tvData = await fallbackTv.json();
      }

      const movies: OTTReleaseItem[] = (moviesData.results || []).slice(0, 16).map((item: any) => ({
        id: item.id,
        title: item.title,
        mediaType: 'movie',
        posterPath: item.poster_path ? getImageUrl(item.poster_path, 'w500') : null,
        backdropPath: item.backdrop_path ? getImageUrl(item.backdrop_path, 'w1280') : null,
        releaseDate: item.release_date || '',
        platform: mappedPlatform,
        voteAverage: Number((item.vote_average || 0).toFixed(1)),
        overview: item.overview || 'No synopsis available.',
        genres: (item.genre_ids || []).map((id: number) => GENRE_MAP[id]).filter(Boolean),
      }));

      const tvShows: OTTReleaseItem[] = (tvData.results || []).slice(0, 16).map((item: any) => ({
        id: item.id,
        title: item.name,
        mediaType: 'tv',
        posterPath: item.poster_path ? getImageUrl(item.poster_path, 'w500') : null,
        backdropPath: item.backdrop_path ? getImageUrl(item.backdrop_path, 'w1280') : null,
        releaseDate: item.first_air_date || '',
        platform: mappedPlatform,
        voteAverage: Number((item.vote_average || 0).toFixed(1)),
        overview: item.overview || 'No synopsis available.',
        genres: (item.genre_ids || []).map((id: number) => GENRE_MAP[id]).filter(Boolean),
      }));

      // Interleave movies and TV shows for a rich varied feed
      const combined: OTTReleaseItem[] = [];
      const maxLen = Math.max(movies.length, tvShows.length);
      for (let i = 0; i < maxLen; i++) {
        if (movies[i]) combined.push(movies[i]);
        if (tvShows[i]) combined.push(tvShows[i]);
      }

      return combined.slice(0, 30);
    }
  } catch (error) {
    console.warn('Failed to fetch platform releases', error);
  }

  return [];
};

// Clean empty initial array (No preloaded data)
export const INITIAL_WATCHLIST_DATA: WatchlistItem[] = [];
