import { YouTubeVideo, YouTubeSearchResult } from '@/types';
import { getYouTubeConfig } from '@/lib/config';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export class YouTubeAPI {
  private static getApiKey() {
    const config = getYouTubeConfig();
    return config.apiKey;
  }

  static async searchVideos(query: string, maxResults: number = 20, pageToken?: string, videoDuration?: 'short' | 'medium' | 'long'): Promise<YouTubeSearchResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('YouTube API key is not configured');
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: maxResults.toString(),
      key: apiKey,
      order: 'relevance',
      videoEmbeddable: 'true'
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    if (videoDuration) {
      params.append('videoDuration', videoDuration);
    }

    const response = await fetch(`${YOUTUBE_API_BASE_URL}/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    // 動画の詳細情報を取得
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const videoDetails = await this.getVideoDetails(videoIds);

    const videos: YouTubeVideo[] = data.items.map((item: any, index: number) => {
      const details = videoDetails[index];
      return {
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: details?.duration || 'N/A',
        viewCount: details?.viewCount || 'N/A',
        likeCount: details?.likeCount || 'N/A'
      };
    });

    return {
      videos,
      nextPageToken: data.nextPageToken,
      totalResults: data.pageInfo.totalResults
    };
  }

  static async getVideoDetails(videoIds: string): Promise<any[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('YouTube API key is not configured');
    }

    const params = new URLSearchParams({
      part: 'statistics,contentDetails',
      id: videoIds,
      key: apiKey
    });

    const response = await fetch(`${YOUTUBE_API_BASE_URL}/videos?${params}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    return data.items.map((item: any) => ({
      duration: this.formatDuration(item.contentDetails.duration),
      viewCount: this.formatNumber(item.statistics.viewCount),
      likeCount: this.formatNumber(item.statistics.likeCount)
    }));
  }

  static async getPopularVideos(categoryId?: string, maxResults: number = 20, videoDuration?: 'short' | 'medium' | 'long'): Promise<YouTubeSearchResult> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('YouTube API key is not configured');
    }

    const params = new URLSearchParams({
      part: 'snippet',
      chart: 'mostPopular',
      regionCode: 'JP',
      maxResults: maxResults.toString(),
      key: apiKey,
      videoEmbeddable: 'true'
    });

    if (categoryId) {
      params.append('videoCategoryId', categoryId);
    }

    if (videoDuration) {
      params.append('videoDuration', videoDuration);
    }

    const response = await fetch(`${YOUTUBE_API_BASE_URL}/videos?${params}`);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    // 動画の詳細情報を取得
    const videoIds = data.items.map((item: any) => item.id).join(',');
    const videoDetails = await this.getVideoDetails(videoIds);

    const videos: YouTubeVideo[] = data.items.map((item: any, index: number) => {
      const details = videoDetails[index];
      return {
        id: item.id,
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        duration: details?.duration || 'N/A',
        viewCount: details?.viewCount || 'N/A',
        likeCount: details?.likeCount || 'N/A'
      };
    });

    return {
      videos,
      nextPageToken: data.nextPageToken,
      totalResults: data.pageInfo.totalResults
    };
  }

  private static formatDuration(duration: string): string {
    // ISO 8601形式の期間を読みやすい形式に変換
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 'N/A';

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  private static formatNumber(num: string): string {
    const number = parseInt(num);
    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1)}M`;
    } else if (number >= 1000) {
      return `${(number / 1000).toFixed(1)}K`;
    }
    return number.toString();
  }
}
