import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import AdminPanel from './components/AdminPanel';
import AuthPage from './components/AuthPage';
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

