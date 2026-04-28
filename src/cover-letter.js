import './cover-letter.css';

// ===== THEME =====
const saved = localStorage.getItem('theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);
document.getElementById('theme-btn')?.addEventListener('click', () => {
  const n = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', n);
  localStorage.setItem('theme', n);
  document.getElementById('theme-btn').textContent = n === 'light' ? '🌙' : '☀️';
});

// ===== PILL SELECTORS =====
let selectedTone = 'professional';
let selectedLen  = 'medium';

document.querySelectorAll('.tone-pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.tone-pill').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); selectedTone = b.dataset.tone;
  });
});
document.querySelectorAll('.len-pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.len-pill').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); selectedLen = b.dataset.len;
  });
});

// ===== WORD COUNT =====
document.getElementById('letter-content')?.addEventListener('input', updateWordCount);
function updateWordCount() {
  const txt = document.getElementById('letter-content')?.innerText || '';
  const wc = txt.trim().split(/\s+/).filter(Boolean).length;
  document.getElementById('lp-wc').textContent = `${wc} words`;
}

// ===== GENERATE =====
window.generateLetter = function(toneOverride) {
  const resume  = document.getElementById('resume-input').value.trim();
  const jd      = document.getElementById('jd-input').value.trim();
  const name    = document.getElementById('name-input').value.trim() || 'Candidate';
  const manager = document.getElementById('manager-input').value.trim() || 'Hiring Manager';
  const company = document.getElementById('company-input').value.trim() || 'your company';
  const role    = document.getElementById('role-input').value.trim() || 'this role';
  const hook    = document.getElementById('hook-input').value.trim();
  const tone    = toneOverride || selectedTone;
  const len     = selectedLen;

  if (!resume && !jd) {
    alert('Please fill in at least your resume highlights or the job description.'); return;
  }

  // Update tone pill if override
  if (toneOverride) {
    document.querySelectorAll('.tone-pill').forEach(b => {
      b.classList.toggle('active', b.dataset.tone === toneOverride);
    });
    selectedTone = toneOverride;
  }

  const btn = document.getElementById('generate-btn');
  const spinner = document.getElementById('gen-spinner');
  btn.disabled = true; spinner.style.display = 'inline-block';

  setTimeout(() => {
    const letter = buildLetter({ resume, jd, name, manager, company, role, hook, tone, len });
    const out = document.getElementById('output-section');
    const content = document.getElementById('letter-content');
    content.innerText = letter;
    updateWordCount();
    out.style.display = 'block';
    out.scrollIntoView({ behavior:'smooth', block:'start' });
    runAnalysis(jd, letter);
    btn.disabled = false; spinner.style.display = 'none';
  }, 800 + Math.random() * 400);
};

