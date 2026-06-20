function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Sidebar({
  sessions,
  activeSessionId,
  setActiveSessionId,
  onNewChat,
  activeView,
  setActiveView,
  user,
  onLogout,
  onDeleteSession,
}) {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">🧠</div>
          <div className="logo-text">
            <div className="logo-title">OpsMind AI</div>
            <div className="logo-subtitle">Corporate Knowledge Agent</div>
          </div>
        </div>

        <button className="btn-new-chat" onClick={onNewChat} id="btn-new-chat">
          <span>✏️</span>
          New Chat
        </button>
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        <button
          className={`nav-btn ${activeView === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveView('chat')}
          id="nav-chat"
        >
          <span className="icon">💬</span>
          Chat Assistant
        </button>
        <button
          className={`nav-btn ${activeView === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveView('admin')}
          id="nav-admin"
        >
          <span className="icon">📚</span>
          Knowledge Base
        </button>
      </div>

      {/* Chat History */}
      <div className="sidebar-history">
        {sessions.length > 0 ? (
          <>
            <div className="history-label">Recent Chats</div>
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`history-item ${session.id === activeSessionId ? 'active' : ''}`}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setActiveView('chat');
                }}
              >
                <span className="history-item-icon">💬</span>
                <span className="history-item-text">{session.title}</span>
                <span className="history-item-time">
                  {formatTime(session.createdAt)}
                </span>
                {/* Delete chat button */}
                <button
                  className="btn-delete-chat"
                  title="Delete chat"
                  id={`btn-delete-chat-${session.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </>
        ) : (
          <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
            No chats yet. Start by asking a question!
          </div>
        )}
      </div>

      {/* Footer — status + user info + logout */}
      <div className="sidebar-footer">
        <div className="status-badge">
          <div className="status-dot" />
          <span>RAG Pipeline Active</span>
        </div>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
            <button
              className="btn-logout"
              onClick={onLogout}
              id="btn-logout"
              title="Sign out"
            >
              ⏻
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
