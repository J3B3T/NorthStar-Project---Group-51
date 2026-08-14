import React from 'react';
import { DeflectionAnalytics } from '../types';
import { TrendingUp, UserCheck, LifeBuoy, Zap, ShieldAlert, CheckCircle2, PieChart, Clock, MessageSquareText } from 'lucide-react';

interface DeflectionDashboardProps {
  analytics: DeflectionAnalytics;
}

export const DeflectionDashboard: React.FC<DeflectionDashboardProps> = React.memo(({ analytics }) => {
  const deflectionPercent = analytics.deflectionRate;
  const total = Math.max(1, analytics.totalConversations);

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Zap className="w-6 h-6 text-cyan-400" />
                <h2 className="text-xl font-bold tracking-tight">Support Ticket Deflection Analytics</h2>
              </div>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Real-time support deflection metrics for Northstar Retail Co. Tracking resolved customer inquiries without human agent intervention.
              </p>
            </div>
            <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/80 flex items-center space-x-4">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Deflection Rate</span>
                <p className="text-2xl font-black text-emerald-400">{deflectionPercent}%</p>
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Industry Target</span>
                <p className="text-sm font-semibold text-slate-200">75.0%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Inquiries</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{analytics.totalConversations}</p>
              <p className="text-[11px] text-slate-400 mt-1">Order status & return chats</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MessageSquareText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deflected (AI Resolved)</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{analytics.deflectedCount}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Saved ~${(analytics.deflectedCount * 8.5).toFixed(0)} in agent cost</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Escalated to Human</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{analytics.escalatedCount}</p>
              <p className="text-[11px] text-rose-500 font-medium mt-1">{((analytics.escalatedCount / total) * 100).toFixed(1)}% escalation rate</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">42 sec</p>
              <p className="text-[11px] text-slate-400 mt-1">Instant bot lookup vs 18m wait</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Intent Breakdown & Deflection Progress Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress gauge card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
              Deflection Performance Benchmark
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Current Deflection:</span>
                <span className="text-emerald-600 font-bold">{deflectionPercent}%</span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, deflectionPercent)}%` }}
                ></div>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>📦 Order Status Inquiries:</span>
                <span className="font-semibold text-slate-800">{analytics.intentBreakdown.orderStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>🔄 Returns & Refunds:</span>
                <span className="font-semibold text-slate-800">{analytics.intentBreakdown.returnsRefunds}</span>
              </div>
              <div className="flex justify-between">
                <span>⚠️ Out-of-Scope / Escalated:</span>
                <span className="font-semibold text-rose-600 font-bold">{analytics.intentBreakdown.escalated}</span>
              </div>
            </div>
          </div>

          {/* Recent Escalation Ticket Stream */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Live Human Escalation Queue
              </h3>
              <span className="text-xs bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold">
                {analytics.recentTickets.length} Escalations
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Inquiries that exceeded MVP deflection rules (e.g., damaged items, billing double charges, or explicit manager requests) automatically routed to human agents:
            </p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {analytics.recentTickets.map((ticket) => (
                <div
                  key={ticket.ticketId}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {ticket.ticketId}
                      </span>
                      {ticket.orderNumber && (
                        <span className="text-cyan-700 font-mono font-semibold">
                          Order #{ticket.orderNumber}
                        </span>
                      )}
                      <span className="text-slate-500">• {ticket.customerName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{ticket.timestamp}</span>
                  </div>

                  <p className="font-medium text-rose-700 bg-rose-50 p-2 rounded border border-rose-100">
                    Reason: {ticket.reason}
                  </p>

                  {ticket.conversationSnippet.length > 0 && (
                    <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 space-y-1">
                      {ticket.conversationSnippet.map((line, idx) => (
                        <p key={idx} className="italic text-slate-700">{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
