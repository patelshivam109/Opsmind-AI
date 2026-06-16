import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchDocuments, uploadDocument, deleteDocument } from '../services/api';

const VECTOR_INDEX_JSON = `{
  "fields": [{
    "type": "vector",
    "path": "embedding",
    "numDimensions": 768,
    "similarity": "cosine"
  }]
}`;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

// SVG Icons — reliable cross-platform rendering
const IconDoc = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

const IconUpload = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconLock = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

export default function AdminPanel({ addToast, user }) {
  const isAdmin = user?.role === 'admin';

  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [loadError, setLoadError] = useState('');
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const loadDocs = useCallback(async () => {
    try {
      const data = await fetchDocuments();
      setDocs(data.documents || []);
      setStats(data.stats || {});
      setLoadError('');
    } catch (err) {
      setLoadError(err.response?.data?.error || err.message || 'Unable to load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
    pollRef.current = setInterval(loadDocs, 4000);
    return () => clearInterval(pollRef.current);
  }, [loadDocs]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!isAdmin) {
      addToast('error', '🔒 Only admins can upload documents.');
      return;
    }
    if (file.type !== 'application/pdf') {
      addToast('error', 'Only PDF files are supported.');
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadDocument(file, (pct) => setUploadProgress(pct));
      addToast('success', `"${file.name}" uploaded! Indexing in background...`);
      await loadDocs();
    } catch (err) {
      addToast('error', `Upload failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!isAdmin) { addToast('error', '🔒 Only admins can upload documents.'); return; }
    handleFileUpload(e.dataTransfer.files[0]);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument(deleteTarget._id);
      addToast('info', `"${deleteTarget.originalName}" deleted.`);
      setDeleteTarget(null);
      await loadDocs();
    } catch (err) {
      addToast('error', `Delete failed: ${err.response?.data?.error || err.message}`);
      setDeleteTarget(null);
    }
  };

  const copyJson = async () => {
    await navigator.clipboard.writeText(VECTOR_INDEX_JSON);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h1 className="admin-header-title">
            Knowledge Base
            {isAdmin && <span className="admin-badge">Admin</span>}
          </h1>
          <p className="admin-header-sub">
            {isAdmin
              ? 'Upload and manage SOP documents. All uploads are automatically indexed for AI retrieval.'
              : 'Browse the documents available in the knowledge base. Contact an admin to add new documents.'}
          </p>
        </div>
        {!isAdmin && (
          <div className="readonly-badge">
            <IconLock />
            <div>
              <div className="readonly-badge-title">View Only</div>
              <div className="readonly-badge-sub">Only admins can upload or delete documents</div>
            </div>
          </div>
        )}
      </div>

      <div className="admin-content">

        {/* Stats */}
        <div className="stats-row">
          {[
            { icon: <IconDoc />, value: stats.totalDocuments ?? '—', label: 'Total Documents', color: '#4f8ef7' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, value: stats.indexedDocuments ?? '—', label: 'Indexed', color: '#34d399' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, value: stats.totalChunks?.toLocaleString() ?? '—', label: 'Total Chunks', color: '#a78bfa' },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, value: stats.processingDocuments ?? '—', label: 'Processing', color: '#f59e0b' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {isAdmin && (
          <div className="kb-flow">
            <div className="kb-flow-step">
              <span>1</span>
              <strong>Upload PDF</strong>
              <small>Add SOP, policy, handbook, or process PDFs here.</small>
            </div>
            <div className="kb-flow-step">
              <span>2</span>
              <strong>Wait for Indexed</strong>
              <small>The backend extracts text, chunks it, and stores embeddings.</small>
            </div>
            <div className="kb-flow-step">
              <span>3</span>
              <strong>Ask in Chat</strong>
              <small>OpsMind answers from the indexed knowledge base with sources.</small>
            </div>
          </div>
        )}

        {/* Atlas banner — admin only */}
        {isAdmin && (
          <div className="setup-banner">
            <div className="setup-banner-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
              </svg>
            </div>
            <div>
              <div className="setup-banner-title">Atlas Vector Search Setup (768 dims)</div>
              <div className="setup-banner-text">
                Go to <strong>MongoDB Atlas → Cluster → Search Indexes</strong>, create a Vector Search index
                on the <code>chunks</code> collection named <code>sop_vector_index</code>.{' '}
                <button className="copy-json-btn" onClick={copyJson}>
                  {copiedJson ? '✓ Copied!' : 'Copy Index JSON'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone — admin only */}
        {isAdmin ? (
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            id="upload-dropzone"
          >
            <div className="upload-icon-wrap">
              <IconUpload />
            </div>
            <div className="upload-title">
              {uploading ? `Uploading… ${uploadProgress}%` : 'Drop a PDF here or click to browse'}
            </div>
            <div className="upload-sub">
              {uploading ? (
                <div className="upload-progress">
                  <div className="upload-progress-bar">
                    <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                'PDF only · Max 50 MB'
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e.target.files?.[0])}
              id="file-upload-input"
            />
          </div>
        ) : (
          <div className="employee-notice">
            <div className="employee-notice-icon"><IconLock /></div>
            <div className="employee-notice-body">
              <div className="employee-notice-title">Document Upload Restricted</div>
              <div className="employee-notice-text">
                Only administrators can upload or remove documents from the knowledge base.
                Contact your admin if you need a new document added.
              </div>
            </div>
          </div>
        )}

        {/* Document List */}
        <div className="docs-section">
          <div className="docs-section-header">
            <div className="docs-section-title">
              Uploaded Documents
              <span className="docs-count-pill">{docs.length}</span>
            </div>
            <button className="btn-refresh" onClick={loadDocs} title="Refresh">
              <IconRefresh /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty-docs">
              <div className="empty-docs-icon spin">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              </div>
              <p>Loading documents…</p>
            </div>
          ) : loadError ? (
            <div className="empty-docs">
              <div className="empty-docs-icon">
                <IconDoc />
              </div>
              <h3>Could not load documents</h3>
              <p>{loadError}</p>
              <button className="btn-refresh" onClick={loadDocs} title="Retry">
                <IconRefresh /> Retry
              </button>
            </div>
          ) : docs.length === 0 ? (
            <div className="empty-docs">
              <div className="empty-docs-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              </div>
              <p>{isAdmin ? 'No documents yet. Upload your first SOP PDF above!' : 'No documents have been uploaded yet.'}</p>
            </div>
          ) : (
            docs.map((doc) => (
              <div key={doc._id} className="doc-card">
                <div className="doc-card-icon"><IconDoc /></div>
                <div className="doc-card-info">
                  <div className="doc-card-name">{doc.originalName}</div>
                  <div className="doc-card-meta">
                    <span>{formatBytes(doc.fileSize)}</span>
                    {doc.pageCount > 0 && <span>{doc.pageCount} pages</span>}
                    {doc.chunkCount > 0 && <span>{doc.chunkCount} chunks</span>}
                    <span>{timeAgo(doc.uploadedAt)}</span>
                  </div>
                  {doc.errorMessage && (
                    <div className="doc-error">{doc.errorMessage}</div>
                  )}
                </div>
                <div className={`doc-status ${doc.status}`}>
                  <div className="doc-status-dot" />
                  {doc.status === 'indexed' ? 'Indexed' : doc.status === 'processing' ? 'Processing…' : 'Error'}
                </div>
                {isAdmin && (
                  <button className="btn-delete" onClick={() => setDeleteTarget(doc)} id={`btn-delete-${doc._id}`}>
                    <IconTrash /> Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
