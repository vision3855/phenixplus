import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, Minus, Plus, Trash2, CheckCircle2, History } from 'lucide-react';
import { productService } from '../services/productService.js';
import { saleService } from '../services/saleService.js';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { TableSkeleton, EmptyState, Spinner } from '../components/Feedback.jsx';
import Pagination from '../components/Pagination.jsx';
import Badge from '../components/Badge.jsx';
import Modal from '../components/Modal.jsx';

const money = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ---------------- POS tab ---------------- */
function PosPanel() {
  const toast = useToast();
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const [cart, setCart] = useState({}); // productId -> qty
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      try {
        const data = await productService.list({ search: debounced || undefined, limit: 60 });
        if (!cancelled) setCatalog(data.products.filter((p) => p.stockQuantity > 0));
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debounced]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToCart = (p) => setCart((c) => {
    const current = c[p._id] ?? 0;
    if (current + 1 > p.stockQuantity) {
      toast.warning(`Only ${p.stockQuantity} × ${p.name} in stock`);
      return c;
    }
    return { ...c, [p._id]: current + 1 };
  });

  const setQty = (p, qty) => setCart((c) => {
    if (qty <= 0) {
      const { [p._id]: _drop, ...rest } = c;
      return rest;
    }
    return { ...c, [p._id]: Math.min(qty, p.stockQuantity) };
  });

  const lines = useMemo(
    () => Object.entries(cart).map(([id, qty]) => {
      const product = catalog.find((p) => p._id === id);
      return product ? { product, qty, lineTotal: product.sellingPrice * qty } : null;
    }).filter(Boolean),
    [cart, catalog]
  );

  const grandTotal = lines.reduce((s, l) => s + l.lineTotal, 0);

  const checkout = async () => {
    if (lines.length === 0) return toast.warning('Cart is empty');
    setSubmitting(true);
    try {
      const sale = await saleService.create({
        items: lines.map((l) => ({ productId: l.product._id, quantity: l.qty })),
        paymentMethod,
      });
      toast.success(`Sale #${sale._id.slice(-6).toUpperCase()} recorded — ${money(sale.totalAmount)}`);
      setReceipt(sale);
      setCart({});
      // Refresh stock in catalog
      const data = await productService.list({ search: debounced || undefined, limit: 60 });
      setCatalog(data.products.filter((p) => p.stockQuantity > 0));
    } catch (err) {
      toast.error(err.message || 'Sale failed — stock rolled back');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pos-grid">
      <div className="card panel">
        <div className="input-icon" style={{ marginBottom: '1rem' }}>
          <Search size={16} />
          <input className="input" placeholder="Scan or search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loadingCatalog ? (
          <Spinner label="Loading catalog…" />
        ) : catalog.length === 0 ? (
          <EmptyState title="No products available" hint="Add products in the Inventory section." />
        ) : (
          <div className="pos-product-grid">
            {catalog.map((p) => (
              <button key={p._id} className="pos-card" onClick={() => addToCart(p)}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3 }}>{p.name}</span>
                <span className="muted mono" style={{ fontSize: '0.72rem' }}>{p.sku}</span>
                <span className="flex" style={{ justifyContent: 'space-between' }}>
                  <span className="price" style={{ fontSize: '0.9rem' }}>{money(p.sellingPrice)}</span>
                  <span className="muted" style={{ fontSize: '0.72rem' }}>{p.stockQuantity} left</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card panel">
        <h3 className="flex gap-2"><ShoppingCart size={16} /> Current Sale</h3>
        {lines.length === 0 ? (
          <EmptyState title="Cart is empty" hint="Click products on the left to add them." />
        ) : (
          <>
            {lines.map(({ product, qty, lineTotal }) => (
              <div key={product._id} className="cart-line">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                  <div className="muted mono" style={{ fontSize: '0.75rem' }}>{money(product.sellingPrice)} each</div>
                </div>
                <div className="qty-ctrl">
                  <button onClick={() => setQty(product, qty - 1)} aria-label="Decrease quantity"><Minus size={13} /></button>
                  <span className="qty">{qty}</span>
                  <button onClick={() => setQty(product, qty + 1)} disabled={qty >= product.stockQuantity} aria-label="Increase quantity"><Plus size={13} /></button>
                </div>
                <span className="mono" style={{ fontWeight: 700, minWidth: 72, textAlign: 'right' }}>{money(lineTotal)}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setQty(product, 0)} aria-label="Remove line">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            <div style={{ marginTop: '1rem' }}>
              <div className="cart-total-row"><span className="muted">Items</span><span className="mono">{lines.reduce((s, l) => s + l.qty, 0)}</span></div>
              <div className="cart-total-row grand"><span>Total</span><span className="mono">{money(grandTotal)}</span></div>
            </div>

            <div className="field" style={{ marginTop: '0.75rem' }}>
              <label htmlFor="pay-method">Payment Method</label>
              <select id="pay-method" className="select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button className="btn btn-primary btn-block" onClick={checkout} disabled={submitting}>
              {submitting ? 'Processing…' : <><CheckCircle2 size={16} /> Complete Sale — {money(grandTotal)}</>}
            </button>
          </>
        )}
      </div>

      {/* Receipt confirmation */}
      <Modal open={Boolean(receipt)} onClose={() => setReceipt(null)} title="Sale Completed">
        {receipt && (
          <div>
            <div className="flex gap-2" style={{ color: 'var(--success)', marginBottom: '1rem' }}>
              <CheckCircle2 size={20} /> <strong>Sale recorded successfully</strong>
            </div>
            <div className="muted" style={{ fontSize: '0.82rem', marginBottom: '0.5rem' }}>#{receipt._id.slice(-8).toUpperCase()} · {fmtDate(receipt.soldAt)}</div>
            {receipt.items.map((it, i) => (
              <div key={i} className="cart-total-row">
                <span>{it.quantity} × {it.name}</span>
                <span className="mono">{money(it.lineTotal)}</span>
              </div>
            ))}
            <div className="cart-total-row grand"><span>Total ({receipt.paymentMethod})</span><span className="mono">{money(receipt.totalAmount)}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------------- History tab ---------------- */
function HistoryPanel() {
  const toast = useToast();
  const { isManager } = useAuth();
  const [sales, setSales] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await saleService.list({ page: p, limit: 15 });
      setSales(data.sales);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isManager) {
    return <EmptyState icon={History} title="Manager access required" hint="Ask an Admin or Manager to view transaction history." />;
  }

  return (
    <div className="card">
      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : sales.length === 0 ? (
        <EmptyState title="No transactions yet" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Receipt</th><th>Date</th><th>Cashier</th><th>Items</th><th>Payment</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s._id}>
                  <td className="mono muted">#{s._id.slice(-8).toUpperCase()}</td>
                  <td className="mono" style={{ fontSize: '0.82rem' }}>{fmtDate(s.soldAt)}</td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.cashier?.name ?? '—'}</div>
                    <div className="muted" style={{ fontSize: '0.72rem' }}>{s.cashier?.role}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', maxWidth: 320 }}>
                      {s.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                    </div>
                  </td>
                  <td><Badge tone="neutral">{s.paymentMethod.replace('_', ' ')}</Badge></td>
                  <td className="text-right mono" style={{ fontWeight: 700 }}>{money(s.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onChange={setPage} />
    </div>
  );
}

/* ---------------- Page shell ---------------- */
export default function SalesPage() {
  const [tab, setTab] = useState('pos');
  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Sales & POS</h2>
          <p className="muted" style={{ fontSize: '0.88rem' }}>Record transactions and review history</p>
        </div>
        <div className="flex gap-2">
          <button className={`btn btn-sm ${tab === 'pos' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('pos')}>
            <ShoppingCart size={14} /> Point of Sale
          </button>
          <button className={`btn btn-sm ${tab === 'history' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('history')}>
            <History size={14} /> Transactions
          </button>
        </div>
      </div>
      {tab === 'pos' ? <PosPanel /> : <HistoryPanel />}
    </div>
  );
}
