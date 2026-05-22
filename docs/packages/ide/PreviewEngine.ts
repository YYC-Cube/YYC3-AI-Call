/**
 * @file PreviewEngine.ts
 * @description 实时预览核心引擎，支持 HTML/CSS/JS/JSX/TSX/Markdown/SVG/JSON 等
 *              多语言检测与沙箱 iframe 渲染，含 Babel 转译、console 捕获、错误边界、
 *              滚动同步注入脚本
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.1.0
 * @created 2026-03-14
 * @updated 2026-03-14
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags preview,engine,iframe,babel,sandbox,scroll-sync
 */

// ================================================================
// PreviewEngine — Core engine for realtime code preview
// Compiles code and generates HTML for iframe rendering
// ================================================================

export type PreviewLanguage =
  | "html"
  | "css"
  | "javascript"
  | "typescript"
  | "jsx"
  | "tsx"
  | "markdown"
  | "svg"
  | "json"
  | "text";

// ── Language Detection ──

export function detectLanguage(filePath: string): PreviewLanguage {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  switch (ext) {
    case "html":
    case "htm":
      return "html";
    case "css":
    case "scss":
    case "less":
      return "css";
    case "js":
    case "mjs":
      return "javascript";
    case "jsx":
      return "jsx";
    case "ts":
    case "mts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "md":
    case "markdown":
    case "mdx":
      return "markdown";
    case "svg":
      return "svg";
    case "json":
      return "json";
    default:
      return "text";
  }
}

// ── Markdown → HTML ──

function markdownToHtml(md: string): string {
  let html = md
    // Code blocks (triple backtick)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      return `<pre><code class="language-${lang || "text"}">${escapeHtml(code.trim())}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Headers
    .replace(/^######\s+(.+)$/gm, "<h6>$1</h6>")
    .replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>")
    .replace(/^####\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Strikethrough
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    )
    // Images
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" style="max-width:100%"/>',
    )
    // Horizontal rules
    .replace(/^---$/gm, "<hr/>")
    // Unordered lists
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    // Ordered lists
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Blockquotes
    .replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>")
    // Line breaks → paragraphs
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br\/>)?)+/g, (match) => {
    return `<ul>${  match.replace(/<br\/>/g, "")  }</ul>`;
  });

  return `<p>${html}</p>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ── Base CSS for preview ──

const BASE_PREVIEW_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    line-height: 1.6;
    color: #e2e8f0;
    background: #0b1729;
    padding: 16px;
    overflow-x: hidden;
  }
  a { color: #38bdf8; text-decoration: none; }
  a:hover { text-decoration: underline; }
  pre {
    background: #0f1d35;
    border: 1px solid #1e3a5f;
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    margin: 8px 0;
  }
  code {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.85em;
    background: #1e293b;
    padding: 2px 5px;
    border-radius: 3px;
  }
  pre code {
    background: none;
    padding: 0;
  }
  h1, h2, h3, h4, h5, h6 {
    color: #f1f5f9;
    margin: 16px 0 8px;
  }
  h1 { font-size: 2em; border-bottom: 1px solid #1e3a5f; padding-bottom: 8px; }
  h2 { font-size: 1.5em; border-bottom: 1px solid #1e3a5f20; padding-bottom: 4px; }
  h3 { font-size: 1.25em; }
  p { margin: 8px 0; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  li { margin: 4px 0; }
  blockquote {
    border-left: 3px solid #38bdf8;
    padding-left: 12px;
    margin: 8px 0;
    color: #94a3b8;
    font-style: italic;
  }
  hr {
    border: none;
    border-top: 1px solid #1e3a5f;
    margin: 16px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
  }
  th, td {
    border: 1px solid #1e3a5f;
    padding: 8px 12px;
    text-align: left;
  }
  th { background: #0f1d35; color: #f1f5f9; }
  img { max-width: 100%; border-radius: 4px; }
`;

// ── Console Capture Script ──

