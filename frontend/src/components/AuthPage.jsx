import { useState } from 'react';
import axios from 'axios';

const FEATURES = [
  {
    icon: '📄',
    title: 'Instant PDF Indexing',
    desc: 'Upload any SOP or policy document and it\'s indexed, embedded, and searchable within seconds.',
    color: '#4f8ef7',
  },
  {
    icon: '🔍',
    title: 'Semantic AI Search',
    desc: 'Ask questions in plain English. AI understands meaning, not just keywords.',
    color: '#a78bfa',
  },
  {
    icon: '📌',
    title: 'Cited Answers Only',
    desc: 'Every answer references the exact page and section. Zero hallucination guaranteed.',
    color: '#34d399',
  },
  {
    icon: '💬',
    title: 'Conversational Chat',
    desc: 'Follow-up questions, multi-turn conversations — feels like chatting with your HR team.',
    color: '#f59e0b',
  },
  {
    icon: '🔐',
    title: 'Role-Based Access',
    desc: 'Admins manage documents. Employees only query. Enterprise-grade permission controls.',
    color: '#f87171',
  },
  {
    icon: '⚡',
    title: 'Gemini 2.5 Flash Powered',
    desc: 'Fastest Gemini model for near-instant streaming responses with superior reasoning.',
    color: '#38bdf8',
  },
];

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const { data } = await axios.post(endpoint, payload);
      localStorage.setItem('opsmind_token', data.token);
      localStorage.setItem('opsmind_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err?.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sl-page">

      {/* ── HEADER ───────────────────────────────────────────── */}
      <header className="sl-header">
        <div className="sl-header-inner">
          <div className="sl-logo">
            <div className="sl-logo-icon">🧠</div>
            <span className="sl-logo-text">OpsMind <span className="sl-logo-ai">AI</span></span>
          </div>
          <div className="sl-header-badges">
            <span className="sl-hbadge sl-hbadge-green">● Live</span>
            <span className="sl-hbadge">Gemini 2.5 Flash</span>
          </div>
        </div>
      </header>

      {/* ── HERO + FORM ──────────────────────────────────────── */}
      <section className="sl-hero">
        <div className="sl-hero-bg">
          <div className="sl-orb sl-orb-1" />
          <div className="sl-orb sl-orb-2" />
          <div className="sl-orb sl-orb-3" />
          <div className="sl-grid-overlay" />
        </div>

        <div className="sl-hero-content">
          {/* Left — Copy */}
          <div className="sl-hero-left">
            <div className="sl-tag">🚀 Enterprise Knowledge Agent</div>
            <h1 className="sl-h1">
              Ask your SOPs<br />
              <span className="sl-gradient-text">anything.</span>
            </h1>
            <p className="sl-hero-desc">
              OpsMind AI ingests your company's SOP documents and gives employees
              instant, <strong>source-cited answers</strong> — powered by Gemini's
              most advanced reasoning.
            </p>
            <div className="sl-stats-row">
              <div className="sl-stat">
                <div className="sl-stat-num">10x</div>
                <div className="sl-stat-lbl">Faster</div>
              </div>
              <div className="sl-stat-sep" />
              <div className="sl-stat">
                <div className="sl-stat-num">0%</div>
                <div className="sl-stat-lbl">Hallucination</div>
              </div>
              <div className="sl-stat-sep" />
              <div className="sl-stat">
                <div className="sl-stat-num">∞</div>
                <div className="sl-stat-lbl">Documents</div>
              </div>
            </div>
          </div>

