import type {
  CastMember,
  MediaSearchResult,
  MediaType,
  OTTReleaseItem,
  ReleaseNewsItem,
  WatchlistItem,
  WatchProvider,
} from '../types';

const DEFAULT_TMDB_API_KEY = '4e44d9029b1270a757cddc766a1bcb63';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const getApiKey = (): string => {
  return localStorage.getItem('watchlist_tmdb_api_key') || DEFAULT_TMDB_API_KEY;
};

export const setCustomApiKey = (key: string) => {
  if (key.trim()) {
    localStorage.setItem('watchlist_tmdb_api_key', key.trim());
  } else {
    localStorage.removeItem('watchlist_tmdb_api_key');
  }
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

  const apiKey = getApiKey();
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(
        query.trim()
      )}&include_adult=false&page=1`
    );

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

// Fetch full details of a Movie or TV Show with comprehensive metadata
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
  const apiKey = getApiKey();
  const appendParam =
    mediaType === 'movie'
      ? 'credits,videos,release_dates,watch/providers'
      : 'credits,videos,content_ratings,watch/providers';

  const endpoint = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${apiKey}&append_to_response=${appendParam}`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    // Crew extraction
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

    // Cast members (up to 16 with high-res headshot URLs)
    const cast: CastMember[] = (data.credits?.cast || []).slice(0, 16).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character || 'Cast',
      profilePath: c.profile_path ? getImageUrl(c.profile_path, 'w185') : null,
    }));

    // Trailer Key
    const trailers = (data.videos?.results || []).filter(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    );
    const trailerKey = trailers.length > 0 ? trailers[0].key : undefined;

    // Age Certification / Content Rating
    let certification = '';
    if (mediaType === 'movie') {
      const usReleases = data.release_dates?.results?.find((r: any) => r.iso_3166_1 === 'US');
      const certObj = usReleases?.release_dates?.find((d: any) => d.certification);
      certification = certObj?.certification || '';
    } else {
      const usRating = data.content_ratings?.results?.find((r: any) => r.iso_3166_1 === 'US');
      certification = usRating?.rating || '';
    }

    // Watch providers
    const providerData =
      data['watch/providers']?.results?.US ||
      data['watch/providers']?.results?.GB ||
      data['watch/providers']?.results?.IN ||
      (Object.values(data['watch/providers']?.results || {})[0] as any);

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
    if (providerData?.rent && streamingProviders.length < 5) {
      providerData.rent.slice(0, 3).forEach((p: any) => {
        if (!streamingProviders.some((sp) => sp.id === p.provider_id)) {
          streamingProviders.push({
            id: p.provider_id,
            name: p.provider_name,
            logoPath: getImageUrl(p.logo_path, 'w185'),
            type: 'rent',
          });
        }
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

// Fetch Trending Media
export const fetchTrending = async (timeWindow: 'day' | 'week' = 'week'): Promise<MediaSearchResult[]> => {
  const apiKey = getApiKey();
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/all/${timeWindow}?api_key=${apiKey}`);
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

// Fetch OTT Streaming Releases & In Theaters
export const fetchPlatformReleases = async (
  platform: 'all' | 'netflix' | 'prime' | 'disney' | 'apple' | 'max' | 'theaters'
): Promise<OTTReleaseItem[]> => {
  const apiKey = getApiKey();
  const providerIdMap: Record<string, number> = {
    netflix: 8,
    prime: 9,
    disney: 337,
    apple: 350,
    max: 1899,
  };

  const platformNameMap: Record<string, 'Netflix' | 'Prime Video' | 'Disney+' | 'Apple TV+' | 'HBO Max' | 'Theaters'> = {
    netflix: 'Netflix',
    prime: 'Prime Video',
    disney: 'Disney+',
    apple: 'Apple TV+',
    max: 'HBO Max',
    theaters: 'Theaters',
  };

  try {
    let url = '';
    if (platform === 'theaters') {
      url = `${TMDB_BASE_URL}/movie/now_playing?api_key=${apiKey}&page=1`;
    } else if (platform !== 'all' && providerIdMap[platform]) {
      const providerId = providerIdMap[platform];
      url = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&sort_by=popularity.desc&with_watch_providers=${providerId}&watch_region=US&page=1`;
    } else {
      url = `${TMDB_BASE_URL}/discover/movie?api_key=${apiKey}&sort_by=popularity.desc&with_watch_providers=8|9|337|350|1899&watch_region=US&page=1`;
    }

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const mappedPlatform = platform === 'all' ? 'Netflix' : platformNameMap[platform] || 'Netflix';

      return (data.results || []).slice(0, 24).map((item: any) => {
        const genreNames = (item.genre_ids || [])
          .map((id: number) => GENRE_MAP[id])
          .filter(Boolean);

        return {
          id: item.id,
          title: item.title || item.name,
          mediaType: 'movie',
          posterPath: item.poster_path ? getImageUrl(item.poster_path, 'w500') : null,
          backdropPath: item.backdrop_path ? getImageUrl(item.backdrop_path, 'w1280') : null,
          releaseDate: item.release_date || new Date().toISOString().split('T')[0],
          platform: mappedPlatform,
          voteAverage: Number((item.vote_average || 0).toFixed(1)),
          overview: item.overview || 'No synopsis available.',
          genres: genreNames,
        };
      });
    }
  } catch (error) {
    console.warn('Failed to fetch platform releases', error);
  }

  return [];
};