const CONSOLE_CAPTURE_SCRIPT = `
<script>
(function() {
  // Safe postMessage wrapper — guards against destroyed message ports
  function safePost(data) {
    try { parent.postMessage(data, '*'); } catch(e) {}
  }

  var _origConsole = {};
  ['log','warn','error','info','debug'].forEach(function(level) {
    _origConsole[level] = console[level];
    console[level] = function() {
      var args = Array.from(arguments).map(function(a) {
        try {
          if (typeof a === 'object') return JSON.stringify(a, null, 2);
          return String(a);
        } catch(e) { return String(a); }
      });
      safePost({
        type: 'preview-console',
        level: level,
        message: args.join(' ')
      });
      _origConsole[level].apply(console, arguments);
    };
  });

  // Capture unhandled errors
  window.onerror = function(msg, source, line, col, err) {
    safePost({
      type: 'preview-error',
      message: String(msg),
      source: source || '',
      line: line || 0,
      column: col || 0,
      stack: err ? err.stack : ''
    });
    return false;
  };

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    var msg = e.reason ? (e.reason.message || String(e.reason)) : 'Unhandled Promise Rejection';
    safePost({
      type: 'preview-error',
      message: msg,
      stack: e.reason && e.reason.stack ? e.reason.stack : ''
    });
  });

  // Notify parent of scroll position (throttled)
  var _scrollTimer = null;
  window.addEventListener('scroll', function() {
    if (_scrollTimer) return;
    _scrollTimer = setTimeout(function() {
      _scrollTimer = null;
      safePost({
        type: 'preview-scroll',
        scrollTop: document.documentElement.scrollTop,
        scrollHeight: document.documentElement.scrollHeight,
        clientHeight: document.documentElement.clientHeight
      });
    }, 50);
  });

  // Notify parent when loaded
  window.addEventListener('load', function() {
    safePost({ type: 'preview-loaded' });
  });

  // Also fire on DOMContentLoaded as fallback for simple HTML
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() { safePost({ type: 'preview-loaded' }); }, 0);
  } else {
    window.addEventListener('DOMContentLoaded', function() {
      safePost({ type: 'preview-loaded' });
    });
  }

  // Listen for scroll sync commands from parent
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'sync-scroll' && typeof e.data.ratio === 'number') {
      var maxScroll = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (maxScroll > 0) {
        document.documentElement.scrollTop = e.data.ratio * maxScroll;
      }
    }
  });
})();
</script>
`;

// ── Timeout Wrapper ──

const TIMEOUT_SCRIPT = `
<script>
(function() {
  var _origSetTimeout = window.setTimeout;
  var _origSetInterval = window.setInterval;
  var MAX_TIMEOUT = 10000;
  var MAX_INTERVALS = 50;
  var _intervalCount = 0;

  window.setTimeout = function(fn, delay) {
    return _origSetTimeout.call(window, fn, Math.min(delay || 0, MAX_TIMEOUT));
  };

  window.setInterval = function(fn, delay) {
    if (_intervalCount >= MAX_INTERVALS) {
      log.warn('[Preview Sandbox] Maximum interval limit reached');
      return -1;
    }
    _intervalCount++;
    return _origSetInterval.call(window, fn, Math.max(delay || 0, 100));
  };
})();
</script>
`;

// ── Build Preview HTML ──

export interface PreviewResult {
  html: string;
  language: PreviewLanguage;
  error?: string;
}

