import './mock-interview.css';

// ===== THEME =====
const saved = localStorage.getItem('theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);
document.getElementById('theme-btn')?.addEventListener('click', () => {
  const n = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', n);
  localStorage.setItem('theme', n);
  document.getElementById('theme-btn').textContent = n === 'light' ? '🌙' : '☀️';
});

// ===== QUESTION BANKS =====
const QUESTIONS = {
  dsa: {
    easy: [
      { q:"Explain the difference between an array and a linked list. When would you use each?", hints:["Think about memory layout","Consider insertion/deletion at head vs tail","Access time differences"] },
      { q:"What is a stack? Implement push, pop, and peek operations.", hints:["LIFO data structure","Think about call stack in recursion","Arrays or linked lists can be used"] },
      { q:"Reverse a string without using built-in reverse. Explain your time & space complexity.", hints:["Two-pointer technique","Consider in-place reversal","O(n) time, O(1) space possible"] },
      { q:"Find the maximum element in an array. What is its time complexity?", hints:["Single pass approach","O(n) time, O(1) space","Edge case: empty array"] },
      { q:"Check if a number is a palindrome without converting to string.", hints:["Reverse the digits","Beware of negative numbers","Compare reversed half"] },
    ],
    medium: [
      { q:"Implement a LRU (Least Recently Used) Cache with O(1) get and O(1) put operations.", hints:["HashMap + Doubly Linked List","Move accessed node to front","Evict tail when capacity exceeded"] },
      { q:"Find all pairs in an array that sum to a target. What's the optimal approach?", hints:["HashMap for O(n) solution","Two-pointer for sorted array","Handle duplicates"] },
      { q:"Given a binary tree, find the maximum path sum. The path can start and end at any node.", hints:["DFS with recursion","At each node: max(left,0) + node + max(right,0)","Track global maximum"] },
      { q:"Implement Merge Sort. Explain when it's preferred over Quick Sort.", hints:["Divide and conquer","Stable sort — preserves order of equals","O(n log n) always, extra space O(n)"] },
      { q:"Detect a cycle in a linked list. Explain Floyd's cycle detection algorithm.", hints:["Fast and slow pointer","If they meet, cycle exists","Find cycle start: reset slow to head"] },
    ],
    hard: [
      { q:"Design a data structure that supports insert, delete, search, and getRandom all in O(1) time.", hints:["HashMap + resizable array","Track indices in the map","Swap with last element on delete"] },
      { q:"Find the median of a data stream. How would you handle it efficiently?", hints:["Two heaps: max-heap + min-heap","Balance heaps after each insert","Median is top of one or average of both tops"] },
      { q:"Given a 2D grid with obstacles, find the number of unique paths from top-left to bottom-right.", hints:["DP: dp[i][j] = dp[i-1][j] + dp[i][j-1]","Base case: dp[0][0] = 1","0 if obstacle at current cell"] },
      { q:"Implement a Trie. Support insert, search, and startsWith. Analyse the complexities.", hints:["Node with children array/hashmap","isEnd flag at word end","O(m) for all ops, m = word length"] },
      { q:"Serialize and deserialize a binary tree. Design an algorithm that can reconstruct the original tree.", hints:["BFS or DFS approach","Use '#' for null nodes","Pre-order traversal for easy deserialization"] },
    ]
  },
  system: {
    easy: [
      { q:"What is the difference between SQL and NoSQL databases? When would you choose each?", hints:["Schema vs schema-less","ACID vs BASE","Use cases: structured vs unstructured data"] },
      { q:"Explain REST API principles. What makes an API RESTful?", hints:["Stateless, uniform interface","HTTP methods: GET, POST, PUT, DELETE","Resource-based URLs"] },
      { q:"What is load balancing? Name two algorithms used.", hints:["Distribute requests across servers","Round Robin, Least Connections","Active-passive vs active-active"] },
    ],
    medium: [
      { q:"Design a URL shortener like bit.ly. Focus on high-level architecture, storage, and key generation.", hints:["Base62 encoding or MD5 hash","KV store for redirects","Handle custom short URLs, analytics"] },
      { q:"Design a notification system that can handle millions of push notifications per day.", hints:["Message queue (Kafka/RabbitMQ)","Push vs pull model","Rate limiting, retry with backoff"] },
      { q:"How would you design a rate limiter? What are the trade-offs between different algorithms?", hints:["Token bucket vs leaky bucket","Fixed window vs sliding window","Redis for distributed rate limiting"] },
    ],
    hard: [
      { q:"Design Netflix's video streaming system. Address storage, CDN, encoding, and reliability.", hints:["Adaptive bitrate streaming (DASH/HLS)","CDN for edge caching","Chunked upload, multiple quality levels"] },
      { q:"Design a distributed cache like Redis. Handle consistency, eviction, and replication.", hints:["Write-through vs write-behind","LRU/LFU eviction policies","Leader-follower replication"] },
      { q:"Design WhatsApp's messaging system for 2 billion users. Cover real-time delivery and storage.", hints:["WebSockets for real-time","Message queue for offline delivery","Sharding by user ID"] },
    ]
  },
  hr: {
    easy: [
      { q:"Tell me about yourself and your background in software development.", hints:["Past-Present-Future structure","Highlight key achievements","Keep under 2 minutes"] },
      { q:"Why do you want to work at this company?", hints:["Research the company's mission","Connect to your career goals","Be specific, not generic"] },
      { q:"What are your biggest strengths as a developer?", hints:["Provide evidence for each strength","Align with job requirements","Be authentic, not rehearsed"] },
    ],
    medium: [
      { q:"Tell me about a time you disagreed with your team or manager. How did you handle it?", hints:["STAR format: Situation, Task, Action, Result","Show maturity and communication","Focus on positive outcome"] },
      { q:"Describe a project you're most proud of and your specific contribution.", hints:["Quantify your impact","Explain challenges faced","Highlight collaboration"] },
      { q:"How do you handle working under tight deadlines or high pressure?", hints:["Concrete example","Prioritisation strategies","Show you remain calm and focused"] },
    ],
    hard: [
      { q:"Where do you see yourself in 5 years? How does this role fit into your long-term goals?", hints:["Show ambition but be realistic","Connect to the company's trajectory","Avoid 'your job' as the answer"] },
      { q:"Tell me about a time you failed. What did you learn?", hints:["Choose a real failure, not 'I worked too hard'","Show accountability","Emphasise growth"] },
      { q:"Describe a situation where you had to lead a team through a difficult technical challenge.", hints:["STAR format","Show both technical and leadership skills","Quantify the result"] },
    ]
  },
  behavioural: {
    easy: [
      { q:"How do you prioritise tasks when you have multiple deadlines at the same time?", hints:["Eisenhower matrix or MoSCoW","Communication with stakeholders","Show systematic thinking"] },
      { q:"Give an example of a time you helped a colleague who was struggling.", hints:["Show empathy and teamwork","Describe the impact","Don't take all the credit"] },
      { q:"How do you stay updated with the latest technologies and trends in software development?", hints:["Specific resources: blogs, papers, podcasts","Side projects and open source","Community involvement"] },
    ],
    medium: [
      { q:"Describe a time when you had to learn a completely new technology quickly for a project. How did you approach it?", hints:["Learning strategy","Seek help when needed","Show adaptability"] },
      { q:"Tell me about a time you received critical feedback. How did you respond and what changed?", hints:["Openness to feedback","Specific actions taken","Measurable improvement"] },
      { q:"Give an example of when you identified a problem before it became critical. What did you do?", hints:["Proactive mindset","Data or observations that led to insight","Business impact of the catch"] },
    ],
    hard: [
      { q:"Describe a time when you had to influence a stakeholder who didn't have technical background to make an important decision.", hints:["Simplify technical concepts","Build trust through data","Focus on business impact"] },
      { q:"Tell me about a time you disagreed with a technical decision that was already made. What did you do?", hints:["Voice concerns professionally","Decide when to escalate vs accept","Show you can commit even if you disagree"] },
      { q:"Describe a situation where you had to balance technical debt with new feature development.", hints:["Quantify the cost of tech debt","Negotiation with product team","Short-term vs long-term thinking"] },
    ]
  }
};

const FEEDBACK_TEMPLATES = {
  excellent: { label:'Excellent Answer! 🏆', color:'#22c55e', min:8 },
  good:      { label:'Good Answer ✅',       color:'#06b6d4', min:6 },
  average:   { label:'Average Answer 📝',   color:'#f59e0b', min:4 },
  weak:      { label:'Needs Improvement ⚠️', color:'#ef4444', min:0 },
};

// ===== STATE =====
const state = {
  type:'dsa', diff:'medium', company:'', total:5,
  questions:[], current:0, answers:[], scores:[],
  timerInterval:null, elapsed:0
};

// ===== SETUP UI =====
document.querySelectorAll('.type-pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.type-pill').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); state.type = b.dataset.type;
  });
});
document.querySelectorAll('.diff-pill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.diff-pill').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); state.diff = b.dataset.diff;
  });
});
document.querySelectorAll('.company-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.company-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); state.company = b.dataset.co;
  });
});
const qSlider = document.getElementById('q-count');
qSlider?.addEventListener('input', () => {
  document.getElementById('q-count-val').textContent = `${qSlider.value} Questions`;
  state.total = +qSlider.value;
});
document.getElementById('answer-input')?.addEventListener('input', e => {
  document.getElementById('ap-char-count').textContent = `${e.target.value.length} / 2000 chars`;
});

