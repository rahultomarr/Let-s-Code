import './ai-resume-studio.css';

// ===== PDF.js worker =====
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ===== STATE =====
const state = {
  rawText: '',
  sections: {},
  improvedSections: {},
  atsScore: 0,
  currentSection: null,
  currentImproved: '',
  acceptedSections: new Set()
};

// ===== THEME =====
const saved = localStorage.getItem('theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ===== FILE UPLOAD =====
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('resume-file');
  const browseBtn = document.getElementById('browse-btn');
  const dropZone  = document.getElementById('drop-zone');
  const dzIdle    = document.getElementById('dz-idle');
  const dzLoad    = document.getElementById('dz-loading');
  const dzDone    = document.getElementById('dz-done');
  const dzFname   = document.getElementById('dz-fname');
  const dzFsize   = document.getElementById('dz-fsize');
  const dzRemove  = document.getElementById('dz-remove');
  const dzLoadTxt = document.getElementById('dz-load-text');
  const jdSection = document.getElementById('jd-section');
  const analyzeBtn= document.getElementById('analyze-btn');

  browseBtn?.addEventListener('click', () => fileInput.click());
  fileInput?.addEventListener('change', () => { if (fileInput.files[0]) processFile(fileInput.files[0]); });

  dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('over'); });
  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('over'));
  dropZone?.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('over');
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  });

  dzRemove?.addEventListener('click', () => {
    state.rawText = ''; fileInput.value = '';
    dzIdle.style.display = 'flex';
    dzDone.style.display = 'none';
    jdSection.style.display = 'none';
    analyzeBtn.style.display = 'none';
  });

  async function processFile(file) {
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5 MB.'); return; }
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf','doc','docx'].includes(ext)) { alert('Please upload PDF, DOC, or DOCX.'); return; }

    dzIdle.style.display = 'none'; dzDone.style.display = 'none';
    dzLoad.style.display = 'flex';
    dzLoadTxt.textContent = ext === 'pdf' ? 'Extracting text from PDF…' : 'Reading Word document…';

    try {
      const text = ext === 'pdf' ? await extractPDF(file) : await extractDOCX(file);
      state.rawText = text;
      dzLoad.style.display = 'none'; dzDone.style.display = 'block';
      dzFname.textContent = file.name;
      dzFsize.textContent = formatBytes(file.size) + ' · ' + text.split(/\s+/).filter(Boolean).length + ' words';
      jdSection.style.display = 'block';
      analyzeBtn.style.display = 'flex';
    } catch (err) {
      dzLoad.style.display = 'none'; dzIdle.style.display = 'flex';
      alert('Could not read file: ' + err.message);
    }
  }

  async function extractPDF(file) {
    const ab = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise;
    let txt = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const c = await page.getTextContent();
      txt += c.items.map(x => x.str).join(' ') + '\n';
    }
    if (!txt.trim()) throw new Error('No text found — PDF may be image-based.');
    return txt;
  }

  async function extractDOCX(file) {
    const ab = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: ab });
    if (!result.value.trim()) throw new Error('No text could be extracted.');
    return result.value;
  }

  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
    return (b/(1024*1024)).toFixed(1) + ' MB';
  }
});

// ===== SECTION PARSER =====
function parseResumeSections(text) {
  const sections = {};
  const t = text;

  // Detect section boundaries by common headers
  const patterns = [
    { key: 'contact',     regex: /^(contact|personal info|basic info|header)/im },
    { key: 'summary',     regex: /^(summary|objective|profile|about me|about)/im },
    { key: 'experience',  regex: /^(experience|work experience|employment|internship|internships)/im },
    { key: 'education',   regex: /^(education|academic|qualification)/im },
    { key: 'skills',      regex: /^(skills|technical skills|technologies|tech stack|tools)/im },
    { key: 'projects',    regex: /^(projects|project|personal projects|notable projects)/im },
    { key: 'achievements',regex: /^(achievements|awards|certifications|honors|accomplishments)/im },
  ];

  const lines = t.split('\n');
  let currentSection = 'contact';
  const sectionLines = { contact: [] };

  lines.forEach(line => {
    const trimmed = line.trim();
    let matched = false;
    for (const p of patterns) {
      if (p.regex.test(trimmed) && trimmed.length < 60) {
        currentSection = p.key;
        if (!sectionLines[currentSection]) sectionLines[currentSection] = [];
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!sectionLines[currentSection]) sectionLines[currentSection] = [];
      sectionLines[currentSection].push(line);
    }
  });

  // Convert to text blocks, keep only non-empty
  for (const [key, lines] of Object.entries(sectionLines)) {
    const content = lines.join('\n').trim();
    if (content.length > 10) sections[key] = content;
  }

  // If parsing failed to detect sections, split by length chunks
  if (Object.keys(sections).length <= 1) {
    const chunk = Math.ceil(t.length / 5);
    sections.contact     = t.substring(0, chunk).trim();
    sections.summary     = t.substring(chunk, chunk*2).trim();
    sections.experience  = t.substring(chunk*2, chunk*3).trim();
    sections.skills      = t.substring(chunk*3, chunk*4).trim();
    sections.projects    = t.substring(chunk*4).trim();
  }

  return sections;
}

