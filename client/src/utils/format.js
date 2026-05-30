export function formatPrice(price) {
  return `¥${Number(price).toFixed(2)}`;
}

export const STATUS_MAP = {
  pending: { label: '待付款', class: 'status-pending' },
  paid: { label: '已付款', class: 'status-paid' },
  shipped: { label: '已发货', class: 'status-shipped' },
  delivered: { label: '已收货', class: 'status-delivered' },
  cancelled: { label: '已取消', class: 'status-cancelled' },
};

export function formatTime(str) {
  if (!str) return '';
  const d = new Date(str + 'Z');
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
