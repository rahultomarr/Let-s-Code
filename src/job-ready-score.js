import './job-ready-score.css';

// ===== STATE =====
const state = { resumeScore: 0, linkedinScore: 0, codingScore: 0, improvements: [] };

// ===== THEME =====
const saved = localStorage.getItem('theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ===== STEP NAVIGATION =====
window.goToStep = function(n) {
  [1,2,3,4].forEach(i => {
    const el = document.getElementById('step-'+i);
    if (el) el.style.display = i === n ? 'block' : 'none';
    const ps = document.getElementById('pstep-'+i);
    if (ps) {
      ps.classList.remove('active','done');
      if (i < n) ps.classList.add('done');
      if (i === n) ps.classList.add('active');
    }
  });
  document.querySelectorAll('.step-connector').forEach((c,i) => {
    c.classList.toggle('done', i < n-1);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ===== RESUME ANALYSIS =====
window.analyzeResume = function() {
  const name  = document.getElementById('resume-name').value.trim();
  const role  = document.getElementById('resume-role').value.trim();
  const text  = document.getElementById('resume-text').value.trim();
  const jd    = document.getElementById('resume-jd').value.trim();

  if (!text || text.length < 100) {
    alert('Please paste your resume content (at least a few sentences).'); return;
  }

  const loader = document.getElementById('resume-loader');
  loader.style.display = 'inline';

  setTimeout(() => {
    loader.style.display = 'none';
    const result = scoreResume(text, jd, role);
    state.resumeScore = result.total;
    state.improvements.push(...result.improvements.map(i => ({...i, cat:'Resume'})));
    renderResumeResult(result);
    document.getElementById('resume-result').style.display = 'block';
    document.getElementById('resume-result').scrollIntoView({ behavior:'smooth', block:'nearest' });
  }, 1800);
};

function scoreResume(text, jd, role) {
  const t = text.toLowerCase();
  const sections = { contact:0, summary:0, experience:0, education:0, skills:0, projects:0, achievements:0 };
  const improvements = [];

  // Contact info
  const hasEmail = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/.test(t);
  const hasPhone = /(\+?\d[\d\s\-()]{8,14})/.test(t);
  const hasLinkedIn = t.includes('linkedin');
  const hasGitHub = t.includes('github');
  sections.contact = (hasEmail?25:0)+(hasPhone?25:0)+(hasLinkedIn?25:0)+(hasGitHub?25:0);
  if (!hasLinkedIn) improvements.push({ icon:'💼', title:'Add LinkedIn URL', desc:'Include your LinkedIn profile URL in contact section.', priority:'high' });
  if (!hasGitHub) improvements.push({ icon:'🐙', title:'Add GitHub URL', desc:'Showcase your projects by adding GitHub link.', priority:'high' });

  // Summary/Objective
  const hasSummary = /summary|objective|profile|about/i.test(t);
  sections.summary = hasSummary ? 100 : 0;
  if (!hasSummary) improvements.push({ icon:'📝', title:'Add a Professional Summary', desc:'2-3 lines about your experience and goals boost ATS scores.', priority:'high' });

  // Experience
  const expWords = ['experience','worked','developed','built','led','managed','designed','implemented','intern'];
  const expCount = expWords.filter(w => t.includes(w)).length;
  sections.experience = Math.min(100, expCount * 12);
  const hasBullets = (text.match(/[•\-\*]/g)||[]).length;
  if (hasBullets < 5) improvements.push({ icon:'📋', title:'Use Bullet Points', desc:'Use bullet points with action verbs for each experience entry.', priority:'high' });
  const hasMetrics = /\d+%|\d+x|\$\d+|\d+k|\d+ users|\d+ team/i.test(text);
  if (!hasMetrics) improvements.push({ icon:'📊', title:'Add Quantifiable Metrics', desc:'Numbers prove impact. E.g. "Improved performance by 40%".', priority:'high' });

  // Education
  const hasEdu = /education|university|college|b\.?tech|b\.?e|bachelor|master|m\.?tech|gpa|cgpa/i.test(t);
  sections.education = hasEdu ? 100 : 30;
  if (!hasEdu) improvements.push({ icon:'🎓', title:'Add Education Section', desc:'Include your degree, institution, and graduation year.', priority:'med' });

  // Skills
  const techSkills = ['python','java','javascript','react','node','sql','aws','docker','git','html','css','c++','typescript','mongodb','redis','linux'];
  const foundSkills = techSkills.filter(s => t.includes(s));
  sections.skills = Math.min(100, foundSkills.length * 7);
  if (foundSkills.length < 6) improvements.push({ icon:'⚙️', title:'Expand Technical Skills', desc:`Add more relevant skills. Currently detected: ${foundSkills.join(', ') || 'none'}.`, priority:'med' });

  // Projects
  const hasProjects = /project|built|created|developed/i.test(t);
  const projectCount = (text.match(/project/gi)||[]).length;
  sections.projects = Math.min(100, hasProjects ? 40 + projectCount*15 : 0);
  if (projectCount < 2) improvements.push({ icon:'🚀', title:'Add More Projects', desc:'Add 2-3 strong projects with tech stack, impact, and GitHub links.', priority:'high' });

  // Achievements / Certifications
  const hasAchieve = /award|achievement|certification|certif|hackathon|competition|rank|winner/i.test(t);
  sections.achievements = hasAchieve ? 100 : 30;
  if (!hasAchieve) improvements.push({ icon:'🏆', title:'Add Achievements/Certifications', desc:'Include certifications, hackathon wins, or academic awards.', priority:'low' });

  // JD Match
  let jdMatch = 70;
  if (jd) {
    const jdWords = jd.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const matched = jdWords.filter(w => t.includes(w));
    jdMatch = Math.round((matched.length / Math.max(jdWords.length,1)) * 100);
    if (jdMatch < 50) improvements.push({ icon:'🎯', title:'Improve JD Keyword Match', desc:`Your resume matches only ${jdMatch}% of the job description keywords. Tailor it more.`, priority:'high' });
  }

  // ATS check
  const hasColumns = text.length > 500 && !/<table|colspan/i.test(text);
  const atsScore = hasColumns ? 75 : 50;
  const wordCount = text.split(/\s+/).length;
  if (wordCount < 300) improvements.push({ icon:'📏', title:'Resume Too Short', desc:`${wordCount} words detected. Ideal is 400-600 words for a 1-page resume.`, priority:'med' });
  if (wordCount > 900) improvements.push({ icon:'✂️', title:'Resume Too Long', desc:`${wordCount} words — trim to 1 page (500-700 words) for entry/mid level.`, priority:'med' });

  const breakdown = [
    { label:'Contact Info', value: sections.contact, max:100 },
    { label:'Summary/Objective', value: sections.summary, max:100 },
    { label:'Work Experience', value: sections.experience, max:100 },
    { label:'Education', value: sections.education, max:100 },
    { label:'Technical Skills', value: sections.skills, max:100 },
    { label:'Projects', value: sections.projects, max:100 },
    { label:'Achievements', value: sections.achievements, max:100 },
    { label:'ATS Compatibility', value: atsScore, max:100 },
    { label: jd ? 'JD Match Score' : 'Keyword Density', value: jdMatch, max:100 },
  ];

  const total = Math.round(breakdown.reduce((a,b) => a+b.value,0) / breakdown.length);
  return { total, breakdown, improvements: improvements.slice(0,6) };
}

function renderResumeResult(result) {
  document.getElementById('resume-score-badge').textContent = result.total;
  const bd = document.getElementById('resume-breakdown');
  bd.innerHTML = result.breakdown.map(b => {
    const pct = Math.round((b.value/b.max)*100);
    const cls = pct >= 70 ? 'bar-green' : pct >= 40 ? 'bar-yellow' : 'bar-red';
    return `<div class="breakdown-item">
      <div class="breakdown-label">${b.label}</div>
      <div class="breakdown-bar-wrap"><div class="breakdown-bar ${cls}" style="width:0%" data-w="${pct}%"></div></div>
      <div class="breakdown-value">${b.value}<span style="color:var(--text-dim);font-size:.75rem">/${b.max}</span></div>
    </div>`;
  }).join('');
  animateBars(bd);

  const imp = document.getElementById('resume-improvements');
  imp.innerHTML = '<h4 style="margin-bottom:12px;font-size:1rem">📌 Improvements</h4>' +
    result.improvements.map(i => `
      <div class="improvement-item">
        <span class="imp-icon">${i.icon}</span>
        <div class="imp-content"><div class="imp-title">${i.title}</div><div class="imp-desc">${i.desc}</div></div>
        <span class="imp-badge badge-${i.priority==='high'?'high':i.priority==='med'?'med':'low'}">${i.priority.toUpperCase()}</span>
      </div>`).join('');
}

// ===== LINKEDIN ANALYSIS =====
window.analyzeLinkedIn = function() {
  const checks = ['li-photo','li-headline','li-summary','li-experience','li-education','li-skills','li-projects','li-certifications','li-recommendations','li-featured','li-activity','li-connections'];
  const checked = checks.filter(id => document.getElementById(id)?.checked);
  const followers = parseInt(document.getElementById('li-followers')?.value)||0;
  const headline = document.getElementById('li-headline-text')?.value.trim()||'';

  const result = scoreLinkedIn(checked, followers, headline);
  state.linkedinScore = result.total;
  state.improvements.push(...result.improvements.map(i=>({...i, cat:'LinkedIn'})));
  renderLinkedInResult(result);
  document.getElementById('linkedin-result').style.display = 'block';
  document.getElementById('linkedin-result').scrollIntoView({ behavior:'smooth', block:'nearest' });
};

function scoreLinkedIn(checked, followers, headline) {
  const improvements = [];
  const weights = {
    'li-photo':10,'li-headline':10,'li-summary':12,'li-experience':15,
    'li-education':8,'li-skills':8,'li-projects':10,'li-certifications':6,
    'li-recommendations':8,'li-featured':5,'li-activity':5,'li-connections':3
  };
  let score = checked.reduce((a,id) => a+(weights[id]||0), 0);

  const missing = Object.keys(weights).filter(id => !checked.includes(id));
  const labels = {
    'li-photo':'Professional Photo','li-headline':'Custom Headline','li-summary':'About/Summary',
    'li-experience':'Work Experience','li-education':'Education','li-skills':'Skills (10+)',
    'li-projects':'Projects','li-certifications':'Certifications','li-recommendations':'Recommendations',
    'li-featured':'Featured Section','li-activity':'Recent Posts','li-connections':'500+ Connections'
  };
  const prios = {
    'li-photo':'high','li-headline':'high','li-summary':'high','li-experience':'high',
    'li-education':'med','li-skills':'med','li-projects':'med','li-certifications':'low',
    'li-recommendations':'med','li-featured':'low','li-activity':'low','li-connections':'low'
  };
  missing.slice(0,5).forEach(id => {
    improvements.push({ icon:'💼', title:`Add ${labels[id]}`, desc:`Missing "${labels[id]}" reduces your profile strength and recruiter visibility.`, priority: prios[id] });
  });

  // Bonus for follower count
  if (followers >= 500) score = Math.min(100, score+5);
  else improvements.push({ icon:'🤝', title:'Grow Your Network', desc:`You have ${followers||0} connections. Aim for 500+ to unlock LinkedIn's "All-Star" badge.`, priority:'low' });

  // Headline quality
  if (headline && headline.length > 40) score = Math.min(100, score+3);
  else if (!headline || headline.length < 20) improvements.push({ icon:'✍️', title:'Improve Your Headline', desc:'A keyword-rich headline (e.g. "CS Student | React | Java | Seeking SDE Roles") boosts recruiter searches.', priority:'high' });

  const total = Math.min(100, score);
  const breakdown = [
    { label:'Profile Completeness', value: Math.round(checked.length/12*100), max:100 },
    { label:'Recruiter Visibility', value: checked.includes('li-photo')&&checked.includes('li-headline')&&checked.includes('li-summary') ? 85 : 40, max:100 },
    { label:'Network Strength', value: followers>=500?90:followers>=200?65:followers>=100?45:25, max:100 },
    { label:'Content Activity', value: checked.includes('li-activity') ? 80 : 20, max:100 },
  ];
  return { total, breakdown, improvements };
}

function renderLinkedInResult(result) {
  document.getElementById('linkedin-score-badge').textContent = result.total;
  const bd = document.getElementById('linkedin-breakdown');
  bd.innerHTML = result.breakdown.map(b => {
    const pct = Math.round((b.value/b.max)*100);
    const cls = pct>=70?'bar-green':pct>=40?'bar-yellow':'bar-red';
    return `<div class="breakdown-item">
      <div class="breakdown-label">${b.label}</div>
      <div class="breakdown-bar-wrap"><div class="breakdown-bar ${cls}" style="width:0%" data-w="${pct}%"></div></div>
      <div class="breakdown-value">${b.value}<span style="color:var(--text-dim);font-size:.75rem">/${b.max}</span></div>
    </div>`;
  }).join('');
  animateBars(bd);

  const imp = document.getElementById('linkedin-improvements');
  imp.innerHTML = '<h4 style="margin-bottom:12px;font-size:1rem">📌 Improvements</h4>' +
    result.improvements.map(i => `
      <div class="improvement-item">
        <span class="imp-icon">${i.icon}</span>
        <div class="imp-content"><div class="imp-title">${i.title}</div><div class="imp-desc">${i.desc}</div></div>
        <span class="imp-badge badge-${i.priority==='high'?'high':i.priority==='med'?'med':'low'}">${i.priority.toUpperCase()}</span>
      </div>`).join('');
}

// ===== CODING ANALYSIS =====
window.analyzeCoding = async function() {
  const lcUser = document.getElementById('lc-username')?.value.trim();
  const ghUser = document.getElementById('gh-username')?.value.trim();
  const lcEasy = parseInt(document.getElementById('lc-easy')?.value)||0;
  const lcMed  = parseInt(document.getElementById('lc-medium')?.value)||0;
  const lcHard = parseInt(document.getElementById('lc-hard')?.value)||0;
  const lcRating = parseInt(document.getElementById('lc-rating')?.value)||0;
  const ghRepos = parseInt(document.getElementById('gh-repos')?.value)||0;
  const ghStars = parseInt(document.getElementById('gh-stars')?.value)||0;

  document.getElementById('coding-loader').style.display='inline';
  document.getElementById('coding-btn-text').textContent='Analyzing...';

  let lcData = { easy:lcEasy, medium:lcMed, hard:lcHard, rating:lcRating };
  let ghData = { repos:ghRepos, stars:ghStars };

  // Try to fetch LeetCode stats
  if (lcUser) {
    try {
      const resp = await fetch(`https://leetcode-stats-api.herokuapp.com/${lcUser}`);
      if (resp.ok) {
        const d = await resp.json();
        if (d.status === 'success') {
          lcData = { easy:d.easySolved||lcEasy, medium:d.mediumSolved||lcMed, hard:d.hardSolved||lcHard, rating:lcRating, total:d.totalSolved };
          document.getElementById('lc-card').style.borderColor = 'var(--green)';
        }
      }
    } catch(e) { console.log('LeetCode API unavailable, using manual input'); }
  }

  // Try to fetch GitHub stats
  if (ghUser) {
    try {
      const resp = await fetch(`https://api.github.com/users/${ghUser}`);
      if (resp.ok) {
        const d = await resp.json();
        ghData = { repos: d.public_repos||ghRepos, stars:ghStars, followers:d.followers||0 };
        document.getElementById('gh-card').style.borderColor = 'var(--green)';
      }
    } catch(e) { console.log('GitHub API unavailable'); }
  }

  document.getElementById('coding-loader').style.display='none';
  document.getElementById('coding-btn-text').textContent='Analyze Coding Profiles →';

  const result = scoreCoding(lcData, ghData);
  state.codingScore = result.total;
  state.improvements.push(...result.improvements.map(i=>({...i, cat:'Coding'})));
  renderCodingResult(result);
  document.getElementById('coding-result').style.display = 'block';
  document.getElementById('coding-result').scrollIntoView({ behavior:'smooth', block:'nearest' });
};

function scoreCoding(lc, gh) {
  const improvements = [];
  const total_lc = (lc.easy||0) + (lc.medium||0) + (lc.hard||0);

  // LeetCode scoring
  let lcScore = 0;
  lcScore += Math.min(30, ((lc.easy||0)/50)*30);
  lcScore += Math.min(40, ((lc.medium||0)/80)*40);
  lcScore += Math.min(30, ((lc.hard||0)/30)*30);

  if (total_lc < 50) improvements.push({ icon:'🧩', title:'Solve More LeetCode Problems', desc:`${total_lc} problems solved. Target 150+ (50E+80M+20H) for top companies.`, priority:'high' });
  if ((lc.medium||0) < 30) improvements.push({ icon:'🔥', title:'Focus on Medium Problems', desc:'Medium problems are the most asked in FAANG interviews. Aim for 80+.', priority:'high' });
  if ((lc.hard||0) < 5) improvements.push({ icon:'💪', title:'Attempt Hard Problems', desc:'Solving 20+ hards shows strong algorithmic thinking for senior roles.', priority:'med' });
  if (lc.rating && lc.rating < 1500) improvements.push({ icon:'🏆', title:'Improve Contest Rating', desc:`Current: ${lc.rating}. Aim for 1600+ (Knight) to stand out on resume.`, priority:'med' });

  // GitHub scoring
  let ghScore = 0;
  ghScore += Math.min(40, ((gh.repos||0)/15)*40);
  ghScore += Math.min(30, ((gh.stars||0)/20)*30);
  ghScore += Math.min(30, gh.followers>50 ? 30 : (gh.followers||0)*0.6);

  if ((gh.repos||0) < 5) improvements.push({ icon:'🐙', title:'Add GitHub Projects', desc:'Create at least 5-8 public repos showcasing different skills.', priority:'high' });
  if ((gh.stars||0) < 5) improvements.push({ icon:'⭐', title:'Build Starrable Projects', desc:'Projects with stars signal quality. Build something useful in your domain.', priority:'med' });

  const total = Math.round((lcScore * 0.6 + ghScore * 0.4));

  const breakdown = [
    { label:'Easy Problems', value: Math.min(100,((lc.easy||0)/50)*100), max:100 },
    { label:'Medium Problems', value: Math.min(100,((lc.medium||0)/80)*100), max:100 },
    { label:'Hard Problems', value: Math.min(100,((lc.hard||0)/30)*100), max:100 },
    { label:'GitHub Projects', value: Math.min(100,((gh.repos||0)/15)*100), max:100 },
    { label:'Open Source Impact', value: Math.min(100,((gh.stars||0)/20)*100), max:100 },
  ];
  return { total: Math.min(100, total), breakdown, improvements, lcData:lc, ghData:gh };
}

function renderCodingResult(result) {
  document.getElementById('coding-score-badge').textContent = result.total;
  const bd = document.getElementById('coding-breakdown');
  bd.innerHTML = result.breakdown.map(b => {
    const pct = Math.round((b.value/b.max)*100);
    const cls = pct>=70?'bar-green':pct>=40?'bar-yellow':'bar-red';
    return `<div class="breakdown-item">
      <div class="breakdown-label">${b.label}</div>
      <div class="breakdown-bar-wrap"><div class="breakdown-bar ${cls}" style="width:0%" data-w="${pct}%"></div></div>
      <div class="breakdown-value">${Math.round(b.value)}<span style="color:var(--text-dim);font-size:.75rem">/${b.max}</span></div>
    </div>`;
  }).join('');
  animateBars(bd);

  const imp = document.getElementById('coding-improvements');
  imp.innerHTML = '<h4 style="margin-bottom:12px;font-size:1rem">📌 Improvements</h4>' +
    result.improvements.map(i => `
      <div class="improvement-item">
        <span class="imp-icon">${i.icon}</span>
        <div class="imp-content"><div class="imp-title">${i.title}</div><div class="imp-desc">${i.desc}</div></div>
        <span class="imp-badge badge-${i.priority==='high'?'high':i.priority==='med'?'med':'low'}">${i.priority.toUpperCase()}</span>
      </div>`).join('');
}

// ===== FINAL SCORE =====
window.generateFinalScore = function() {
  const final = Math.round(state.resumeScore * 0.35 + state.linkedinScore * 0.25 + state.codingScore * 0.40);
  goToStep(4);

  // Animate dial
  setTimeout(() => {
    const circle = document.getElementById('score-circle');
    const circumference = 502;
    const offset = circumference - (final / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Animate number
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + 2, final);
      document.getElementById('final-score-number').textContent = cur;
      if (cur >= final) clearInterval(timer);
    }, 30);

    // Grade
    const grade = final >= 85 ? '🏆 Excellent' : final >= 70 ? '✅ Good' : final >= 55 ? '⚡ Average' : '🔧 Needs Work';
    const gradeColor = final >= 85 ? '#22c55e' : final >= 70 ? '#06b6d4' : final >= 55 ? '#f59e0b' : '#ef4444';
    const gradeEl = document.getElementById('final-score-grade');
    gradeEl.textContent = grade;
    gradeEl.style.color = gradeColor;

    // Sub-scores
    document.getElementById('fb-resume-score').textContent = state.resumeScore;
    document.getElementById('fb-linkedin-score').textContent = state.linkedinScore;
    document.getElementById('fb-coding-score').textContent = state.codingScore;
    setTimeout(() => {
      document.getElementById('fb-resume-bar').style.width = state.resumeScore + '%';
      document.getElementById('fb-linkedin-bar').style.width = state.linkedinScore + '%';
      document.getElementById('fb-coding-bar').style.width = state.codingScore + '%';
    }, 300);
  }, 200);

  // 90-day plan
  const planEl = document.getElementById('action-plan-grid');
  planEl.innerHTML = buildActionPlan(final);

  // Top improvements (sorted by priority)
  const sorted = [...state.improvements].sort((a,b) => {
    const p = {high:0,med:1,low:2};
    return (p[a.priority]||2) - (p[b.priority]||2);
  });
  const top = document.getElementById('top-improvements-list');
  top.innerHTML = sorted.slice(0,8).map((imp,i) => `
    <div class="top-imp-item">
      <div class="top-imp-rank">${i+1}</div>
      <div>
        <div class="top-imp-text">${imp.icon} ${imp.title}</div>
        <div class="top-imp-cat">${imp.cat} · ${imp.desc}</div>
      </div>
      <span class="top-imp-priority imp-badge badge-${imp.priority==='high'?'high':imp.priority==='med'?'med':'low'}">${imp.priority.toUpperCase()}</span>
    </div>`).join('');
};

function buildActionPlan(score) {
  const plans = [
    {
      month:'Month 1 — Foundation',
      title: score < 60 ? 'Fix Critical Gaps' : 'Sharpen Fundamentals',
      tasks: score < 60
        ? ['Rewrite resume with quantifiable achievements','Add LinkedIn summary & headline','Solve 30 LeetCode Easy problems','Create 2 GitHub projects with README']
        : ['Optimize resume with target JD keywords','Grow LinkedIn to 500+ connections','Solve 20 LeetCode Medium problems','Add certifications to LinkedIn']
    },
    {
      month:'Month 2 — Growth',
      title: 'Build Momentum',
      tasks: ['Complete 1 full-stack project & deploy it','Solve 40 LeetCode Medium problems','Post weekly on LinkedIn (learnings/projects)','Get 2 LinkedIn recommendations']
    },
    {
      month:'Month 3 — Launch',
      title: 'Job Applications',
      tasks: ['Apply to 10 companies/week with tailored resumes','Practice 5 mock interviews on Pramp/Interviewing.io','Attend virtual hiring events & hackathons','Follow up on applications systematically']
    }
  ];
  return plans.map(p => `
    <div class="plan-card">
      <div class="plan-month">${p.month}</div>
      <h4>${p.title}</h4>
      <div class="plan-tasks">${p.tasks.map(t=>`<div class="plan-task">${t}</div>`).join('')}</div>
    </div>`).join('');
}

// ===== RESTART =====
window.restartAnalysis = function() {
  state.resumeScore = 0; state.linkedinScore = 0; state.codingScore = 0; state.improvements = [];
  document.getElementById('resume-result').style.display = 'none';
  document.getElementById('linkedin-result').style.display = 'none';
  document.getElementById('coding-result').style.display = 'none';
  goToStep(1);
};

// ===== UTILS =====
function animateBars(container) {
  setTimeout(() => {
    container.querySelectorAll('.breakdown-bar').forEach(bar => {
      bar.style.width = bar.dataset.w || '0%';
    });
  }, 100);
}
