import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    api.get('/stats/overview').then(setStats).catch(() => {});
    api.get('/stats/category-stats').then(setCategoryStats).catch(() => {});
    api.get('/stats/top-products?limit=8').then(setTopProducts).catch(() => {});
  }, []);

  if (!stats) return <div>加载中...</div>;

  const maxSales = Math.max(...categoryStats.map(c => c.total_sales), 1);

  return (
    <div>
      <div className="admin-header"><h2>数据看板</h2></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="label">商品总数</div><div className="value products">{stats.totalProducts}</div></div>
        <div className="stat-card"><div className="label">用户总数</div><div className="value users">{stats.totalUsers}</div></div>
        <div className="stat-card"><div className="label">订单总数</div><div className="value orders">{stats.totalOrders}</div></div>
        <div className="stat-card"><div className="label">总营收</div><div className="value revenue">¥{stats.totalRevenue.toFixed(2)}</div></div>
        <div className="stat-card"><div className="label">待处理订单</div><div className="value orders">{stats.pendingOrders}</div></div>
        <div className="stat-card"><div className="label">配送中订单</div><div className="value orders">{stats.shippedOrders}</div></div>
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
                <tr key={i}><td>{p.name}</td><td>¥{p.price}</td><td>{p.sales}</td><td>{p.stock}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
