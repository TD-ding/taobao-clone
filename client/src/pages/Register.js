import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('两次密码不一致'); return; }
    setLoading(true);
    try {
      const data = await api.post('/auth/register', { username: form.username, password: form.password, email: form.email, phone: form.phone });
      login(data.token, data.user);
      navigate('/');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div className="auth-page">
      <h2>注册</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>用户名</label>
          <input value={form.username} onChange={e => update('username', e.target.value)} placeholder="至少3个字符" />
        </div>
        <div className="form-group">
          <label>密码</label>
          <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="至少6个字符" />
        </div>
        <div className="form-group">
          <label>确认密码</label>
          <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="再次输入密码" />
        </div>
        <div className="form-group">
          <label>邮箱（可选）</label>
          <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="your@email.com" />
        </div>
        <div className="form-group">
          <label>手机号（可选）</label>
          <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="13800138000" />
        </div>
        {error && <p className="error-msg">{error}</p>}
        <button className="btn-submit" type="submit" disabled={loading}>{loading ? '注册中...' : '注册'}</button>
      </form>
      <div className="switch-link">已有账号？<Link to="/login">去登录</Link></div>
    </div>
  );
}
