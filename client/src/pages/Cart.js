import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCart = () => {
    if (!user) { setItems([]); setLoading(false); return; }
    api.get('/users/cart').then(data => { setItems(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(fetchCart, [user]);

  const updateQty = async (id, qty) => {
    if (qty < 1) return;
    await api.put(`/users/cart/${id}`, { quantity: qty });
    setItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = async (id) => {
    await api.delete(`/users/cart/${id}`);
    setItems(items.filter(i => i.id !== id));
  };

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (!address || !phone) { setError('收货地址和联系电话不能为空'); return; }
    try {
      const orderItems = items.map(i => ({ product_id: i.product_id, quantity: i.quantity }));
      await api.post('/orders', { items: orderItems, address, phone, note });
      setShowCheckout(false);
      navigate('/orders');
    } catch (e) { setError(e.message); }
  };

  if (!user) return <div className="container"><div className="empty-state"><div className="icon">🔒</div><p>请先登录</p><button className="btn-primary" onClick={() => navigate('/login')}>去登录</button></div></div>;

  if (loading) return <div className="container"><div className="empty-state"><div className="icon">⏳</div><p>加载中...</p></div></div>;

  return (
    <div className="container">
      <div className="cart-page">
        <h2>我的购物车 ({items.length}件商品)</h2>
        {items.length ? (
          <>
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-img" onClick={() => navigate(`/product/${item.product_id}`)} style={{ cursor: 'pointer' }}>
                  {item.image ? <img src={item.image} alt={item.product_name} /> : <span style={{ fontSize: 30 }}>📦</span>}
                </div>
                <div className="item-info">
                  <div className="name">{item.product_name}</div>
                  <div className="price">¥{item.price}</div>
                  {item.product_status !== 'active' && <div style={{ color: '#ff4400', fontSize: 12 }}>已下架</div>}
                </div>
                <div className="qty-controls">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                </div>
                <div className="item-total">¥{(item.price * item.quantity).toFixed(2)}</div>
                <button className="remove-btn" onClick={() => removeItem(item.id)}>✕</button>
              </div>
            ))}
            <div className="cart-footer">
              <div className="total">合计：<span>¥{totalPrice.toFixed(2)}</span></div>
              <button className="btn-primary" onClick={() => setShowCheckout(true)}>去结算</button>
            </div>
          </>
        ) : (
          <div className="empty-state"><div className="icon">🛒</div><p>购物车空空如也</p><button className="btn-primary" onClick={() => navigate('/')}>去逛逛</button></div>
        )}
      </div>

      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>确认订单</h3>
            <div className="form-group">
              <label>收货地址</label>
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="请输入收货地址" />
            </div>
            <div className="form-group">
              <label>联系电话</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入联系电话" />
            </div>
            <div className="form-group">
              <label>备注（可选）</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="对订单有什么备注" />
            </div>
            <div style={{ margin: '12px 0', fontSize: 16 }}>订单金额：<strong style={{ color: '#ff4400' }}>¥{totalPrice.toFixed(2)}</strong></div>
            {error && <p className="error-msg">{error}</p>}
            <div className="actions">
              <button className="btn-outline" onClick={() => setShowCheckout(false)}>取消</button>
              <button className="btn-primary" onClick={handleCheckout}>提交订单</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
