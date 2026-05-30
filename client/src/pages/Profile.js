import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatTime } from '../utils/format';

export default function Profile() {
  const { user, login, token } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('info');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [editAddr, setEditAddr] = useState(null);
  const [addrForm, setAddrForm] = useState({ name: '', phone: '', address: '', is_default: false });
  const [addrError, setAddrError] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setAvatar(user.avatar || '');
  }, [user]);

  const fetchAddresses = () => {
    api.get('/profile/addresses').then(setAddresses).catch(() => {});
  };

  useEffect(fetchAddresses, [user]);

  const handleProfileSave = async () => {
    try {
      const data = await api.put('/profile/profile', { email, phone, avatar });
      login(token, data.user);
      setProfileMsg('保存成功');
      setTimeout(() => setProfileMsg(''), 2000);
    } catch (e) { setProfileMsg(e.message); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const data = await api.upload('/upload', formData);
      setAvatar(data.url);
    } catch (e) { setProfileMsg('头像上传失败'); }
    setUploading(false);
  };

  const openCreateAddr = () => {
    setEditAddr(null);
    setAddrForm({ name: '', phone: '', address: '', is_default: false });
    setAddrError('');
    setShowAddrModal(true);
  };

  const openEditAddr = (addr) => {
    setEditAddr(addr);
    setAddrForm({ name: addr.name || '', phone: addr.phone, address: addr.address, is_default: !!addr.is_default });
    setAddrError('');
    setShowAddrModal(true);
  };

  const handleAddrSubmit = async (e) => {
    e.preventDefault();
    if (!addrForm.address || !addrForm.phone) { setAddrError('地址和电话不能为空'); return; }
    try {
      if (editAddr) {
        await api.put(`/profile/addresses/${editAddr.id}`, addrForm);
      } else {
        await api.post('/profile/addresses', addrForm);
      }
      setShowAddrModal(false);
      fetchAddresses();
    } catch (e) { setAddrError(e.message); }
  };

  const deleteAddr = async (id) => {
    if (!confirm('确定删除该地址？')) return;
    await api.delete(`/profile/addresses/${id}`);
    fetchAddresses();
  };

  const setDefault = async (id) => {
    const addr = addresses.find(a => a.id === id);
    if (!addr) return;
    await api.put(`/profile/addresses/${id}`, { name: addr.name, phone: addr.phone, address: addr.address, is_default: true });
    fetchAddresses();
  };

  if (!user) return <div className="container"><div className="empty-state"><div className="icon">🔒</div><p>请先登录</p><button className="btn-primary" onClick={() => navigate('/login')}>去登录</button></div></div>;

  return (
    <div className="container">
      <div className="profile-page">
        <h2>个人中心</h2>
        <div className="profile-tabs">
          <button className={`filter-btn ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>基本信息</button>
          <button className={`filter-btn ${tab === 'address' ? 'active' : ''}`} onClick={() => setTab('address')}>收货地址</button>
        </div>

        {tab === 'info' && (
          <div className="profile-section">
            <div className="form-group">
              <label>头像</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {avatar ? <img src={avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} /> : <span style={{ fontSize: 48 }}>👤</span>}
                <div>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                  {uploading && <span style={{ fontSize: 12, color: '#999' }}>上传中...</span>}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>用户名</label>
              <input value={user.username} disabled style={{ background: '#f5f5f5' }} />
            </div>
            <div className="form-group">
              <label>邮箱</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" />
            </div>
            <div className="form-group">
              <label>手机号</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="请输入手机号" />
            </div>
            <div className="form-group">
              <label>注册时间</label>
              <input value={formatTime(user.created_at)} disabled style={{ background: '#f5f5f5' }} />
            </div>
            <button className="btn-primary" onClick={handleProfileSave} style={{ marginTop: 12 }}>保存修改</button>
            {profileMsg && <p style={{ color: profileMsg.includes('成功') ? '#4caf50' : '#ff4400', marginTop: 8 }}>{profileMsg}</p>}
          </div>
        )}

        {tab === 'address' && (
          <div className="profile-section">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn-primary" onClick={openCreateAddr}>+ 新增地址</button>
            </div>
            {addresses.length ? addresses.map(addr => (
              <div key={addr.id} className="address-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{addr.name || user.username} <span style={{ color: '#666', fontWeight: 'normal', marginLeft: 8 }}>{addr.phone}</span></div>
                    <div style={{ color: '#666', fontSize: 14, marginTop: 4 }}>{addr.address}</div>
                    {addr.is_default ? <span style={{ color: '#ff4400', fontSize: 12, marginTop: 4, display: 'inline-block' }}>默认地址</span> : (
                      <button style={{ color: '#2196f3', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, padding: 0 }} onClick={() => setDefault(addr.id)}>设为默认</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => openEditAddr(addr)}>编辑</button>
                    <button className="btn-outline" style={{ padding: '4px 12px', fontSize: 12, color: '#ff4400', borderColor: '#ff4400' }} onClick={() => deleteAddr(addr.id)}>删除</button>
                  </div>
                </div>
              </div>
            )) : <div className="empty-state"><div className="icon">📍</div><p>暂无收货地址</p></div>}
          </div>
        )}
      </div>

      {showAddrModal && (
        <div className="modal-overlay" onClick={() => setShowAddrModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editAddr ? '编辑地址' : '新增地址'}</h3>
            <form onSubmit={handleAddrSubmit}>
              <div className="form-group">
                <label>收货人</label>
                <input value={addrForm.name} onChange={e => setAddrForm({ ...addrForm, name: e.target.value })} placeholder="请输入收货人姓名" />
              </div>
              <div className="form-group">
                <label>联系电话 *</label>
                <input value={addrForm.phone} onChange={e => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="请输入联系电话" />
              </div>
              <div className="form-group">
                <label>详细地址 *</label>
                <input value={addrForm.address} onChange={e => setAddrForm({ ...addrForm, address: e.target.value })} placeholder="请输入详细地址" />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={addrForm.is_default} onChange={e => setAddrForm({ ...addrForm, is_default: e.target.checked })} />
                  设为默认地址
                </label>
              </div>
              {addrError && <p className="error-msg">{addrError}</p>}
              <div className="actions">
                <button className="btn-outline" type="button" onClick={() => setShowAddrModal(false)}>取消</button>
                <button className="btn-primary" type="submit">{editAddr ? '保存' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
