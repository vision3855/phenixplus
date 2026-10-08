import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, PackageX, ArrowRight } from 'lucide-react';
import StatCard from '../components/StatCard.jsx';
import Badge from '../components/Badge.jsx';
import { Spinner, EmptyState, Skeleton } from '../components/Feedback.jsx';
import { analyticsService } from '../services/analyticsService.js';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const money = (n) => `$${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const toast = useToast();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await analyticsService.dashboard();
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) toast.error(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div>
        <div className="stat-grid">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={130} />)}
        </div>
        <Skeleton height={320} />
      </div>
    );
  }

  if (!data) return <EmptyState title="Could not load dashboard" hint="Refresh the page to try again." />;

  const { performance, lowStock, valuation, topSellers, trend } = data;

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Dashboard</h2>
          <p className="muted" style={{ fontSize: '0.88rem' }}>Last 30 days · {user?.name}</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard icon={DollarSign} tone="success" label="Total Revenue" value={money(performance.totalRevenue)} hint="30d" />
        <StatCard icon={ShoppingBag} tone="primary" label="Items Sold" value={performance.totalItemsSold.toLocaleString()} hint="30d" />
        <StatCard icon={AlertTriangle} tone={lowStock.count > 0 ? 'warning' : 'success'} label="Low-Stock Alerts" value={lowStock.count} hint="act now" />
        <StatCard icon={PackageX} tone="info" label="Stock Value (Cost)" value={money(valuation.totalCostValue)} hint={`${valuation.totalUnits} units`} />
      </div>

      <div className="dash-grid">
        <div className="card panel">
          <h3>Revenue Trend</h3>
          {trend.length === 0 ? (
            <EmptyState title="No sales in this period" hint="Recorded sales will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={56} />
                <Tooltip
                  formatter={(v) => [money(v), 'Revenue']}
                  contentStyle={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 13 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card panel">
          <div className="flex" style={{ justifyContent: 'space-between' }}>
            <h3>Top Sellers</h3>
            <Link to="/sales" className="flex gap-2" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              POS <ArrowRight size={14} />
            </Link>
          </div>
          {topSellers.length === 0 ? (
            <EmptyState title="Nothing sold yet" />
          ) : (
            topSellers.map((p, i) => (
              <div key={p.productId} className="rank-row">
                <span className="rank-num">{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.name}
                  </div>
                  <div className="muted" style={{ fontSize: '0.75rem' }}>{p.totalQuantity} sold</div>
                </div>
                <span className="mono" style={{ fontWeight: 700, fontSize: '0.85rem' }}>{money(p.totalRevenue)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {lowStock.count > 0 && (
        <div className="card panel" style={{ marginTop: '1rem' }}>
          <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <h3>Low Stock — needs restocking</h3>
            <Link to="/inventory?lowStock=1" style={{ fontSize: '0.82rem', fontWeight: 600 }}>View all</Link>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>SKU</th><th>Product</th><th>Stock</th><th>Threshold</th><th>Status</th></tr>
              </thead>
              <tbody>
                {lowStock.items.slice(0, 6).map((p) => (
                  <tr key={p._id}>
                    <td className="mono">{p.sku}</td>
                    <td>{p.name}</td>
                    <td className="mono">{p.stockQuantity}</td>
                    <td className="mono muted">{p.lowStockThreshold}</td>
                    <td>
                      <Badge tone={p.severity === 'OUT_OF_STOCK' ? 'danger' : 'warning'}>
                        {p.severity === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
