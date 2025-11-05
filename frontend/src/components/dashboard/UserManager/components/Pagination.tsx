import React from 'react';
import { ChevronDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination-modern">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronDown size={18} style={{ transform: 'rotate(90deg)' }} />
      </button>
      
      <div className="pagination-info">
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
        <span className="pagination-total">({totalItems} usuários)</span>
      </div>

      <button
        className="pagination-btn"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronDown size={18} style={{ transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  );
};

export default Pagination;
