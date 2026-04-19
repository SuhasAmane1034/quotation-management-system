import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, Printer, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import PrintView from '../components/PrintView';

const emptyRow = () => ({
  _id: Math.random().toString(36).slice(2),
  product_id: '', product_name: '', product_image: '',
  shape: '', color: '', body_color: '', warranty: '',
  quantity: '', unit: 'Pcs', rate: '', discount: 0, amount: 0,
  bill_after_warranty: false, warranty_end_date: ''
});

/* ── Product autocomplete cell ─────────────────────────── */
function ProductCell({ value, onChange, onSelect, onKeyDown }) {
  const [query, setQuery]   = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen]     = useState(false);
  const [idx, setIdx]       = useState(0);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    if (query.length < 1) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const res = await axios.get(`/api/products?search=${encodeURIComponent(query)}`);
        setResults(res.data); setOpen(res.data.length > 0); setIdx(0);
      } catch {}
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  const pick = (p) => { setQuery(p.name); setOpen(false); onSelect(p); };

  const handleKey = (e) => {
    if (open) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(i+1, results.length-1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setIdx(i => Math.max(i-1, 0)); return; }
      if (e.key === 'Enter' && results[idx]) { e.preventDefault(); pick(results[idx]); return; }
      if (e.key === 'Escape') { setOpen(false); return; }
    }
    onKeyDown && onKeyDown(e);
  };

  return (
    <div className="autocomplete-wrapper">
      <input className="grid-input" value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onKeyDown={handleKey}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        placeholder="Type product name…" autoComplete="off" style={{ minWidth: 180 }} />
      {open && (
        <div className="autocomplete-dropdown">
          {results.map((p, i) => (
            <div key={p.id} className={`autocomplete-item ${i === idx ? 'selected' : ''}`} onMouseDown={() => pick(p)}>
              {p.image
                ? <img src={`http://localhost:3001${p.image}`} alt="" style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
                : <div style={{ width: 30, height: 30, background: 'var(--accent-muted)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>💡</div>
              }
              <div>
                <div className="autocomplete-item-name">{p.name}</div>
                <div className="autocomplete-item-meta">{p.code || '—'} · ₹{p.rate}/{p.unit}{p.stock != null && p.track_stock ? ` · Stock: ${p.stock}` : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shortcut select cell ──────────────────────────────── */
function ShortcutCell({ value, options = [], onChange, onKeyDown, placeholder }) {
  const [input, setInput] = useState(value || '');
  const [open, setOpen]   = useState(false);

  useEffect(() => { setInput(value || ''); }, [value]);

  const resolve = (raw) => {
    const v = raw.trim().toUpperCase();
    const match = options.find(o => o.key?.toUpperCase() === v);
    return match ? match.value : raw;
  };

  const handleBlur = () => {
    setTimeout(() => {
      const resolved = resolve(input);
      setInput(resolved); onChange(resolved); setOpen(false);
    }, 160);
  };

  const pick = (v) => { setInput(v); onChange(v); setOpen(false); };

  const filtered = options.filter(o =>
    o.value.toLowerCase().includes(input.toLowerCase()) ||
    o.key.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="autocomplete-wrapper">
      <input className="grid-input" value={input}
        onChange={e => { setInput(e.target.value); setOpen(true); }}
        onBlur={handleBlur} onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown} placeholder={placeholder} style={{ minWidth: 80 }} />
      {open && filtered.length > 0 && (
        <div className="autocomplete-dropdown" style={{ minWidth: 150 }}>
          {filtered.map(o => (
            <div key={o.key} className="autocomplete-item" onMouseDown={() => pick(o.value)}>
              <span className="tag" style={{ fontSize: 10, minWidth: 30, justifyContent: 'center' }}>{o.key}</span>
              <span className="autocomplete-item-name">{o.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Builder ──────────────────────────────────────── */
export default function QuotationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, addToast } = useApp();
  const [saving, setSaving]     = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const loaded = useRef(false);

  const [header, setHeader] = useState({
    company_name: '', company_logo: '',
    customer_name: '', customer_mobile: '', customer_address: '',
    date: new Date().toISOString().split('T')[0],
    validity_days: 30, notes: '', terms: '', status: 'draft',
    subtotal: 0, discount: 0, tax: 0, tax_rate: 0, total: 0
  });
  const [rows, setRows]             = useState([emptyRow()]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [applyTax, setApplyTax]     = useState(false);
  const [quoteNumber, setQuoteNumber] = useState('');

  /* Load settings defaults */
  useEffect(() => {
    if (settings && !loaded.current && !id) {
      setHeader(h => ({
        ...h,
        company_name:  settings.company_name  || '',
        company_logo:  settings.company_logo  || '',
        validity_days: Number(settings.validity_days) || 30,
        terms:         settings.terms         || '',
        tax_rate:      Number(settings.tax_rate) || 18,
      }));
    }
  }, [settings, id]);

  /* Load existing quotation */
  useEffect(() => {
    if (!id) return;
    axios.get(`/api/quotations/${id}`).then(res => {
      const q = res.data;
      setQuoteNumber(q.quote_number);
      setHeader({
        company_name: q.company_name, company_logo: q.company_logo || settings?.company_logo || '',
        customer_name: q.customer_name, customer_mobile: q.customer_mobile,
        customer_address: q.customer_address, date: q.date,
        validity_days: q.validity_days, notes: q.notes, terms: q.terms,
        status: q.status, subtotal: q.subtotal, discount: q.discount,
        tax: q.tax, tax_rate: q.tax_rate, total: q.total
      });
      setOverallDiscount(q.discount || 0);
      setApplyTax(q.tax > 0);
      setRows(q.items?.length
        ? [...q.items.map(item => ({ ...item, _id: item.id || Math.random().toString(36).slice(2) })), emptyRow()]
        : [emptyRow()]);
      loaded.current = true;
    }).catch(() => addToast('Failed to load quotation', 'error'));
  }, [id]);

  const calcTotals = useCallback((rowList, disc, taxOn, taxRate) => {
    const sub = rowList.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const discAmt = Math.min(Number(disc) || 0, sub);
    const afterDisc = sub - discAmt;
    const taxAmt = taxOn ? afterDisc * (taxRate / 100) : 0;
    return { subtotal: sub, discount: discAmt, tax: taxAmt, total: afterDisc + taxAmt };
  }, []);

  const applyTotals = useCallback((rowList, disc, taxOn) => {
    const taxRate = Number(header.tax_rate || settings?.tax_rate || 18);
    const totals = calcTotals(rowList, disc, taxOn, taxRate);
    setHeader(h => ({ ...h, ...totals, tax_rate: taxRate }));
  }, [header.tax_rate, settings, calcTotals]);

  const updateRow = useCallback((i, field, value) => {
    setRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      const r = next[i];
      const qty = Number(r.quantity) || 0;
      const rate = Number(r.rate) || 0;
      const disc = Math.min(Number(r.discount) || 0, 100);
      next[i].amount = qty * rate * (1 - disc / 100);
      if (i === next.length - 1 && String(value).trim() !== '') next.push(emptyRow());
      applyTotals(next, overallDiscount, applyTax);
      return next;
    });
  }, [overallDiscount, applyTax, applyTotals]);

  const selectProduct = useCallback((i, p) => {
    setRows(prev => {
      const next = [...prev];
      next[i] = { ...next[i], product_id: p.id, product_name: p.name, rate: p.rate, unit: p.unit || 'Pcs', product_image: p.image || '' };
      const qty = Number(next[i].quantity) || 1;
      next[i].quantity = qty;
      next[i].amount = qty * p.rate * (1 - (Number(next[i].discount) || 0) / 100);
      if (i === next.length - 1) next.push(emptyRow());
      applyTotals(next, overallDiscount, applyTax);
      return next;
    });
  }, [overallDiscount, applyTax, applyTotals]);

  const deleteRow = (i) => {
    if (rows.length === 1) return;
    setRows(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      applyTotals(next, overallDiscount, applyTax);
      return next;
    });
  };

  useEffect(() => { applyTotals(rows, overallDiscount, applyTax); }, [overallDiscount, applyTax]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const validRows = rows.filter(r => r.product_name && r.quantity && r.rate);
      const payload = { ...header, items: validRows.map((r, i) => ({ ...r, sr_no: i + 1 })) };
      if (id) {
        await axios.put(`/api/quotations/${id}`, payload);
        addToast('Quotation saved!', 'success');
      } else {
        const res = await axios.post('/api/quotations', payload);
        addToast('Quotation created!', 'success');
        navigate(`/quotations/${res.data.id}/edit`);
      }
    } catch { addToast('Save failed', 'error'); }
    setSaving(false);
  };

  const handleKeyNav = (e, rowIdx, field) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const fields = ['product_name','shape','color','body_color','warranty','quantity','unit','rate','discount'];
    const fi = fields.indexOf(field);
    if (fi < fields.length - 1) {
      document.querySelector(`[data-row="${rowIdx}"][data-field="${fields[fi+1]}"] input`)?.focus();
    } else {
      document.querySelector(`[data-row="${rowIdx+1}"][data-field="product_name"] input`)?.focus();
    }
  };

  const shapes      = settings?.shapes      || [];
  const colors      = settings?.colors      || [];
  const bodyColors  = settings?.body_colors || [];
  const warranties  = settings?.warranties  || [];
  const currency    = settings?.currency    || '₹';
  const colVis      = settings?.columns_visible || {};
  const taxRate     = Number(header.tax_rate || settings?.tax_rate || 18);
  const validRows   = rows.filter(r => r.product_name && r.quantity && r.rate);

  const validTill = header.date && header.validity_days
    ? new Date(new Date(header.date).getTime() + Number(header.validity_days) * 86400000)
        .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  if (showPrint) {
    return <PrintView
      quotation={{ ...header, quote_number: quoteNumber || 'PREVIEW', items: validRows }}
      onClose={() => setShowPrint(false)}
      settings={settings}
    />;
  }

  return (
    <div>
      <div className="top-header">
        <span className="header-title">{id ? `Edit ${quoteNumber}` : 'New Quotation'}</span>
        <div className="header-actions">
          <select value={header.status} onChange={e => setHeader(h => ({ ...h, status: e.target.value }))}
            style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn btn-secondary" onClick={() => setShowPrint(true)}><Printer size={14} /> Print / PDF</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── HEADER CARDS ── */}
        <div className="grid-2">
          {/* Company info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Company</span>
              {settings?.company_logo && (
                <img src={`http://localhost:3001${settings.company_logo}`} alt="logo"
                  style={{ height: 28, objectFit: 'contain', borderRadius: 5 }} />
              )}
            </div>
            <div className="card-body">
              <div className="form-group">
                <label>Company Name</label>
                <input value={header.company_name}
                  onChange={e => setHeader(h => ({ ...h, company_name: e.target.value }))}
                  placeholder="From Settings" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Quote Date</label>
                  <input type="date" value={header.date}
                    onChange={e => setHeader(h => ({ ...h, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Validity Days</label>
                  <input type="number" value={header.validity_days}
                    onChange={e => setHeader(h => ({ ...h, validity_days: e.target.value }))} />
                </div>
              </div>
              {validTill && (
                <div style={{ background: 'var(--accent-muted)', borderRadius: 7, padding: '7px 12px', fontSize: 12.5, color: 'var(--accent)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                  📅 Valid Till: <strong>{validTill}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="card">
            <div className="card-header"><span className="card-title">Customer Details</span></div>
            <div className="card-body">
              <div className="form-group">
                <label>Customer Name</label>
                <input value={header.customer_name}
                  onChange={e => setHeader(h => ({ ...h, customer_name: e.target.value }))}
                  placeholder="Customer / Company" autoFocus />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Mobile</label>
                  <input value={header.customer_mobile}
                    onChange={e => setHeader(h => ({ ...h, customer_mobile: e.target.value }))}
                    placeholder="+91 XXXXX XXXXX" />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input value={header.customer_address}
                    onChange={e => setHeader(h => ({ ...h, customer_address: e.target.value }))}
                    placeholder="City / State" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PRODUCT TABLE ── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Products ({validRows.length} items)</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ⌨ <strong>Enter</strong> = next cell &nbsp;·&nbsp; Type shortcut in Shape/Color/Body/Warranty
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="product-row-table">
              <thead>
                <tr>
                  {colVis.sr_no !== false          && <th style={{ width: 34 }}>#</th>}
                  {colVis.product_image !== false   && <th style={{ width: 40 }}>Img</th>}
                  <th style={{ minWidth: 190 }}>Product Name</th>
                  {colVis.shape !== false           && <th style={{ minWidth: 88 }}>Shape</th>}
                  {colVis.color !== false           && <th style={{ minWidth: 108 }}>Color</th>}
                  {colVis.body_color !== false      && <th style={{ minWidth: 96 }}>Body</th>}
                  {colVis.warranty !== false        && <th style={{ minWidth: 96 }}>Warranty</th>}
                  <th style={{ width: 68 }}>Qty</th>
                  {colVis.unit !== false            && <th style={{ width: 64 }}>Unit</th>}
                  <th style={{ width: 88 }}>Rate</th>
                  {colVis.discount !== false        && <th style={{ width: 64 }}>Disc%</th>}
                  <th style={{ width: 100 }}>Amount</th>
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row._id}>
                    {colVis.sr_no !== false && (
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                    )}
                    {colVis.product_image !== false && (
                      <td>
                        {row.product_image
                          ? <img src={`http://localhost:3001${row.product_image}`} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 5 }} />
                          : <div style={{ width: 28, height: 28, background: 'var(--accent-muted)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💡</div>
                        }
                      </td>
                    )}
                    <td data-row={i} data-field="product_name">
                      <ProductCell value={row.product_name}
                        onChange={v => updateRow(i, 'product_name', v)}
                        onSelect={p => selectProduct(i, p)}
                        onKeyDown={e => handleKeyNav(e, i, 'product_name')} />
                    </td>
                    {colVis.shape !== false && (
                      <td data-row={i} data-field="shape">
                        <ShortcutCell value={row.shape} options={shapes}
                          onChange={v => updateRow(i, 'shape', v)}
                          onKeyDown={e => handleKeyNav(e, i, 'shape')} placeholder="R/S…" />
                      </td>
                    )}
                    {colVis.color !== false && (
                      <td data-row={i} data-field="color">
                        <ShortcutCell value={row.color} options={colors}
                          onChange={v => updateRow(i, 'color', v)}
                          onKeyDown={e => handleKeyNav(e, i, 'color')} placeholder="W/NW…" />
                      </td>
                    )}
                    {colVis.body_color !== false && (
                      <td data-row={i} data-field="body_color">
                        <ShortcutCell value={row.body_color} options={bodyColors}
                          onChange={v => updateRow(i, 'body_color', v)}
                          onKeyDown={e => handleKeyNav(e, i, 'body_color')} placeholder="B/W…" />
                      </td>
                    )}
                    {colVis.warranty !== false && (
                      <td data-row={i} data-field="warranty">
                        <ShortcutCell value={row.warranty} options={warranties}
                          onChange={v => updateRow(i, 'warranty', v)}
                          onKeyDown={e => handleKeyNav(e, i, 'warranty')} placeholder="1/NW…" />
                      </td>
                    )}
                    <td data-row={i} data-field="quantity">
                      <input className="grid-input" type="number" value={row.quantity} min="0"
                        onChange={e => updateRow(i, 'quantity', e.target.value)}
                        onKeyDown={e => handleKeyNav(e, i, 'quantity')} style={{ width: 58 }} />
                    </td>
                    {colVis.unit !== false && (
                      <td data-row={i} data-field="unit">
                        <input className="grid-input" value={row.unit}
                          onChange={e => updateRow(i, 'unit', e.target.value)}
                          onKeyDown={e => handleKeyNav(e, i, 'unit')} style={{ width: 56 }} />
                      </td>
                    )}
                    <td data-row={i} data-field="rate">
                      <input className="grid-input" type="number" value={row.rate} min="0"
                        onChange={e => updateRow(i, 'rate', e.target.value)}
                        onKeyDown={e => handleKeyNav(e, i, 'rate')} style={{ width: 78 }} />
                    </td>
                    {colVis.discount !== false && (
                      <td data-row={i} data-field="discount">
                        <input className="grid-input" type="number" value={row.discount} min="0" max="100"
                          onChange={e => updateRow(i, 'discount', e.target.value)}
                          onKeyDown={e => handleKeyNav(e, i, 'discount')} style={{ width: 56 }} />
                      </td>
                    )}
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, paddingRight: 10 }}>
                      {row.amount > 0 ? `${currency}${Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm btn-icon"
                        style={{ color: 'var(--danger)', opacity: rows.length === 1 ? 0.25 : 1 }}
                        onClick={() => deleteRow(i)} disabled={rows.length === 1}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── NOTES + TOTALS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'start' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Notes & Terms</span></div>
            <div className="card-body">
              <div className="form-group">
                <label>Notes (visible on quotation)</label>
                <textarea value={header.notes}
                  onChange={e => setHeader(h => ({ ...h, notes: e.target.value }))}
                  placeholder="e.g. Thank you for your business!" rows={2} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Terms & Conditions</label>
                <textarea value={header.terms}
                  onChange={e => setHeader(h => ({ ...h, terms: e.target.value }))}
                  rows={4} />
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, marginBottom: 14, color: 'var(--text-primary)' }}>Summary</div>

            <div className="total-row">
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: 700 }}>{currency}{Number(header.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="total-row" style={{ gap: 12 }}>
              <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>Overall Discount</span>
              <input type="number" value={overallDiscount}
                onChange={e => setOverallDiscount(Number(e.target.value))}
                style={{ width: 80, textAlign: 'right', padding: '3px 7px', fontSize: 13 }} min="0" />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{currency}</span>
            </div>

            <div className="total-row">
              <label className="toggle-switch">
                <input type="checkbox" checked={applyTax} onChange={e => setApplyTax(e.target.checked)} />
                <span className="toggle-track"></span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {settings?.tax_label || 'GST'} ({taxRate}%)
                </span>
              </label>
              <span style={{ fontWeight: 600 }}>
                {applyTax ? `${currency}${Number(header.tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
              </span>
            </div>

            <div className="total-row grand">
              <span>Grand Total</span>
              <span>{currency}{Number(header.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <button className="btn btn-primary w-full" onClick={handleSave} disabled={saving}
              style={{ marginTop: 14, justifyContent: 'center' }}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save Quotation'}
            </button>
          </div>
        </div>

        {/* Bottom padding so FAB doesn't overlap */}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