export function buildPreviewHtml(
  code: string,
  language: PreviewLanguage,
  options?: {
    showGrid?: boolean;
    darkMode?: boolean;
  },
): PreviewResult {
  const gridOverlay = options?.showGrid
    ? `<style>
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(56,189,248,0.06) 49px, rgba(56,189,248,0.06) 50px),
            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(56,189,248,0.06) 49px, rgba(56,189,248,0.06) 50px);
          pointer-events: none;
          z-index: 99999;
        }
      </style>`
    : "";

  try {
    switch (language) {
      case "html":
        return {
          html: buildHtmlPreview(code, gridOverlay),
          language,
        };

      case "css":
        return {
          html: buildCssPreview(code, gridOverlay),
          language,
        };

      case "javascript":
      case "typescript":
        return {
          html: buildJsPreview(code, gridOverlay),
          language,
        };

      case "jsx":
      case "tsx":
        return {
          html: buildReactPreview(code, gridOverlay),
          language,
        };

      case "markdown":
        return {
          html: buildMarkdownPreview(code, gridOverlay),
          language,
        };

      case "svg":
        return {
          html: buildSvgPreview(code, gridOverlay),
          language,
        };

      case "json":
        return {
          html: buildJsonPreview(code, gridOverlay),
          language,
        };

      default:
        return {
          html: buildTextPreview(code, gridOverlay),
          language,
        };
    }
  } catch (err) {
    return {
      html: buildErrorHtml(err instanceof Error ? err.message : String(err)),
      language,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── HTML Preview ──

function buildHtmlPreview(code: string, gridOverlay: string): string {
  // If the code already has <html> or <!DOCTYPE>, render as-is with injected scripts
  if (/<html/i.test(code) || /<!doctype/i.test(code)) {
    // Inject our console capture before </head> or at start
    const injection = CONSOLE_CAPTURE_SCRIPT + TIMEOUT_SCRIPT + gridOverlay;
    if (/<\/head>/i.test(code)) {
      return code.replace(/<\/head>/i, `${injection  }</head>`);
    }
    return injection + code;
  }

  // Otherwise wrap it
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>${BASE_PREVIEW_CSS}</style>
  ${gridOverlay}
  ${CONSOLE_CAPTURE_SCRIPT}
  ${TIMEOUT_SCRIPT}
</head>
<body>
${code}
</body>
</html>`;
}

// ── CSS Preview ──

function buildCssPreview(code: string, gridOverlay: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>${BASE_PREVIEW_CSS}</style>
  <style>${code}</style>
  ${gridOverlay}
  ${CONSOLE_CAPTURE_SCRIPT}
  ${TIMEOUT_SCRIPT}
</head>
<body>
  <div class="preview-container">
    <h1>CSS Preview</h1>
    <p>The CSS styles are applied to this preview document.</p>
    <div class="box" style="width:100px;height:100px;background:#38bdf8;border-radius:8px;margin:16px 0;"></div>
    <button style="padding:8px 16px;border:1px solid #38bdf8;background:transparent;color:#38bdf8;border-radius:6px;cursor:pointer;margin-right:8px;">Button</button>
    <button style="padding:8px 16px;border:none;background:#38bdf8;color:#0b1729;border-radius:6px;cursor:pointer;">Primary</button>
    <div style="margin-top:16px;display:flex;gap:8px;">
      <div style="width:60px;height:60px;background:#c084fc;border-radius:50%;"></div>
      <div style="width:60px;height:60px;background:#34d399;border-radius:12px;"></div>
      <div style="width:60px;height:60px;background:#fbbf24;border-radius:4px;"></div>
    </div>
    <p style="margin-top:16px;color:#64748b;">Sample text for styling preview</p>
    <input type="text" placeholder="Input field" style="margin-top:8px;padding:8px 12px;background:#0f1d35;border:1px solid #1e3a5f;border-radius:6px;color:#e2e8f0;outline:none;"/>
  </div>
</body>
</html>`;
}

// ── JavaScript / TypeScript Preview ─

function buildJsPreview(code: string, gridOverlay: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    ${BASE_PREVIEW_CSS}
    #output {
      white-space: pre-wrap;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.85em;
      line-height: 1.5;
    }
    .log-entry { padding: 4px 0; border-bottom: 1px solid #1e293b; }
    .log-warn { color: #fbbf24; }
    .log-error { color: #f87171; }
    .log-info { color: #38bdf8; }
  </style>
  ${gridOverlay}
  ${CONSOLE_CAPTURE_SCRIPT}
  ${TIMEOUT_SCRIPT}
</head>
<body>
  <div id="output"></div>
  <script>
    (function() {
      var output = document.getElementById('output');
      var origLog = console.log;

      // Also render logs to the preview area
      var _parentLog = console.log;
      console.log = function() {
        _parentLog.apply(console, arguments);
        var div = document.createElement('div');
        div.className = 'log-entry';
        div.textContent = Array.from(arguments).map(function(a) {
          try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a); }
          catch(e) { return String(a); }
        }).join(' ');
        output.appendChild(div);
      };

      try {
        ${code}
      } catch(err) {
        var div = document.createElement('div');
        div.className = 'log-entry log-error';
        div.textContent = 'Error: ' + (err.message || err);
        output.appendChild(div);
      }

      if (!output.children.length) {
        output.innerHTML = '<div style="color:#64748b;font-style:italic;">No console output. Use console.log() to display results.</div>';
      }
    })();
  </script>
</body>
</html>`;
}

// ── React/JSX/TSX Preview ──

function buildReactPreview(code: string, gridOverlay: string): string {
  // For JSX/TSX, we provide a basic React + Babel standalone environment
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    ${BASE_PREVIEW_CSS}
    body { padding: 0; }
    #root { padding: 16px; min-height: 100vh; }
    .react-error {
      color: #f87171;
      background: #1e0505;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      padding: 16px;
      margin: 16px;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
  ${gridOverlay}
  ${CONSOLE_CAPTURE_SCRIPT}
  ${TIMEOUT_SCRIPT}
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react,typescript">
    try {
      ${code}

      // Try to find a default export or App component
      const _components = { App, default: typeof exports !== 'undefined' ? exports.default : undefined };
      const RootComponent = _components.App || _components.default;

      if (typeof RootComponent === 'function') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(RootComponent));
      }
    } catch(e) {
      // Show the error message in a user-friendly way
      document.getElementById('root').innerHTML =
        '<div class="react-error">' +
        '<strong>React Preview Error</strong>\\n\\n' +
        (e.message || String(e)) +
        '</div>';
    }
  </script>
</body>
</html>`;
}

// ── Markdown Preview ──

function buildMarkdownPreview(code: string, gridOverlay: string): string {
  const htmlContent = markdownToHtml(code);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    ${BASE_PREVIEW_CSS}
    body { max-width: 800px; margin: 0 auto; padding: 24px; }
  </style>
  ${gridOverlay}
  ${CONSOLE_CAPTURE_SCRIPT}
</head>
<body>
  <article class="markdown-body">
    ${htmlContent}
  </article>
</body>
</html>`;
}

// ── SVG Preview ──

function buildSvgPreview(code: string, gridOverlay: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    ${BASE_PREVIEW_CSS}
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0b1729;
      background-image:
        linear-gradient(45deg, #0f1d35 25%, transparent 25%),
        linear-gradient(-45deg, #0f1d35 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #0f1d35 75%),
        linear-gradient(-45deg, transparent 75%, #0f1d35 75%);
      background-size: 20px 20px;
      background-position: 0 0, 0 10px, 10px -10px, -10px 0;
    }
    svg {
      max-width: 90%;
      max-height: 90vh;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
    }
  </style>
  ${gridOverlay}
  ${CONSOLE_CAPTURE_SCRIPT}
</head>
<body>
  ${code}
</body>
</html>`;
}

// ── JSON Preview ──

function buildJsonPreview(code: string, gridOverlay: string): string {
  let formatted: string;
  try {
    const parsed = JSON.parse(code);
    formatted = JSON.stringify(parsed, null, 2);
  } catch {
    formatted = code;
  }
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    ${BASE_PREVIEW_CSS}
    pre {
      margin: 0;
      padding: 16px;
      font-size: 0.82em;
      line-height: 1.5;
    }
    .string { color: #34d399; }
    .number { color: #fbbf24; }
    .boolean { color: #c084fc; }
    .null { color: #94a3b8; }
    .key { color: #38bdf8; }
  </style>
  ${gridOverlay}
  ${CONSOLE_CAPTURE_SCRIPT}
</head>
<body>
  <pre><code>${syntaxHighlightJson(formatted)}</code></pre>
</body>
</html>`;
}

function syntaxHighlightJson(json: string): string {
  return escapeHtml(json)
    .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="string">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="number">$1</span>')
    .replace(/: (true|false)/g, ': <span class="boolean">$1</span>')
    .replace(/: (null)/g, ': <span class="null">$1</span>');
}

// ── Text Preview ──

function buildTextPreview(code: string, gridOverlay: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    ${BASE_PREVIEW_CSS}
    pre { margin: 0; font-size: 0.82em; white-space: pre-wrap; word-break: break-word; }
  </style>
  ${gridOverlay}
</head>
<body>
  <pre>${escapeHtml(code)}</pre>
</body>
</html>`;
}

// ── Error HTML ──

function buildErrorHtml(message: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0b1729;
      color: #f87171;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .error-box {
      background: #1e0505;
      border: 1px solid #7f1d1d;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      width: 100%;
    }
    h2 { margin: 0 0 12px; font-size: 1.1em; }
    pre {
      background: #0f0202;
      padding: 12px;
      border-radius: 6px;
      font-size: 0.8em;
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="error-box">
    <h2>Preview Error</h2>
    <pre>${escapeHtml(message)}</pre>
  </div>
</body>
</html>`;
}
