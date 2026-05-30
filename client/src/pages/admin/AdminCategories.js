import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Pagination from '../../components/Pagination';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', icon: '', sort_order: 0 });
  const [error, setError] = useState('');

  const fetchCategories = () => {
    api.get('/admin/categories').then(setCategories).catch(() => {});
  };

  useEffect(fetchCategories, []);

  const openCreate = () => {
    setEditCat(null);
    setForm({ name: '', icon: '', sort_order: 0 });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCat(c);
    setForm({ name: c.name, icon: c.icon || '', sort_order: c.sort_order || 0 });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('分类名称不能为空'); return; }
    try {
      if (editCat) {
        await api.put(`/admin/categories/${editCat.id}`, form);
      } else {
        await api.post('/admin/categories', form);
      }
      setShowModal(false);
      fetchCategories();
    } catch (e) { setError(e.message); }
  };

  const deleteCat = async (id) => {
    if (!confirm('确定删除该分类？该分类下的商品将变为未分类。')) return;
    try { await api.delete(`/admin/categories/${id}`); fetchCategories(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="admin-header">
        <h2>分类管理</h2>
        <button className="btn-primary" onClick={openCreate}>+ 新增分类</button>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>ID</th><th>图标</th><th>名称</th><th>排序</th><th>操作</th></tr></thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td style={{ fontSize: 24 }}>{c.icon || '-'}</td>
                <td>{c.name}</td>
                <td>{c.sort_order}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn-edit" onClick={() => openEdit(c)}>编辑</button>
                    <button className="btn-del" onClick={() => deleteCat(c.id)}>删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal form-modal" onClick={e => e.stopPropagation()}>
            <h3>{editCat ? '编辑分类' : '新增分类'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>分类名称 *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>图标（Emoji）</label>
                  <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="如 📱" />
                </div>
                <div className="form-group">
                  <label>排序</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="actions">
                <button className="btn-outline" type="button" onClick={() => setShowModal(false)}>取消</button>
                <button className="btn-primary" type="submit">{editCat ? '保存' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