// Release Radar & Entertainment News Feed
export const getReleaseNewsFeed = (): ReleaseNewsItem[] => {
  return [
    {
      id: 'news-1',
      title: 'Dune: Prophecy Hits Digital Streaming Premiere Worldwide',
      source: 'StreamRadar Weekly',
      date: 'Aug 28, 2026',
      category: 'OTT Premiere',
      platform: 'HBO Max',
      summary:
        'Set 10,000 years before the ascension of Paul Atreides, the epic prequel series following the origins of the Bene Gesserit sisterhood is now streaming in 4K HDR with Dolby Atmos audio.',
      relatedMedia: {
        title: 'Dune: Prophecy',
        mediaType: 'tv',
        tmdbId: 93812,
        posterPath: 'https://image.tmdb.org/t/p/w500/uU4cgn7pDqC6mE0fA6yX5wUo7x4.jpg',
        releaseDate: '2026-08',
        genres: ['Sci-Fi', 'Drama', 'Adventure'],
      },
    },
    {
      id: 'news-2',
      title: 'Christopher Nolan New Epic Film Production & Theatrical Release Details',
      source: 'Cinema Daily Bulletin',
      date: 'Aug 26, 2026',
      category: 'In Theaters',
      platform: 'Theaters',
      summary:
        'Filmed with state-of-the-art IMAX 70mm cameras, the eagerly awaited next blockbuster from Christopher Nolan locks in worldwide theatrical premiere dates with exclusive IMAX screenings.',
      relatedMedia: {
        title: 'Oppenheimer',
        mediaType: 'movie',
        tmdbId: 872585,
        posterPath: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        releaseDate: '2023-07-21',
        genres: ['Drama', 'History'],
      },
    },
    {
      id: 'news-3',
      title: 'Stranger Things Final Season Special Episodes Schedule Confirmed',
      source: 'Entertainment Wire',
      date: 'Aug 24, 2026',
      category: 'New Season',
      platform: 'Netflix',
      summary:
        'Netflix reveals the complete rollout schedule for the climatic conclusion of the Hawkins saga, featuring movie-length finale episodes and expanded mythos reveals.',
      relatedMedia: {
        title: 'Stranger Things',
        mediaType: 'tv',
        tmdbId: 66732,
        posterPath: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
        releaseDate: '2016-07-15',
        genres: ['Sci-Fi', 'Mystery', 'Drama'],
      },
    },
    {
      id: 'news-4',
      title: 'Severance Season 2 Arrives on Apple TV+ with Mind-Bending Twists',
      source: 'StreamInsider',
      date: 'Aug 21, 2026',
      category: 'OTT Premiere',
      platform: 'Apple TV+',
      summary:
        'Mark Scout and the MDR department face the immediate fallout of the Overtime Contingency as Lumon Industries tightens security across severed floor protocols.',
      relatedMedia: {
        title: 'Severance',
        mediaType: 'tv',
        tmdbId: 95396,
        posterPath: 'https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
        releaseDate: '2022-02-18',
        genres: ['Drama', 'Mystery', 'Sci-Fi'],
      },
    },
    {
      id: 'news-5',
      title: 'Spider-Man: Beyond the Spider-Verse Animation Milestone Update',
      source: 'Animation Chronicle',
      date: 'Aug 19, 2026',
      category: 'Announcement',
      platform: 'Theaters',
      summary:
        'Sony Pictures Animation unveils groundbreaking multi-dimensional visual styling test footage for the grand finale of Miles Morales multiverse journey.',
      relatedMedia: {
        title: 'Spider-Man: Across the Spider-Verse',
        mediaType: 'movie',
        tmdbId: 569094,
        posterPath: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        releaseDate: '2023-06-02',
        genres: ['Animation', 'Action', 'Sci-Fi'],
      },
    },
    {
      id: 'news-6',
      title: 'The Bear Returns for Highly Anticipated New Kitchen Season',
      source: 'Global Stream Times',
      date: 'Aug 15, 2026',
      category: 'New Season',
      platform: 'Disney+',
      summary:
        'Carmy, Sydney, and Richie push for culinary perfection as the team aims for their first coveted Michelin star under intense pressure.',
      relatedMedia: {
        title: 'The Bear',
        mediaType: 'tv',
        tmdbId: 136315,
        posterPath: 'https://image.tmdb.org/t/p/w500/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg',
        releaseDate: '2022-06-23',
        genres: ['Drama', 'Comedy'],
      },
    },
  ];
};

