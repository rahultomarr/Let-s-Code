import './resume-builder.css';
import { TEMPLATES } from './resume-builder-templates.js';

// ===== THEME =====
const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('theme-toggle').textContent = next === 'light' ? '🌙' : '☀️';
});

// ===== STATE =====
let editor = null;
let currentTemplate = null;
let zoomLevel = 100;
let editorTheme = 'dracula';
let autoCompileTimer = null;

// ===== GALLERY RENDER =====
function renderGallery(cat = 'all') {
  const grid = document.getElementById('template-grid');
  const list = cat === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.cat === cat);
  grid.innerHTML = list.map(t => `
    <div class="template-card" data-id="${t.id}" onclick="openTemplate('${t.id}')">
      <div class="tc-preview">
        <div class="tc-preview-inner" id="prev-${t.id}"></div>
        <div class="tc-overlay"></div>
        <div class="tc-badge">${t.cat}</div>
      </div>
      <div class="tc-info">
        <div class="tc-name">${t.name}</div>
        <div class="tc-desc">${t.desc}</div>
        <div class="tc-tags">${t.tags.map(tg => `<span class="tc-tag">${tg}</span>`).join('')}</div>
        <button class="tc-use-btn">Use This Template →</button>
      </div>
    </div>
  `).join('');

  // Render mini previews
  list.forEach(t => {
    setTimeout(() => {
      const el = document.getElementById(`prev-${t.id}`);
      if (el) el.innerHTML = renderLatex(t.tex, t.class);
    }, 50);
  });
}

// ===== FILTER =====
document.querySelectorAll('.filt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderGallery(btn.dataset.cat);
  });
});

// ===== OPEN TEMPLATE IN EDITOR =====
window.openTemplate = function(id) {
  const t = TEMPLATES.find(t => t.id === id);
  if (!t) return;
  currentTemplate = t;

  document.getElementById('gallery-page').style.display = 'none';
  document.getElementById('editor-page').style.display  = 'flex';
  document.getElementById('current-template-name').textContent = `${t.id}.tex`;

  initEditor(t.tex);
  compileLatex();
};

// ===== BACK TO GALLERY =====
document.getElementById('back-to-gallery')?.addEventListener('click', () => {
  document.getElementById('editor-page').style.display  = 'none';
  document.getElementById('gallery-page').style.display = 'block';
});

// ===== INIT CODEMIRROR EDITOR =====
function initEditor(tex) {
  const ta = document.getElementById('latex-editor');
  if (editor) { editor.setValue(tex); return; }

  editor = window.CodeMirror.fromTextArea(ta, {
    mode: 'stex',
    theme: 'dracula',
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    lineWrapping: true,
    indentUnit: 2,
    tabSize: 2,
    extraKeys: {
      'Ctrl-Enter': compileLatex,
      'Cmd-Enter':  compileLatex,
      'Ctrl-/':     (cm) => cm.toggleComment(),
    }
  });
  editor.setValue(tex);

  // Status bar updates
  editor.on('cursorActivity', updateStatusBar);
  editor.on('change', () => {
    setSaveStatus('● Unsaved');
    clearTimeout(autoCompileTimer);
    autoCompileTimer = setTimeout(compileLatex, 2000);
  });

  // Make editor fill container
  editor.setSize('100%', '100%');
}

function updateStatusBar() {
  if (!editor) return;
  const cur  = editor.getCursor();
  const text = editor.getValue();
  document.getElementById('sb-cursor').textContent = `Ln ${cur.line+1}, Col ${cur.ch+1}`;
  document.getElementById('sb-chars').textContent  = `${text.length} chars`;
  document.getElementById('sb-words').textContent  = `${text.split(/\s+/).filter(Boolean).length} words`;
}

function setSaveStatus(msg) {
  const el = document.getElementById('save-status');
  if (el) { el.textContent = msg; el.style.color = msg.includes('Saved') ? 'var(--green)' : 'var(--yellow)'; }
}

