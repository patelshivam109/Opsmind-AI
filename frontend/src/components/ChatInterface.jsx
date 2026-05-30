import { useState, useRef, useEffect, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import { sendChatMessage } from '../services/api';

const SUGGESTIONS = [
  { icon: '📋', title: 'Refund Process', sub: 'How do I process a customer refund?', query: 'How do I process a refund?' },
  { icon: '🏖️', title: 'Leave Policy', sub: 'What is the annual leave entitlement?', query: 'What is the annual leave policy?' },
  { icon: '🔐', title: 'Data Security', sub: 'How should I handle sensitive data?', query: 'What is the data security and handling policy?' },
  { icon: '🚀', title: 'Onboarding Steps', sub: 'What are the new employee steps?', query: 'What are the steps in the employee onboarding process?' },
];

const STORAGE_KEY = 'opsmind_chat_sessions';

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export default function ChatInterface({ sessions, setSessions, activeSessionId, setActiveSessionId }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
    }
  };

  const updateSession = useCallback((sessionId, updater) => {
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId ? { ...s, messages: updater(s.messages) } : s
      );
      saveSessions(updated);
      return updated;
    });
  }, [setSessions]);

  const sendMessage = useCallback(async (queryText) => {
    const query = (queryText || input).trim();
    if (!query || isLoading) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Ensure we have an active session
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = `session_${Date.now()}`;
      const newSession = {
        id: sessionId,
        title: query.slice(0, 40) + (query.length > 40 ? '...' : ''),
        createdAt: new Date(),
        messages: [],
      };
      setSessions((prev) => {
        const updated = [newSession, ...prev];
        saveSessions(updated);
        return updated;
      });
      setActiveSessionId(sessionId);
    }

    // Add user message
    const userMsg = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    // Add AI thinking placeholder
    const aiMsgId = `msg_${Date.now() + 1}`;
    const aiThinkingMsg = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      thinking: true,
      statusText: 'Searching knowledge base...',
      timestamp: new Date(),
      sources: [],
    };

    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id === sessionId) {
          const newMessages = [...s.messages, userMsg, aiThinkingMsg];
          // Update session title if it's the first message
          const title = s.messages.length === 0
            ? query.slice(0, 40) + (query.length > 40 ? '...' : '')
            : s.title;
          return { ...s, messages: newMessages, title };
        }
        return s;
      });
      saveSessions(updated);
      return updated;
    });

    setIsLoading(true);

    // Build chat history (exclude current user message)
    const chatHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let fullText = '';

    const abort = sendChatMessage(query, chatHistory, {
      onStatus: (statusText) => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === aiMsgId ? { ...m, statusText } : m
                  ),
                }
              : s
          )
        );
      },

      onChunk: (text) => {
        fullText += text;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === aiMsgId
                      ? { ...m, content: fullText, thinking: false, streaming: true }
                      : m
                  ),
                }
              : s
          )
        );
      },
