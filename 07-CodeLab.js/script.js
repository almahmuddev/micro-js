// 

/*
 * CodeLab.js - Personal IDE Project
 * Using CodeMirror for the editor part. 
 * iframe handling is a bit hacky but it works for now.
 */


const
    defaultCode = {
        html: `<div class="scene">
  <div class="glow"></div>
  <header class="hero">
    <p class="eyebrow">Welcome to</p>
    <h1 class="headline">Code<span>Lab</span><span class="dot">.</span>js</h1>
    <p class="sub">A browser-based IDE — edit any panel and watch the preview update in real time.</p>
    <div class="actions">
      <button class="btn-primary" onclick="handleClick()">Launch ✦</button>
      <button class="btn-ghost" onclick="handleReset()">Reset</button>
    </div>
  </header>
  
  <div class="cards">
    <div class="card" style="--i:0"><div class="card-icon">⚡</div><h3>Live Preview</h3><p>Changes reflect instantly as you type.</p></div>
    <div class="card" style="--i:1"><div class="card-icon">🎨</div><h3>3 Languages</h3><p>HTML, CSS and JavaScript, all in one tab.</p></div>
    <div class="card" style="--i:2"><div class="card-icon">🖥️</div><h3>Console</h3><p>All logs and errors captured below.</p></div>
  </div>
  <p id="message" class="message"></p>
</div>`,
        css: `*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
:root { --accent: #7c6af7; --accent2: #f0a05a; --bg: #07070f; --card-bg: rgba(255,255,255,.03); --text: #e8e8f8; --muted: rgba(255,255,255,.38); }
body { min-height:100vh; background:var(--bg); font-family:system-ui,sans-serif; color:var(--text); display:flex; align-items:center; justify-content:center; }
.scene { max-width:860px; padding:3rem 2rem; text-align:center; position:relative; }
.glow { position:fixed; inset:0; background:radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,106,247,.2), transparent), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(240,160,90,.1), transparent); pointer-events:none; }
.hero { margin-bottom:3.5rem; }
.eyebrow { font-size:.8rem; font-weight:600; letter-spacing:.18em; color:var(--accent); margin-bottom:.8rem; animation:up .5s .0s both; }
.headline { font-size:clamp(3rem,8vw,5.5rem); font-weight:900; line-height:1; letter-spacing:-.04em; margin-bottom:1.2rem; animation:up .5s .08s both; }
.headline span { color:var(--accent); }
.headline .dot { color:var(--accent2); }
.sub { font-size:1rem; color:var(--muted); margin-bottom:2rem; animation:up .5s .16s both; }
.actions { display:flex; gap:.9rem; justify-content:center; animation:up .5s .22s both; }
.btn-primary, .btn-ghost { padding:11px 28px; border:none; border-radius:50px; font-weight:700; cursor:pointer; transition:all .18s; }
.btn-primary { background:var(--accent); color:#fff; box-shadow:0 4px 22px rgba(124,106,247,.35); }
.btn-primary:hover { background:#9585ff; transform:translateY(-2px); }
.btn-ghost { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1); color:var(--muted); }
.btn-ghost:hover { border-color:rgba(255,255,255,.25); color:var(--text); }
.cards { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.card { background:var(--card-bg); border:1px solid rgba(255,255,255,.06); border-radius:16px; padding:1.6rem 1.2rem; text-align:left; transition:border-color .2s,transform .2s; animation:up .5s calc(.28s + var(--i)*.07s) both; }
.card:hover { border-color:rgba(124,106,247,.35); transform:translateY(-3px); }
.card-icon { font-size:1.6rem; margin-bottom:.7rem; }
.card h3 { font-size:.92rem; margin-bottom:.35rem; }
.card p { font-size:.8rem; color:var(--muted); line-height:1.55; }
.message { margin-top:2rem; font-size:.9rem; color:#52e8a0; min-height:1.4em; font-weight:600; animation:up .3s both; }
@keyframes up { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }`,
        js: `// Starter script for the demo
const messages = ['🚀 Explore JavaScript!','✨ You are building something real.','⚡ The DOM bends to your will.','🎯 Keep writing.','💜 Vanilla JS only.'];
let messageIndex = 0;

function handleClick() {
  const el = document.getElementById('message');
  el.textContent = messages[messageIndex % messages.length];
  messageIndex++;
  
  // Trigger animation reset
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
  console.log('User clicked Launch!');
}

function handleReset() {
  document.getElementById('message').textContent = '';
  messageIndex = 0;
  console.log('Demo reset.');
}`
    };

// State management

let currentTab = 'html';
let editor;
let autoRunTimer;
let logCount = 0;

const codeData = {
    ...
    defaultCode
};

// Keep a working copy

const tabMeta = {
    html: { name: 'index.html', mode: 'htmlmixed', color: '#7c6af7' },
    css: { name: 'styles.css', mode: 'css', color: '#52e8a0' },
    js: { name: 'script.js', mode: 'javascript', color: '#f0a05a' }
};

// == storage management === 

const saveToDisk = () => {
    localStorage.setItem('codelab_session', JSON.stringify({
        ...codeData,
        lastUpdated: Date.now()
    }));
    logToConsole('sys', '💾 Changes saved locally');
};

const loadSession = () => {
    const saved = localStorage.getItem('codelab_session');
    if (!saved) return false;

    try {
        const parsed = JSON.parse(saved);
        Object.assign(codeData, parsed);
        if (editor) editor.setValue(codeData[currentTab]);
        logToConsole('sys', '📀 Restored your last session');
        return true;
    } catch (err) {
        console.error("Failed to load session:", err);
        return false;
    }
};

//   core editor setup and tab management

