import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { formatPrice } from '../../utils/format';
import Pagination from '../../components/Pagination';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', original_price: '', category_id: '', stock: '', status: 'active', image: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => { api.get('/products/categories').then(setCategories).catch(() => {}); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(debounceRef.current);
  }, [keyword]);

  const fetchProducts = () => {
    const params = new URLSearchParams();
    params.set('page', page); if (debouncedKeyword) params.set('keyword', debouncedKeyword); if (status) params.set('status', status);
    api.get(`/admin/products?${params.toString()}`).then(data => { setProducts(data.products); setTotalPages(data.totalPages); }).catch(() => {});
  };

  useEffect(fetchProducts, [page, debouncedKeyword, status]);

  const openCreate = () => { setEditProduct(null); setForm({ name: '', description: '', price: '', original_price: '', category_id: '', stock: '', status: 'active', image: '' }); setShowModal(true); setError(''); };

  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, description: p.description || '', price: String(p.price), original_price: String(p.original_price || ''), category_id: String(p.category_id || ''), stock: String(p.stock), status: p.status, image: p.image || '' }); setShowModal(true); setError(''); };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData(); formData.append('image', file);
      const data = await api.upload('/upload', formData);
      setForm({ ...form, image: data.url });
    } catch (e) { setError('图片上传失败'); }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const price = parseFloat(form.price);
    if (!form.name) { setError('名称不能为空'); return; }
    if (isNaN(price) || price < 0) { setError('价格不能为空且不能为负数'); return; }
    try {
      const payload = {
        ...form,
        price,
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        stock: parseInt(form.stock) || 0
      };
      if (editProduct) {
        await api.put(`/admin/products/${editProduct.id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      setShowModal(false); fetchProducts();
    } catch (e) { setError(e.message); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('确定删除该商品？')) return;
    try { await api.delete(`/admin/products/${id}`); fetchProducts(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="admin-header">
        <h2>商品管理</h2>
        <button className="btn-primary" onClick={openCreate}>+ 新增商品</button>
      </div>

      <div className="filters">
        <input placeholder="搜索商品..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4 }} />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4 }}>
          <option value="">全部状态</option><option value="active">上架</option><option value="inactive">下架</option>
        </select>
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>ID</th><th>图片</th><th>名称</th><th>价格</th><th>库存</th><th>销量</th><th>分类</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.image ? <img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /> : '📦'}</td>
                <td>{p.name}</td>
                <td style={{ color: '#ff4400' }}>{formatPrice(p.price)}</td>
                <td>{p.stock}</td>
                <td>{p.sales}</td>
                <td>{p.category_name || '-'}</td>
                <td><span className={`status-badge ${p.status === 'active' ? 'status-delivered' : 'status-cancelled'}`}>{p.status === 'active' ? '上架' : '下架'}</span></td>
                <td><div className="table-actions"><button className="btn-edit" onClick={() => openEdit(p)}>编辑</button><button className="btn-del" onClick={() => deleteProduct(p.id)}>删除</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal form-modal" onClick={e => e.stopPropagation()}>
            <h3>{editProduct ? '编辑商品' : '新增商品'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>商品名称 *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group"><label>价格 *</label><input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                <div className="form-group"><label>原价</label><input type="number" step="0.01" min="0" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>分类</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}>
                    <option value="">无分类</option>{categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>库存</label><input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>描述</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6, resize: 'vertical' }} /></div>
              <div className="form-group">
                <label>商品图片</label>
                {form.image && <img src={form.image} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />}
                <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                {uploading && <span style={{ fontSize: 12, color: '#999' }}>上传中...</span>}
              </div>
              <div className="form-group"><label>状态</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }}>
                  <option value="active">上架</option><option value="inactive">下架</option>
                </select>
              </div>
              {error && <p className="error-msg">{error}</p>}
              <div className="actions"><button className="btn-outline" type="button" onClick={() => setShowModal(false)}>取消</button><button className="btn-primary" type="submit">{editProduct ? '保存' : '创建'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}