import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, CreditCard as Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const STATUS_BADGE = {
  draft: 'badge-draft', sent: 'badge-sent',
  approved: 'badge-approved', rejected: 'badge-rejected'
};

export default function Quotations() {
  const { user, settings, addToast } = useApp();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const currency = settings?.currency || 'Rs.';

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('quotations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setQuotations(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this quotation?')) return;
    setDeleting(id);
    await supabase.from('quotations').delete().eq('id', id);
    setQuotations(prev => prev.filter(q => q.id !== id));
    addToast('Quotation deleted', 'info');
    setDeleting(null);
  };

  const filtered = quotations.filter(q => {
    const matchSearch = !search ||
      q.quote_number?.toLowerCase().includes(search.toLowerCase()) ||
      q.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div>
      <div className="top-header">
        <span className="header-title">Quotations</span>
        <div className="header-actions">
          <Link to="/quotations/new" className="btn btn-primary"><Plus size={14} /> New Quotation</Link>
        </div>
      </div>

      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
              <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
                <Search size={14} className="search-icon" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by quote # or customer…" />
              </div>
              {['all','draft','sent','approved','rejected'].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ textTransform: 'capitalize' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Quote #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Valid Till</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5,6].map(i => (
                    <tr key={i}>
                      {[1,2,3,4,5,6,7].map(j => (
                        <td key={j}><div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 4 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📋</div>
                      <h3>{search || statusFilter !== 'all' ? 'No quotations match your filter' : 'No quotations yet'}</h3>
                      <p>{search || statusFilter !== 'all' ? 'Try adjusting your search or filter' : 'Create your first quotation to get started'}</p>
                      {!search && statusFilter === 'all' && <Link to="/quotations/new" className="btn btn-primary" style={{ marginTop: 14 }}><Plus size={14} /> Create Quotation</Link>}
                    </div>
                  </td></tr>
                ) : (
                  filtered.map(q => {
                    const validTill = q.date && q.validity_days
                      ? new Date(new Date(q.date).getTime() + Number(q.validity_days) * 86400000)
                          .toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—';
                    return (
                      <tr key={q.id}>
                        <td><Link to={`/quotations/${q.id}/edit`} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>{q.quote_number}</Link></td>
                        <td style={{ fontWeight: 600 }}>{q.customer_name || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {q.date ? new Date(q.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{validTill}</td>
                        <td style={{ fontWeight: 700 }}>{currency}{fmt(q.total)}</td>
                        <td><span className={`badge ${STATUS_BADGE[q.status] || 'badge-draft'}`}>{q.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <Link to={`/quotations/${q.id}/edit`} className="btn btn-ghost btn-sm btn-icon"><Edit2 size={13} /></Link>
                            <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }}
                              onClick={() => handleDelete(q.id)} disabled={deleting === q.id}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ height: 20 }} />
      </div>

      <Link to="/quotations/new" className="fab"><Plus size={18} /> New Quote</Link>
    </div>
  );
}
