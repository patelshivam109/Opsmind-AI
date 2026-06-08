import axios from 'axios';

const BASE_URL = '/api';

// Attach JWT token to protected requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('opsmind_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ──────────────────────────────────────────────────────────────
// Documents API
// ──────────────────────────────────────────────────────────────

export const uploadDocument = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await axios.post(`${BASE_URL}/docs/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...getAuthHeaders() },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return response.data;
};

export const fetchDocuments = async () => {
  const response = await axios.get(`${BASE_URL}/docs`);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await axios.delete(`${BASE_URL}/docs/${id}`, { headers: getAuthHeaders() });
  return response.data;
};

// ──────────────────────────────────────────────────────────────
// Chat SSE Stream
// ──────────────────────────────────────────────────────────────

/**
 * Send a chat message and handle SSE stream events
 * @param {string} query
 * @param {Array} chatHistory
 * @param {Object} callbacks - { onStatus, onChunk, onSources, onDone, onError }
 * @returns {Function} - call to abort the request
 */
export const sendChatMessage = (query, chatHistory, callbacks) => {
  const { onStatus, onChunk, onSources, onDone, onError } = callbacks;
  const controller = new AbortController();

  fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, chatHistory }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Server error' }));
        onError?.(err.error || 'Request failed');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processChunk = (rawChunk) => {
        buffer += rawChunk;
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // skip event line
          } else if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              // Look at the preceding event line in buffer
              // We'll resolve by matching event types from output
              // Handle inline by re-reading the event
            } catch {}
          }
        }
      };

      // Proper SSE parsing
      let eventBuffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        eventBuffer += decoder.decode(value, { stream: true });
        const eventParts = eventBuffer.split('\n\n');
        eventBuffer = eventParts.pop();

        for (const part of eventParts) {
          const lines = part.split('\n');
          let eventType = '';
          let dataStr = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim();
            if (line.startsWith('data: ')) dataStr = line.slice(6).trim();
          }

          if (!dataStr) continue;
          let data;
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue;
          }

          switch (eventType) {
            case 'status':
              onStatus?.(data.message);
              break;
            case 'chunk':
              onChunk?.(data.text);
              break;
            case 'sources':
              onSources?.(data.sources);
              break;
            case 'done':
              onDone?.(data.fullText);
              break;
            case 'error':
              onError?.(data.message);
              break;
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err.message || 'Network error');
      }
    });

  return () => controller.abort();
};
