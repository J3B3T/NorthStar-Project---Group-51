import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatMessage, Order } from '../types';
import {
  Send,
  Bot,
  User,
  Package,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  HelpCircle,
  Truck,
  RefreshCw,
} from 'lucide-react';
import avatarImg from '../assets/images/support_avatar_1786612469261.jpg';
import { StatusBadge } from './StatusBadge';

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onOpenEscalationModal: (orderNum?: string, reason?: string) => void;
  onResetChat: () => void;
  orders: Order[];
}

export const ChatWindow: React.FC<ChatWindowProps> = React.memo(({
  messages,
  onSendMessage,
  isLoading,
  onOpenEscalationModal,
  onResetChat,
  orders,
}) => {
  const [inputText, setInputText] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [feedbackState, setFeedbackState] = useState<Record<string, 'helpful' | 'not_helpful'>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Handle TTS text to speech when enabled
  useEffect(() => {
    if (ttsEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'assistant' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(lastMsg.text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);

        // Cleanup on unmount or when messages change
        return () => {
          window.speechSynthesis.cancel();
        };
      }
    }
  }, [messages, ttsEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  const handleQuickChip = async (chipText: string) => {
    if (isLoading) return;
    await onSendMessage(chipText);
  };

  const handleFeedback = (msgId: string, type: 'helpful' | 'not_helpful') => {
    setFeedbackState((prev) => ({ ...prev, [msgId]: type }));
    if (type === 'not_helpful') {
      onOpenEscalationModal(undefined, 'Customer rated bot response as unhelpful');
    }
  };

  const renderOrderStatusBadge = useCallback((status: string) => {
    return <StatusBadge status={status as Order['status']} />;
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-100">
      {/* Bot Chat Bar Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={avatarImg}
              alt="Northstar Assistant"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border-2 border-cyan-500 shadow-sm"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900">Northstar Support Assistant</h2>
              <span className="text-[10px] bg-cyan-100 text-cyan-800 font-bold px-2 py-0.5 rounded-full border border-cyan-200">
                AI Agent Active
              </span>
            </div>
            <p className="text-xs text-slate-500">Order Status • Returns & Refunds • Instant Deflection</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            title={ttsEnabled ? 'Mute AI Voice Speech' : 'Enable AI Voice Speech'}
            aria-label={ttsEnabled ? 'Mute AI Voice Speech' : 'Enable AI Voice Speech'}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
              ttsEnabled
                ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 text-cyan-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={onResetChat}
            title="Start new support conversation"
            aria-label="Start new support conversation"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {/* Quick Demo Instructions Banner */}
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 shadow-sm border border-slate-800 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Northstar Deflection Engine Test Bench</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
              MVP Rules Active
            </span>
          </div>
          <p className="text-slate-300">
            Click any test scenario below or enter an order number (e.g. <span className="font-mono text-cyan-300 font-bold">NS1001</span> to <span className="font-mono text-cyan-300 font-bold">NS1010</span>) to test instant AI resolution or human escalation:
          </p>

          {/* Quick Scenario Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => handleQuickChip("Where is my order NS1004?")}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] transition-colors font-medium flex items-center space-x-1"
            >
              <Truck className="w-3 h-3 text-cyan-400" />
              <span>NS1004 (Out for Delivery)</span>
            </button>

            <button
              onClick={() => handleQuickChip("I want to return order NS1005")}
              className="bg-slate-800 hover:bg-slate-700 text-emerald-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] transition-colors font-medium flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3 text-emerald-400" />
              <span>NS1005 (Eligible Return)</span>
            </button>

            <button
              onClick={() => handleQuickChip("Can I return order NS1006?")}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] transition-colors font-medium flex items-center space-x-1"
            >
              <HelpCircle className="w-3 h-3 text-amber-400" />
              <span>NS1006 (Outside Window)</span>
            </button>

            <button
              onClick={() => handleQuickChip("My order NS1007 arrived damaged")}
              className="bg-slate-800 hover:bg-slate-700 text-rose-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] transition-colors font-medium flex items-center space-x-1"
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>NS1007 (Damaged - Escalation)</span>
            </button>

            <button
              onClick={() => handleQuickChip("When will my refund for NS1009 arrive?")}
              className="bg-slate-800 hover:bg-slate-700 text-purple-300 px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] transition-colors font-medium flex items-center space-x-1"
            >
              <Package className="w-3 h-3 text-purple-400" />
              <span>NS1009 (Refund Processing)</span>
            </button>
          </div>
        </div>

        {/* Message Stream */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-xs ${
                  isUser ? 'bg-slate-800 text-white' : 'bg-cyan-600 text-white border border-cyan-500'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Container */}
              <div className={`max-w-xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Inline Order Details Card if Order Context Exists */}
                {msg.orderContext && !isUser && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 mt-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-cyan-600" />
                        <span className="font-mono font-bold text-slate-900">
                          Order #{msg.orderContext.orderNumber}
                        </span>
                      </div>
                      {renderOrderStatusBadge(msg.orderContext.status)}
                    </div>

                    {msg.orderContext.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                          <p className="text-slate-500 mt-0.5">
                            Qty: {item.quantity} • Total: ${msg.orderContext?.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="text-xs space-y-1 text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <p><span className="text-slate-400">Order Date:</span> {msg.orderContext.orderDate}</p>
                      {msg.orderContext.trackingNumber && (
                        <p><span className="text-slate-400">Tracking:</span> <span className="font-mono font-semibold text-slate-800">{msg.orderContext.carrier}: {msg.orderContext.trackingNumber}</span></p>
                      )}
                      {msg.orderContext.estimatedDelivery && (
                        <p><span className="text-slate-400">Estimated Delivery:</span> <span className="font-bold text-cyan-700">{msg.orderContext.estimatedDelivery}</span></p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleQuickChip(`Check return status for order ${msg.orderContext?.orderNumber}`)}
                        className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold text-center transition-colors"
                      >
                        Check Return Window
                      </button>
                    </div>
                  </div>
                )}

                {/* Escalation Card Banner */}
                {msg.isEscalated && !isUser && (
                  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 shadow-sm space-y-3 mt-2 animate-in fade-in duration-300">
                    <div className="flex items-center space-x-2 text-rose-700 font-bold text-xs">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>Human Specialist Support Escalation</span>
                    </div>
                    <p className="text-xs text-rose-800">
                      Reason: <span className="font-semibold">{msg.escalationReason || 'Out of MVP scope or specialist investigation required.'}</span>
                    </p>
                    <button
                      onClick={() => onOpenEscalationModal(msg.orderContext?.orderNumber, msg.escalationReason)}
                      className="w-full py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                    >
                      <span>Submit Ticket to Specialist</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Feedback prompt for deflection tracking */}
                {!isUser && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
                    <span>{msg.timestamp}</span>
                    <div className="flex items-center space-x-2">
                      <span>Resolved without agent?</span>
                      <button
                        onClick={() => handleFeedback(msg.id, 'helpful')}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                          feedbackState[msg.id] === 'helpful' ? 'text-emerald-600 font-bold' : 'text-slate-400'
                        }`}
                        title="Yes, resolved!"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, 'not_helpful')}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                          feedbackState[msg.id] === 'not_helpful' ? 'text-rose-600 font-bold' : 'text-slate-400'
                        }`}
                        title="No, escalate to agent"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-cyan-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-none shadow-xs flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-xs text-slate-400 ml-2 font-medium">Checking Northstar database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4 shadow-lg">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2 max-w-5xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about order status or returns (e.g., Where is my order NS1004?)..."
            aria-label="Chat message input"
            className="flex-1 bg-slate-50 border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white text-slate-800 transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            className="bg-cyan-700 hover:bg-cyan-800 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-colors shadow-sm disabled:cursor-not-allowed"
          >
            <span>Send</span>
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 max-w-5xl mx-auto px-1">
          <span>Supported MVP Intents: 📦 Order Status & 🔄 Returns & Refunds</span>
          <span className="hidden sm:inline">Northstar Support AI • Powered by Gemini 3.6 Flash</span>
        </div>
      </div>
    </div>
  );
});