// ===== LETTER BUILDER =====
function buildLetter({ resume, jd, name, manager, company, role, hook, tone, len }) {
  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  // Extract keywords from JD
  const jdKws  = extractKeywords(jd);
  const resKws = extractKeywords(resume);
  const matched = jdKws.filter(k => resKws.includes(k)).slice(0, 5);

  // Skills from resume
  const skills = extractSkills(resume);

  // Opening by tone
  const openings = {
    professional: `I am writing to express my strong interest in the ${role} position at ${company}. With my background in ${skills.slice(0,3).join(', ')}, I am confident in my ability to contribute meaningfully to your team.`,
    enthusiastic: `I was thrilled to come across the ${role} opening at ${company}! Having passionately worked with ${skills.slice(0,3).join(', ')}, this opportunity feels like the perfect next step in my career.`,
    concise: `I am applying for the ${role} role at ${company}. My experience with ${skills.slice(0,3).join(', ')} makes me a strong fit for this position.`,
    creative: `Imagine a developer who ships pixel-perfect UIs, obsesses over performance metrics, and genuinely loves solving hard problems — that's me, and I'd love to bring that energy to the ${role} role at ${company}.`,
    formal: `I hereby submit my application for the position of ${role} at ${company}. My qualifications and professional experience align directly with the requirements outlined in your job posting.`,
  };

  // Body paragraphs
  const resumeHighlights = extractHighlights(resume);
  const body1 = resumeHighlights.length
    ? `Throughout my career, ${resumeHighlights.slice(0,2).join(' Furthermore, ')}.`
    : `I bring strong technical expertise and a proven track record of delivering high-quality software solutions. My experience spans the full development lifecycle, from architecture through deployment.`;

  const body2Kw = matched.length
    ? `Your requirement for ${matched.slice(0,3).join(', ')} aligns directly with my core competencies. I have applied these skills to deliver measurable business outcomes — from improving system performance to reducing time-to-market.`
    : `I am particularly drawn to ${company}'s mission and the technical challenges this role presents. I thrive in fast-paced, collaborative environments and consistently deliver results under pressure.`;

  const hookLine = hook ? `\n${hook}\n` : '';

  // Closing by tone
  const closings = {
    professional: `I would welcome the opportunity to discuss how my experience can benefit ${company}. Thank you for considering my application.`,
    enthusiastic: `I am genuinely excited about the possibility of joining ${company} and would love to discuss this further. Thank you so much for your time!`,
    concise: `I welcome the opportunity to discuss this further. Thank you for your consideration.`,
    creative: `I'd love to show you what I can bring to ${company} — in person, in code, or however works best for you. Thanks for reading!`,
    formal: `I look forward to the opportunity to further discuss my suitability for this position at your earliest convenience. Thank you for your time and consideration.`,
  };

  const wordTargets = { short:150, medium:250, long:400 };
  const targetWords = wordTargets[len] || 250;

  // Compose letter
  let letter = `${name}
[Your Email] · [Your Phone] · [Your LinkedIn]

${today}

${manager}
${role} Hiring Team
${company}

Dear ${manager},

${openings[tone] || openings.professional}
${hookLine}
${body1}

${body2Kw}`;

  if (targetWords >= 250) {
    letter += `\n\nI am particularly excited about ${company}'s approach to innovation and the opportunity to work alongside talented engineers. I believe my collaborative mindset and commitment to clean, maintainable code will make me a valuable addition to your team.`;
  }

  if (targetWords >= 350) {
    letter += `\n\nBeyond technical skills, I bring strong communication abilities and experience working in agile, cross-functional teams. I am comfortable both leading technical discussions and executing independently under minimal supervision.`;
  }

  letter += `\n\n${closings[tone] || closings.professional}

Sincerely,
${name}`;

  return letter;
}

function extractKeywords(text) {
  const tech = ['react','node','python','java','typescript','javascript','aws','docker','kubernetes',
    'sql','mongodb','redis','graphql','rest','api','microservices','ci/cd','git','linux',
    'machine learning','tensorflow','pytorch','flask','spring','golang','rust','nextjs','vue',
    'angular','postgres','mysql','kafka','rabbitmq','terraform','ansible','devops','agile','scrum'];
  const lower = text.toLowerCase();
  return tech.filter(k => lower.includes(k));
}

function extractSkills(text) {
  const found = extractKeywords(text);
  if (found.length) return found.map(s => s.charAt(0).toUpperCase() + s.slice(1));
  return ['software development','problem solving','team collaboration'];
}

function extractHighlights(text) {
  const lines = text.split(/[\n.]+/).filter(l => l.trim().length > 30);
  const highlights = [];
  lines.forEach(l => {
    const clean = l.trim();
    if (/\d+[%x]|\$[\d]+|\d+[km+]|reduced|improved|built|developed|led|increased/i.test(clean)) {
      highlights.push(clean.charAt(0).toLowerCase() + clean.slice(1).replace(/\.$/, '') + '.');
    }
  });
  return highlights.slice(0, 3);
}

