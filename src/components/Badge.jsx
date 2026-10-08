export default function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export function stockBadge(stock, threshold) {
  if (stock === 0) return { tone: 'danger', label: 'Out of Stock' };
  if (stock <= threshold) return { tone: 'warning', label: 'Low Stock' };
  return { tone: 'success', label: 'In Stock' };
}
