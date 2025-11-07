'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showInfo = true,
  totalItems = 0,
  itemsPerPage = 10
}: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
      {/* Info */}
      {showInfo && (
        <div className="mv-text-muted text-sm">
          Showing <span className="text-white font-medium">{startItem}</span> to{' '}
          <span className="text-white font-medium">{endItem}</span> of{' '}
          <span className="text-white font-medium">{totalItems}</span> results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
            currentPage === 1
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105'
          }`}
        >
          <span className="text-sm">◀</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <div className="w-10 h-10 flex items-center justify-center text-white/50">
                  <span className="text-sm">◈</span>
                </div>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-yellow-400 to-green-400 text-black scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
            currentPage === totalPages
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-white/10 hover:bg-white/20 text-white hover:scale-105'
          }`}
        >
          <span className="text-sm">▶</span>
        </button>
      </div>

      {/* Mobile Page Info */}
      <div className="sm:hidden mv-text-muted text-sm">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}