// ===== COMPILE =====
window.compileLatex = function() {
  if (!editor) return;
  const tex = editor.getValue();
  const t0  = performance.now();

  const spinner = document.getElementById('compile-spinner');
  const btn     = document.getElementById('compile-btn');
  spinner.style.display = 'inline-block';
  btn.disabled = true;

  // Hide placeholder, clear errors
  document.getElementById('preview-placeholder').style.display = 'none';
  document.getElementById('error-panel').style.display = 'none';

  setTimeout(() => {
    try {
      const cls   = currentTemplate?.class || '';
      const html  = renderLatex(tex, cls);
      const prev  = document.getElementById('resume-preview');
      prev.innerHTML = html;
      prev.style.display = 'block';
      const ms = Math.round(performance.now() - t0);
      document.getElementById('compile-time').textContent = `Compiled in ${ms}ms`;
      setSaveStatus('● Saved');
    } catch(e) {
      showError(e.message);
    }
    spinner.style.display = 'none';
    btn.disabled = false;
  }, 300);
};

function showError(msg) {
  const ep = document.getElementById('error-panel');
  ep.style.display = 'block';
  ep.textContent = '! LaTeX Error: ' + msg;
}

// ===== LATEX → HTML RENDERER =====
export function renderLatex(tex, templateClass = '') {
  // Remove comments
  let t = tex.replace(/%.*$/gm, '');
  // Remove preamble and \end{document}
  t = t.replace(/\\documentclass[\s\S]*?\\begin\{document\}/m, '');
  t = t.replace(/\\end\{document\}/g, '');

  // Handle sidebar template specially
  if (templateClass === 'tmpl-sidebar') {
    return renderSidebarTemplate(t);
  }

  let html = '';

  // Extract name from \begin{center} block
  const nameMatch = t.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
  if (nameMatch) {
    const block = nameMatch[1];
    const name  = extractArg(block.match(/\\Huge\s*\\textbf\{([^}]+)\}/)?.[0] || '') ||
                  extractArg(block.match(/\\huge\s*\\textbf\{([^}]+)\}/)?.[0] || '') ||
                  block.match(/\\Huge\s+([A-Z][^\\\n]+)/)?.[1]?.trim() || 'Your Name';

    // Contact line
    const contactLine = block.replace(/\\Huge[\s\S]*?\\\\/, '').replace(/\\vspace\{[^}]+\}/, '').trim();
    const contactHtml = parseInline(contactLine.replace(/\$\|\$/g, '|').replace(/\\small\s*/g, ''));

    html += `<div class="rv-name">${name}</div>`;
    html += `<div class="rv-contact">${formatContact(contactHtml)}</div>`;
    t = t.replace(nameMatch[0], '');
  }

  // Summary/About as plain paragraph (before first \section)
  const summaryMatch = t.match(/^([^\\]+(?:\\resumeItemListStart)?[^\\]*?)(?=\\section)/m);

  // Process sections
  const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section\{|$)/g;
  let match;
  while ((match = sectionRegex.exec(t)) !== null) {
    const title   = match[1];
    const body    = match[2];
    html += `<div class="rv-section"><div class="rv-section-title">${title}</div>`;
    html += renderSectionBody(body);
    html += `</div>`;
  }

  return `<div id="resume-preview" class="${templateClass}" style="display:block">${html}</div>`;
}