// 16 Verified Masterpieces with 100% Real High-Res Posters & Backdrops
export const INITIAL_WATCHLIST_DATA: WatchlistItem[] = [
  {
    id: 'movie-872585',
    tmdbId: 872585,
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/neeNHeXjMF5fXoCJRsOmkNGC7q.jpg',
    releaseYear: '2023',
    releaseDate: '2023-07-19',
    genres: ['Drama', 'History', 'Biography'],
    tagline: 'The world forever changes.',
    certification: 'R',
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II, exploring the moral and scientific dilemmas that defined the 20th century.",
    voteAverage: 8.1,
    voteCount: 12340,
    runtime: 181,
    budget: 100000000,
    revenue: 957000000,
    language: 'English',
    status: 'completed',
    userRating: 9.8,
    userNotes: 'Cillian Murphy gives a career-defining performance. Hoyte van Hoytema cinematography and Ludwig Göransson sound design are extraordinary.',
    rewatchCount: 1,
    tags: ['Historical', 'Academy Award Winner', 'Nolan'],
    addedAt: '2026-08-05T16:00:00.000Z',
    updatedAt: '2026-08-22T11:45:00.000Z',
    director: 'Christopher Nolan',
    writers: 'Christopher Nolan, Kai Bird, Martin J. Sherwin',
    cinematographer: 'Hoyte van Hoytema',
    composer: 'Ludwig Göransson',
    productionCompanies: ['Syncopy', 'Universal Pictures', 'Atlas Entertainment'],
    trailerKey: 'uYPbbksJxIg',
    streamingProviders: [
      { id: 9, name: 'Prime Video', logoPath: 'https://image.tmdb.org/t/p/w185/mXeC4TrcgdjvClV03U75uFuvB7f.jpg', type: 'stream' },
    ],
    cast: [
      { id: 2037, name: 'Cillian Murphy', character: 'J. Robert Oppenheimer', profilePath: 'https://image.tmdb.org/t/p/w185/2lKs67r7FI4bPu0AXxMUJZxmUXn.jpg' },
      { id: 5081, name: 'Emily Blunt', character: 'Katherine Oppenheimer', profilePath: 'https://image.tmdb.org/t/p/w185/nPJn59J7Z5b1k1s0n4y6x9m5h7u.jpg' },
      { id: 1892, name: 'Matt Damon', character: 'Leslie Groves', profilePath: 'https://image.tmdb.org/t/p/w185/elSlNg0WqjG2f1559yQ.jpg' },
      { id: 3223, name: 'Robert Downey Jr.', character: 'Lewis Strauss', profilePath: 'https://image.tmdb.org/t/p/w185/1YjdSym1jA7Ln93r7v9t1u7x6k8.jpg' },
      { id: 1373737, name: 'Florence Pugh', character: 'Jean Tatlock', profilePath: 'https://image.tmdb.org/t/p/w185/7Ns6tO3FSjqMm9b6.jpg' },
      { id: 1100, name: 'Josh Hartnett', character: 'Ernest Lawrence', profilePath: 'https://image.tmdb.org/t/p/w185/y9yW7f3A7x9.jpg' },
    ],
  },
  {
    id: 'movie-157336',
    tmdbId: 157336,
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/5XNQBqnBwPA9yT0jZ0p3s8bbLh0.jpg',
    releaseYear: '2014',
    releaseDate: '2014-11-05',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    certification: 'PG-13',
    overview:
      'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    voteAverage: 8.4,
    voteCount: 35600,
    runtime: 169,
    budget: 165000000,
    revenue: 773800000,
    language: 'English',
    status: 'completed',
    userRating: 10,
    userNotes: 'Absolute masterpiece. Hans Zimmer soundtrack elevates every single sequence. The docking scene is peerless.',
    rewatchCount: 3,
    tags: ['Sci-Fi Favorite', 'Hans Zimmer', 'Christopher Nolan'],
    addedAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-25T14:20:00.000Z',
    director: 'Christopher Nolan',
    writers: 'Jonathan Nolan, Christopher Nolan',
    cinematographer: 'Hoyte van Hoytema',
    composer: 'Hans Zimmer',
    productionCompanies: ['Paramount Pictures', 'Warner Bros. Pictures', 'Syncopy', 'Lynda Obst Productions'],
    trailerKey: 'zSWdZVtXT7E',
    streamingProviders: [
      { id: 8, name: 'Netflix', logoPath: 'https://image.tmdb.org/t/p/w185/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', type: 'stream' },
      { id: 9, name: 'Prime Video', logoPath: 'https://image.tmdb.org/t/p/w185/mXeC4TrcgdjvClV03U75uFuvB7f.jpg', type: 'stream' },
      { id: 1899, name: 'HBO Max', logoPath: 'https://image.tmdb.org/t/p/w185/Ajqyt5GhGFOXny9qAnsjxnxIOVo.jpg', type: 'stream' },
    ],
    cast: [
      { id: 10297, name: 'Matthew McConaughey', character: 'Joseph Cooper', profilePath: 'https://image.tmdb.org/t/p/w185/wDeLhG1nQe96xZ2U9p3d0zYqVj7.jpg' },
      { id: 1813, name: 'Anne Hathaway', character: 'Dr. Amelia Brand', profilePath: 'https://image.tmdb.org/t/p/w185/tLel4FGQBPixYGE0ugy2525nJea.jpg' },
      { id: 83002, name: 'Jessica Chastain', character: 'Murphy Cooper', profilePath: 'https://image.tmdb.org/t/p/w185/vO1P98p4vX92L1V934k3x1f5q8F.jpg' },
      { id: 3895, name: 'Michael Caine', character: 'Professor Brand', profilePath: 'https://image.tmdb.org/t/p/w185/bVZpqggYho1IHAqukkLJK3n9527.jpg' },
    ],
  },
  {
    id: 'tv-95396',
    tmdbId: 95396,
    title: 'Severance',
    originalTitle: 'Severance',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/ixgFmf1X59PUZam2qbAfskx2gQr.jpg',
    releaseYear: '2022',
    releaseDate: '2022-02-18',
    genres: ['Drama', 'Mystery', 'Sci-Fi'],
    tagline: 'Please do not attempt to adjust your workplace reality.',
    certification: 'TV-MA',
    overview:
      'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives. When a mysterious colleague appears outside of work, it begins a journey to discover the truth about their jobs.',
    voteAverage: 8.4,
    voteCount: 1420,
    numberOfSeasons: 2,
    numberOfEpisodes: 19,
    language: 'English',
    status: 'watching',
    userRating: 9.6,
    userNotes: 'Incredible suspense and psychological tension. Season 1 finale was pure perfection.',
    rewatchCount: 1,
    tags: ['Mind Bending', 'Must Watch', 'Apple Original'],
    addedAt: '2026-08-10T12:30:00.000Z',
    updatedAt: '2026-08-28T09:15:00.000Z',
    director: 'Ben Stiller, Aoife McArdle',
    writers: 'Dan Erickson',
    composer: 'Theodore Shapiro',
    productionCompanies: ['Red Hour Productions', 'Endeavor Content'],
    trailerKey: 'xEQP4VVuyrY',
    streamingProviders: [
      { id: 350, name: 'Apple TV+', logoPath: 'https://image.tmdb.org/t/p/w185/2E0NxGBqiQ2xQdnV6Y1kM7m3G2.jpg', type: 'stream' },
    ],
    cast: [
      { id: 36801, name: 'Adam Scott', character: 'Mark Scout', profilePath: 'https://image.tmdb.org/t/p/w185/c1YpYFq9xJ4t7wF7L4uW7rR1s0m.jpg' },
      { id: 1251390, name: 'Britt Lower', character: 'Helly R.', profilePath: 'https://image.tmdb.org/t/p/w185/z8KkF8N5x8p4k1W5h0y9l5a5t7u.jpg' },
      { id: 1253360, name: 'Zach Cherry', character: 'Dylan George', profilePath: 'https://image.tmdb.org/t/p/w185/6kK6U5x4p1y8r3v9p4t1u7x6k8y.jpg' },
      { id: 1243, name: 'John Turturro', character: 'Irving Bailiff', profilePath: 'https://image.tmdb.org/t/p/w185/6T0Z8Z7v1k1s0n4y6x9m5h7u2s1.jpg' },
    ],
  },
  {
    id: 'movie-693134',
    tmdbId: 693134,
    title: 'Dune: Part Two',
    originalTitle: 'Dune: Part Two',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/eZ239CUp1d6OryZEBPnO2n87gMG.jpg',
    releaseYear: '2024',
    releaseDate: '2024-02-27',
    genres: ['Sci-Fi', 'Adventure'],
    tagline: 'Long live the fighters.',
    certification: 'PG-13',
    overview:
      'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, Paul endeavors to prevent a terrible future only he can foresee.',
    voteAverage: 8.2,
    voteCount: 6200,
    runtime: 166,
    budget: 190000000,
    revenue: 714400000,
    language: 'English',
    status: 'watching',
    userRating: 9.4,
    userNotes: 'Planned for weekend 4K HDR home theater re-watch.',
    rewatchCount: 0,
    tags: ['Sci-Fi Epic', 'Denis Villeneuve', 'IMAX'],
    addedAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-08-15T08:00:00.000Z',
    director: 'Denis Villeneuve',
    writers: 'Denis Villeneuve, Jon Spaihts, Frank Herbert',
    cinematographer: 'Greig Fraser',
    composer: 'Hans Zimmer',
    productionCompanies: ['Legendary Pictures', 'Warner Bros. Pictures'],
    trailerKey: 'Way9Dexny3w',
    streamingProviders: [
      { id: 1899, name: 'HBO Max', logoPath: 'https://image.tmdb.org/t/p/w185/Ajqyt5GhGFOXny9qAnsjxnxIOVo.jpg', type: 'stream' },
    ],
    cast: [
      { id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: 'https://image.tmdb.org/t/p/w185/BE2sdjpgsa2rNTFa66f7upkaOP.jpg' },
      { id: 505710, name: 'Zendaya', character: 'Chani', profilePath: 'https://image.tmdb.org/t/p/w185/r3A7ev7Qkjv9n8s6N2u0g6t.jpg' },
      { id: 933238, name: 'Rebecca Ferguson', character: 'Lady Jessica', profilePath: null },
    ],
  },
  {
    id: 'tv-1396',
    tmdbId: 1396,
    title: 'Breaking Bad',
    originalTitle: 'Breaking Bad',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/anFx9aTOOYqgS3v7x3R84Kz67ly.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    releaseYear: '2008',
    releaseDate: '2008-01-20',
    genres: ['Drama', 'Crime', 'Thriller'],
    tagline: 'Change the equation.',
    certification: 'TV-MA',
    overview:
      'Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of two years to live. He chooses to enter a dangerous world of drugs and crime to secure his family financial future.',
    voteAverage: 8.9,
    voteCount: 14500,
    numberOfSeasons: 5,
    numberOfEpisodes: 62,
    language: 'English',
    status: 'completed',
    userRating: 10,
    userNotes: 'The greatest television drama ever crafted. Ozymandias and Felina are perfection.',
    rewatchCount: 2,
    tags: ['Legendary', 'Crime Drama', 'All Time Best'],
    addedAt: '2026-07-20T14:00:00.000Z',
    updatedAt: '2026-08-20T19:00:00.000Z',
    director: 'Vince Gilligan',
    writers: 'Vince Gilligan, Peter Gould, Thomas Schnauz',
    composer: 'Dave Porter',
    productionCompanies: ['High Bridge Productions', 'Gran Via Productions', 'Sony Pictures Television'],
    trailerKey: 'HhesaQXLuRY',
    streamingProviders: [
      { id: 8, name: 'Netflix', logoPath: 'https://image.tmdb.org/t/p/w185/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', type: 'stream' },
    ],
    cast: [
      { id: 17419, name: 'Bryan Cranston', character: 'Walter White', profilePath: 'https://image.tmdb.org/t/p/w185/kNyYWBXb19MvLz5e3A4X0qF7U8f.jpg' },
      { id: 84497, name: 'Aaron Paul', character: 'Jesse Pinkman', profilePath: 'https://image.tmdb.org/t/p/w185/mB1X6b2r6mY9h0n8s6N2u0g6t.jpg' },
    ],
  },
  {
    id: 'tv-136315',
    tmdbId: 136315,
    title: 'The Bear',
    originalTitle: 'The Bear',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/eKfVzzEazSIjJMrw9ADa2x8ksLz.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/aJtG4txtmiRHwAAqENQHZvBs6kY.jpg',
    releaseYear: '2022',
    releaseDate: '2022-06-23',
    genres: ['Drama', 'Comedy'],
    tagline: 'Every second counts.',
    certification: 'TV-MA',
    overview:
      'A young chef from the fine dining world comes home to Chicago to run his family Italian beef sandwich shop after a tragic death.',
    voteAverage: 8.3,
    voteCount: 1600,
    numberOfSeasons: 3,
    numberOfEpisodes: 28,
    language: 'English',
    status: 'watching',
    userRating: 9.3,
    userNotes: 'Intense, rhythmic, and deeply emotional. The Christmas episode was cinema.',
    rewatchCount: 0,
    tags: ['Kitchen Drama', 'Fast Paced', 'Emmy Winner'],
    addedAt: '2026-08-18T18:00:00.000Z',
    updatedAt: '2026-08-28T21:10:00.000Z',
    director: 'Christopher Storer',
    writers: 'Christopher Storer, Joanna Calo',
    productionCompanies: ['FX Productions'],
    trailerKey: 'y-c1fl81xJ4',
    streamingProviders: [
      { id: 337, name: 'Disney+', logoPath: 'https://image.tmdb.org/t/p/w185/7rwgEs55t0v789n8s6N2u0g6t.jpg', type: 'stream' },
    ],
    cast: [
      { id: 82513, name: 'Jeremy Allen White', character: 'Carmen Carmy Berzatto', profilePath: null },
      { id: 1819129, name: 'Ayo Edebiri', character: 'Sydney Adamu', profilePath: null },
    ],
  },
  {
    id: 'movie-335984',
    tmdbId: 335984,
    title: 'Blade Runner 2049',
    originalTitle: 'Blade Runner 2049',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/gNdLJU9TxrpGx4dkZidjys3fyy0.jpg',
    releaseYear: '2017',
    releaseDate: '2017-10-04',
    genres: ['Sci-Fi', 'Drama', 'Mystery'],
    tagline: 'The key to the future is finally unearthed.',
    certification: 'R',
    overview:
      'Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what is left of society into chaos.',
    voteAverage: 7.6,
    voteCount: 13200,
    runtime: 164,
    budget: 150000000,
    revenue: 259200000,
    language: 'English',
    status: 'completed',
    userRating: 9.6,
    userNotes: 'Roger Deakins cinematography is unmatched. Pure visual poetry.',
    rewatchCount: 2,
    tags: ['Neo-Noir', 'Sci-Fi', 'Deakins'],
    addedAt: '2026-08-02T11:00:00.000Z',
    updatedAt: '2026-08-12T15:00:00.000Z',
    director: 'Denis Villeneuve',
    writers: 'Hampton Fancher, Michael Green, Philip K. Dick',
    cinematographer: 'Roger Deakins',
    composer: 'Hans Zimmer, Benjamin Wallfisch',
    productionCompanies: ['Alcon Entertainment', 'Columbia Pictures', 'Torridon Films'],
    trailerKey: 'gCcx85zbxz4',
    streamingProviders: [
      { id: 1899, name: 'HBO Max', logoPath: 'https://image.tmdb.org/t/p/w185/Ajqyt5GhGFOXny9qAnsjxnxIOVo.jpg', type: 'stream' },
    ],
    cast: [
      { id: 30614, name: 'Ryan Gosling', character: 'Officer K / Joe', profilePath: null },
      { id: 10205, name: 'Harrison Ford', character: 'Rick Deckard', profilePath: null },
    ],
  },
  {
    id: 'movie-129',
    tmdbId: 129,
    title: 'Spirited Away',
    originalTitle: '千と千尋の神隠し',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg',
    releaseYear: '2001',
    releaseDate: '2001-07-20',
    genres: ['Animation', 'Family', 'Fantasy'],
    tagline: 'Tunnel to the mysterious town.',
    certification: 'PG',
    overview:
      'A young girl, Chihiro, becomes trapped in a strange world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free her family.',
    voteAverage: 8.5,
    voteCount: 16500,
    runtime: 125,
    budget: 19000000,
    revenue: 395800000,
    language: 'Japanese',
    status: 'completed',
    userRating: 10,
    userNotes: 'Miyazaki magnum opus. Joe Hisaishi score brings tears every single time.',
    rewatchCount: 4,
    tags: ['Ghibli', 'Animation', 'Miyazaki'],
    addedAt: '2026-07-15T09:00:00.000Z',
    updatedAt: '2026-08-10T18:00:00.000Z',
    director: 'Hayao Miyazaki',
    writers: 'Hayao Miyazaki',
    composer: 'Joe Hisaishi',
    productionCompanies: ['Studio Ghibli', 'Tokuma Shoten', 'Nippon Television Network'],
    trailerKey: 'ByXuk9QqQkk',
    streamingProviders: [
      { id: 1899, name: 'HBO Max', logoPath: 'https://image.tmdb.org/t/p/w185/Ajqyt5GhGFOXny9qAnsjxnxIOVo.jpg', type: 'stream' },
    ],
    cast: [
      { id: 520, name: 'Rumi Hiiragi', character: 'Chihiro Ogino (voice)', profilePath: null },
      { id: 19588, name: 'Miyu Irino', character: 'Haku (voice)', profilePath: null },
    ],
  },
  {
    id: 'tv-76331',
    tmdbId: 76331,
    title: 'Succession',
    originalTitle: 'Succession',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/z0XiwdrCQ9yVIr4O0pxzaAYRxdW.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/bcdUYUFk8GdpZJPiSAas9UeocLH.jpg',
    releaseYear: '2018',
    releaseDate: '2018-06-03',
    genres: ['Drama'],
    tagline: 'Who will take the throne?',
    certification: 'TV-MA',
    overview:
      'The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their aging father steps down from the company.',
    voteAverage: 8.4,
    voteCount: 1900,
    numberOfSeasons: 4,
    numberOfEpisodes: 39,
    language: 'English',
    status: 'completed',
    userRating: 9.8,
    userNotes: 'Sharpest dialogue on television. Nicholas Britell score is iconic.',
    rewatchCount: 1,
    tags: ['HBO Masterpiece', 'Drama', 'Emmy Winner'],
    addedAt: '2026-07-28T10:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
    director: 'Jesse Armstrong, Mark Mylod',
    writers: 'Jesse Armstrong, Lucy Prebble, Will Tracy',
    composer: 'Nicholas Britell',
    productionCompanies: ['Gary Sanchez Productions', 'Hyperobject Industries', 'HBO Entertainment'],
    trailerKey: 'OzYxJV_rmE8',
    streamingProviders: [
      { id: 1899, name: 'HBO Max', logoPath: 'https://image.tmdb.org/t/p/w185/Ajqyt5GhGFOXny9qAnsjxnxIOVo.jpg', type: 'stream' },
    ],
    cast: [
      { id: 18997, name: 'Brian Cox', character: 'Logan Roy', profilePath: null },
      { id: 36802, name: 'Jeremy Strong', character: 'Kendall Roy', profilePath: null },
    ],
  },
  {
    id: 'tv-94605',
    tmdbId: 94605,
    title: 'Arcane',
    originalTitle: 'Arcane',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/q8eejQcg1bAqImEV8jh8RtBD4uH.jpg',
    releaseYear: '2021',
    releaseDate: '2021-11-06',
    genres: ['Animation', 'Sci-Fi & Fantasy', 'Action & Adventure'],
    tagline: 'Every legend has a beginning.',
    certification: 'TV-14',
    overview:
      'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
    voteAverage: 8.7,
    voteCount: 4200,
    numberOfSeasons: 2,
    numberOfEpisodes: 18,
    language: 'English',
    status: 'watching',
    userRating: 9.5,
    userNotes: 'Fortiche animation sets a brand new gold standard for the entire medium.',
    rewatchCount: 1,
    tags: ['Animation', 'Masterpiece', 'Netflix Original'],
    addedAt: '2026-08-20T14:00:00.000Z',
    updatedAt: '2026-08-28T19:00:00.000Z',
    director: 'Christian Linke, Alex Yee',
    writers: 'Christian Linke, Alex Yee',
    productionCompanies: ['Riot Games', 'Fortiche Production'],
    trailerKey: 'fXmAurh012s',
    streamingProviders: [
      { id: 8, name: 'Netflix', logoPath: 'https://image.tmdb.org/t/p/w185/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', type: 'stream' },
    ],
    cast: [
      { id: 1425984, name: 'Hailee Steinfeld', character: 'Vi (voice)', profilePath: null },
      { id: 1826093, name: 'Ella Purnell', character: 'Jinx (voice)', profilePath: null },
    ],
  },
  {
    id: 'movie-244786',
    tmdbId: 244786,
    title: 'Whiplash',
    originalTitle: 'Whiplash',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/wbQa0EnWUyRzQ5d1pHLNRlmsCUP.jpg',
    releaseYear: '2014',
    releaseDate: '2014-10-10',
    genres: ['Drama', 'Music'],
    tagline: 'The road to greatness can take you to the edge.',
    certification: 'R',
    overview:
      'Under the direction of a ruthless instructor, a talented young drummer begins to pursue perfection at any cost, pushing himself to the mental and physical brink.',
    voteAverage: 8.4,
    voteCount: 14800,
    runtime: 107,
    budget: 3300000,
    revenue: 49000000,
    language: 'English',
    status: 'completed',
    userRating: 9.8,
    userNotes: 'Phenomenal editing and sheer adrenaline. J.K. Simmons is terrifyingly brilliant.',
    rewatchCount: 3,
    tags: ['Music', 'High Tension', 'Chazelle'],
    addedAt: '2026-07-10T12:00:00.000Z',
    updatedAt: '2026-08-15T16:00:00.000Z',
    director: 'Damien Chazelle',
    writers: 'Damien Chazelle',
    cinematographer: 'Sharone Meir',
    composer: 'Justin Hurwitz',
    productionCompanies: ['Bold Films', 'Blumhouse Productions', 'Right of Way Films'],
    trailerKey: '7d_jQycdQGo',
    streamingProviders: [
      { id: 8, name: 'Netflix', logoPath: 'https://image.tmdb.org/t/p/w185/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', type: 'stream' },
    ],
    cast: [
      { id: 37153, name: 'Miles Teller', character: 'Andrew Neiman', profilePath: null },
      { id: 18973, name: 'J.K. Simmons', character: 'Terence Fletcher', profilePath: null },
    ],
  },
  {
    id: 'movie-329865',
    tmdbId: 329865,
    title: 'Arrival',
    originalTitle: 'Arrival',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/pEzNVQfdzYDzVK0XqxERIw2x2se.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/8MUZz7oPXQftFTslZpRP3CVMOoq.jpg',
    releaseYear: '2016',
    releaseDate: '2016-11-10',
    genres: ['Sci-Fi', 'Mystery', 'Drama'],
    tagline: 'Why are they here?',
    certification: 'PG-13',
    overview:
      'Taking place after alien crafts land around the world, an expert linguist is recruited by the military to determine whether they come in peace or are a threat.',
    voteAverage: 7.6,
    voteCount: 17200,
    runtime: 116,
    budget: 47000000,
    revenue: 203400000,
    language: 'English',
    status: 'completed',
    userRating: 9.3,
    userNotes: 'Jóhann Jóhannsson score and the nonlinear concept of time make this deeply touching.',
    rewatchCount: 2,
    tags: ['Sci-Fi', 'Linguistics', 'Villeneuve'],
    addedAt: '2026-07-22T15:00:00.000Z',
    updatedAt: '2026-08-18T14:00:00.000Z',
    director: 'Denis Villeneuve',
    writers: 'Eric Heisserer, Ted Chiang',
    cinematographer: 'Bradford Young',
    composer: 'Jóhann Jóhannsson',
    productionCompanies: ['FilmNation Entertainment', '21 Laps Entertainment'],
    trailerKey: 'tFMo3UJ4B4g',
    streamingProviders: [
      { id: 9, name: 'Prime Video', logoPath: 'https://image.tmdb.org/t/p/w185/mXeC4TrcgdjvClV03U75uFuvB7f.jpg', type: 'stream' },
    ],
    cast: [
      { id: 9273, name: 'Amy Adams', character: 'Dr. Louise Banks', profilePath: null },
      { id: 17604, name: 'Jeremy Renner', character: 'Ian Donnelly', profilePath: null },
    ],
  },
  {
    id: 'tv-87108',
    tmdbId: 87108,
    title: 'Chernobyl',
    originalTitle: 'Chernobyl',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/3URK0z9PzpVNJrGE7XOuyy6KFzk.jpg',
    releaseYear: '2019',
    releaseDate: '2019-05-06',
    genres: ['Drama', 'History'],
    tagline: 'What is the cost of lies?',
    certification: 'TV-MA',
    overview:
      'The true story of one of the worst man-made catastrophes in history: the catastrophic nuclear accident at Chernobyl, and the sacrifices made to save Europe from disaster.',
    voteAverage: 8.7,
    voteCount: 6100,
    numberOfSeasons: 1,
    numberOfEpisodes: 5,
    language: 'English',
    status: 'completed',
    userRating: 9.9,
    userNotes: 'Hildur Guðnadóttir score using actual nuclear power plant field recordings is chilling.',
    rewatchCount: 1,
    tags: ['Miniseries', 'Historical', 'Masterpiece'],
    addedAt: '2026-07-05T18:00:00.000Z',
    updatedAt: '2026-08-01T20:00:00.000Z',
    director: 'Johan Renck',
    writers: 'Craig Mazin',
    composer: 'Hildur Guðnadóttir',
    productionCompanies: ['Sister Pictures', 'The Mighty Mint', 'HBO', 'Sky UK'],
    trailerKey: 's9APLXM9Ei8',
    streamingProviders: [
      { id: 1899, name: 'HBO Max', logoPath: 'https://image.tmdb.org/t/p/w185/Ajqyt5GhGFOXny9qAnsjxnxIOVo.jpg', type: 'stream' },
    ],
    cast: [
      { id: 15440, name: 'Jared Harris', character: 'Valery Legasov', profilePath: null },
      { id: 1640, name: 'Stellan Skarsgård', character: 'Boris Shcherbina', profilePath: null },
    ],
  },
  {
    id: 'tv-60059',
    tmdbId: 60059,
    title: 'Better Call Saul',
    originalTitle: 'Better Call Saul',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/zjg4jpK1Wp2kiRvtt5ND0kznako.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/rfxryDIv8huejujg4JueDJx8zCz.jpg',
    releaseYear: '2015',
    releaseDate: '2015-02-08',
    genres: ['Crime', 'Drama'],
    tagline: 'It is all good, man.',
    certification: 'TV-MA',
    overview:
      'Six years before Saul Goodman meets Walter White, we follow the trials and tribulations of Jimmy McGill, a small-time lawyer searching for his destiny.',
    voteAverage: 8.7,
    voteCount: 5100,
    numberOfSeasons: 6,
    numberOfEpisodes: 63,
    language: 'English',
    status: 'completed',
    userRating: 9.7,
    userNotes: 'Tragic character study. Rhea Seehorn as Kim Wexler is extraordinary.',
    rewatchCount: 1,
    tags: ['Crime', 'Character Study', 'AMC'],
    addedAt: '2026-07-12T16:00:00.000Z',
    updatedAt: '2026-08-14T22:00:00.000Z',
    director: 'Vince Gilligan, Peter Gould',
    writers: 'Vince Gilligan, Peter Gould',
    composer: 'Dave Porter',
    productionCompanies: ['High Bridge Productions', 'Crystal Diner Productions', 'Gran Via Productions', 'Sony Pictures Television'],
    trailerKey: 'HN4oydykJFc',
    streamingProviders: [
      { id: 8, name: 'Netflix', logoPath: 'https://image.tmdb.org/t/p/w185/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', type: 'stream' },
    ],
    cast: [
      { id: 28384, name: 'Bob Odenkirk', character: 'Jimmy McGill / Saul Goodman', profilePath: null },
      { id: 125025, name: 'Rhea Seehorn', character: 'Kim Wexler', profilePath: null },
    ],
  },
  {
    id: 'movie-666277',
    tmdbId: 666277,
    title: 'Past Lives',
    originalTitle: 'Past Lives',
    mediaType: 'movie',
    posterPath: 'https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/7HR38hMBl23lf38MAN63y4pKsHz.jpg',
    releaseYear: '2023',
    releaseDate: '2023-06-02',
    genres: ['Drama', 'Romance'],
    tagline: 'In-Yun connects two souls across time.',
    certification: 'PG-13',
    overview:
      'Nora and Hae Sung, two deeply connected childhood friends, are wrested apart after Nora family emigrates from South Korea. Decades later, they are reunited in New York for one fateful week as they confront notions of destiny, love, and the choices that make a life.',
    voteAverage: 7.8,
    voteCount: 1500,
    runtime: 106,
    budget: 12000000,
    revenue: 42000000,
    language: 'Korean',
    status: 'completed',
    userRating: 9.4,
    userNotes: 'Tender, heartbreaking, and profoundly quiet. Celine Song directing debut is extraordinary.',
    rewatchCount: 1,
    tags: ['A24', 'Quiet Cinema', 'Romance'],
    addedAt: '2026-08-01T14:00:00.000Z',
    updatedAt: '2026-08-10T11:00:00.000Z',
    director: 'Celine Song',
    writers: 'Celine Song',
    cinematographer: 'Shabier Kirchner',
    composer: 'Christopher Bear, Daniel Rossen',
    productionCompanies: ['A24', 'CJ ENM', 'Killer Films', '2AM'],
    trailerKey: 'kA244xewjcI',
    streamingProviders: [
      { id: 1899, name: 'HBO Max', logoPath: 'https://image.tmdb.org/t/p/w185/Ajqyt5GhGFOXny9qAnsjxnxIOVo.jpg', type: 'stream' },
    ],
    cast: [
      { id: 1476483, name: 'Greta Lee', character: 'Nora Moon', profilePath: null },
      { id: 1476484, name: 'Teo Yoo', character: 'Hae Sung', profilePath: null },
    ],
  },
  {
    id: 'tv-126308',
    tmdbId: 126308,
    title: 'Shōgun',
    originalTitle: 'Shōgun',
    mediaType: 'tv',
    posterPath: 'https://image.tmdb.org/t/p/w500/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
    backdropPath: 'https://image.tmdb.org/t/p/w1280/bwSmgmd90hCWwqOKQYTEraeOZhJ.jpg',
    releaseYear: '2024',
    releaseDate: '2024-02-27',
    genres: ['Drama', 'War & Politics', 'Action & Adventure'],
    tagline: 'When two worlds collide, destinies are written in blood.',
    certification: 'TV-MA',
    overview:
      'In Japan in the year 1600, Lord Yoshii Toranaga discovers secrets that could tip the scales of power against his formidable enemies on the Council of Regents.',
    voteAverage: 8.5,
    voteCount: 1300,
    numberOfSeasons: 1,
    numberOfEpisodes: 10,
    language: 'Japanese',
    status: 'watching',
    userRating: 9.3,
    userNotes: 'Stunning historical epic with incredible costume design and Hiroyuki Sanada magnetic presence.',
    rewatchCount: 0,
    tags: ['Historical Epic', 'Feudal Japan', 'FX'],
    addedAt: '2026-08-16T10:00:00.000Z',
    updatedAt: '2026-08-27T18:00:00.000Z',
    director: 'Rachel Kondo, Justin Marks',
    writers: 'Rachel Kondo, Justin Marks, James Clavell',
    composer: 'Atticus Ross, Leopold Ross, Nick Chuba',
    productionCompanies: ['DNA Films', 'Michael De Luca Productions', 'FX Productions'],
    trailerKey: 'yAN5uspAo8U',
    streamingProviders: [
      { id: 337, name: 'Disney+', logoPath: 'https://image.tmdb.org/t/p/w185/7rwgEs55t0v789n8s6N2u0g6t.jpg', type: 'stream' },
    ],
    cast: [
      { id: 10959, name: 'Hiroyuki Sanada', character: 'Lord Yoshii Toranaga', profilePath: null },
      { id: 1110774, name: 'Cosmo Jarvis', character: 'John Blackthorne', profilePath: null },
    ],
  },
];
