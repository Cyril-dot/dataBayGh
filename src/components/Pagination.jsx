export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn--ghost" disabled={page <= 0} onClick={() => onChange(page - 1)}>
        ← Prev
      </button>
      <span className="pagination__label">
        Page {page + 1} of {totalPages}
      </span>
      <button className="btn btn--ghost" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </div>
  );
}
