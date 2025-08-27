'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink } from 'lucide-react';
import { googleCalendarClientService } from '@/lib/googleCalendarClient';

export default function AuthPage() {
  const handleGoogleAuth = async () => {
    try {
      const authUrl = await googleCalendarClientService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Googleカレンダー連携
          </h1>
          <p className="text-gray-600">
            Googleカレンダーと連携して、スケジュールを統合表示できます
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleGoogleAuth}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Googleカレンダーと連携
          </Button>
          
          <p className="text-xs text-gray-500">
            連携により、Googleカレンダーの読み取り権限を許可します
          </p>
        </div>
      </div>
    </div>
  );
}
