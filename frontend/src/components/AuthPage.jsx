import { useState } from 'react';
import axios from 'axios';

const FEATURES = [
  { icon: '📄', title: 'Instant PDF Indexing', desc: "Upload any SOP or policy document and it's indexed, embedded, and searchable within seconds.", color: '#4f8ef7' },
  { icon: '🔍', title: 'Semantic AI Search', desc: 'Ask questions in plain English. AI understands meaning, not just keywords.', color: '#a78bfa' },
  { icon: '📌', title: 'Cited Answers Only', desc: 'Every answer references the exact page and section. Zero hallucination guaranteed.', color: '#34d399' },
  { icon: '💬', title: 'Conversational Chat', desc: 'Follow-up questions, multi-turn conversations — feels like chatting with your HR team.', color: '#f59e0b' },
  { icon: '🔐', title: 'Role-Based Access', desc: 'Admins manage documents. Employees only query. Enterprise-grade permission controls.', color: '#f87171' },
  { icon: '⚡', title: 'Gemini 2.5 Flash Powered', desc: 'Fastest Gemini model for near-instant streaming responses with superior reasoning.', color: '#38bdf8' },
];

// Sub-Component: App Header
const PageHeader = () => (
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
);

// Sub-Component: Hero / Left Side Info
const HeroSection = () => (
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
      <div className="sl-stat"><div className="sl-stat-num">10x</div><div className="sl-stat-lbl">Faster</div></div>
      <div className="sl-stat-sep" />
      <div className="sl-stat"><div className="sl-stat-num">0%</div><div className="sl-stat-lbl">Hallucination</div></div>
      <div className="sl-stat-sep" />
      <div className="sl-stat"><div className="sl-stat-num">∞</div><div className="sl-stat-lbl">Documents</div></div>
    </div>
  </div>
);

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isLogin = mode === 'login';

  const resetForm = (targetMode) => {
    setMode(targetMode);
    setError('');
    setForm({ name: '', email: '', password: '' });
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
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
      <PageHeader />

      <section className="sl-hero">
        <div className="sl-hero-bg">
          <div className="sl-orb sl-orb-1" />
          <div className="sl-orb sl-orb-2" />
          <div className="sl-orb sl-orb-3" />
          <div className="sl-grid-overlay" />
        </div>

        <div className="sl-hero-content">
          <HeroSection />

          {/* Right — Auth card */}
          <div className="sl-hero-right">
            <div className="sl-auth-card">
              <div className="sl-auth-card-glow" />

              <div className="sl-auth-tabs">
                <button
                  id="tab-login"
                  className={`sl-tab ${isLogin ? 'sl-tab-on' : ''}`}
                  onClick={() => resetForm('login')}
                >Sign In</button>
                <button
                  id="tab-register"
                  className={`sl-tab ${!isLogin ? 'sl-tab-on' : ''}`}
                  onClick={() => resetForm('register')}
                >Sign Up</button>
              </div>

              <div className="sl-auth-heading">
                <h2>{isLogin ? 'Welcome back 👋' : 'Get started free 🚀'}</h2>
                <p>{isLogin ? 'Access your knowledge workspace' : 'Join your team on OpsMind AI'}</p>
              </div>

              {error && (
                <div className="sl-auth-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="sl-auth-form" id="auth-form">
                {!isLogin && (
                  <div className="sl-fld">
                    <label htmlFor="auth-name">Full Name</label>
                    <input id="auth-name" type="text" name="name" placeholder="Jane Smith"
                      value={form.name} onChange={handleChange} required autoComplete="name" />
                  </div>
                )}
                
                <div className="sl-fld">
                  <label htmlFor="auth-email">Work Email</label>
                  <input id="auth-email" type="email" name="email" placeholder="you@company.com"
                    value={form.email} onChange={handleChange} required autoComplete="email" />
                </div>

                <div className="sl-fld">
                  <label htmlFor="auth-password">Password</label>
                  <div className="sl-pass">
                    <input id="auth-password"
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      placeholder={!isLogin ? 'Min. 6 characters' : '••••••••'}
                      value={form.password} onChange={handleChange} required
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                    />
                    <button type="button" className="sl-eye" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="sl-auth-btn" disabled={loading} id="auth-submit">
                  {loading ? (
                    <><span className="spin">⟳</span> {isLogin ? 'Signing in…' : 'Creating account…'}</>
                  ) : (
                    isLogin ? 'Sign In →' : 'Create Account →'
                  )}
                </button>
              </form>

              <p className="sl-auth-switch">
                {isLogin ? "No account?" : "Have an account?"}{' '}
                <button 
                  id="auth-switch" 
                  className="sl-auth-link"
                  onClick={() => resetForm(isLogin ? 'register' : 'login')}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