function renderSectionBody(body) {
  let html = '';

  // \resumeSubheading{A}{B}{C}{D}
  const subRe = /\\resumeSubheading\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}/g;
  let processed = body;

  // Collect all subheadings with their item lists
  const segments = [];
  let lastIdx = 0;
  let m;
  const clone = new RegExp(subRe.source, 'g');
  while ((m = clone.exec(body)) !== null) {
    if (m.index > lastIdx) segments.push({ type:'text', val: body.slice(lastIdx, m.index) });
    segments.push({ type:'subheading', a:m[1], b:m[2], c:m[3], d:m[4], end: m.index + m[0].length });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < body.length) segments.push({ type:'text', val: body.slice(lastIdx) });

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type === 'subheading') {
      html += `<div class="rv-subheading">
        <div>
          <div class="rv-sh-left-top">${parseInline(seg.a)}</div>
          <div class="rv-sh-left-bot">${parseInline(seg.c)}</div>
        </div>
        <div>
          <div class="rv-sh-right-top">${parseInline(seg.b)}</div>
          <div class="rv-sh-right-bot">${parseInline(seg.d)}</div>
        </div>
      </div>`;
      // Check next text segment for items
      if (i+1 < segments.length && segments[i+1].type === 'text') {
        html += renderItems(segments[i+1].val);
        i++;
      }
    } else {
      html += renderItems(seg.val);
    }
  }

  // \resumeProjectHeading{title}{date}
  const projRe = /\\resumeProjectHeading\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\s*\{([^}]*)\}/g;
  const projMatches = [...processed.matchAll(projRe)];
  if (projMatches.length && !segments.some(s => s.type === 'subheading')) {
    html = '';
    let bodyLeft = body;
    projMatches.forEach(pm => {
      html += `<div class="rv-subheading">
        <div><div class="rv-sh-left-top">${parseInline(pm[1])}</div></div>
        <div><div class="rv-sh-right-top rv-date">${parseInline(pm[2])}</div></div>
      </div>`;
      const after = bodyLeft.slice(pm.index + pm[0].length);
      const nextProj = after.search(/\\resumeProjectHeading/);
      const chunk = nextProj >= 0 ? after.slice(0, nextProj) : after;
      html += renderItems(chunk);
      bodyLeft = after.slice(nextProj >= 0 ? nextProj : after.length);
    });
  }

  // \resumeSkill{Cat}{Values}
  const skillRe = /\\resumeSkill\s*\{([^}]+)\}\s*\{([^}]+)\}/g;
  const skills = [...body.matchAll(skillRe)];
  if (skills.length) {
    html += '<div class="rv-skills">';
    skills.forEach(s => {
      html += `<div class="rv-skills-row">
        <span class="rv-skill-cat">${parseInline(s[1])}:</span>
        <span class="rv-skill-val">${parseInline(s[2])}</span>
      </div>`;
    });
    html += '</div>';
  }

  // Plain paragraph (summary/about)
  const plain = body.replace(/\\resume\w+\{[^}]*\}(\{[^}]*\})*/g,'').replace(/\\resumeItemListStart[\s\S]*?\\resumeItemListEnd/g,'').replace(/\\vspace\{[^}]*\}/g,'').trim();
  if (plain && !skills.length && !segments.some(s=>s.type==='subheading') && !projMatches.length) {
    html += `<p style="font-size:9.5pt;line-height:1.6;margin:0">${parseInline(plain)}</p>`;
  }

  return html;
}

function renderItems(text) {
  const items = [...text.matchAll(/\\resumeItem\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g)];
  if (!items.length) return '';
  return '<ul class="rv-items">' + items.map(m => `<li>${parseInline(m[1])}</li>`).join('') + '</ul>';
}

