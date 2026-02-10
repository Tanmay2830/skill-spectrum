
/**
 * YOUTUBE DATA API V3 SERVICE
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Google Cloud Console (https://console.cloud.google.com/)
 * 2. Create a Project or select an existing one.
 * 3. Enable "YouTube Data API v3" in the API Library.
 * 4. Create Credentials:
 *    - For public data (Search/Metadata): Use the API Key provided.
 *    - For private data (Playlists/Likes): Use OAuth 2.0 Client ID.
 * 
 * OAUTH 2.0 SCOPES:
 * - https://www.googleapis.com/auth/youtube.readonly (View your YouTube account)
 * - https://www.googleapis.com/auth/youtube (Manage your YouTube account)
 * 
 * ERROR HANDLING:
 * - 403: Quota exceeded or API Key invalid.
 * - 400: Invalid parameters.
 * - 401: Authorization required (OAuth only).
 */

const YOUTUBE_API_KEY = 'AIzaSyCG5oAiPyK8m7tvBdr6qiVBCYK-ACd2Cdo';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  viewCount?: string;
  publishedAt: string;
}

/**
 * Searches for videos using the YouTube Data API.
 * @param query Search keywords
 * @param maxResults Number of results to return
 */
export async function searchYouTubeVideos(query: string, maxResults = 5): Promise<YouTubeVideoInfo[]> {
  try {
    const url = `${BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`YouTube API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    
    // Fetch statistics (view counts) for these videos
    return await fetchYouTubeVideoStatistics(videoIds, data.items);
  } catch (error) {
    console.error("YouTube Search Failed:", error);
    return [];
  }
}

/**
 * Fetches detailed statistics for a list of video IDs.
 */
async function fetchYouTubeVideoStatistics(videoIds: string, searchItems: any[]): Promise<YouTubeVideoInfo[]> {
  try {
    const url = `${BASE_URL}/videos?part=statistics,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    return data.items.map((item: any) => {
      const searchItem = searchItems.find(si => si.id.videoId === item.id);
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        viewCount: item.statistics.viewCount,
        publishedAt: item.snippet.publishedAt
      };
    });
  } catch (error) {
    console.warn("Could not fetch video statistics, falling back to basic data.");
    return searchItems.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt
    }));
  }
}

/**
 * Retrieves specific metadata for a single video.
 */
export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoInfo | null> {
  try {
    const url = `${BASE_URL}/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url,
        viewCount: item.statistics.viewCount,
        publishedAt: item.snippet.publishedAt
      };
    }
    return null;
  } catch (error) {
    console.error("YouTube Metadata Retrieval Failed:", error);
    return null;
  }
}