// ===== ATS SCORING =====
function scoreATS(text, jd) {
  const t = text.toLowerCase();
  const categories = [];
  const fixes = [];

  // 1. Keywords
  const techKw = ['python','java','javascript','react','node','sql','aws','docker','git','html','css','typescript','mongodb','linux','spring','kubernetes','c++','golang','flutter','rest','api'];
  const found = techKw.filter(k => t.includes(k));
  const kwScore = Math.min(100, Math.round((found.length / 12) * 100));
  categories.push({ icon:'🔑', name:'Keywords', score: kwScore });
  if (kwScore < 60) fixes.push({ icon:'🔑', text:`Only ${found.length} tech keywords found. Add more relevant skills like ${techKw.filter(k=>!found.includes(k)).slice(0,4).join(', ')}.`, priority:'h' });

  // 2. Experience
  const expWords = ['developed','built','led','managed','implemented','designed','optimized','delivered','collaborated','reduced','increased','achieved'];
  const expCount = expWords.filter(w => t.includes(w)).length;
  const hasMetrics = /\d+%|\d+x|\d+k|\$\d+|\d+ users|\d+ team|\d+ million/i.test(text);
  const expScore = Math.min(100, expCount * 8 + (hasMetrics ? 20 : 0));
  categories.push({ icon:'💼', name:'Experience', score: expScore });
  if (!hasMetrics) fixes.push({ icon:'📊', text:'No quantifiable metrics found. Add impact numbers like "improved performance by 40%" or "served 10,000 users".', priority:'h' });

  // 3. Format
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasBullets = (text.match(/[•\-\*]/g)||[]).length >= 5;
  const hasEmail = /\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/i.test(text);
  const hasPhone = /(\+?\d[\d\s\-()]{8,14})/.test(text);
  const fmtScore = Math.min(100, (wordCount>200?30:15) + (hasBullets?30:0) + (hasEmail?20:0) + (hasPhone?10:0) + (wordCount<700?10:0));
  categories.push({ icon:'📐', name:'Format', score: fmtScore });
  if (!hasBullets) fixes.push({ icon:'📋', text:'Use bullet points (•) under experience/projects to improve ATS parsing and readability.', priority:'h' });

  // 4. Skills
  const hasSkillsSection = /skills|technologies|tools/i.test(text);
  const skillScore = Math.min(100, (hasSkillsSection ? 40 : 0) + kwScore * 0.6);
  categories.push({ icon:'⚙️', name:'Skills', score: Math.round(skillScore) });

  // 5. Education
  const hasEdu = /education|university|college|b\.?tech|bachelor|master|gpa|cgpa|degree/i.test(t);
  const hasYear = /20(1[5-9]|2[0-9])/.test(text);
  const eduScore = (hasEdu ? 60 : 10) + (hasYear ? 40 : 0);
  categories.push({ icon:'🎓', name:'Education', score: Math.min(100, eduScore) });
  if (!hasEdu) fixes.push({ icon:'🎓', text:'Education section not found. Add your degree, institution name, graduation year, and GPA.', priority:'m' });

  // 6. Contact
  const hasLinkedIn = t.includes('linkedin');
  const hasGitHub   = t.includes('github');
  const contactScore = (hasEmail?25:0)+(hasPhone?25:0)+(hasLinkedIn?25:0)+(hasGitHub?25:0);
  categories.push({ icon:'📬', name:'Contact', score: contactScore });
  if (!hasLinkedIn) fixes.push({ icon:'💼', text:'LinkedIn URL missing from contact section. Recruiters check LinkedIn for every candidate.', priority:'h' });
  if (!hasGitHub)   fixes.push({ icon:'🐙', text:'GitHub URL missing. Always include your GitHub, especially for tech roles.', priority:'h' });

  // 7. JD Match
  let jdScore = 70;
  if (jd) {
    const jdWords = jd.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const matched  = jdWords.filter(w => t.includes(w));
    jdScore = Math.round((matched.length / Math.max(jdWords.length, 1)) * 100);
    if (jdScore < 50) fixes.push({ icon:'🎯', text:`JD keyword match is only ${jdScore}%. Tailor your resume to include more JD-specific terms.`, priority:'h' });
  }
  categories.push({ icon:'🎯', name:'JD Match', score: jdScore });

  const total = Math.round(categories.reduce((a,b) => a+b.score, 0) / categories.length);
  return { total, categories, fixes: fixes.slice(0, 5) };
}

