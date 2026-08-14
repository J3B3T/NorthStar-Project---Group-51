import React from 'react';

export type OrderStatusType =
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

interface StatusBadgeProps {
  status: OrderStatusType;
  size?: 'sm' | 'md';
}

const statusStyles: Record<OrderStatusType, { bg: string; text: string; border: string }> = {
  Processing: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  Packed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  Shipped: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Out for Delivery': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  Delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  Cancelled: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(({ status, size = 'md' }) => {
  const styles = statusStyles[status] || statusStyles['Processing'];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses}`}
      aria-label={`Order status: ${status}`}
    >
      {status}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
