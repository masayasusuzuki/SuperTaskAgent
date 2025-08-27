'use client';

import React from 'react';
import Goals from '@/components/Goals';

export default function GoalsPage() {
  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">目標管理</h1>
        <p className="text-gray-600 mt-1">月間目標の設定と進捗管理</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <Goals />
      </div>
    </div>
  );
}
