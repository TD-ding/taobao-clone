import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';
import Pagination from '../../components/Pagination';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(debounceRef.current);
  }, [keyword]);

  const fetchUsers = () => {
    const params = new URLSearchParams();
    params.set('page', page); if (debouncedKeyword) params.set('keyword', debouncedKeyword);
    api.get(`/admin/users?${params.toString()}`).then(data => { setUsers(data.users); setTotalPages(data.totalPages); }).catch(() => {});
  };

  useEffect(fetchUsers, [page, debouncedKeyword]);

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    if (!confirm(`确定将用户角色改为${newRole === 'admin' ? '管理员' : '普通用户'}？`)) return;
    try { await api.put(`/admin/users/${id}/role`, { role: newRole }); fetchUsers(); } catch (e) { alert(e.message); }
  };

  const deleteUser = async (id) => {
    if (!confirm('确定删除该用户？')) return;
    try { await api.delete(`/admin/users/${id}`); fetchUsers(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="admin-header"><h2>用户管理</h2></div>

      <div className="filters">
        <input placeholder="搜索用户..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 4 }} />
      </div>

      <div className="admin-table-wrap">
        <table>
          <thead><tr><th>ID</th><th>用户名</th><th>角色</th><th>邮箱</th><th>手机</th><th>注册时间</th><th>操作</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td><span className={`status-badge ${u.role === 'admin' ? 'status-delivered' : 'status-paid'}`}>{u.role === 'admin' ? '管理员' : '用户'}</span></td>
                <td>{u.email || '-'}</td>
                <td>{u.phone || '-'}</td>
                <td style={{ fontSize: 12 }}>{u.created_at}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn-edit" onClick={() => toggleRole(u.id, u.role)}>{u.role === 'admin' ? '降为用户' : '升为管理员'}</button>
                    <button className="btn-del" onClick={() => deleteUser(u.id)}>删除</button>
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