// ===== AI IMPROVEMENT (rule-based) =====
const ACTION_VERBS = ['Architected','Engineered','Spearheaded','Delivered','Optimized','Automated','Designed','Implemented','Collaborated','Accelerated','Streamlined','Reduced','Increased','Built','Developed','Launched','Deployed','Mentored','Led','Improved'];

function aiImproveSection(sectionKey, content) {
  const lines = content.split('\n').filter(l => l.trim());
  const improved = [];

  if (sectionKey === 'summary' || sectionKey === 'objective') {
    // Rewrite summary to be more impactful
    const skills = (content.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)?/g)||[]).slice(0,4).join(', ');
    improved.push(`Results-driven software engineer with hands-on experience in ${skills || 'full-stack development'}. Passionate about building scalable, high-performance applications and contributing to cross-functional teams. Seeking to leverage technical expertise to deliver impactful solutions at a forward-thinking organization.`);
  } else if (sectionKey === 'experience') {
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      // Upgrade weak verbs
      const weakVerbs = ['worked on','responsible for','helped','assisted','did','made','was part of','contributed to'];
      let improved_line = trimmed;
      weakVerbs.forEach(v => {
        if (improved_line.toLowerCase().startsWith(v)) {
          const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
          improved_line = verb + ' ' + improved_line.substring(v.length).trim();
        }
      });
      // Add metrics if line looks like a bullet without numbers
      if ((trimmed.startsWith('•') || trimmed.startsWith('-')) && !/\d+/.test(trimmed)) {
        improved_line = improved_line.replace(/\.$/, '') + ', resulting in a measurable improvement in system performance.';
      }
      improved.push(improved_line);
    });
  } else if (sectionKey === 'projects') {
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) { improved.push(''); return; }
      let il = trimmed;
      if (il.startsWith('•') || il.startsWith('-')) {
        // Make project descriptions stronger
        if (!/\d+/.test(il) && il.length > 20) {
          il = il.replace(/\.$/, '') + ' — deployed on AWS, serving active users.';
        }
      }
      improved.push(il);
    });
  } else if (sectionKey === 'skills') {
    // Organize skills into categories
    const techSkillsFound = ['JavaScript','TypeScript','React','Node.js','Python','Java','SQL','MongoDB','AWS','Docker','Git','HTML','CSS'].filter(s =>
      content.toLowerCase().includes(s.toLowerCase())
    );
    const formatted = [
      'Languages: ' + (techSkillsFound.filter(s=>['JavaScript','TypeScript','Python','Java'].includes(s)).join(', ') || content.split(/[,|•\n]/)[0]),
      'Frameworks: ' + (techSkillsFound.filter(s=>['React','Node.js'].includes(s)).join(', ') || 'React, Node.js'),
      'Databases: ' + (techSkillsFound.filter(s=>['SQL','MongoDB'].includes(s)).join(', ') || 'SQL, MongoDB'),
      'DevOps/Cloud: ' + (techSkillsFound.filter(s=>['AWS','Docker'].includes(s)).join(', ') || 'Git, Linux'),
    ];
    improved.push(...formatted);
  } else {
    // Generic improvement — strengthen sentences
    lines.forEach(line => {
      let l = line.trim();
      if (!l) return;
      const weak = ['i ','i\'m ','i am ','my '];
      weak.forEach(w => { if (l.toLowerCase().startsWith(w)) l = l.substring(w.length); });
      // Capitalize first char
      l = l.charAt(0).toUpperCase() + l.slice(1);
      improved.push(l);
    });
  }

  return improved.filter(Boolean).join('\n');
}

// ===== RUN ANALYSIS =====
window.runAnalysis = function() {
  if (!state.rawText) { alert('Please upload a resume first.'); return; }

  const analyzeBtn  = document.getElementById('analyze-btn');
  const spinner     = document.getElementById('analyze-spinner');
  const jdInput     = document.getElementById('jd-input');
  analyzeBtn.disabled = true;
  spinner.style.display = 'inline-block';

  setTimeout(() => {
    const jd = jdInput?.value.trim() || '';
    const atsResult = scoreATS(state.rawText, jd);
    state.atsScore  = atsResult.total;
    state.sections  = parseResumeSections(state.rawText);

    // Show ATS panel
    document.getElementById('upload-card').style.display = 'none';
    renderATSPanel(atsResult);
    document.getElementById('ats-panel').style.display = 'block';

    // Show editor
    renderEditor();
    document.getElementById('panel-editor').style.display = 'block';

    analyzeBtn.disabled = false;
    spinner.style.display = 'none';
  }, 1600);
};

