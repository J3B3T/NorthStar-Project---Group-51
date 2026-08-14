/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { OrderExplorer } from './components/OrderExplorer';
import { DeflectionDashboard } from './components/DeflectionDashboard';
import { EscalationModal } from './components/EscalationModal';
import { ChatMessage, Order, DeflectionAnalytics } from './types';
import { INITIAL_ORDERS, INITIAL_ANALYTICS } from './mockData';

const INITIAL_GREETING_MSG: ChatMessage = {
  id: 'msg-0',
  sender: 'assistant',
  text: `Hello! 👋 Welcome to Northstar Retail Support. I'm here to help you with your order. I can assist with:\n\n📦 Order Status\n\n🔄 Returns & Refunds\n\nPlease tell me how I can help today.`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'orders' | 'analytics'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING_MSG]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [analytics, setAnalytics] = useState<DeflectionAnalytics>(INITIAL_ANALYTICS);
  const [isLoading, setIsLoading] = useState(false);

  // Escalation Modal state
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [escalationData, setEscalationData] = useState<{ orderNumber?: string; reason: string }>({
    reason: 'Requested human specialist',
  });

  // Fetch initial data from server
  useEffect(() => {
    fetchData();
  }, []);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setFetchError(null);
      const [ordersRes, analyticsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/analytics'),
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (data.orders) setOrders(data.orders);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        if (data.analytics) setAnalytics(data.analytics);
      }
    } catch (err) {
      console.warn('Using client fallback data:', err);
      setFetchError('Unable to connect to server. Using cached data.');
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          messages: messages.concat(userMsg),
        }),
      });

      const data = await response.json();

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.text || "I'm here to help with your order status or returns.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orderContext: data.orderContext || null,
        isEscalated: data.isEscalated || false,
        escalationReason: data.escalationReason,
      };

      setMessages((prev) => [...prev, botMsg]);

      // Refresh analytics after every interaction
      fetchData();
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: "I'd be happy to check that for you. Could you please provide your order number?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        text: `Hello! 👋 Welcome to Northstar Retail Support. I'm here to help you with your order. I can assist with:\n\n📦 Order Status\n\n🔄 Returns & Refunds\n\nPlease tell me how I can help today.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleResetData = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch (e) {
      console.warn('Reset endpoint failed, resetting local state');
    }
    handleResetChat();
    fetchData();
  };

  const handleSelectOrderForChat = (orderNumber: string) => {
    setActiveTab('chat');
    handleSendMessage(`What is the status of my order ${orderNumber}?`);
  };

  const handleOpenEscalationModal = (orderNumber?: string, reason?: string) => {
    setEscalationData({
      orderNumber,
      reason: reason || 'Human support specialist requested',
    });
    setIsEscalationModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetData={handleResetData}
        deflectionRate={analytics.deflectionRate}
      />

      {fetchError && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between" role="alert">
          <span>{fetchError}</span>
          <button
            onClick={() => setFetchError(null)}
            className="text-amber-600 hover:text-amber-800 font-semibold"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1" role="main">
        {activeTab === 'chat' && (
          <section aria-label="Support Chat">
            <ChatWindow
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onOpenEscalationModal={handleOpenEscalationModal}
              onResetChat={handleResetChat}
              orders={orders}
            />
          </section>
        )}

        {activeTab === 'orders' && (
          <section aria-label="Order Database">
            <OrderExplorer
              orders={orders}
              onSelectOrderForChat={handleSelectOrderForChat}
            />
          </section>
        )}

        {activeTab === 'analytics' && (
          <section aria-label="Deflection Analytics">
            <DeflectionDashboard analytics={analytics} />
          </section>
        )}
      </main>

      <EscalationModal
        isOpen={isEscalationModalOpen}
        onClose={() => setIsEscalationModalOpen(false)}
        orderNumber={escalationData.orderNumber}
        reason={escalationData.reason}
        onSubmitTicket={() => fetchData()}
      />
    </div>
  );
}
