import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import { formatPrice, STATUS_MAP } from '../../utils/format';
import Pagination from '../../components/Pagination';

const NEXT_STATUS = { pending: 'paid', paid: 'shipped', shipped: 'delivered' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(debounceRef.current);
  }, [keyword]);

  const fetchOrders = () => {
    const params = new URLSearchParams();
    params.set('page', page);
    if (status) params.set('status', status);
    if (debouncedKeyword) params.set('keyword', debouncedKeyword);
    api.get(`/admin/orders?${params.toString()}`).then(data => { setOrders(data.orders); setTotalPages(data.totalPages); }).catch(() => {});
  };

  useEffect(fetchOrders, [page, status, debouncedKeyword]);

  const updateStatus = async (id, newStatus) => {
    const label = newStatus === 'cancelled' ? '取消' : STATUS_MAP[newStatus]?.label || newStatus;
    if (!confirm(`确定将订单状态改为「${label}」？`)) return;
    try { await api.put(`/admin/orders/${id}/status`, { status: newStatus }); fetchOrders(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="admin-header"><h2>订单管理</h2></div>

      <div className="filters">
        <input placeholder="搜索订单号/用户名..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4 }} />
        {['', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button key={s} className={`filter-btn ${status === s ? 'active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s ? STATUS_MAP[s].label : '全部'}
          </button>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>订单号</th><th>用户</th><th>商品</th><th>金额</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.username}</td>
                <td style={{ maxWidth: 200 }}>{o.items?.map(i => `${i.product_name}x${i.quantity}`).join(', ')}</td>
                <td style={{ color: '#ff4400', fontWeight: 'bold' }}>{formatPrice(o.total_price)}</td>
                <td><span className={`status-badge ${STATUS_MAP[o.status]?.class}`}>{STATUS_MAP[o.status]?.label}</span></td>
                <td style={{ fontSize: 12 }}>{o.created_at}</td>
                <td>
                  <div className="table-actions">
                    {NEXT_STATUS[o.status] && (
                      <button className="btn-edit" onClick={() => updateStatus(o.id, NEXT_STATUS[o.status])}>
                        {o.status === 'pending' ? '确认付款' : o.status === 'paid' ? '发货' : '确认收货'}
                      </button>
                    )}
                    {o.status !== 'cancelled' && o.status !== 'delivered' && (
                      <button className="btn-del" onClick={() => updateStatus(o.id, 'cancelled')}>取消</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
