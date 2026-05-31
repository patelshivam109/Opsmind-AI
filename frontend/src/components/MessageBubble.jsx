import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SourceCitation from './SourceCitation';

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isStreaming = message.streaming;

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      {/* Avatar */}
      <div className="message-avatar">
        {isUser ? '👤' : '🧠'}
      </div>

      <div className="message-content">
        {/* Thinking state */}
        {message.thinking && !message.content && (
          <div className="thinking-bubble">
            <div className="thinking-dots">
              <span />
              <span />
              <span />
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {message.statusText || 'Searching knowledge base...'}
            </span>
          </div>
        )}
