import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshCartCount } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then(setProduct).catch(() => navigate('/'));
  }, [id, navigate]);

  const addToCart = async () => {
    if (!user) return navigate('/login');
    setAdding(true);
    try {
      await api.post('/users/cart', { product_id: parseInt(id), quantity });
      refreshCartCount();
      setMsg('已加入购物车');
      setTimeout(() => setMsg(''), 2000);
    } catch (e) { setMsg(e.message); }
    setAdding(false);
  };

  const buyNow = async () => {
    if (!user) return navigate('/login');
    setBuying(true);
    try {
      await api.post('/users/cart', { product_id: parseInt(id), quantity });
      refreshCartCount();
      navigate('/cart');
    } catch (e) { setMsg(e.message); }
    setBuying(false);
  };

  if (!product) return <div className="container"><div className="empty-state"><div className="icon">⏳</div><p>加载中...</p></div></div>;

  const isOffShelf = product.status !== 'active';
  const isSoldOut = product.stock === 0;

  return (
    <div className="container">
      <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
      <div className="product-detail">
        <div className="main-img">
          {product.image ? <img src={product.image} alt={product.name} /> : <span className="placeholder">📦</span>}
        </div>
        <div className="detail-info">
          <h1>{product.name}</h1>
          <div className="price-box">
            <span className="current">{formatPrice(product.price)}</span>
            {product.original_price && <span className="original">{formatPrice(product.original_price)}</span>}
          </div>
          <div className="meta-info">
            <span>分类：{product.category_name || '未分类'}</span>
            <span>销量：{product.sales}</span>
            {!isSoldOut && <span>库存：{product.stock}件</span>}
          </div>
          {isOffShelf && <div style={{ color: '#ff4400', fontWeight: 'bold', margin: '12px 0', fontSize: 16 }}>该商品已下架</div>}
          {isSoldOut && !isOffShelf && <div style={{ color: '#ff4400', fontWeight: 'bold', margin: '12px 0', fontSize: 16 }}>该商品已售罄</div>}
          <p style={{ color: '#666', fontSize: 14, lineHeight: 1.8, margin: '12px 0' }}>{product.description}</p>
          <div className="quantity-selector">
            <span>数量：</span>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={isOffShelf || isSoldOut}>-</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={isOffShelf || isSoldOut}>+</button>
          </div>
          <div className="actions">
            <button className="btn-secondary" onClick={addToCart} disabled={isOffShelf || isSoldOut || adding}>
              {adding ? '添加中...' : '加入购物车'}
            </button>
            <button className="btn-primary" onClick={buyNow} disabled={isOffShelf || isSoldOut || buying}>
              {buying ? '处理中...' : '立即购买'}
            </button>
          </div>
          {msg && <p style={{ color: msg.includes('成功') || msg.includes('购物车') ? '#4caf50' : '#ff4400', marginTop: 12 }}>{msg}</p>}
        </div>
      </div>
    </div>
  );
}