// src/components/common/RouteLoadingFallback.jsx
import React from 'react';

export function RouteLoadingFallback() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
      <p className="text-xs text-on-surface-variant font-medium animate-pulse">Đang tải...</p>
    </div>
  );
}

export default RouteLoadingFallback;
