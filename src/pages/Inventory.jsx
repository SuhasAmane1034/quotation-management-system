import React, { useState, useEffect } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

function AdjustModal({ product, onSave, onClose }) {
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const n = Number(amount);
    if (!n || n <= 0) return;
    setSaving(true);
    const adjustment = mode === 'add' ? n : -n;
    await onSave(product.id, adjustment);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <span className="modal-title">Adjust Stock</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--bg-hover)', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{product.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Current stock: <strong style={{ color: 'var(--text-primary)' }}>{product.stock}</strong></div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className={`btn ${mode === 'add' ? 'btn-success' : 'btn-secondary'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMode('add')}><Plus size={14} /> Add Stock</button>
            <button className={`btn ${mode === 'remove' ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMode('remove')}><Minus size={14} /> Remove Stock</button>
          </div>
          <div className="form-group">
            <label>Quantity to {mode === 'add' ? 'Add' : 'Remove'}</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" min="1" autoFocus />
          </div>
          {amount && (
            <div style={{ padding: '8px 12px', background: mode === 'add' ? 'var(--success-bg)' : 'var(--danger-bg)', borderRadius: 6, fontSize: 13, color: mode === 'add' ? 'var(--success)' : 'var(--danger)' }}>
              New stock will be: <strong>{Math.max(0, product.stock + (mode === 'add' ? Number(amount) : -Number(amount)))}</strong>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${mode === 'add' ? 'btn-success' : 'btn-danger'}`} onClick={handleSave} disabled={saving || !amount}>
            {saving ? 'Saving…' : `${mode === 'add' ? 'Add' : 'Remove'} Stock`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Inventory() {
  const { user, addToast } = useApp();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [adjusting, setAdjusting] = useState(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).eq('track_stock', true).order('name');
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleAdjust = async (productId, adjustment) => {
    const product = products.find(p => p.id === productId);
    const newStock = Math.max(0, (product.stock || 0) + adjustment);
    await supabase.from('products').update({ stock: newStock }).eq('id', productId);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    addToast(adjustment > 0 ? `Added ${adjustment} units` : `Removed ${Math.abs(adjustment)} units`, 'success');
    setAdjusting(null);
  };

  const filtered = products.filter(p => {
    if (filter === 'low') return p.stock <= p.min_stock && p.stock > 0;
    if (filter === 'out') return p.stock === 0;
    return true;
  });

  const totalValue = products.reduce((s, p) => s + (p.stock * p.rate), 0);
  const lowStock = products.filter(p => p.stock <= p.min_stock && p.stock > 0).length;
  const outStock = products.filter(p => p.stock === 0).length;

  return (
    <div>
      <div className="top-header">
        <span className="header-title">Inventory</span>
      </div>

      {adjusting && <AdjustModal product={adjusting} onSave={handleAdjust} onClose={() => setAdjusting(null)} />}

      <div className="page-content">
        <div className="stats-grid" style={{ marginBottom: 14 }}>
          {[
            { label: 'Tracked Products', value: products.length, color: 'var(--accent)' },
            { label: 'Low Stock', value: lowStock, color: 'var(--warning)' },
            { label: 'Out of Stock', value: outStock, color: 'var(--danger)' },
            { label: 'Stock Value', value: `Rs.${totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{loading ? '—' : s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'low', label: `Low Stock (${lowStock})` },
                { id: 'out', label: `Out of Stock (${outStock})` },
              ].map(t => (
                <button key={t.id} onClick={() => setFilter(t.id)}
                  className={`btn btn-sm ${filter === t.id ? 'btn-primary' : 'btn-secondary'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="inventory-grid" style={{ padding: 16 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="inventory-card">
                  <div className="skeleton" style={{ height: 14, width: '70%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 6, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>{filter !== 'all' ? 'No products match this filter' : 'No tracked products'}</h3>
              <p>Enable stock tracking on products in the Product Library</p>
            </div>
          ) : (
            <div className="inventory-grid" style={{ padding: 16 }}>
              {filtered.map(p => {
                const pct = p.min_stock > 0 ? Math.min(100, Math.round((p.stock / (p.min_stock * 3)) * 100)) : 100;
                const isOut = p.stock === 0;
                const isLow = !isOut && p.stock <= p.min_stock;
                return (
                  <div key={p.id} className={`inventory-card ${isOut ? 'out-stock' : isLow ? 'low-stock' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.code || 'No code'} · {p.category || 'Uncategorized'}</div>
                      </div>
                      <span className={`badge ${isOut ? 'badge-rejected' : isLow ? 'badge-warning' : 'badge-approved'}`} style={{ fontSize: 10 }}>
                        {isOut ? 'OUT' : isLow ? 'LOW' : 'OK'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' }}>{p.stock}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>min: {p.min_stock}</span>
                    </div>

                    <div className="stock-bar-bg">
                      <div className="stock-bar" style={{ width: `${pct}%`, background: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' }} />
                    </div>

                    <button className="btn btn-secondary btn-sm w-full" style={{ marginTop: 10, justifyContent: 'center' }}
                      onClick={() => setAdjusting(p)}>
                      Adjust Stock
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
