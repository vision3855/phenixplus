import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Archive, PackagePlus, Pencil, ArrowUpDown } from 'lucide-react';
import Badge, { stockBadge } from '../components/Badge.jsx';
import Pagination from '../components/Pagination.jsx';
import Modal from '../components/Modal.jsx';
import ProductFormModal from '../components/ProductFormModal.jsx';
import StockAdjustModal from '../components/StockAdjustModal.jsx';
import { TableSkeleton, EmptyState } from '../components/Feedback.jsx';
import { productService } from '../services/productService.js';
import { categoryService } from '../services/categoryService.js';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';

const money = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function InventoryPage() {
  const toast = useToast();
  const { isManager } = useAuth();
  const [params, setParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters from URL so state is shareable/bookmarkable
  const query = {
    page: Number(params.get('page')) || 1,
    search: params.get('search') || '',
    category: params.get('category') || '',
    lowStock: params.get('lowStock') === '1' || undefined,
  };
  const [searchInput, setSearchInput] = useState(query.search);
  const debouncedSearch = useDebounce(searchInput);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [busy, setBusy] = useState(false);

  const patchParams = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === false) next.delete(k);
      else next.set(k, String(v));
    }
    if (!('page' in patch)) next.delete('page'); // reset to page 1 on filter change
    setParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productService.list({
        page: query.page, limit: 15,
        search: debouncedSearch || undefined,
        category: query.category || undefined,
        lowStock: query.lowStock || undefined,
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [query.page, debouncedSearch, query.category, query.lowStock]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    categoryService.list().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    patchParams({ search: debouncedSearch }); // sync debounced search to URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const onSaved = async (payload, id) => {
    if (id) {
      await productService.update(id, payload);
      toast.success('Product updated');
    } else {
      await productService.create(payload);
      toast.success('Product created');
    }
    await load();
  };

  const onAdjusted = () => load();

  const confirmArchive = async () => {
    setBusy(true);
    try {
      await productService.archive(archiving._id);
      toast.success(`${archiving.name} archived`);
      setArchiving(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const lowStockCount = useMemo(() => products.filter((p) => p.stockQuantity <= p.lowStockThreshold).length, [products]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Inventory</h2>
          <p className="muted" style={{ fontSize: '0.88rem' }}>{pagination.total.toLocaleString()} products{query.lowStock ? ` · ${lowStockCount} shown need restock` : ''}</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="card">
        <div className="toolbar" style={{ padding: '1rem 1rem 0' }}>
          <div className="input-icon">
            <Search size={16} />
            <input className="input" style={{ minWidth: 240 }} placeholder="Search name or SKU…"
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)} aria-label="Search products" />
          </div>
          <select className="select" value={query.category} onChange={(e) => patchParams({ category: e.target.value })} aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <label className="flex gap-2" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
            <input type="checkbox" checked={Boolean(query.lowStock)} onChange={(e) => patchParams({ lowStock: e.target.checked ? '1' : undefined })} />
            Low stock only
          </label>
          <div className="spacer" />
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearchInput(''); patchParams({ search: undefined, category: undefined, lowStock: undefined }); }}>
            <ArrowUpDown size={14} /> Reset
          </button>
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" hint="Try adjusting your filters, or add a new product." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>SKU</th><th>Product</th><th>Category</th>
                  <th className="text-right">Cost</th><th className="text-right">Price</th>
                  <th className="text-right">Stock</th><th>Status</th>
                  {isManager && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const badge = stockBadge(p.stockQuantity, p.lowStockThreshold);
                  return (
                    <tr key={p._id}>
                      <td className="mono muted">{p.sku}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.description && <div className="muted" style={{ fontSize: '0.75rem', maxWidth: 280, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div>}
                      </td>
                      <td><Badge tone="info">{p.category?.name ?? '—'}</Badge></td>
                      <td className="text-right mono muted">{money(p.costPrice)}</td>
                      <td className="text-right mono" style={{ fontWeight: 700 }}>{money(p.sellingPrice)}</td>
                      <td className="text-right mono">{p.stockQuantity}</td>
                      <td><Badge tone={badge.tone}>{badge.label}</Badge></td>
                      {isManager && (
                        <td>
                          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary btn-sm" title="Restock / adjust"
                              onClick={() => setAdjusting(p)}>
                              <PackagePlus size={14} />
                            </button>
                            <button className="btn btn-secondary btn-sm" title="Edit"
                              onClick={() => { setEditing(p); setFormOpen(true); }}>
                              <Pencil size={14} />
                            </button>
                            <button className="btn btn-ghost btn-sm" title="Archive"
                              onClick={() => setArchiving(p)}>
                              <Archive size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total}
          onChange={(p) => patchParams({ page: p })} />
      </div>

      <ProductFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
        product={editing}
        categories={categories}
        onCategoryCreated={(c) => setCategories((cs) => [...cs, c])}
      />

      <StockAdjustModal
        open={Boolean(adjusting)}
        onClose={() => setAdjusting(null)}
        product={adjusting}
        onAdjusted={onAdjusted}
      />

      <Modal
        open={Boolean(archiving)}
        onClose={() => setArchiving(null)}
        title="Archive Product"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setArchiving(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={confirmArchive} disabled={busy}>
              {busy ? 'Archiving…' : 'Archive'}
            </button>
          </>
        }
      >
        <p>
          Archive <strong>{archiving?.name}</strong>? It will disappear from the catalog, POS and
          analytics, but historical sales remain intact.
        </p>
      </Modal>
    </div>
  );
}