// ===== RENDER ATS PANEL =====
function renderATSPanel(result) {
  // Animate dial
  const circle = document.getElementById('ats-circle');
  const circumference = 314;
  setTimeout(() => {
    circle.style.strokeDashoffset = circumference - (result.total / 100) * circumference;
  }, 100);

  // Animate number
  let cur = 0;
  const timer = setInterval(() => {
    cur = Math.min(cur + 2, result.total);
    document.getElementById('ats-score-num').textContent = cur;
    if (cur >= result.total) clearInterval(timer);
  }, 20);

  // Grade
  const grade = result.total >= 80 ? '🏆 Excellent' : result.total >= 65 ? '✅ Good' : result.total >= 50 ? '⚡ Average' : '🔧 Needs Work';
  const desc  = result.total >= 80 ? 'Your resume will pass most ATS filters.' : result.total >= 65 ? 'Good score — a few tweaks will make it great.' : result.total >= 50 ? 'Several areas need improvement for ATS.' : 'Critical issues found — follow the fixes below.';
  document.getElementById('ats-grade').textContent = grade;
  document.getElementById('ats-grade-desc').textContent = desc;

  // Category bars
  const catEl = document.getElementById('ats-categories');
  catEl.innerHTML = result.categories.map(c => {
    const cls = c.score >= 70 ? 'bar-g' : c.score >= 45 ? 'bar-y' : 'bar-r';
    return `<div class="cat-row">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-name">${c.name}</span>
      <div class="cat-bar-wrap"><div class="cat-bar ${cls}" style="width:0%" data-w="${c.score}%"></div></div>
      <span class="cat-val">${c.score}</span>
    </div>`;
  }).join('');
  setTimeout(() => {
    catEl.querySelectorAll('.cat-bar').forEach(b => { b.style.width = b.dataset.w; });
  }, 150);

  // Quick fixes
  const fixEl = document.getElementById('quick-fixes');
  if (result.fixes.length) {
    fixEl.innerHTML = '<h4>⚡ Quick Fixes</h4>' + result.fixes.map(f =>
      `<div class="fix-item">
        <span class="fix-icon">${f.icon}</span>
        <span class="fix-text">${f.text}</span>
        <span class="fix-badge badge-${f.priority==='h'?'h':f.priority==='m'?'m':'l'}">${f.priority==='h'?'HIGH':f.priority==='m'?'MED':'LOW'}</span>
      </div>`
    ).join('');
  }
}

// ===== RENDER EDITOR =====
function renderEditor() {
  const sectionLabels = {
    contact:'Contact Info', summary:'Professional Summary', experience:'Work Experience',
    education:'Education', skills:'Skills', projects:'Projects', achievements:'Achievements'
  };

  const origEl = document.getElementById('sections-original');
  const impEl  = document.getElementById('sections-improved');

  origEl.innerHTML = '';
  impEl.innerHTML  = '';

  Object.entries(state.sections).forEach(([key, content]) => {
    if (!content.trim()) return;
    const label = sectionLabels[key] || key.charAt(0).toUpperCase() + key.slice(1);

    // Original pane
    const origDiv = document.createElement('div');
    origDiv.className = 'resume-section';
    origDiv.innerHTML = `
      <div class="rs-header">
        <span class="rs-title">${label}</span>
        <button class="rs-improve-btn" onclick="improveSection('${key}')">✨ AI Improve</button>
      </div>
      <div class="rs-content">${escHtml(content)}</div>`;
    origEl.appendChild(origDiv);

    // Improved pane — loading state initially
    const impDiv = document.createElement('div');
    impDiv.className = 'improved-section is-loading';
    impDiv.id = `imp-${key}`;
    impDiv.innerHTML = `<div class="is-spinner"></div><span>Click "AI Improve" to improve this section</span>`;
    impEl.appendChild(impDiv);
  });
}

