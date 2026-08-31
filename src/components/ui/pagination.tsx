"use client";

import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getRange = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const leftSibling = Math.max(1, currentPage - siblingCount);
  const rightSibling = Math.min(totalPages, currentPage + siblingCount);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < totalPages - 1;

  const pages: (number | "...")[] = [];

  if (leftSibling === 1) {
    pages.push(...getRange(1, rightSibling));
  } else {
    pages.push(1);
    if (showLeftDots) pages.push("...");
    pages.push(...getRange(leftSibling, rightSibling));
  }

  if (rightSibling < totalPages) {
    if (showRightDots) pages.push("...");
    pages.push(totalPages);
  }

  const buttonBase =
    "inline-flex h-9 min-w-9 items-center justify-center px-3 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

  return (
    <nav className={cn("flex items-center gap-1", className)} aria-label="Pagination">
      <button
        type="button"
        className={cn(buttonBase, "text-gray-700 hover:bg-gray-100")}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {pages.map((page, idx) =>
        page === "..." ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm text-gray-500"
          >
            ...
          </span>
        ) : (
          <button
            key={page}
            type="button"
            className={cn(
              buttonBase,
              page === currentPage
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "text-gray-700 hover:bg-gray-100"
            )}
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        type="button"
        className={cn(buttonBase, "text-gray-700 hover:bg-gray-100")}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </nav>
  );
}
