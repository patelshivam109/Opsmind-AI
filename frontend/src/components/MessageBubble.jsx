import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SourceCitation from './SourceCitation';

// Helper: Formats timestamp to 12-hour AM/PM format
const formatTime = (date) => 
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

// Sub-Component: Renders the thinking/loading indicator
const ThinkingIndicator = ({ statusText }) => (
  <div className="thinking-bubble">
    <div className="thinking-dots"><span /><span /><span /></div>
    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
      {statusText || 'Searching knowledge base...'}
    </span>
  </div>
);

// Sub-Component: Renders the core text or markdown content
const BubbleContent = ({ isUser, content, isStreaming }) => {
  const bubbleClass = `message-bubble ${isStreaming ? 'streaming-cursor' : ''}`;
  
  return (
    <div className={bubbleClass}>
      {isUser ? (
        <span>{content}</span>
      ) : (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      )}
    </div>
  );
};

export default function MessageBubble({ message }) {
  const { role, streaming: isStreaming, thinking, content, statusText, sources, timestamp } = message;
  const isUser = role === 'user';
  const showCitation = !isUser && !isStreaming && sources?.length > 0;

  return (
    <div className={`message ${isUser ? 'user' : 'assistant'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🧠'}
      </div>

      <div className="message-content">
        {/* Thinking State */}
        {thinking && !content && <ThinkingIndicator statusText={statusText} />}

        {/* Core Message Content */}
        {content && <BubbleContent isUser={isUser} content={content} isStreaming={isStreaming} />}

        {/* Source Citations */}
        {showCitation && <SourceCitation sources={sources} />}

        {/* Timestamp */}
        {timestamp && <div className="message-time">{formatTime(timestamp)}</div>}
      </div>
    </div>
  );
}
