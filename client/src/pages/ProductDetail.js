import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatTime } from '../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshCartCount } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [msg, setMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then(p => {
      setProduct(p);
      setCurrentImg(0);
    }).catch(() => navigate('/'));
  }, [id, navigate]);

  useEffect(() => {
    if (user) {
      api.get(`/profile/favorites/check/${id}`).then(data => setFavorited(data.favorited)).catch(() => {});
    }
  }, [id, user]);

  const fetchReviews = () => {
    api.get(`/profile/reviews/${id}`).then(setReviews).catch(() => {});
  };

  useEffect(fetchReviews, [id]);

  const allImages = [];
  if (product) {
    if (product.image) allImages.push(product.image);
    if (product.images) {
      try {
        const extra = JSON.parse(product.images);
        if (Array.isArray(extra)) extra.forEach(img => { if (img && !allImages.includes(img)) allImages.push(img); });
      } catch (e) {}
    }
  }

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

  const toggleFavorite = async () => {
    if (!user) return navigate('/login');
    setFavLoading(true);
    try {
      if (favorited) {
        await api.delete(`/profile/favorites/${id}`);
        setFavorited(false);
      } else {
        await api.post('/profile/favorites', { product_id: parseInt(id) });
        setFavorited(true);
      }
    } catch (e) { setMsg(e.message); }
    setFavLoading(false);
  };

  const submitReview = async () => {
    if (!user) return navigate('/login');
    if (!reviewContent.trim()) { setReviewError('评价内容不能为空'); return; }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      await api.post('/profile/reviews', { product_id: parseInt(id), rating: reviewRating, content: reviewContent });
      setShowReviewForm(false);
      setReviewContent('');
      setReviewRating(5);
      fetchReviews();
      api.get(`/products/${id}`).then(setProduct);
    } catch (e) { setReviewError(e.message); }
    setReviewSubmitting(false);
  };

  if (!product) return <div className="container"><div className="empty-state"><div className="icon">⏳</div><p>加载中...</p></div></div>;

  const isOffShelf = product.status !== 'active';
  const isSoldOut = product.stock === 0;

  return (
    <div className="container">
      <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
      <div className="product-detail">
        <div className="main-img-area">
          <div className="main-img">
            {allImages.length > 0 ? <img src={allImages[currentImg]} alt={product.name} /> : <span className="placeholder">📦</span>}
          </div>
          {allImages.length > 1 && (
            <div className="img-thumbnails">
              {allImages.map((img, i) => (
                <div key={i} className={`img-thumb ${i === currentImg ? 'active' : ''}`} onClick={() => setCurrentImg(i)}>
                  <img src={img} alt="" />
                </div>
              ))}
            </div>
          )}
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
            <button className={`btn-fav ${favorited ? 'favorited' : ''}`} onClick={toggleFavorite} disabled={favLoading}>
              {favorited ? '❤️ 已收藏' : '🤍 收藏'}
            </button>
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

      <div className="reviews-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>商品评价 ({reviews.length})</h3>
          {user && <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 14 }} onClick={() => setShowReviewForm(!showReviewForm)}>写评价</button>}
        </div>

        {showReviewForm && (
          <div style={{ background: 'white', borderRadius: 8, padding: 20, marginBottom: 16 }}>
            <div className="form-group">
              <label>评分</label>
              <div className="star-selector">
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} style={{ fontSize: 28, cursor: 'pointer', color: n <= reviewRating ? '#ff9800' : '#ddd' }} onClick={() => setReviewRating(n)}>★</span>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>评价内容</label>
              <textarea value={reviewContent} onChange={e => setReviewContent(e.target.value)} rows={3} placeholder="分享你的购买体验..." style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, resize: 'vertical' }} />
            </div>
            {reviewError && <p className="error-msg">{reviewError}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-outline" onClick={() => setShowReviewForm(false)}>取消</button>
              <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 14 }} onClick={submitReview} disabled={reviewSubmitting}>
                {reviewSubmitting ? '提交中...' : '提交评价'}
              </button>
            </div>
          </div>
        )}

        {reviews.length ? reviews.map(r => (
          <div key={r.id} className="review-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 'bold' }}>{r.username}</span>
                <span style={{ color: '#ff9800' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <span style={{ color: '#999', fontSize: 12 }}>{formatTime(r.created_at)}</span>
            </div>
            <p style={{ color: '#333', fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{r.content}</p>
          </div>
        )) : <div className="empty-state"><div className="icon">💬</div><p>暂无评价</p></div>}
      </div>
    </div>
  );
}