function setupEditor() {
    const textArea = document.getElementById('cm-textarea');

    editor = CodeMirror.fromTextArea(textArea, {
        theme: 'dracula',
        lineNumbers: true,
        tabSize: 2,
        autoCloseBrackets: true,
        autoCloseTags: true,
        mode: 'htmlmixed',
        extraKeys: {
            'Ctrl-Enter': runCode,
            'Cmd-Enter': runCode
        }
    });

    editor.setValue(codeData.html);
    editor.setSize('100%', '100%');

    //   live update
    editor.on('change', () => {
        codeData[currentTab] = editor.getValue();
        updateStats();

        // Debounce the auto-run to avoid excessive iframe reloads in time of typing
        if (document.getElementById('autorun-cb').checked) {
            clearTimeout(autoRunTimer);
            autoRunTimer = setTimeout(runCode, 500);
        }
    });

    editor.on('cursorActivity', updateStats);
    updateStats();
}

function switchTab(newTab) {
    if (newTab === currentTab) return;

    // Save current editor content to our object before switching
    codeData[currentTab] = editor.getValue();

    currentTab = newTab;
    editor.setValue(codeData[newTab]);
    editor.setOption('mode', tabMeta[newTab].mode);
    editor.focus();

    // update ui active states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === newTab);
    });

    updateStats();
}

//   preview & console

function runCode() {
    const frame = document.getElementById('preview-frame');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    statusText.textContent = 'Updating...';
    statusDot.style.background = '#f0a05a';

    // captures console.logs inside the iframe
    const consoleInterceptor = `
        <script>
            (function() {
                const methods = ['log', 'warn', 'error'];
                methods.forEach(m => {
                    const original = console[m];
                    console[m] = (...args) => {
                        window.parent.postMessage({
                            type: 'console',
                            level: m,
                            content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                        }, '*');
                        original.apply(console, args);
                    };
                });
                window.onerror = (message, url, line) => {
                    window.parent.postMessage({ type: 'console', level: 'error', content: message + ' (Line ' + line + ')' }, '*');
                };
            })();
        </script>
    `;

    const finalHtml = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                ${consoleInterceptor}
                <style>${codeData.css}</style>
            </head>
            <body>
                ${codeData.html}
                <script>${codeData.js}<\/script>
            </body>
        </html>
    `;

    try {
        frame.srcdoc = finalHtml;
        statusText.textContent = 'Ready';
        statusDot.style.background = '#52e8a0';
    } catch (entryError) {
        logToConsole('error', entryError.message);
        statusText.textContent = 'Error';
        statusDot.style.background = '#ff5f56';
    }
}

function logToConsole(level, message) {
    const consoleBox = document.getElementById('console-out');
    const logLine = document.createElement('div');

    logLine.className = `c-line ${level}`;
    logLine.textContent = message;

    consoleBox.appendChild(logLine);
    consoleBox.scrollTop = consoleBox.scrollHeight;

    logCount++;
    const badge = document.getElementById('log-badge');
    badge.textContent = logCount;
    badge.classList.add('show');
}

//   ui utilities

function updateStats() {
    const cursor = editor.getCursor();
    const content = editor.getValue();

    document.getElementById('cursor-info').textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
    document.getElementById('char-counter').textContent = `${content.length} chars`;

    // Update the visual indicator for the current file
    const label = document.getElementById('filename');
    const dot = document.getElementById('lang-dot');

    label.textContent = tabMeta[currentTab].name;
    label.style.color = tabMeta[currentTab].color;
    dot.style.background = tabMeta[currentTab].color;
}

function handleExport() {
    codeData[currentTab] = editor.getValue();
    const blob = new Blob([document.getElementById('preview-frame').srcdoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `codelab-export-${Date.now()}.html`;
    link.click();

    logToConsole('sys', '🚀 Exported project as HTML');
}

//   standard mouse move handling
function initResizer() {
    const bar = document.getElementById('resizer');
    const panel = document.getElementById('editor-panel');
    let isResizing = false;

    bar.addEventListener('mousedown', () => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        // prevent iframe from stealing mouse events during drag
        document.getElementById('preview-frame').style.pointerEvents = 'none';
    });

    document.addEventListener('mousemove', (etc) => {
        if (!isResizing) return;
        const newWidth = etc.clientX;
        if (newWidth > 200 && newWidth < window.innerWidth - 200) {
            panel.style.width = `${newWidth}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.cursor = 'default';
        document.getElementById('preview-frame').style.pointerEvents = 'all';
        if (editor) editor.refresh();
    });
}

// event listeners and initialization


// catch messages from the iframe console
window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'console') {
        logToConsole(e.data.level, e.data.content);
    }
});

// Set up click handlers for all buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.lang));
});

document.getElementById('run-btn').addEventListener('click', runCode);
document.getElementById('export-html-btn').addEventListener('click', handleExport);
document.getElementById('save-storage-btn').addEventListener('click', saveToDisk);

document.getElementById('clear-console-btn').addEventListener('click', () => {
    document.getElementById('console-out').innerHTML = '';
    logCount = 0;
    document.getElementById('log-badge').classList.remove('show');
});

document.getElementById('reset-default-btn').addEventListener('click', () => {
    if (confirm("Reset everything to default? You'll lose your current work.")) {
        Object.assign(codeData,
            defaultCode
        );
        editor.setValue(codeData[currentTab]);
        runCode();
        logToConsole('sys', '⟳ Code reset to default');
    }
});

// Initialize everything on load
window.onload = () => {
    setupEditor();
    initResizer();

    const wasRestored = loadSession();

    // Short delay for settle before first run
    setTimeout(() => {
        runCode();
        logToConsole('sys', '⚡ CodeLab Ready. Happy coding!');
    }, 200);
};