// ===== START =====
window.startInterview = function() {
  const pool = QUESTIONS[state.type]?.[state.diff] || QUESTIONS.dsa.medium;
  state.questions = shuffle([...pool]).slice(0, Math.min(state.total, pool.length));
  state.current = 0; state.answers = []; state.scores = [];
  state.total = state.questions.length;
  document.getElementById('q-total').textContent = state.total;
  document.getElementById('qp-type-badge').textContent = state.type.toUpperCase();
  document.getElementById('qp-diff-badge').textContent = state.diff.charAt(0).toUpperCase() + state.diff.slice(1);
  document.getElementById('setup-section').style.display = 'none';
  document.getElementById('session-section').style.display = 'block';
  showQuestion();
  startTimer();
};

function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

function startTimer() {
  clearInterval(state.timerInterval);
  state.elapsed = 0;
  state.timerInterval = setInterval(() => {
    state.elapsed++;
    const m = String(Math.floor(state.elapsed/60)).padStart(2,'0');
    const s = String(state.elapsed%60).padStart(2,'0');
    document.getElementById('qp-timer').textContent = `⏱ ${m}:${s}`;
  }, 1000);
}

function showQuestion() {
  const q = state.questions[state.current];
  if (!q) return;
  document.getElementById('q-current').textContent = `Q${state.current+1}`;
  const pct = (state.current / state.total) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('question-content').innerHTML = `
    <div class="q-text">${q.q}</div>
    ${state.company ? `<div class="q-company">📍 ${state.company} style</div>` : ''}`;
  document.getElementById('answer-input').value = '';
  document.getElementById('ap-char-count').textContent = '0 / 2000 chars';
  document.getElementById('q-hints').style.display = 'block';
  document.getElementById('hint-body').style.display = 'none';
  document.getElementById('hint-toggle-icon').textContent = '▼';
  document.getElementById('hint-body').innerHTML = `<ul>${q.hints.map(h => `<li>${h}</li>`).join('')}</ul>`;
  document.getElementById('feedback-section').style.display = 'none';
  document.getElementById('session-section').style.display = 'block';
  state.elapsed = 0;
}

