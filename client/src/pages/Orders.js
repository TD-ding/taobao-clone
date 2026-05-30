import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, STATUS_MAP } from '../utils/format';
import Pagination from '../components/Pagination';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams();
    params.set('page', page);
    if (status) params.set('status', status);
    api.get(`/orders?${params.toString()}`).then(data => { setOrders(data.orders); setTotalPages(data.totalPages); }).catch(() => {});
  }, [user, page, status]);

  const cancelOrder = async (id) => {
    if (!confirm('确定取消该订单？')) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
    } catch (e) { alert(e.message); }
  };

  if (!user) return <div className="container"><div className="empty-state"><div className="icon">🔒</div><p>请先登录</p></div></div>;

  return (
    <div className="container">
      <h2 style={{ marginBottom: 16 }}>我的订单</h2>
      <div className="filters">
        {['', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} className={`filter-btn ${status === s ? 'active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s ? STATUS_MAP[s].label : '全部'}
          </button>
        ))}
      </div>

      {orders.length ? orders.map(order => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <span>订单号：{order.id} | {order.created_at}</span>
            <span className={`status-badge ${STATUS_MAP[order.status]?.class}`}>{STATUS_MAP[order.status]?.label}</span>
          </div>
          {order.items?.map(item => (
            <div key={item.id} className="order-item">
              {item.product_image ? <img src={item.product_image} alt={item.product_name} /> : <span style={{ fontSize: 30 }}>📦</span>}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>{item.product_name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>x{item.quantity}</div>
              </div>
              <div style={{ fontWeight: 'bold', color: '#ff4400' }}>{formatPrice(item.price * item.quantity)}</div>
            </div>
          ))}
          <div className="order-footer">
            <span>合计：<strong style={{ color: '#ff4400', fontSize: 16 }}>{formatPrice(order.total_price)}</strong></span>
            <div style={{ display: 'flex', gap: 8 }}>
              {order.status === 'pending' && <button className="btn-outline" onClick={() => cancelOrder(order.id)}>取消订单</button>}
              <button className="btn-outline" onClick={() => navigate(`/orders/${order.id}`)}>查看详情</button>
            </div>
          </div>
        </div>
      )) : <div className="empty-state"><div className="icon">📋</div><p>暂无订单</p></div>}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
