import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatPrice } from '../../utils/format';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesDaily, setSalesDaily] = useState([]);
  const [salesDays, setSalesDays] = useState(7);

  useEffect(() => {
    api.get('/stats/overview').then(setStats).catch(() => {});
    api.get('/stats/category-stats').then(setCategoryStats).catch(() => {});
    api.get('/stats/top-products?limit=8').then(setTopProducts).catch(() => {});
    api.get(`/stats/sales-daily?days=${salesDays}`).then(setSalesDaily).catch(() => {});
  }, []);

  useEffect(() => {
    api.get(`/stats/sales-daily?days=${salesDays}`).then(setSalesDaily).catch(() => {});
  }, [salesDays]);

  if (!stats) return <div>加载中...</div>;

  const maxSales = Math.max(...categoryStats.map(c => c.total_sales), 1);
  const maxRevenue = Math.max(...salesDaily.map(d => d.revenue), 1);

  return (
    <div>
      <div className="admin-header"><h2>数据看板</h2></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="label">商品总数</div><div className="value products">{stats.totalProducts}</div></div>
        <div className="stat-card"><div className="label">用户总数</div><div className="value users">{stats.totalUsers}</div></div>
        <div className="stat-card"><div className="label">订单总数</div><div className="value orders">{stats.totalOrders}</div></div>
        <div className="stat-card"><div className="label">总营收</div><div className="value revenue">{formatPrice(stats.totalRevenue)}</div></div>
        <div className="stat-card"><div className="label">待处理订单</div><div className="value orders">{stats.pendingOrders}</div></div>
        <div className="stat-card"><div className="label">配送中订单</div><div className="value orders">{stats.shippedOrders}</div></div>
      </div>

      <div className="chart-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0 }}>销售趋势</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            {[7, 14, 30].map(d => (
              <button key={d} className={`filter-btn ${salesDays === d ? 'active' : ''}`} onClick={() => setSalesDays(d)} style={{ padding: '4px 12px', fontSize: 12 }}>
                近{d}天
              </button>
            ))}
          </div>
        </div>
        {salesDaily.length > 0 ? (
          <div className="line-chart">
            <div className="line-chart-bars">
              {salesDaily.map((d, i) => (
                <div key={i} className="line-chart-col">
                  <div className="line-chart-bar-wrap">
                    <div className="line-chart-bar" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}>
                      <span className="line-chart-tooltip">{formatPrice(d.revenue)}</span>
                    </div>
                  </div>
                  <span className="line-chart-label">{d.order_count}单</span>
                  <span className="line-chart-date">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>暂无销售数据</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="chart-section">
          <h4>分类销量排行</h4>
          <div className="bar-chart">
            {categoryStats.map(c => (
              <div key={c.category} className="bar-row">
                <span className="label">{c.category}</span>
                <div className="bar-bg">
                  <div className="bar-fill" style={{ width: `${(c.total_sales / maxSales) * 100}%` }}>{c.total_sales}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-section">
          <h4>热销商品 TOP8</h4>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead><tr><th>商品</th><th>价格</th><th>销量</th><th>库存</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i}><td>{p.name}</td><td>{formatPrice(p.price)}</td><td>{p.sales}</td><td>{p.stock}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
