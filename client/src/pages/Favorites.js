import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';

export default function Favorites() {
  const { user, refreshCartCount } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = () => {
    if (!user) return;
    api.get('/profile/favorites').then(data => { setFavorites(data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(fetchFavorites, [user]);

  const removeFavorite = async (productId) => {
    try {
      await api.delete(`/profile/favorites/${productId}`);
      setFavorites(favorites.filter(f => f.id !== productId));
    } catch (e) { alert(e.message); }
  };

  const addToCart = async (productId) => {
    if (!user) return navigate('/login');
    try {
      await api.post('/users/cart', { product_id: productId, quantity: 1 });
      refreshCartCount();
      alert('已加入购物车');
    } catch (e) { alert(e.message); }
  };

  if (!user) return <div className="container"><div className="empty-state"><div className="icon">🔒</div><p>请先登录</p><button className="btn-primary" onClick={() => navigate('/login')}>去登录</button></div></div>;
  if (loading) return <div className="container"><div className="empty-state"><div className="icon">⏳</div><p>加载中...</p></div></div>;

  return (
    <div className="container">
      <h2 style={{ marginBottom: 16 }}>我的收藏</h2>
      {favorites.length ? (
        <div className="product-grid">
          {favorites.map(p => (
            <div key={p.id} className="product-card">
              <div className="img-wrap" onClick={() => navigate(`/product/${p.id}`)}>
                {p.image ? <img src={p.image} alt={p.name} /> : <span className="placeholder">📦</span>}
                {p.status !== 'active' && <span className="stock-hint sold-out">已下架</span>}
              </div>
              <div className="info">
                <div className="name" onClick={() => navigate(`/product/${p.id}`)} style={{ cursor: 'pointer' }}>{p.name}</div>
                <div className="price-row">
                  <span className="price">{formatPrice(p.price)}</span>
                  {p.original_price && <span className="original-price">{formatPrice(p.original_price)}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => addToCart(p.id)} disabled={p.status !== 'active' || p.stock === 0}>
                    加入购物车
                  </button>
                  <button className="btn-outline" style={{ padding: '4px 12px', fontSize: 12, color: '#ff4400', borderColor: '#ff4400' }} onClick={() => removeFavorite(p.id)}>
                    取消收藏
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="empty-state"><div className="icon">❤️</div><p>暂无收藏商品</p><button className="btn-primary" onClick={() => navigate('/')}>去逛逛</button></div>}
    </div>
  );
}
