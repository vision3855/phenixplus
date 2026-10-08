import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { productService } from '../services/productService.js';
import { useToast } from './Toast.jsx';

/** Modal for restocking / adjusting / returning stock on a product. */
export default function StockAdjustModal({ open, onClose, product, onAdjusted }) {
  const toast = useToast();
  const [type, setType] = useState('RESTOCK');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setType('RESTOCK'); setQuantity(1); setNote(''); }
  }, [open]);

  if (!product) return null;
  const parsed = Number(quantity);
  const projected = product.stockQuantity + (type === 'ADJUSTMENT' ? -Math.abs(parsed) : parsed);

  const submit = async (e) => {
    e.preventDefault();
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return toast.warning('Enter a whole number greater than 0');
    }
    const quantityChange = type === 'ADJUSTMENT' ? -Math.abs(parsed) : parsed;
    setSaving(true);
    try {
      await productService.adjustStock(product._id, { type, quantityChange, note: note.trim() || undefined });
      toast.success(`Stock updated for ${product.name}`);
      onAdjusted();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Adjust Stock — ${product.name}`}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="stock-form" type="submit" disabled={saving}>
            {saving ? 'Applying…' : 'Apply Adjustment'}
          </button>
        </>
      }
    >
      <form id="stock-form" onSubmit={submit}>
        <div className="flex gap-2" style={{ marginBottom: '1rem' }}>
          {['RESTOCK', 'ADJUSTMENT', 'RETURN'].map((t) => (
            <button key={t} type="button"
              className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setType(t)}>
              {t === 'RESTOCK' ? '➕ Restock' : t === 'ADJUSTMENT' ? '➖ Remove' : '↩ Return'}
            </button>
          ))}
        </div>

        <div className="field">
          <label htmlFor="sa-qty">Quantity</label>
          <input id="sa-qty" type="number" min="1" className="input" value={quantity}
            onChange={(e) => setQuantity(e.target.value)} autoFocus />
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            {product.stockQuantity} in stock →{' '}
            <strong style={{ color: projected < 0 ? 'var(--danger)' : 'var(--success)' }}>
              {projected}
            </strong>{' '}
            after
          </span>
        </div>

        <div className="field">
          <label htmlFor="sa-note">Note (optional)</label>
          <input id="sa-note" className="input" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Supplier delivery #4821" maxLength={500} />
        </div>
      </form>
    </Modal>
  );
}
