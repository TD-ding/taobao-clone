import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="pagination">
      <button disabled={page === 1} onClick={() => onPageChange(1)}>首页</button>
      <button disabled={page === 1} onClick={() => onPageChange(page - 1)}>上一页</button>
      {start > 1 && <span className="pagination-ellipsis">...</span>}
      {pages.map(p => (
        <button key={p} className={p === page ? 'active' : ''} onClick={() => onPageChange(p)}>{p}</button>
      ))}
      {end < totalPages && <span className="pagination-ellipsis">...</span>}
      <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>下一页</button>
      <button disabled={page === totalPages} onClick={() => onPageChange(totalPages)}>末页</button>
    </div>
  );
}