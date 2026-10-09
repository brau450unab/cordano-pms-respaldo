import React from 'react';

export const ViewLoadingSkeleton: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Cargando módulo operativo..."
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse select-none"
    >
      {/* Top Banner Skeleton */}
      <div className="h-16 bg-[#E2E8F0]/60 rounded-2xl border border-[#E2E8F0]" />

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-[#E2E8F0]/50 rounded-2xl border border-[#E2E8F0]" />
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 h-96 bg-[#E2E8F0]/40 rounded-2xl border border-[#E2E8F0]" />
        <div className="lg:col-span-5 h-96 bg-[#E2E8F0]/40 rounded-2xl border border-[#E2E8F0]" />
      </div>
    </div>
  );
};
