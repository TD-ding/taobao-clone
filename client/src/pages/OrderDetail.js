import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_MAP = {
  pending: { label: '待付款', class: 'status-pending' },
  paid: { label: '已付款', class: 'status-paid' },
  shipped: { label: '已发货', class: 'status-shipped' },
  delivered: { label: '已收货', class: 'status-delivered' },
  cancelled: { label: '已取消', class: 'status-cancelled' },
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get(`/orders/${id}`).then(setOrder).catch(() => navigate('/orders'));
  }, [id, user, navigate]);

  if (!order) return <div className="container"><div className="empty-state"><div className="icon">⏳</div><p>加载中...</p></div></div>;

  return (
    <div className="container">
      <div style={{ background: 'white', borderRadius: 8, padding: 24, marginTop: 20 }}>
        <h2>订单详情</h2>
        <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'space-between' }}>
          <span>订单号：{order.id}</span>
          <span className={`status-badge ${STATUS_MAP[order.status]?.class}`}>{STATUS_MAP[order.status]?.label}</span>
        </div>
        <div style={{ color: '#666', fontSize: 14, margin: '8px 0' }}>下单时间：{order.created_at}</div>
        <div style={{ color: '#666', fontSize: 14, margin: '8px 0' }}>收货地址：{order.address}</div>
        <div style={{ color: '#666', fontSize: 14, margin: '8px 0' }}>联系电话：{order.phone}</div>
        {order.note && <div style={{ color: '#666', fontSize: 14, margin: '8px 0' }}>备注：{order.note}</div>}

        <h3 style={{ margin: '20px 0 12px' }}>商品列表</h3>
        {order.items?.map(item => (
          <div key={item.id} className="order-item">
            {item.product_image ? <img src={item.product_image} alt={item.product_name} /> : <span style={{ fontSize: 30 }}>📦</span>}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14 }}>{item.product_name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>单价：¥{item.price} x {item.quantity}</div>
            </div>
            <div style={{ fontWeight: 'bold', color: '#ff4400' }}>¥{(item.price * item.quantity).toFixed(2)}</div>
          </div>
        ))}

        <div style={{ textAlign: 'right', marginTop: 16, paddingTop: 16, borderTop: '2px solid #f0f0f0' }}>
          <span>订单总额：</span>
          <strong style={{ color: '#ff4400', fontSize: 22 }}>¥{order.total_price.toFixed(2)}</strong>
        </div>

        <button className="btn-outline" style={{ marginTop: 16 }} onClick={() => navigate('/orders')}>返回订单列表</button>
      </div>
    </div>
  );
}