function renderSidebarTemplate(tex) {
  const sidebarMatch = tex.match(/\\begin\{sidebar\}([\s\S]*?)\\end\{sidebar\}/);
  const sidebarHtml = sidebarMatch ? sidebarMatch[1] : '';
  const mainTex = sidebarMatch ? tex.replace(sidebarMatch[0], '') : tex;

  const sideLines = sidebarHtml.split('\\\\').map(l => parseInline(l.trim())).filter(Boolean);
  const name = extractArg(sidebarHtml.match(/\\Large\s*\\textbf\{([^}]+)\}/)?.[0] || '') || 'Name';

  let sideContent = `<div class="rv-name">${name}</div><div class="rv-contact" style="flex-direction:column;align-items:flex-start">`;
  let inSection = false;
  sideLines.slice(1).forEach(l => {
    if (l.match(/^[A-Z\s]+$/)) {
      if (inSection) sideContent += '</div>';
      sideContent += `<div style="margin-top:12px;font-size:8pt;font-weight:700;letter-spacing:.1em;opacity:.7">${l}</div><div style="margin-top:4px">`;
      inSection = true;
    } else {
      sideContent += `<div style="font-size:9pt;margin:2px 0">${l}</div>`;
    }
  });
  if (inSection) sideContent += '</div>';
  sideContent += '</div>';

  let mainHtml = '';
  const sectionRe = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section\{|$)/g;
  let m;
  while ((m = sectionRe.exec(mainTex)) !== null) {
    mainHtml += `<div class="rv-section"><div class="rv-section-title">${m[1]}</div>${renderSectionBody(m[2])}</div>`;
  }

  return `<div class="tmpl-sidebar" style="display:grid;grid-template-columns:220px 1fr;min-height:100%">
    <div class="rv-sidebar" style="background:#1a5276;color:white;padding:36px 20px">${sideContent}</div>
    <div class="rv-main-content" style="padding:36px 32px">${mainHtml}</div>
  </div>`;
}

// ===== INLINE LATEX PARSER =====
function parseInline(str) {
  if (!str) return '';
  return str
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\emph\{([^}]+)\}/g, '<em>$1</em>')
    .replace(/\\underline\{([^}]+)\}/g, '<u>$1</u>')
    .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '<a class="rv-inline-link" href="$1">$2</a>')
    .replace(/\\url\{([^}]+)\}/g, '<a class="rv-inline-link" href="$1">$1</a>')
    .replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>')
    .replace(/\\large\s*/gi, '')
    .replace(/\\Large\s*/gi, '')
    .replace(/\\Huge\s*/gi, '')
    .replace(/\\small\s*/gi, '')
    .replace(/\\normalsize\s*/gi, '')
    .replace(/\\vspace\{[^}]+\}/g, '')
    .replace(/\\hfill/g, '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')
    .replace(/\$\|\$/g, ' | ')
    .replace(/\$\\cdot\$/g, '·')
    .replace(/\$\\bullet\$/g, '•')
    .replace(/\\&/g, '&amp;')
    .replace(/\\\\/g, '')
    .replace(/--/g, '–')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatContact(html) {
  return html.split('|').map(part => part.trim()).filter(Boolean)
    .map((p,i,a) => p + (i < a.length-1 ? '<span class="rv-contact-sep"> | </span>' : ''))
    .join('');
}

function extractArg(str) {
  if (!str) return '';
  const m = str.match(/\{([^}]+)\}/);
  return m ? m[1] : '';
}

// ===== ZOOM =====
window.zoomPreview = function(delta) {
  zoomLevel = Math.min(200, Math.max(50, zoomLevel + delta));
  document.getElementById('preview-page').style.transform = `scale(${zoomLevel/100})`;
  document.getElementById('preview-page').style.transformOrigin = 'top center';
  document.getElementById('zoom-val').textContent = zoomLevel + '%';
};

window.fitPreview = function() {
  const container = document.getElementById('preview-container');
  const page = document.getElementById('preview-page');
  const ratio = (container.clientWidth - 48) / page.offsetWidth;
  zoomLevel = Math.round(ratio * 100);
  page.style.transform = `scale(${ratio})`;
  page.style.transformOrigin = 'top center';
  document.getElementById('zoom-val').textContent = zoomLevel + '%';
};

// ===== TOGGLE EDITOR THEME =====
window.toggleEditorTheme = function() {
  editorTheme = editorTheme === 'dracula' ? 'default' : 'dracula';
  if (editor) editor.setOption('theme', editorTheme);
};

