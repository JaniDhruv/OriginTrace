'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect, useState, type ChangeEvent } from 'react';
import styles from './chat.module.css';

export default function ChatPage() {
  const { messages, sendMessage, status, error, clearError } = useChat();
  const isLoading = status === 'submitted' || status === 'streaming';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    void sendMessage({ text: input });
    setInput('');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

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
        
        {error && (
          <div className={`${styles.messageRow} ${styles.messageRowAgent}`}>
            <div className={`${styles.messageBubble} ${styles.messageBubbleAgent}`}>
              <div className={styles.messageRole}>Agent</div>
              <div className={styles.messageContent}>
                {error.message}
                <button type="button" onClick={clearError} className={styles.retryBtn}>Dismiss</button>
              </div>
            </div>
          </div>
        )}
        {messages.map((m) => (
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
                {m.parts.map((part, i) => {
                  if (part.type === 'text') return <span key={i}>{part.text}</span>;
                  if (part.type === 'dynamic-tool') {
                    return (
                      <div key={part.toolCallId} className={styles.toolInvocation}>
                        <span className={styles.toolName}>Sanity Context MCP</span>
                        {' '}{part.toolName.replaceAll('_', ' ')}: {part.state}
                      </div>
                    );
                  }
                  if (part.type === 'source-url') {
                    return <a key={part.sourceId} href={part.url} target="_blank" rel="noreferrer">{part.title || part.url}</a>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.messageRow} ${styles.messageRowAgent}`}>
            <div className={`${styles.messageBubble} ${styles.messageBubbleAgent}`}>
              <div className={styles.messageRole}>Agent</div>
              <div className={styles.typingIndicator}>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
                <div className={styles.typingDot}></div>
              </div>
            </div>
          </div>
        )}
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
