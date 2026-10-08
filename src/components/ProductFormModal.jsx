import { useEffect, useState } from 'react';
import Modal from './Modal.jsx';
import { categoryService } from '../services/categoryService.js';
import { useToast } from './Toast.jsx';

const EMPTY = {
  sku: '', name: '', description: '', category: '',
  costPrice: '', sellingPrice: '', stockQuantity: 0, lowStockThreshold: 10,
};

/** Modal to create a product, or edit an existing one (edit mode omits stock). */
export default function ProductFormModal({ open, onClose, onSaved, product, categories, onCategoryCreated }) {
  const toast = useToast();
  const isEdit = Boolean(product?._id);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setNewCategory('');
    setForm(product ? {
      sku: product.sku ?? '',
      name: product.name ?? '',
      description: product.description ?? '',
      category: product.category?._id ?? product.category ?? '',
      costPrice: product.costPrice ?? '',
      sellingPrice: product.sellingPrice ?? '',
      stockQuantity: product.stockQuantity ?? 0,
      lowStockThreshold: product.lowStockThreshold ?? 10,
    } : EMPTY);
  }, [open, product]);

  const set = (key) => (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!isEdit && form.sku.trim().length < 2) er.sku = 'SKU must be at least 2 characters';
    if (!form.name.trim()) er.name = 'Name is required';
    if (!form.category) er.category = 'Select a category';
    if (!(Number(form.costPrice) > 0)) er.costPrice = 'Cost price must be > 0';
    if (!(Number(form.sellingPrice) > 0)) er.sellingPrice = 'Selling price must be > 0';
    if (Number(form.sellingPrice) < Number(form.costPrice)) {
      er.sellingPrice = 'Selling price is below cost price';
    }
    if (!isEdit && (!Number.isInteger(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0)) {
      er.stockQuantity = 'Initial stock must be a whole number ≥ 0';
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        lowStockThreshold: Number(form.lowStockThreshold) || 10,
        ...(isEdit ? {} : { stockQuantity: Number(form.stockQuantity) }),
      };
      await onSaved(payload, product?._id);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const quickAddCategory = async () => {
    const name = newCategory.trim();
    if (name.length < 2) return toast.warning('Category name too short');
    try {
      const cat = await categoryService.create({ name });
      toast.success(`Category "${cat.name}" created`);
      onCategoryCreated?.(cat);
      setForm((f) => ({ ...f, category: cat._id }));
      setNewCategory('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit — ${product?.name}` : 'Add New Product'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" form="product-form" type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </>
      }
    >
      <form id="product-form" onSubmit={submit} noValidate>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div className="field">
            <label htmlFor="pf-sku">SKU</label>
            <input id="pf-sku" className={`input ${errors.sku ? 'invalid' : ''}`} value={form.sku}
              onChange={set('sku')} disabled={isEdit} placeholder="e.g. SNK-001" />
            {errors.sku && <span className="field-error">{errors.sku}</span>}
          </div>
          <div className="field">
            <label htmlFor="pf-threshold">Low-Stock Threshold</label>
            <input id="pf-threshold" type="number" min="0" className="input" value={form.lowStockThreshold}
              onChange={set('lowStockThreshold')} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="pf-name">Product Name</label>
          <input id="pf-name" className={`input ${errors.name ? 'invalid' : ''}`} value={form.name}
            onChange={set('name')} placeholder="e.g. Running Shoes — Size 42" />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="pf-desc">Description</label>
          <textarea id="pf-desc" className="input" rows={2} value={form.description} onChange={set('description')} />
        </div>

        <div className="field">
          <label htmlFor="pf-category">Category</label>
          <select id="pf-category" className={`select ${errors.category ? 'invalid' : ''}`} value={form.category} onChange={set('category')}>
            <option value="">— Select category —</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          {errors.category && <span className="field-error">{errors.category}</span>}
          <div className="flex gap-2" style={{ marginTop: '0.4rem' }}>
            <input className="input" placeholder="New category…" value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), quickAddCategory())} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={quickAddCategory}>Add</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div className="field">
            <label htmlFor="pf-cost">Cost Price ($)</label>
            <input id="pf-cost" type="number" step="0.01" min="0" className={`input ${errors.costPrice ? 'invalid' : ''}`}
              value={form.costPrice} onChange={set('costPrice')} />
            {errors.costPrice && <span className="field-error">{errors.costPrice}</span>}
          </div>
          <div className="field">
            <label htmlFor="pf-price">Selling Price ($)</label>
            <input id="pf-price" type="number" step="0.01" min="0" className={`input ${errors.sellingPrice ? 'invalid' : ''}`}
              value={form.sellingPrice} onChange={set('sellingPrice')} />
            {errors.sellingPrice && <span className="field-error">{errors.sellingPrice}</span>}
          </div>
        </div>

        {!isEdit && (
          <div className="field">
            <label htmlFor="pf-stock">Initial Stock Quantity</label>
            <input id="pf-stock" type="number" min="0" className={`input ${errors.stockQuantity ? 'invalid' : ''}`}
              value={form.stockQuantity} onChange={set('stockQuantity')} />
            {errors.stockQuantity && <span className="field-error">{errors.stockQuantity}</span>}
          </div>
        )}
      </form>
    </Modal>
  );
}