// ===== FORMAT CODE =====
window.formatCode = function() {
  if (!editor) return;
  let val = editor.getValue();
  // Basic formatting: ensure consistent spacing around \section
  val = val.replace(/\\section\{/g, '\n\\section{')
           .replace(/\\resumeSubheading/g, '\n  \\resumeSubheading')
           .replace(/\\resumeItemListStart/g, '\n  \\resumeItemListStart')
           .replace(/\\resumeItem\{/g, '\n    \\resumeItem{')
           .replace(/\\resumeItemListEnd/g, '\n  \\resumeItemListEnd')
           .replace(/\n{3,}/g, '\n\n');
  editor.setValue(val);
};

// ===== DOWNLOAD PDF =====
window.downloadPDF = function() {
  const html = document.getElementById('resume-preview')?.innerHTML;
  if (!html) { alert('Please compile your resume first.'); return; }
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Resume</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      #resume-preview{padding:56px 64px;font-family:'Times New Roman',serif;color:#000;line-height:1.4;font-size:11pt;display:block!important}
      .rv-name{font-size:24pt;font-weight:700;text-align:center;letter-spacing:.05em;margin-bottom:4px}
      .rv-contact{text-align:center;font-size:9.5pt;color:#333;margin-bottom:16px;display:flex;flex-wrap:wrap;justify-content:center;gap:4px}
      .rv-contact a{color:#1a5276}
      .rv-contact-sep{color:#aaa}
      .rv-section{margin-bottom:14px}
      .rv-section-title{font-size:11pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;border-bottom:1.5px solid #1a1a1a;padding-bottom:2px;margin-bottom:8px}
      .rv-subheading{display:grid;grid-template-columns:1fr auto;gap:2px;margin-bottom:6px}
      .rv-sh-left-top{font-weight:700;font-size:10.5pt}
      .rv-sh-right-top{font-size:10pt;text-align:right;color:#333}
      .rv-sh-left-bot{font-style:italic;font-size:9.5pt;color:#444}
      .rv-sh-right-bot{font-size:9.5pt;text-align:right;color:#555;font-style:italic}
      .rv-items{list-style:none;padding:0;margin:2px 0 6px 0}
      .rv-items li{font-size:9.5pt;padding:1px 0 1px 16px;position:relative;color:#111}
      .rv-items li::before{content:'•';position:absolute;left:4px;color:#555}
      .rv-skills-row{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin-bottom:3px}
      .rv-skill-cat{font-weight:700;font-size:9.5pt}
      .rv-skill-val{font-size:9.5pt}
      .rv-inline-link{color:#1a5276}
      .tmpl-modern .rv-name{color:#1a5276;border-bottom:2px solid #1a5276;padding-bottom:8px;margin-bottom:8px}
      .tmpl-modern .rv-section-title{color:#1a5276;border-color:#1a5276}
      .tmpl-tech .rv-name{font-family:monospace;font-size:18pt}
      .tmpl-tech .rv-section-title{color:#4f9d69}
      .tmpl-minimal .rv-name{font-weight:300;letter-spacing:.2em;font-size:20pt;text-transform:uppercase}
      .tmpl-minimal .rv-section-title{font-weight:300;letter-spacing:.15em;border-color:#aaa;color:#333}
      .tmpl-executive .rv-name{font-family:Georgia,serif;letter-spacing:.1em;font-size:22pt}
      .tmpl-academic .rv-name{font-family:Georgia,serif;font-size:20pt}
      .tmpl-academic .rv-section-title{font-style:italic;border:none;border-bottom:1px solid #999;color:#2c3e50}
    </style>
  </head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 600);
};

// ===== DOWNLOAD .TEX =====
window.downloadTex = function() {
  if (!editor) return;
  const blob = new Blob([editor.getValue()], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (currentTemplate?.id || 'resume') + '.tex';
  a.click();
};

// ===== DRAGGABLE DIVIDER =====
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();

  const divider = document.getElementById('editor-divider');
  const left    = document.querySelector('.editor-left');
  let dragging  = false, startX = 0, startW = 0;

  divider?.addEventListener('mousedown', e => {
    dragging = true; startX = e.clientX; startW = left.offsetWidth;
    divider.classList.add('dragging'); e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const newW = Math.min(Math.max(280, startW + dx), window.innerWidth - 300);
    left.style.width = newW + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; divider?.classList.remove('dragging'); });
});
