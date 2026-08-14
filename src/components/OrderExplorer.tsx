import React, { useState, useMemo, useCallback } from 'react';
import { Order } from '../types';
import { Package, Search, ExternalLink, ShieldAlert, CheckCircle2, Truck, RefreshCw, Clock, Copy, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface OrderExplorerProps {
  orders: Order[];
  onSelectOrderForChat: (orderNumber: string) => void;
}

export const OrderExplorer: React.FC<OrderExplorerProps> = React.memo(({ orders, onSelectOrderForChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'eligible') return matchesSearch && order.returnStatus === 'Eligible';
    if (statusFilter === 'ineligible') return matchesSearch && order.returnStatus === 'Not Eligible';
    if (statusFilter === 'damaged') return matchesSearch && order.isDamagedReported;
    return matchesSearch && order.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const handleCopy = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = useCallback((status: string) => {
    return <StatusBadge status={status as Order['status']} size="md" />;
  }, []);

  const getReturnBadge = (status: string, isDamaged?: boolean) => {
    if (isDamaged) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-700 border border-rose-300 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Damaged Item (Escalate)
        </span>
      );
    }
    switch (status) {
      case 'Eligible':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-700 border border-emerald-300">Eligible (30 Days)</span>;
      case 'Not Eligible':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-700 border border-rose-300">Ineligible (Outside Window)</span>;
      case 'Already Returned':
      case 'Refund Processing':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-700 border border-cyan-300">Refund Processing</span>;
      case 'Refund Completed':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-700 border border-purple-300">Refund Completed</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Package className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold tracking-tight">Northstar Order Database</h2>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Pre-populated test database covering all 10 ticket scenarios specified in the Northstar Support prompt (Order Statuses, Return windows, Refunds & Escalations). Click any order to test in the AI Assistant!
              </p>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
              <span className="text-xs font-semibold text-slate-300 px-2">Quick Test Scenarios:</span>
              <span className="text-xs text-cyan-300 bg-cyan-950 px-2 py-1 rounded border border-cyan-800">
                10 Orders Configured
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Order # (e.g. NS1004), Customer, or Product..."
              aria-label="Search orders"
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Filter:</span>
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'processing', label: 'Processing' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'out for delivery', label: 'Out for Delivery' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'eligible', label: 'Eligible Return' },
              { id: 'ineligible', label: 'Outside Window' },
              { id: 'damaged', label: 'Damaged Item' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                aria-pressed={statusFilter === tab.id}
                aria-label={`Filter by ${tab.label}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-cyan-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => (
            <div
              key={order.orderNumber}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-base text-slate-900 group-hover:text-cyan-700 transition-colors">
                        {order.orderNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(order.orderNumber)}
                        aria-label={`Copy order number ${order.orderNumber}`}
                        title="Copy order number"
                        className="text-slate-400 hover:text-cyan-600 p-1 rounded transition-colors"
                      >
                        {copiedId === order.orderNumber ? (
                          <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customer: <span className="font-medium text-slate-700">{order.customerName}</span> ({order.email})
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Product items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-500">
                          Qty: {item.quantity} • ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Metadata */}
                <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Date:</span>
                    <span className="font-medium text-slate-700">{order.orderDate}</span>
                  </div>
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Carrier / Tracking:</span>
                      <span className="font-mono text-slate-700 font-medium">{order.carrier}: {order.trackingNumber}</span>
                    </div>
                  )}
                  {order.estimatedDelivery && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Delivery:</span>
                      <span className="font-medium text-cyan-700">{order.estimatedDelivery}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200/60 font-semibold text-slate-800">
                    <span>Total Amount:</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Status & Return details */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Return Status:</span>
                  {getReturnBadge(order.returnStatus, order.isDamagedReported)}
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onSelectOrderForChat(order.orderNumber)}
                  className="w-full py-2 px-3 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
                >
                  <span>Test in Chat Assistant</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
