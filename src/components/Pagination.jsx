import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, onChange }) {
  if (!pages || pages < 1) return null;
  return (
    <div className="flex gap-3" style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
      <span className="muted" style={{ fontSize: '0.82rem' }}>
        {total.toLocaleString()} result{total === 1 ? '' : 's'}
      </span>
      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </button>
        <span className="muted" style={{ fontSize: '0.82rem', alignSelf: 'center' }}>
          Page {page} of {pages}
        </span>
        <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
