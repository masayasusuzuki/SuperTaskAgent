'use client';

import React, { useState, useEffect } from 'react';
import { Search, Play, Heart, Clock, Eye, ThumbsUp, Loader2, Star } from 'lucide-react';
import { useTaskStore } from '@/store/useStore';
import { YouTubeVideo, YouTubeFavorite } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const YouTube: React.FC = () => {
  const {
    youtubeVideos,
    youtubeFavorites,
    youtubeSearchQuery,
    youtubeCurrentVideo,
    youtubeIsLoading,
    setYouTubeSearchQuery,
    setYouTubeCurrentVideo,
    searchYouTubeVideos,
    getPopularYouTubeVideos,
    addYouTubeFavorite,
    removeYouTubeFavorite
  } = useTaskStore();

  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'popular' | 'favorites' | 'player'>('search');

  // 初期表示時に人気動画を取得
  useEffect(() => {
    if (youtubeVideos.length === 0) {
      getPopularYouTubeVideos();
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setYouTubeSearchQuery(searchInput);
      searchYouTubeVideos(searchInput);
      setActiveTab('search');
    }
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    setYouTubeCurrentVideo(video);
    setActiveTab('player');
  };

  const handleFavoriteToggle = (video: YouTubeVideo) => {
    const isFavorite = youtubeFavorites.some(f => f.videoId === video.videoId);
    
    if (isFavorite) {
      removeYouTubeFavorite(video.videoId);
    } else {
      const favorite: YouTubeFavorite = {
        id: Date.now().toString(),
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        addedAt: new Date()
      };
      addYouTubeFavorite(favorite);
    }
  };

  const isFavorite = (videoId: string) => {
    return youtubeFavorites.some(f => f.videoId === videoId);
  };

  const VideoCard: React.FC<{ video: YouTubeVideo; showFavorite?: boolean }> = ({ video, showFavorite = true }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-48 object-cover cursor-pointer"
          onClick={() => handleVideoClick(video)}
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {video.duration}
        </div>
        {showFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFavoriteToggle(video);
            }}
            className="absolute top-2 right-2 p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200"
          >
            <Heart
              size={16}
              className={isFavorite(video.videoId) ? 'text-red-500 fill-current' : 'text-gray-600'}
            />
          </button>
        )}
      </div>
      
      <div className="p-4">
        <h3 
          className="font-semibold text-gray-900 text-sm line-clamp-2 cursor-pointer hover:text-blue-600"
          onClick={() => handleVideoClick(video)}
        >
          {video.title}
        </h3>
        <p className="text-gray-600 text-xs mt-1">{video.channelTitle}</p>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {video.viewCount}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp size={12} />
            {video.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {new Date(video.publishedAt).toLocaleDateString('ja-JP')}
          </span>
        </div>
      </div>
    </div>
  );

  const VideoPlayer: React.FC = () => {
    if (!youtubeCurrentVideo) return null;

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-900 rounded-lg mb-4 flex items-center justify-center" style={{ height: '400px' }}>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeCurrentVideo.videoId}?autoplay=1`}
              title={youtubeCurrentVideo.title}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{youtubeCurrentVideo.title}</h2>
              <p className="text-gray-600 text-sm mb-2">{youtubeCurrentVideo.channelTitle}</p>
              <p className="text-gray-700 text-sm line-clamp-3">{youtubeCurrentVideo.description}</p>
            </div>
            <button
              onClick={() => handleFavoriteToggle(youtubeCurrentVideo)}
              className="ml-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
            >
              <Heart
                size={20}
                className={isFavorite(youtubeCurrentVideo.videoId) ? 'text-red-500 fill-current' : 'text-gray-600'}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* ヘッダー */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">YouTube 学習</h1>
          <p className="text-gray-600">学習に役立つ動画を検索・視聴できます</p>
        </div>
        <div className="flex items-center gap-2">
          <Star size={20} className="text-yellow-500" />
          <span className="text-sm text-gray-600">
            {youtubeFavorites.length} お気に入り
          </span>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex space-x-1 p-4">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'search' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            動画検索
          </button>
          <button
            onClick={() => {
              setActiveTab('popular');
              getPopularYouTubeVideos();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'popular' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            人気動画
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === 'favorites' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            お気に入り
          </button>
          {youtubeCurrentVideo && (
            <button
              onClick={() => setActiveTab('player')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                activeTab === 'player' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              再生中
            </button>
          )}
        </div>
      </div>

      {/* 検索バー */}
      {activeTab === 'search' && (
        <div className="bg-white border-b border-gray-200 p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              placeholder="学習したい内容を検索..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={youtubeIsLoading}>
              {youtubeIsLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              検索
            </Button>
          </form>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'player' && youtubeCurrentVideo && (
          <VideoPlayer />
        )}

        {(activeTab === 'search' || activeTab === 'popular') && (
          <div>
            {youtubeIsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">動画を読み込み中...</span>
              </div>
            ) : youtubeVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {youtubeVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Play size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">動画が見つかりませんでした</p>
                {activeTab === 'search' && (
                  <p className="text-sm text-gray-500 mt-2">別のキーワードで検索してみてください</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div>
            {youtubeFavorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {youtubeFavorites.map((favorite) => {
                  const video: YouTubeVideo = {
                    id: favorite.id,
                    videoId: favorite.videoId,
                    title: favorite.title,
                    description: '',
                    thumbnail: favorite.thumbnail,
                    channelTitle: favorite.channelTitle,
                    publishedAt: favorite.addedAt.toISOString(),
                    duration: '',
                    viewCount: '',
                    likeCount: ''
                  };
                  return <VideoCard key={favorite.id} video={video} showFavorite={false} />;
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">お気に入りの動画がありません</p>
                <p className="text-sm text-gray-500 mt-2">動画のハートボタンをクリックしてお気に入りに追加できます</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTube;
