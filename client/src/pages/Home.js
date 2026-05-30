import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { formatPrice } from '../utils/format';
import Pagination from '../components/Pagination';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [selectedCat, setSelectedCat] = useState('');
  const [sort, setSort] = useState('');
  const debounceRef = useRef(null);

  const keyword = searchParams.get('keyword') || '';
  const [inputVal, setInputVal] = useState(keyword);

  useEffect(() => { setInputVal(keyword); }, [keyword]);

  useEffect(() => {
    api.get('/products/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (keyword) params.set('keyword', keyword);
    if (selectedCat) params.set('category_id', selectedCat);
    if (sort) params.set('sort', sort);
    params.set('page', page);
    params.set('limit', 20);
    api.get(`/products?${params.toString()}`).then(data => {
      setProducts(data.products);
      setTotalPages(data.totalPages);
    }).catch(() => {});
  }, [keyword, selectedCat, sort, page]);

  useEffect(() => { setPage(1); }, [keyword, selectedCat, sort]);

  const handleSearchInput = (val) => {
    setInputVal(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        setSearchParams({ keyword: val.trim() });
      } else {
        setSearchParams({});
      }
    }, 400);
  };

  return (
    <div className="container">
      <div className="categories">
        <h3>商品分类</h3>
        <div className="category-list">
          <span className={`category-item ${!selectedCat ? 'active' : ''}`} onClick={() => setSelectedCat('')}>全部</span>
          {categories.map(c => (
            <span key={c.id} className={`category-item ${selectedCat == c.id ? 'active' : ''}`} onClick={() => setSelectedCat(String(c.id))}>
              {c.icon} {c.name}
            </span>
          ))}
        </div>
      </div>

      <div className="filters">
        <span style={{ fontSize: 14, color: '#666' }}>排序：</span>
        {[
          ['', '默认'], ['sales', '销量'], ['price_asc', '价格↑'], ['price_desc', '价格↓'], ['rating', '评分']
        ].map(([val, label]) => (
          <button key={val} className={`filter-btn ${sort === val ? 'active' : ''}`} onClick={() => setSort(val)}>{label}</button>
        ))}
      </div>

      {products.length ? (
        <div className="product-grid">
          {products.map(p => (
            <div key={p.id} className="product-card" onClick={() => navigate(`/product/${p.id}`)}>
              <div className="img-wrap">
                {p.image ? <img src={p.image} alt={p.name} /> : <span className="placeholder">📦</span>}
                {p.stock > 0 && p.stock <= 10 && <span className="stock-hint">仅剩{p.stock}件</span>}
                {p.stock === 0 && <span className="stock-hint sold-out">已售罄</span>}
              </div>
              <div className="info">
                <div className="name">{p.name}</div>
                <div className="price-row">
                  <span className="price">{formatPrice(p.price)}</span>
                  {p.original_price && <span className="original-price">{formatPrice(p.original_price)}</span>}
                </div>
                <div className="meta">
                  <span>销量 {p.sales}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><div className="icon">🔍</div><p>没有找到相关商品</p></div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}