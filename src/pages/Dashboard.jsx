import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertTriangle, Plus, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

const STATUS_BADGE = {
  draft: 'badge-draft', sent: 'badge-sent',
  approved: 'badge-approved', rejected: 'badge-rejected'
};

function StatCard({ icon, label, value, color, change }) {
  return (
    <div className="stat-card">
      <div className="stat-card-glow" />
      <div className="stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change && <div className={`stat-change ${change >= 0 ? 'up' : 'down'}`}>{change >= 0 ? '▲' : '▼'} {Math.abs(change)} this month</div>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: '80%', height: 14 }} />
    </div>
  );
}

export default function Dashboard() {
  const { user, settings } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const currency = settings?.currency || 'Rs.';

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [quotRes, prodRes] = await Promise.all([
        supabase.from('quotations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('user_id', user.id)
      ]);

      const quotations = quotRes.data || [];
      const products = prodRes.data || [];

      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const thisMonth = quotations.filter(q => q.created_at?.startsWith(monthStr));
      const approved = quotations.filter(q => q.status === 'approved');
      const revenue = approved.reduce((s, q) => s + (Number(q.total) || 0), 0);

      const lowStock = products.filter(p => p.track_stock && p.stock <= p.min_stock);
      const outOfStock = products.filter(p => p.track_stock && p.stock === 0);

      const statusCounts = { draft: 0, sent: 0, approved: 0, rejected: 0 };
      quotations.forEach(q => { if (statusCounts[q.status] !== undefined) statusCounts[q.status]++; });

      const productRevMap = {};
      const { data: items } = await supabase.from('quotation_items').select('product_name, quantity, amount').eq('user_id', user.id);
      (items || []).forEach(item => {
        if (!productRevMap[item.product_name]) productRevMap[item.product_name] = { qty: 0, amount: 0 };
        productRevMap[item.product_name].qty += Number(item.quantity) || 0;
        productRevMap[item.product_name].amount += Number(item.amount) || 0;
      });
      const topProducts = Object.entries(productRevMap)
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setData({
        total: quotations.length,
        thisMonth: thisMonth.length,
        revenue,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        recent: quotations.slice(0, 6),
        statusCounts,
        topProducts,
        lowStockItems: lowStock.slice(0, 5)
      });
      setLoading(false);
    })();
  }, [user]);

  const fmt = (n) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div>
      <div className="top-header">
        <span className="header-title">Dashboard</span>
        <div className="header-actions">
          <Link to="/quotations/new" className="btn btn-primary">
            <Plus size={14} /> New Quotation
          </Link>
        </div>
      </div>

      <div className="page-content">
        <div className="stats-grid">
          {loading ? (
            [1,2,3,4].map(i => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard icon={<FileText size={18} />} label="Total Quotations" value={data.total} color="var(--accent)" change={data.thisMonth} />
              <StatCard icon={<CheckCircle size={18} />} label="Approved Revenue" value={`${currency}${fmt(data.revenue)}`} color="var(--success)" />
              <StatCard icon={<Clock size={18} />} label="This Month" value={data.thisMonth} color="var(--info)" />
              <StatCard icon={<AlertTriangle size={18} />} label="Low Stock Items" value={data.lowStock} color="var(--warning)" />
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: 14 }}>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Quotations</span>
              <Link to="/quotations" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Quote #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1,2,3,4,5].map(i => (
                      <tr key={i}>
                        {[1,2,3,4,5].map(j => (
                          <td key={j}><div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 4 }} /></td>
                        ))}
                      </tr>
                    ))
                  ) : data.recent.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>No quotations yet. <Link to="/quotations/new" style={{ color: 'var(--accent)' }}>Create one!</Link></td></tr>
                  ) : (
                    data.recent.map(q => (
                      <tr key={q.id}>
                        <td><Link to={`/quotations/${q.id}/edit`} style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>{q.quote_number}</Link></td>
                        <td style={{ fontWeight: 600 }}>{q.customer_name || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{q.date ? new Date(q.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}</td>
                        <td style={{ fontWeight: 700 }}>{currency}{fmt(q.total)}</td>
                        <td><span className={`badge ${STATUS_BADGE[q.status] || 'badge-draft'}`}>{q.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Quote Status</span></div>
              <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
                {loading ? (
                  [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 14, borderRadius: 4, marginBottom: 8 }} />)
                ) : (
                  Object.entries(data?.statusCounts || {}).map(([status, count]) => {
                    const total = Object.values(data.statusCounts).reduce((s, v) => s + v, 0) || 1;
                    const pct = Math.round((count / total) * 100);
                    const colors = { draft: '#6b7280', sent: 'var(--info)', approved: 'var(--success)', rejected: 'var(--danger)' };
                    return (
                      <div key={status} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{status}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                        </div>
                        <div className="stock-bar-bg">
                          <div className="stock-bar" style={{ width: `${pct}%`, background: colors[status] }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {!loading && data?.lowStockItems?.length > 0 && (
              <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.03)' }}>
                <div className="card-header">
                  <span className="card-title" style={{ color: 'var(--warning)' }}>Low Stock Alert</span>
                  <Link to="/inventory" className="btn btn-ghost btn-sm">View</Link>
                </div>
                <div style={{ padding: '10px 16px' }}>
                  {data.lowStockItems.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: p.stock === 0 ? 'var(--danger)' : 'var(--warning)', fontWeight: 700, background: p.stock === 0 ? 'var(--danger-bg)' : 'var(--warning-bg)', padding: '2px 7px', borderRadius: 10 }}>
                        {p.stock === 0 ? 'OUT' : `${p.stock} left`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {!loading && data?.topProducts?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <span className="card-title">Top Products by Revenue</span>
              <TrendingUp size={16} style={{ color: 'var(--success)' }} />
            </div>
            <div className="table-wrapper" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Total Qty</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p, i) => (
                    <tr key={p.name}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{fmt(p.qty)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>{currency}{fmt(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>

      <Link to="/quotations/new" className="fab">
        <Plus size={18} /> New Quote
      </Link>
    </div>
  );
}
