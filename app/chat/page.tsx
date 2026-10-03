'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState } from 'react';
import styles from './chat.module.css';

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
      chatContext.sendMessage({ content: input });
    }
    setInput('');
  };

  const handleInputChange = (e: any) => setInput(e.target.value);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          OriginTrace Agent
        </h1>
        <p className={styles.subtitle}>
          Ask questions about your scanned articles. Powered by Sanity Context MCP.
        </p>
      </header>

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {messages.length === 0 && (
          <div className={styles.emptyState}>
            <p>Ask me how many copies were found, or request a DMCA template!</p>
          </div>
        )}
        
        {messages.map((m: any) => (
          <div
            key={m.id}
            className={`${styles.messageRow} ${m.role === 'user' ? styles.messageRowUser : styles.messageRowAgent}`}
          >
            <div
              className={`${styles.messageBubble} ${
                m.role === 'user'
                  ? styles.messageBubbleUser
                  : styles.messageBubbleAgent
              }`}
            >
              <div className={styles.messageRole}>
                {m.role === 'user' ? 'You' : 'Agent'}
              </div>
              <div className={styles.messageContent}>
                {m.content}
                {m.toolInvocations?.map((toolInvocation: any) => (
                  <div key={toolInvocation.toolCallId} className={styles.toolInvocation}>
                    <span className={styles.toolName}>[{toolInvocation.toolName}]</span> 
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
      <div className={styles.inputArea}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="e.g. Which article has the highest overlap percentage?"
            className={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={styles.submitBtn}
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