window.toggleHints = function() {
  const body = document.getElementById('hint-body');
  const icon = document.getElementById('hint-toggle-icon');
  const show = body.style.display === 'none';
  body.style.display = show ? 'block' : 'none';
  icon.textContent = show ? '▲' : '▼';
};

window.clearAnswer = function() { document.getElementById('answer-input').value = ''; document.getElementById('ap-char-count').textContent = '0 / 2000 chars'; };

window.useSpeech = function() {
  const btn = document.getElementById('speech-btn');
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert('Speech recognition not supported in this browser. Try Chrome.'); return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SR();
  recognition.continuous = true; recognition.interimResults = true;
  const ta = document.getElementById('answer-input');
  const base = ta.value;
  btn.textContent = '🔴 Listening…'; btn.style.color = 'var(--red)';
  recognition.onresult = e => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    ta.value = base + ' ' + transcript;
    document.getElementById('ap-char-count').textContent = `${ta.value.length} / 2000 chars`;
  };
  recognition.onend = () => { btn.textContent = '🎙 Voice'; btn.style.color = ''; };
  recognition.start();
  setTimeout(() => recognition.stop(), 30000);
};

// ===== SUBMIT =====
window.submitAnswer = function() {
  const answer = document.getElementById('answer-input').value.trim();
  state.answers.push(answer);
  document.getElementById('session-section').style.display = 'none';
  document.getElementById('feedback-section').style.display = 'block';
  document.getElementById('fb-loading').style.display = 'flex';
  document.getElementById('fb-content').style.display = 'none';
  setTimeout(() => showFeedback(answer), 1400 + Math.random() * 600);
};

