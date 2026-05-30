import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debounceRef = useRef(null);

  useEffect(() => {
    const kw = searchParams.get('keyword') || '';
    setKeyword(kw);
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      api.get('/users/cart').then(items => setCartCount(items.length)).catch(() => {});
    } else {
      setCartCount(0);
    }
  }, [user]);

  const handleSearchInput = (val) => {
    setKeyword(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) navigate(`/?keyword=${encodeURIComponent(val.trim())}`);
      else navigate('/');
    }, 400);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    if (keyword.trim()) navigate(`/?keyword=${encodeURIComponent(keyword.trim())}`);
    else navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate('/')}>
        <span>🛍️</span> <span className="logo-text">淘淘购物</span>
      </div>
      <form className="search-box" onSubmit={handleSearchSubmit}>
        <input placeholder="搜索商品..." value={keyword} onChange={e => handleSearchInput(e.target.value)} />
        <button type="submit">搜索</button>
      </form>
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>首页</Link>
        {user ? (
          <>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>
              购物车{cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <Link to="/orders" onClick={() => setMenuOpen(false)}>我的订单</Link>
            {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)}>管理后台</Link>}
            <button onClick={() => { logout(); setMenuOpen(false); }}>退出 ({user.username})</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>登录</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}>注册</Link>
          </>
        )}
      </div>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>
    </nav>
  );
}
