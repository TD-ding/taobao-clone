import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { username, password });
      login(data.token, data.user);
      navigate('/');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <h2>登录</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-submit" type="submit" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
      </form>
      <div className="switch-link">还没有账号？<Link to="/register">去注册</Link></div>
    </div>
  );
}