// ===== ATS ANALYSIS =====
function runAnalysis(jd, letter) {
  const jdKws     = extractKeywords(jd || '');
  const letterKws = extractKeywords(letter);
  const matched   = jdKws.filter(k => letterKws.includes(k));
  const missing   = jdKws.filter(k => !letterKws.includes(k)).slice(0, 6);

  const categories = [
    { label:'Keyword Match',   score: jdKws.length ? Math.round((matched.length/jdKws.length)*100) : 70 },
    { label:'Personalisation', score: letter.includes('company') || letter.includes('role') ? 80 : 55 },
    { label:'Tone & Clarity',  score: 78 },
    { label:'Length',          score: letter.split(/\s+/).length > 150 && letter.split(/\s+/).length < 500 ? 85 : 60 },
    { label:'Action Words',    score: /developed|led|built|improved|reduced|achieved/i.test(letter) ? 82 : 58 },
  ];

  const avg = Math.round(categories.reduce((a,c)=>a+c.score,0)/categories.length);
  document.getElementById('ats-score-big').textContent = `${avg}%`;

  document.getElementById('ats-bars').innerHTML = categories.map(c => `
    <div class="ats-bar-row">
      <span class="ats-bar-label">${c.label}</span>
      <div class="ats-bar-wrap"><div class="ats-bar-fill" style="width:${c.score}%"></div></div>
      <span class="ats-bar-val">${c.score}%</span>
    </div>`).join('');

  // Keywords panel
  const allKws = [...new Set([...matched.slice(0,8), ...missing.slice(0,4)])];
  document.getElementById('kw-matched').innerHTML = allKws.length
    ? allKws.map(k => `<span class="kw-chip ${matched.includes(k)?'kw-found':'kw-missing'}">${matched.includes(k)?'✓':'+'}  ${k}</span>`).join('')
    : '<span style="font-size:.8rem;color:var(--muted)">Add a job description to see keyword matching</span>';

  // Quick tips
  const tips = [];
  if (avg < 70) tips.push({ i:'⚡', t:'Add more JD keywords to boost ATS score' });
  if (missing.length > 3) tips.push({ i:'🔑', t:`Missing keywords: ${missing.slice(0,3).join(', ')}` });
  if (!/\d/.test(letter)) tips.push({ i:'📊', t:'Add quantified achievements (e.g. "improved by 40%")' });
  if (letter.split(/\s+/).length < 150) tips.push({ i:'📝', t:'Letter is short — consider adding more detail' });
  if (letter.split(/\s+/).length > 450) tips.push({ i:'✂️', t:'Letter is long — aim for 250–350 words' });
  if (!tips.length) tips.push({ i:'✅', t:'Your letter looks well-optimised!' });

  document.getElementById('quick-tips').innerHTML = tips.map(t =>
    `<div class="qt-item"><span class="qt-icon">${t.i}</span><span>${t.t}</span></div>`).join('');
}

// ===== COPY =====
window.copyLetter = function() {
  const txt = document.getElementById('letter-content').innerText;
  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.querySelector('.lp-btn');
    const orig = btn.textContent;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = orig, 1800);
  });
};

// ===== DOWNLOAD PDF =====
window.downloadPDF = function() {
  const txt = document.getElementById('letter-content').innerText;
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cover Letter</title>
    <style>
      body{font-family:'Times New Roman',Georgia,serif;max-width:700px;margin:60px auto;padding:0 40px;font-size:11pt;line-height:1.75;color:#111}
      p{margin-bottom:12px}
    </style></head><body><pre style="white-space:pre-wrap;font-family:inherit;font-size:inherit">${txt}</pre></body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
};

// ===== DOWNLOAD DOC =====
window.downloadDoc = function() {
  const txt = document.getElementById('letter-content').innerText;
  const blob = new Blob([
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;margin:1in}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit">' +
    txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') +
    '</pre></body></html>'
  ], { type:'application/msword' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cover-letter.doc';
  a.click();
};

// ===== REGENERATE =====
window.regenerate = function() {
  window.generateLetter();
};
