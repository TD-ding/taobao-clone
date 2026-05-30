import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (keyword.trim()) navigate(`/?keyword=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate('/')}>
        <span>🛍️</span> 淘淘购物
      </div>
      <form className="search-box" onSubmit={handleSearch}>
        <input placeholder="搜索商品..." value={keyword} onChange={e => setKeyword(e.target.value)} />
        <button type="submit">搜索</button>
      </form>
      <div className="nav-links">
        <Link to="/">首页</Link>
        {user ? (
          <>
            <Link to="/cart">购物车<span className="cart-badge">🛒</span></Link>
            <Link to="/orders">我的订单</Link>
            {isAdmin && <Link to="/admin">管理后台</Link>}
            <button onClick={logout}>退出 ({user.username})</button>
          </>
        ) : (
          <>
            <Link to="/login">登录</Link>
            <Link to="/register">注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}
