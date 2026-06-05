import { useState } from 'react';

const VECTOR_INDEX_JSON = JSON.stringify(
  {
    fields: [
      {
        type: 'vector',
        path: 'embedding',
        numDimensions: 768,
        similarity: 'cosine',
      },
    ],
  },
  null,
  2
);

export default function SourceCitation({ sources }) {
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!sources || sources.length === 0) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(VECTOR_INDEX_JSON);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="sources-section">
      <div className="sources-label">
        <span>📎</span>
        Sources ({sources.length})
      </div>

      <div className="sources-grid">
        {sources.map((source) => (
          <div
            key={source.index}
            className="source-card"
            onClick={() => setExpanded(source)}
            title="Click to view full excerpt"
          >
            <div className="source-card-icon">📄</div>
            <div className="source-card-body">
              <div className="source-card-title">{source.sourceFile}</div>
              <div className="source-card-meta">Page {source.pageNumber}</div>
              {source.text && (
                <div className="source-card-preview">{source.text}</div>
              )}
              {source.score !== undefined && (
                <div className="source-score-badge">
                  ⚡ {(source.score * 100).toFixed(0)}% match
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded source modal */}
      {expanded && (
        <div className="source-expanded" onClick={() => setExpanded(null)}>
          <div
            className="source-expanded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="source-expanded-header">
              <div>
                <div className="source-expanded-title">
                  📄 {expanded.sourceFile}
                </div>
                <div className="source-expanded-meta">
                  Page {expanded.pageNumber} · Source #{expanded.index}
                  {expanded.score !== undefined && (
                    <span style={{ marginLeft: 10, color: 'var(--color-primary-2)' }}>
                      ⚡ {(expanded.score * 100).toFixed(0)}% relevance
                    </span>
                  )}
                </div>
              </div>
              <button
                className="btn-close"
                onClick={() => setExpanded(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="source-expanded-text">
              {expanded.text || 'No preview available.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
