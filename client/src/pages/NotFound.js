import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container">
      <div className="empty-state">
        <div className="icon">🤷</div>
        <h2>404 - 页面不存在</h2>
        <p style={{ margin: '16px 0' }}>你访问的页面不存在，请检查链接是否正确。</p>
        <Link to="/" className="btn-primary" style={{ display: 'inline-block' }}>返回首页</Link>
      </div>
    </div>
  );
}