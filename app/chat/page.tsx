'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState } from 'react';

export default function ChatPage() {
  const chatContext: any = useChat();
  const messages = chatContext.messages || [];
  const isLoading = chatContext.status === 'submitted' || chatContext.status === 'streaming' || chatContext.isLoading;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (chatContext.append) {
      chatContext.append({ role: 'user', content: input });
    } else if (chatContext.sendMessage) {
      chatContext.sendMessage([{ role: 'user', content: input }]);
    }
    setInput('');
  };

  const handleInputChange = (e: any) => setInput(e.target.value);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="py-6 px-8 border-b border-white/10 glass-panel z-10 sticky top-0">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-500 bg-clip-text text-transparent">
          OriginTrace Agent
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Ask questions about your scanned articles. Powered by Sanity Context MCP.
        </p>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Ask me how many copies were found, or request a DMCA template!</p>
          </div>
        )}
        
        {messages.map((m: any) => (
          <div
            key={m.id}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                m.role === 'user'
                  ? 'bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg'
                  : 'bg-white/5 border border-white/10 text-gray-200'
              }`}
            >
              <div className="font-semibold text-xs opacity-75 mb-1 uppercase tracking-wider">
                {m.role === 'user' ? 'You' : 'Agent'}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                {m.content}
                {m.toolInvocations?.map((toolInvocation: any) => (
                  <div key={toolInvocation.toolCallId} className="mt-3 text-xs bg-black/40 rounded p-2 border border-white/5 text-gray-400">
                    <span className="text-teal-400 font-mono">[{toolInvocation.toolName}]</span> 
                    {' '}status: {toolInvocation.state}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="e.g. Which article has the highest overlap percentage?"
            className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-6 pr-32 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-teal-500 hover:bg-teal-400 text-white rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