window.skipQuestion = function() {
  state.answers.push('');
  state.scores.push(0);
  if (state.current + 1 >= state.total) { showResults(); return; }
  state.current++;
  showQuestion();
};

function showFeedback(answer) {
  const q = state.questions[state.current];
  const score = evaluateAnswer(answer, q);
  state.scores.push(score);

  const template = score >= 8 ? FEEDBACK_TEMPLATES.excellent
    : score >= 6 ? FEEDBACK_TEMPLATES.good
    : score >= 4 ? FEEDBACK_TEMPLATES.average
    : FEEDBACK_TEMPLATES.weak;

  // Animate ring
  const circle = document.getElementById('fb-circle');
  const offset = 214 - (214 * score / 10);
  setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);

  document.getElementById('fb-score').textContent = score;
  document.getElementById('fb-verdict-text').textContent = template.label;
  document.getElementById('fb-verdict-text').style.color = template.color;
  document.getElementById('fb-q-recap').textContent = q.q.slice(0, 80) + (q.q.length > 80 ? '…' : '');

  const { strengths, improvements, model } = generateFeedback(score, answer, q, state.type);

  document.getElementById('fb-strengths').className = 'fb-sec fb-sec-strengths';
  document.getElementById('fb-strengths').innerHTML = `<h4>✅ Strengths</h4><ul>${strengths.map(s=>`<li>${s}</li>`).join('')}</ul>`;

  document.getElementById('fb-improvements').className = 'fb-sec fb-sec-improvements';
  document.getElementById('fb-improvements').innerHTML = `<h4>⚡ Areas to Improve</h4><ul>${improvements.map(s=>`<li>${s}</li>`).join('')}</ul>`;

  document.getElementById('fb-model').className = 'fb-sec fb-sec-model';
  document.getElementById('fb-model').innerHTML = `<h4>💡 Model Answer Outline</h4><div class="fb-model-text">${model}</div>`;

  const isLast = state.current + 1 >= state.total;
  const btn = document.getElementById('next-question-btn');
  btn.textContent = isLast ? '📊 See Results →' : 'Next Question →';

  document.getElementById('fb-loading').style.display = 'none';
  document.getElementById('fb-content').style.display = 'block';
  document.getElementById('fb-circle').style.strokeDashoffset = offset;
}

