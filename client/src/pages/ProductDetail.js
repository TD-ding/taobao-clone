import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/products/${id}`).then(setProduct).catch(() => navigate('/'));
  }, [id, navigate]);

  const addToCart = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post('/users/cart', { product_id: parseInt(id), quantity });
      setMsg('已加入购物车');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) { setMsg(e.message); }
  };

  const buyNow = async () => {
    if (!user) return navigate('/login');
    try {
      await api.post('/users/cart', { product_id: parseInt(id), quantity });
      navigate('/cart');
    } catch (e) { setMsg(e.message); }
  };

  if (!product) return <div className="container"><div className="empty-state"><div className="icon">⏳</div><p>加载中...</p></div></div>;

  return (
    <div className="container">
      <div className="product-detail">
        <div className="main-img">
          {product.image ? <img src={product.image} alt={product.name} /> : <span className="placeholder">📦</span>}
        </div>
        <div className="detail-info">
          <h1>{product.name}</h1>
          <div className="price-box">
            <span className="current">{product.price}</span>
            {product.original_price && <span className="original">¥{product.original_price}</span>}
          </div>
          <div className="meta-info">
            <span>分类：{product.category_name || '未分类'}</span>
            <span>销量：{product.sales}</span>
            <span>库存：{product.stock}</span>
          </div>
          <p style={{ color: '#666', fontSize: 14, lineHeight: 1.8, margin: '12px 0' }}>{product.description}</p>
          <div className="quantity-selector">
            <span>数量：</span>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
            <span style={{ fontSize: 12, color: '#999' }}>(库存{product.stock}件)</span>
          </div>
          <div className="actions">
            <button className="btn-secondary" onClick={addToCart}>加入购物车</button>
            <button className="btn-primary" onClick={buyNow}>立即购买</button>
          </div>
          {msg && <p style={{ color: '#ff4400', marginTop: 12 }}>{msg}</p>}
        </div>
      </div>
    </div>
  );
}
