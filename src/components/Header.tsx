import React from 'react';
import { Bot, Package, BarChart3, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'orders' | 'analytics';
  setActiveTab: (tab: 'chat' | 'orders' | 'analytics') => void;
  onResetData: () => void;
  deflectionRate: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onResetData,
  deflectionRate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-slate-100 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <span className="text-xl font-bold text-cyan-400">✦</span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Northstar Retail Co.
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  <Sparkles className="w-3 h-3 mr-1 text-cyan-400" /> Deflection MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Customer Support Assistant & Ticket Deflection Engine
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Support Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'orders'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Order Database</span>
              <span className="sm:hidden">Orders</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Deflection Analytics</span>
              <span className="sm:hidden">Metrics</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {deflectionRate}%
              </span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={onResetData}
              title="Reset order state and chat metrics"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
