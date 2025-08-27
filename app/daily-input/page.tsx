'use client';

import React from 'react';
import DailyInput from '@/components/DailyInput';

export default function DailyInputPage() {
  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">日次入力</h1>
        <p className="text-gray-600 mt-1">今日の実績を記録しましょう</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <DailyInput />
      </div>
    </div>
  );
}
