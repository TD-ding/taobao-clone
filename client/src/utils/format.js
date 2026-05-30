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