function evaluateAnswer(answer, q) {
  if (!answer || answer.length < 20) return 1;
  let score = 4;
  const words = answer.toLowerCase().split(/\s+/);
  const len = answer.length;
  if (len > 200) score++;
  if (len > 500) score++;
  // Keyword check from hints
  q.hints.forEach(h => {
    const kws = h.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    if (kws.some(k => words.includes(k))) score++;
  });
  // Complexity mention for DSA
  if (state.type === 'dsa' && /o\(|complexity|time|space/i.test(answer)) score++;
  if (/example|instance|for example|such as/i.test(answer)) score += 0.5;
  return Math.min(10, Math.round(Math.max(1, score)));
}

function generateFeedback(score, answer, q, type) {
  const len = answer.length;
  const strengths = [];
  const improvements = [];

  if (len > 400) strengths.push('Detailed and well-structured answer');
  else improvements.push('Expand your answer with more detail and examples');

  if (/example|instance|for example/i.test(answer)) strengths.push('Good use of concrete examples');
  else improvements.push('Add real-world examples to strengthen your answer');

  if (type === 'dsa' && /o\(|complexity|time|space/i.test(answer)) strengths.push('Mentioned time/space complexity — excellent!');
  else if (type === 'dsa') improvements.push('Always state the time and space complexity');

  if (type === 'system' && /trade.?off|pros|cons|vs\b/i.test(answer)) strengths.push('Good analysis of trade-offs');
  else if (type === 'system') improvements.push('Discuss trade-offs between different approaches');

  if (/\b(i|we|my|our)\b/i.test(answer) && /hr|behavioural/.test(type)) strengths.push('Personal ownership shown with first-person examples');
  if (q.hints.some(h => answer.toLowerCase().includes(h.toLowerCase().split(' ')[0]))) strengths.push('Covered key technical concepts correctly');

  if (strengths.length === 0) strengths.push('You attempted the question');
  if (improvements.length === 0) improvements.push('Practice articulating trade-offs more clearly');

  const model = q.hints.join(' → ') + '. Structure: define concept → explain approach → state complexity → give example.';
  return { strengths: strengths.slice(0,3), improvements: improvements.slice(0,3), model };
}

window.showHint = function() { document.getElementById('q-hints').scrollIntoView({ behavior:'smooth' }); };

window.nextQuestion = function() {
  if (state.current + 1 >= state.total) { showResults(); return; }
  state.current++;
  showQuestion();
};

// ===== RESULTS =====
function showResults() {
  clearInterval(state.timerInterval);
  document.getElementById('session-section').style.display = 'none';
  document.getElementById('feedback-section').style.display = 'none';
  document.getElementById('results-section').style.display = 'block';

  const avg = state.scores.length ? (state.scores.reduce((a,b)=>a+b,0) / state.scores.length).toFixed(1) : 0;
  const pct = Math.round((avg / 10) * 100);
  const grade = pct >= 85 ? 'Excellent 🏆' : pct >= 70 ? 'Good ✅' : pct >= 55 ? 'Average 📝' : 'Needs Practice ⚠️';

  document.getElementById('rc-big-score').textContent = `${avg}/10`;
  document.getElementById('rc-grade').textContent = grade;

  const breakdown = document.getElementById('rc-breakdown');
  breakdown.innerHTML = state.scores.map((s, i) => `
    <div class="rc-row">
      <span class="rc-row-label">Q${i+1}</span>
      <div class="rc-bar-wrap"><div class="rc-bar" style="width:${s*10}%"></div></div>
      <span class="rc-row-score">${s}/10</span>
    </div>`).join('');

  const tips = getTips(state.type, avg);
  document.getElementById('rc-tips').innerHTML = `<h4>🎯 Improvement Tips</h4><ul>${tips.map(t=>`<li>${t}</li>`).join('')}</ul>`;
}

function getTips(type, avg) {
  const base = [
    'Practice explaining your thought process out loud before writing code',
    'Use the STAR method for all behavioural answers',
    'Research the company — mention their tech stack and challenges',
  ];
  const specific = {
    dsa:['Revise Big-O notation and always mention complexity','Practice coding on paper or whiteboard','LeetCode: solve 2 mediums per day'],
    system:['Learn CAP theorem and distributed systems fundamentals','Study case studies: Amazon, Netflix, Uber architectures','Read "Designing Data-Intensive Applications"'],
    hr:['Record yourself answering to review your delivery','Prepare 10 STAR stories covering different competencies','Research the company culture and values'],
    behavioural:['Build a story bank of 10+ real work experiences','Quantify every achievement with numbers','Practice concise answers — 90 to 120 seconds max'],
  };
  return [...(specific[type] || []), ...base].slice(0,4);
}

window.restartInterview = function() {
  document.getElementById('results-section').style.display = 'none';
  document.getElementById('setup-section').style.display = 'block';
  state.scores = []; state.answers = []; state.current = 0;
};
