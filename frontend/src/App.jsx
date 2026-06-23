import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';
import { fetchCurrentUser } from './services/api';
import './index.css';

const SESSIONS_KEY = 'opsmind_chat_sessions';

function loadSessions() {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((s) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      messages: s.messages.map((m) => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      })),
    }));
  } catch {
    return [];
  }
}

function loadUser() {
  try {
    const raw = localStorage.getItem('opsmind_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(loadUser);
  const [sessions, setSessions] = useState(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeView, setActiveView] = useState('chat');
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setActiveView('chat');
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };



  useEffect(() => {
    const token = localStorage.getItem('opsmind_token');
    if (!token) return;

    fetchCurrentUser()
      .then(({ user: freshUser }) => {
        if (!freshUser) return;
        localStorage.setItem('opsmind_user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        localStorage.removeItem('opsmind_token');
        localStorage.removeItem('opsmind_user');
        setUser(null);
      });
  }, []);

  const handleDeleteSession = (sessionId) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      localStorage.setItem('opsmind_chat_sessions', JSON.stringify(updated));
      return updated;
    });
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  // Show auth page if not logged in
  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        onNewChat={handleNewChat}
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onLogout={handleLogout}
        onDeleteSession={handleDeleteSession}
      />

      <div className="main-area">
        {activeView === 'chat' ? (
          <ChatInterface
            sessions={sessions}
            setSessions={setSessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
          />
        ) : (
          <AdminPanel addToast={addToast} user={user} />
        )}
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
