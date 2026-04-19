import React, { useState, useEffect } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const CATEGORIES = ['All','Panel','Spot','Strip','Bulb','Tube','Downlight','Flood','Street','COB','Driver','Batten','Ceiling','Track','Emergency','Solar'];

function ProductModal({ product, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', code: '', category: '', rate: '', mrp: '', unit: 'Pcs',
    stock: '', min_stock: 5, track_stock: false, ...product
  });
  const [saving, setSaving] = useState(false);
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.rate) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{product?.id ? 'Edit Product' : 'Add Product'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group">
              <label>Product Name *</label>
              <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="LED Panel 18W" autoFocus />
            </div>
            <div className="form-group">
              <label>Product Code</label>
              <input value={form.code} onChange={e => f('code', e.target.value)} placeholder="PL18W" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Rate (Selling) *</label>
              <input type="number" value={form.rate} onChange={e => f('rate', e.target.value)} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label>MRP</label>
              <input type="number" value={form.mrp} onChange={e => f('mrp', e.target.value)} placeholder="0" min="0" />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={e => f('category', e.target.value)}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Unit</label>
              <select value={form.unit} onChange={e => f('unit', e.target.value)}>
                {['Pcs','Meter','Reel','Set','Box'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="toggle-switch">
              <input type="checkbox" checked={!!form.track_stock} onChange={e => f('track_stock', e.target.checked)} />
              <span className="toggle-track"></span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Track Stock</span>
            </label>
          </div>
          {form.track_stock && (
            <div className="grid-2">
              <div className="form-group">
                <label>Current Stock</label>
                <input type="number" value={form.stock} onChange={e => f('stock', e.target.value)} min="0" />
              </div>
              <div className="form-group">
                <label>Min Stock Alert</label>
                <input type="number" value={form.min_stock} onChange={e => f('min_stock', e.target.value)} min="0" />
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name || !form.rate}>
            {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductLibrary() {
  const { user, addToast } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [modal, setModal] = useState(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).order('name');
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async (form) => {
    const payload = {
      name: form.name, code: form.code || '', category: form.category || '',
      rate: Number(form.rate) || 0, mrp: Number(form.mrp) || null,
      unit: form.unit || 'Pcs', stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 5, track_stock: !!form.track_stock,
    };
    if (form.id) {
      await supabase.from('products').update(payload).eq('id', form.id);
      addToast('Product updated', 'success');
    } else {
      await supabase.from('products').insert({ ...payload, user_id: user.id });
      addToast('Product added', 'success');
    }
    setModal(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    addToast('Product deleted', 'info');
  };

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || p.category === category;
    return matchSearch && matchCat;
  });

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div>
      <div className="top-header">
        <span className="header-title">Product Library</span>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={14} /> Add Product</button>
        </div>
      </div>

      {modal !== null && (
        <ProductModal product={modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
                <Search size={14} className="search-icon" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code…" />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {categories.map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-secondary'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Rate</th>
                  <th>Unit</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>{[1,2,3,4,5,6,7].map(j => (
                      <td key={j}><div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 4 }} /></td>
                    ))}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📦</div>
                      <h3>{search || category !== 'All' ? 'No products match' : 'No products yet'}</h3>
                      <p>Add your first product to get started</p>
                      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => setModal({})}><Plus size={14} /> Add Product</button>
                    </div>
                  </td></tr>
                ) : (
                  filtered.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 28, height: 28, background: 'var(--accent-muted)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💡</div>
                          {p.name}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{p.code || '—'}</td>
                      <td>{p.category ? <span className="badge badge-accent">{p.category}</span> : '—'}</td>
                      <td style={{ fontWeight: 700 }}>Rs.{Number(p.rate).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.unit}</td>
                      <td>
                        {p.track_stock
                          ? <span className={`badge ${p.stock === 0 ? 'badge-rejected' : p.stock <= p.min_stock ? 'badge-warning' : 'badge-approved'}`}>
                              {p.stock === 0 ? 'Out' : p.stock <= p.min_stock ? `Low (${p.stock})` : p.stock}
                            </span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(p)}><Edit2 size={13} /></button>
                          <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>

      <button className="fab" onClick={() => setModal({})}><Plus size={18} /> Add Product</button>
    </div>
  );
}