// ===== IMPROVE SINGLE SECTION =====
window.improveSection = function(key) {
  const impDiv = document.getElementById(`imp-${key}`);
  if (!impDiv) return;
  state.currentSection = key;

  // Show loading in improved pane
  impDiv.className = 'improved-section is-loading';
  impDiv.innerHTML = `<div class="is-spinner"></div><span>AI is rewriting ${key}…</span>`;

  setTimeout(() => {
    const improved = aiImproveSection(key, state.sections[key]);
    state.improvedSections[key] = improved;

    impDiv.className = 'improved-section';
    impDiv.innerHTML = `
      <div class="rs-header">
        <span class="rs-title" style="color:var(--accent-hover)">✨ Improved</span>
        <button class="rs-improve-btn" onclick="acceptSection('${key}')">✅ Accept</button>
      </div>
      <div class="rs-content">${escHtml(improved)}</div>`;

    impDiv.onclick = () => acceptSection(key);
  }, 900 + Math.random() * 400);
};

// ===== ACCEPT SECTION =====
window.acceptSection = function(key) {
  state.sections[key] = state.improvedSections[key] || state.sections[key];
  state.acceptedSections.add(key);

  // Update original pane to show accepted content
  const origEl = document.getElementById('sections-original');
  const cards  = origEl.querySelectorAll('.resume-section');
  const keys   = Object.keys(state.sections);
  const idx    = keys.indexOf(key);
  if (cards[idx]) {
    cards[idx].querySelector('.rs-content').textContent = state.sections[key];
    cards[idx].style.borderColor = 'var(--green)';
  }

  // Mark improved pane as accepted
  const impDiv = document.getElementById(`imp-${key}`);
  if (impDiv) impDiv.style.borderColor = 'var(--green)';

  // Rebuild final resume
  updateFinalResume();
};

function updateFinalResume() {
  const labels = {
    contact:'CONTACT INFORMATION', summary:'PROFESSIONAL SUMMARY',
    experience:'WORK EXPERIENCE', education:'EDUCATION',
    skills:'TECHNICAL SKILLS', projects:'PROJECTS', achievements:'ACHIEVEMENTS'
  };
  const text = Object.entries(state.sections)
    .filter(([,v]) => v.trim())
    .map(([k,v]) => `${labels[k]||k.toUpperCase()}\n${'─'.repeat(40)}\n${v}`)
    .join('\n\n');

  const fw = document.getElementById('final-editor-wrap');
  const fr = document.getElementById('final-resume');
  fw.style.display = 'block';
  fr.textContent = text;
}

// ===== IMPROVE ALL =====
window.improveAll = function() {
  const btn = document.getElementById('btn-improve-all');
  btn.textContent = '⏳ Improving…';
  btn.disabled = true;

  const keys = Object.keys(state.sections);
  let i = 0;
  const next = () => {
    if (i >= keys.length) {
      btn.textContent = '✨ AI Improve All';
      btn.disabled = false;
      updateFinalResume();
      return;
    }
    improveSection(keys[i]);
    setTimeout(() => {
      acceptSection(keys[i]);
      i++; next();
    }, 1100 + Math.random() * 300);
  };
  next();
};

// ===== DOWNLOAD PDF =====
window.downloadPDF = function() {
  const content = document.getElementById('final-resume')?.innerText || buildFullText();
  if (!content.trim()) { alert('Please analyse a resume first.'); return; }
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Resume</title>
    <style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 40px;font-size:13px;line-height:1.8;color:#111}
    pre{white-space:pre-wrap;font-family:inherit;font-size:13px}</style>
    </head><body><pre>${escHtml(content)}</pre></body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
};

// ===== DOWNLOAD DOC =====
window.downloadDOC = function() {
  const content = document.getElementById('final-resume')?.innerText || buildFullText();
  if (!content.trim()) { alert('Please analyse a resume first.'); return; }
  const blob = new Blob([
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;margin:1in}</style></head><body><pre>' +
    escHtml(content) + '</pre></body></html>'
  ], { type: 'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'improved-resume.doc';
  a.click();
};

function buildFullText() {
  return Object.entries(state.sections).map(([k,v]) => `${k.toUpperCase()}\n${v}`).join('\n\n');
}

// ===== RESET =====
window.resetStudio = function() {
  state.rawText = ''; state.sections = {}; state.improvedSections = {};
  state.atsScore = 0; state.acceptedSections = new Set();
  document.getElementById('upload-card').style.display = 'block';
  document.getElementById('ats-panel').style.display   = 'none';
  document.getElementById('panel-editor').style.display = 'none';
  document.getElementById('dz-idle').style.display = 'flex';
  document.getElementById('dz-done').style.display = 'none';
  document.getElementById('jd-section').style.display  = 'none';
  document.getElementById('analyze-btn').style.display = 'none';
  document.getElementById('final-editor-wrap').style.display = 'none';
};

// ===== MODAL (unused in this version but wired for future) =====
window.closeModal = function() {
  document.getElementById('improve-modal').classList.remove('open');
};

// ===== UTILS =====
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
