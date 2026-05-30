import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (!user || !isAdmin) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 100 }}>
        <h2>需要管理员权限</h2>
        <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/login')}>去登录</button>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="logo">🛍️ 管理后台</div>
        <nav>
          <NavLink to="dashboard" className={({ isActive }) => isActive ? 'active' : ''}>📊 数据看板</NavLink>
          <NavLink to="products" className={({ isActive }) => isActive ? 'active' : ''}>📦 商品管理</NavLink>
          <NavLink to="orders" className={({ isActive }) => isActive ? 'active' : ''}>📋 订单管理</NavLink>
          <NavLink to="users" className={({ isActive }) => isActive ? 'active' : ''}>👥 用户管理</NavLink>
        </nav>
        <div style={{ padding: '0 20px', marginTop: 'auto' }}>
          <button onClick={() => { logout(); navigate('/'); }} style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>退出登录</button>
        </div>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
