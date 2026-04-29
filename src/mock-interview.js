import './mock-interview.css';

// ===== THEME =====
const saved = localStorage.getItem('lc-theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);
document.getElementById('theme-btn')?.addEventListener('click', () => {
  const n = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', n);
  localStorage.setItem('lc-theme', n);
  document.getElementById('theme-btn').textContent = n === 'light' ? '🌙' : '☀️';
});

// ===== STATE =====
const S = {
  type:'dsa', diff:'medium', company:'', total:5,
  resumeText:'',
  questions:[], current:0, spokenAnswers:[], scores:[],
  timerInterval:null, elapsed:0,
  recognition:null, isRecording:false,
  synth: window.speechSynthesis,
  currentTranscript:''
};

// ===== QUESTION BANK (conversational phrasing) =====
const QB = {
  dsa:{
    easy:[
      {q:"So, let's start with something fundamental. Can you explain the difference between an array and a linked list? And, like, when would you actually prefer using one over the other in a real project?",hints:["Memory layout","O(1) vs O(n) access","Insertion at head"]},
      {q:"Alright, tell me about stacks. What exactly is a stack, and, um, can you give me a real-world example of where you'd use one? Walk me through the basic operations.",hints:["LIFO principle","Call stack","Undo/redo"]},
      {q:"Okay, here's a classic one. How would you go about reversing a string, but, here's the catch, without using any built-in reverse functions? Think out loud for me.",hints:["Two-pointer","O(n) time","In-place swap"]},
      {q:"This one's straightforward. If I give you an unsorted array, how do you find the maximum element? And what's the time complexity there? Any edge cases you'd worry about?",hints:["Linear scan","O(n)","Edge case: empty"]},
    ],
    medium:[
      {q:"Alright, let's step it up a bit. I want you to design an LRU cache, and both get and put need to be O of 1. Walk me through how you'd actually build that, step by step.",hints:["HashMap + Doubly Linked List","Move to front on access","Evict tail"]},
      {q:"Okay, so, I have an array and a target sum. I need all pairs that add up to that target. What's the most efficient way you'd solve this? Think about the trade-offs.",hints:["HashMap O(n)","Two-pointer for sorted","Handle duplicates"]},
      {q:"Here's an interesting one. You have a linked list, and it might have a cycle. How would you detect if there's a cycle, and if there is one, how do you find exactly where it starts?",hints:["Floyd's algorithm","Slow and fast pointer","Reset to head"]},
      {q:"This is a tricky tree problem. Given a binary tree, find the maximum path sum, but the path can start and end at any node. How would you approach this?",hints:["DFS recursion","max(left,0)+node+max(right,0)","Track global max"]},
    ],
    hard:[
      {q:"Okay, this one's a tough one. I need you to design a data structure that supports insert, delete, search, and get random, and all of them need to run in constant time. How would you do that?",hints:["HashMap + array","Track indices","Swap and pop on delete"]},
      {q:"Alright, imagine you have a continuous stream of numbers coming in. How would you efficiently find the median at any given point? Walk me through your thinking.",hints:["Two heaps","Max-heap + min-heap","Balance after insert"]},
    ]
  },
  system:{
    easy:[
      {q:"Let's talk about system design basics. What is load balancing, and why does it matter? Can you name, like, two common algorithms used for it?",hints:["Distribute traffic","Round Robin","Least Connections"]},
      {q:"So, SQL versus NoSQL. I hear this debate a lot. Can you break down the key differences for me, and tell me when you'd actually choose one over the other?",hints:["Schema vs schemaless","ACID vs BASE","Structured vs unstructured"]},
    ],
    medium:[
      {q:"Alright, let's design something. Imagine you're building a URL shortener, kind of like bit.ly. Walk me through how you'd handle the storage, the key generation, and how you'd scale it.",hints:["Base62 encoding","KV store","Collision handling"]},
      {q:"So, rate limiting, right? It's super important for APIs. How would you design a rate limiter? And can you compare, like, token bucket versus sliding window approaches?",hints:["Token bucket","Redis for distributed","Per-user limits"]},
    ],
    hard:[
      {q:"This is a big one. How would you design a video streaming system like Netflix? Think about CDN, encoding, adaptive bitrate, and, you know, keeping it reliable at scale.",hints:["Adaptive bitrate","CDN edge caching","Chunked upload"]},
    ]
  },
  hr:{
    easy:[
      {q:"So, let's start with the classic. Tell me about yourself. Walk me through your journey so far, what you've been working on, and what brought you here today.",hints:["Past-Present-Future","Under 2 minutes","Connect to this role"]},
      {q:"I'm curious, why this company specifically? Like, what is it about us that made you want to apply? I'd love to hear your genuine thought process there.",hints:["Research their mission","Align goals","Be specific"]},
    ],
    medium:[
      {q:"Okay, here's a situational one. Tell me about a time you had a disagreement with your team, maybe about an approach or a decision. How did you handle that situation?",hints:["STAR format","Show maturity","Positive outcome"]},
      {q:"What's a project you're really proud of? And I mean, specifically, what was your individual contribution? What challenges did you face?",hints:["Quantify impact","Challenges faced","Collaboration"]},
    ],
    hard:[
      {q:"Alright, this one requires some honesty. Tell me about a time you failed at something significant. What happened, and more importantly, what did you take away from it?",hints:["Real failure","Accountability","Growth mindset"]},
    ]
  },
  full:{
    easy:[{q:"If I asked you to build a simple CRUD REST API from scratch, right now, walk me through the steps. What stack would you pick, and why? How would you structure it?",hints:["Stack choice","DB schema","Auth"]}],
    medium:[
      {q:"Okay, imagine this scenario. There's a production bug, and it's affecting about 30 percent of your users. Walk me through exactly how you'd approach debugging that. Step by step.",hints:["Logging","Reproduce","Root cause"]},
      {q:"In a fast-paced team that's shipping features every week, how do you actually maintain code quality? What practices have worked for you in the past?",hints:["Code reviews","CI/CD","Automated tests"]},
    ],
    hard:[{q:"So your team tells you the database is the bottleneck. The app is slowing down at scale. What do you do? Walk me through your investigation and solution process.",hints:["Indexing","Read replicas","Caching layer"]}]
  }
};

const INTROS = [
  "Hey there! I'm Priya, and I'll be your interviewer today. So, I've gone through your profile, and I've put together some questions that I think will be really interesting. After each question, you'll get a few seconds to gather your thoughts, and then your mic will open up automatically. No pressure, just think out loud. Ready? Let's dive in.",
  "Hi! Welcome. My name is Priya, and I'm really excited to chat with you today. So, here's how this is going to work. I'll ask you a question, you get a few seconds to think, and then you just start talking. Don't worry about being perfect. I'm much more interested in how you think. Alright, let's get started.",
  "Hello! Great to meet you. I'm Priya. So, I'll be walking you through a few questions today, and honestly, I want this to feel more like a conversation than a formal interview. After each question, take a breath, collect your thoughts, and your mic will open right up. Sound good? Let's go."
];

// ===== SETUP INTERACTIONS =====
window.toggleResumePanel = function() {
  const p = document.getElementById('resume-panel');
  const b = document.getElementById('rus-toggle');
  const open = p.style.display !== 'none';
  p.style.display = open ? 'none' : 'flex';
  b.textContent = open ? 'Add Resume ↓' : 'Close ↑';
};

document.querySelectorAll('.topic-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    S.type = card.dataset.type || 'dsa';
    const n = document.getElementById('cb-topic-name');
    if (n) n.textContent = card.querySelector('.tc-name')?.textContent || 'DSA';
  });
});

document.querySelectorAll('.track-start-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    S.type = btn.dataset.type || 'dsa';
    S.diff = btn.dataset.diff || 'medium';
    S.company = btn.dataset.company || '';
    S.total = 5;
    startInterview();
  });
});

document.querySelectorAll('#diff-pills .cpill').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#diff-pills .cpill').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    S.diff = b.dataset.val;
  });
});

document.getElementById('company-select')?.addEventListener('change', e => { S.company = e.target.value; });
document.getElementById('q-count-select')?.addEventListener('change', e => { S.total = +e.target.value; });
document.getElementById('resume-text')?.addEventListener('input', e => { S.resumeText = e.target.value; });

// File upload
document.getElementById('upload-zone')?.addEventListener('click', () => document.getElementById('resume-file')?.click());
document.getElementById('resume-file')?.addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => { S.resumeText = ev.target.result; document.getElementById('resume-text').value = S.resumeText.slice(0,3000); document.getElementById('resume-status').textContent = `✅ Loaded: ${f.name}`; };
  r.readAsText(f);
});

// ===== START =====
document.getElementById('big-start-btn')?.addEventListener('click', startInterview);

function startInterview() {
  const pool = QB[S.type]?.[S.diff] || QB.dsa.medium;
  S.questions = shuffle([...pool]).slice(0, Math.min(S.total, pool.length));
  S.total = S.questions.length;
  S.current = 0; S.spokenAnswers = []; S.scores = [];

  document.getElementById('screen-setup').style.display = 'none';
  document.getElementById('screen-interview').style.display = 'block';
  document.getElementById('q-total').textContent = S.total;
  document.getElementById('q-type-badge').textContent = S.type.toUpperCase();
  document.getElementById('q-diff-badge').textContent = cap(S.diff);

  startClock();
  const intro = INTROS[Math.floor(Math.random() * INTROS.length)];
  setStatus('Priya is introducing herself…');
  typeQuestion(intro, () => speak(intro, () => setTimeout(askQuestion, 600)));
}

function askQuestion() {
  const q = S.questions[S.current];
  if (!q) return;
  document.getElementById('q-num').textContent = `Q${S.current + 1}`;
  document.getElementById('progress-fill').style.width = `${(S.current / S.total) * 100}%`;
  const prefix = S.company ? `[${S.company}] ` : '';
  const full = prefix + q.q;
  setStatus('Priya is asking a question…');
  setSpeakingAI(true);
  typeQuestion(full, () => speak(full, () => { setSpeakingAI(false); startCountdown(5); }));
}

// ===== COUNTDOWN → AUTO MIC =====
function startCountdown(secs) {
  const overlay = document.getElementById('countdown-overlay');
  const numEl = document.getElementById('cd-number');
  const path = document.getElementById('cd-circle-path');
  const total = 276;
  overlay.style.display = 'flex';
  setStatus(`Think time — mic opens in ${secs}s`);
  let left = secs;
  numEl.textContent = left;
  path.style.strokeDashoffset = '0';

  const interval = setInterval(() => {
    left--;
    numEl.textContent = left;
    const offset = total * (1 - left / secs);
    path.style.strokeDashoffset = offset;
    setStatus(`Think time — mic opens in ${left}s`);
    if (left <= 0) {
      clearInterval(interval);
      overlay.style.display = 'none';
      startAutoRecording();
    }
  }, 1000);
}

// ===== AUTO RECORDING =====
function startAutoRecording() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    setStatus('Voice not supported — skipping this question');
    setTimeout(skipQuestion, 2000);
    return;
  }
  S.currentTranscript = '';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  S.recognition = new SR();
  S.recognition.continuous = true;
  S.recognition.interimResults = true;
  S.recognition.lang = 'en-IN';

  S.recognition.onstart = () => {
    S.isRecording = true;
    document.getElementById('recording-overlay').style.display = 'flex';
    document.getElementById('stop-rec-btn').style.display = 'inline-flex';
    document.getElementById('mic-indicator')?.querySelector('.mic-dot')?.classList.add('active');
    setStatus('🎙 Recording your answer…');
    animateVoiceBars(true);
  };

  S.recognition.onresult = e => {
    S.currentTranscript = Array.from(e.results).map(r => r[0].transcript).join(' ');
  };

  let silenceTimer;
  S.recognition.onspeechend = () => {
    silenceTimer = setTimeout(() => { if (S.isRecording) stopRecording(); }, 3000);
  };

  S.recognition.onend = () => {
    clearTimeout(silenceTimer);
    if (S.isRecording) {
      S.isRecording = false;
      finishAnswer();
    }
  };

  S.recognition.onerror = () => { S.isRecording = false; finishAnswer(); };
  S.recognition.start();
}

window.stopRecording = function() {
  if (S.recognition) { S.recognition.stop(); }
  S.isRecording = false;
};

function finishAnswer() {
  document.getElementById('recording-overlay').style.display = 'none';
  document.getElementById('stop-rec-btn').style.display = 'none';
  animateVoiceBars(false);
  setStatus('Processing your answer…');
  S.spokenAnswers.push(S.currentTranscript);
  const score = scoreAnswer(S.currentTranscript, S.questions[S.current]);
  S.scores.push(score);
  const reactions = score >= 8 ? [
    "Oh, that was really good. I like how you structured that. Alright, let's move on to the next one.",
    "Nice! You clearly know this well. Great explanation. Okay, moving on.",
    "Yeah, that's exactly what I was looking for. Well done. Let's keep going.",
    "Hmm, excellent. You covered the key points really well there. Next question."
  ] : score >= 6 ? [
    "Good, good. You hit the main points. I'd love a bit more depth next time, but solid overall. Let's continue.",
    "That's a decent answer. You're on the right track. Let me throw the next one at you.",
    "Yeah, okay, I see where you're going with that. Let's move to the next question."
  ] : score >= 4 ? [
    "Alright, I see you have some understanding there. Let's keep practicing. On to the next one.",
    "Hmm, okay. There's some room to improve on that one, but don't worry. Let's keep going.",
    "That's a start. Try to be a bit more specific next time. Alright, next question."
  ] : [
    "Okay, no worries. That's what practice is for, right? Let's keep moving.",
    "Hmm, that one was tough. Don't stress about it. Let's try the next one.",
    "Alright, let's move on. Sometimes a question just doesn't click, and that's totally fine."
  ];
  const reaction = reactions[Math.floor(Math.random() * reactions.length)];
  setTimeout(() => {
    speak(reaction, () => {
      if (S.current + 1 >= S.total) showResults();
      else { S.current++; askQuestion(); }
    });
  }, 600);
}

window.skipQuestion = function() {
  if (S.recognition) { S.recognition.stop(); S.isRecording = false; }
  document.getElementById('recording-overlay').style.display = 'none';
  document.getElementById('countdown-overlay').style.display = 'none';
  document.getElementById('stop-rec-btn').style.display = 'none';
  S.spokenAnswers.push('');
  S.scores.push(0);
  if (S.current + 1 >= S.total) showResults();
  else { S.current++; askQuestion(); }
};

// ===== NATURAL TTS (sentence-by-sentence with pauses) =====
let _chosenVoice = null;
function pickVoice() {
  if (_chosenVoice) return _chosenVoice;
  const voices = S.synth.getVoices();
  // Priority: Natural/Neural female voices > Google female > any female > any English
  _chosenVoice =
    voices.find(v => /natural|neural/i.test(v.name) && /female|samantha|zira|victoria|karen|moira|fiona|tessa|rishi/i.test(v.name) && v.lang.startsWith('en')) ||
    voices.find(v => /samantha|victoria|karen|moira|fiona|zira|tessa/i.test(v.name) && v.lang.startsWith('en')) ||
    voices.find(v => v.name.includes('Google') && v.lang === 'en-US') ||
    voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
    voices.find(v => v.lang.startsWith('en-US')) ||
    voices.find(v => v.lang.startsWith('en-')) ||
    voices[0];
  return _chosenVoice;
}

// Split text into sentences for natural pacing
function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+[\s]?|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) || [text];
}

function speak(text, cb) {
  if (!S.synth) { if (cb) cb(); return; }
  S.synth.cancel();
  const sentences = splitSentences(text);
  const voice = pickVoice();
  let idx = 0;
  setSpeakingAI(true);

  function speakNext() {
    if (idx >= sentences.length) {
      setSpeakingAI(false);
      if (cb) cb();
      return;
    }
    const sentence = sentences[idx];
    const utt = new SpeechSynthesisUtterance(sentence);
    // Vary rate and pitch slightly per sentence for natural feel
    const baseRate = 0.88;
    const basePitch = 1.1;
    utt.rate = baseRate + (Math.random() * 0.12 - 0.04); // 0.84 – 0.96
    utt.pitch = basePitch + (Math.random() * 0.1 - 0.05); // 1.05 – 1.15
    utt.volume = 1;
    if (voice) utt.voice = voice;

    utt.onend = () => {
      idx++;
      // Natural pause between sentences (200–600ms)
      const pause = 200 + Math.random() * 400;
      setTimeout(speakNext, pause);
    };
    utt.onerror = () => {
      idx++;
      setTimeout(speakNext, 200);
    };
    S.synth.speak(utt);
  }
  speakNext();
}

// ===== TYPING ANIMATION =====
function typeQuestion(text, cb) {
  const typing = document.getElementById('aqb-typing');
  const bubble = document.getElementById('aqb-text');
  typing.style.display = 'flex'; bubble.style.display = 'none';
  const delay = Math.min(text.length * 15, 1200);
  setTimeout(() => {
    typing.style.display = 'none'; bubble.style.display = 'block';
    bubble.textContent = '';
    let i = 0;
    const iv = setInterval(() => { bubble.textContent += text[i++]; if (i >= text.length) { clearInterval(iv); if (cb) cb(); } }, 16);
  }, delay);
}

function setSpeakingAI(speaking) {
  const ring = document.getElementById('ai-speaking-ring');
  const dot = document.getElementById('ai-live-dot');
  if (speaking) { ring?.classList.add('active'); if (dot) dot.style.background = '#8b5cf6'; }
  else { ring?.classList.remove('active'); if (dot) dot.style.background = '#22c55e'; }
}

function animateVoiceBars(on) {
  document.querySelectorAll('#voice-bars .vb').forEach((b,i) => {
    if (on) { b.classList.add('active'); b.style.animationDelay = `${i*0.07}s`; }
    else { b.classList.remove('active'); b.style.height = '8px'; }
  });
}

function setStatus(msg) { const el = document.getElementById('cv-status'); if (el) el.textContent = msg; }

function startClock() {
  clearInterval(S.timerInterval); S.elapsed = 0;
  S.timerInterval = setInterval(() => {
    S.elapsed++;
    const m = String(Math.floor(S.elapsed/60)).padStart(2,'0');
    const s = String(S.elapsed%60).padStart(2,'0');
    const el = document.getElementById('session-timer'); if (el) el.textContent = `${m}:${s}`;
  }, 1000);
}

// ===== SCORING =====
function scoreAnswer(answer, q) {
  if (!answer || answer.trim().length < 10) return 1;
  let score = 3;
  const words = answer.toLowerCase();
  if (answer.length > 100) score++;
  if (answer.length > 250) score++;
  if (answer.length > 450) score++;
  q.hints.forEach(h => { if (h.toLowerCase().split(' ').filter(w=>w.length>4).some(k=>words.includes(k))) score++; });
  if (S.type === 'dsa' && /complexity|o\(|linear|quadratic|time|space/i.test(answer)) score++;
  if (/example|instance|such as|for instance/i.test(answer)) score += 0.5;
  return Math.min(10, Math.round(Math.max(1, score)));
}

// ===== RESULTS =====
function showResults() {
  clearInterval(S.timerInterval);
  S.synth?.cancel();
  document.getElementById('screen-interview').style.display = 'none';
  document.getElementById('screen-results').style.display = 'block';

  const avg = S.scores.length ? +(S.scores.reduce((a,b)=>a+b,0)/S.scores.length).toFixed(1) : 0;
  const pct = Math.round(avg*10);
  const grade = pct>=85?'Excellent 🏆':pct>=70?'Good ✅':pct>=55?'Average 📝':'Keep Practising ⚠️';

  document.getElementById('rp-big-score').textContent = `${avg}/10`;
  document.getElementById('rp-grade').textContent = grade;

  document.getElementById('rp-breakdown').innerHTML = S.scores.map((s,i) => `
    <div class="rp-row">
      <span class="rp-row-lbl">Q${i+1}</span>
      <div class="rp-bar-wrap"><div class="rp-bar" style="width:0%" data-w="${s*10}%"></div></div>
      <span class="rp-row-score">${s}/10</span>
    </div>`).join('');
  setTimeout(() => { document.querySelectorAll('.rp-bar').forEach(b => { b.style.width = b.dataset.w; }); }, 100);

  const comment = avg>=8 ? `Outstanding performance! You demonstrated strong conceptual clarity and communicated your ideas very well. You're interview-ready.` :
    avg>=6 ? `Good effort overall. You covered the key concepts. To improve further, focus on adding concrete examples and mentioning complexity for DSA answers.` :
    avg>=4 ? `You showed understanding of the basics, but there's room to grow. Practice structuring answers with the STAR method and being more specific.` :
    `Keep practising! Focus on the fundamentals and try answering out loud daily. Confidence and clarity will come with repetition.`;

  document.getElementById('rpc-bubble').textContent = comment;
  speak(comment);

  const allAnswers = S.spokenAnswers.join(' ');
  const strengths = [], improvements = [];
  if (avg >= 7) strengths.push('Strong conceptual understanding across questions');
  if (/example|instance/i.test(allAnswers)) strengths.push('Good use of real-world examples');
  if (S.type==='dsa' && /complexity|o\(/i.test(allAnswers)) strengths.push('Mentioned time/space complexity');
  if (allAnswers.length > 500) strengths.push('Detailed, well-elaborated answers');
  if (strengths.length===0) strengths.push('You attempted all questions — that takes courage');
  if (avg < 8) improvements.push('Add specific examples to every answer');
  if (S.type==='dsa' && !/complexity/i.test(allAnswers)) improvements.push('Always state time and space complexity for DSA');
  if (S.type==='system') improvements.push('Discuss trade-offs and scalability considerations');
  improvements.push('Structure answers: Define → Approach → Example → Complexity');
  if (improvements.length===0) improvements.push('Try articulating trade-offs even more clearly');

  document.getElementById('rp-strengths').innerHTML = `<h4>✅ Strengths</h4><ul>${strengths.slice(0,3).map(s=>`<li>${s}</li>`).join('')}</ul>`;
  document.getElementById('rp-improvements').innerHTML = `<h4>⚡ Areas to Improve</h4><ul>${improvements.slice(0,3).map(s=>`<li>${s}</li>`).join('')}</ul>`;

  const tips = {
    dsa:['Practise 2 LeetCode mediums every day','Think out loud — explain every step','Always mention Big-O complexity'],
    system:['Study real architectures: Netflix, Uber, WhatsApp','Read "Designing Data-Intensive Applications"','Draw diagrams when explaining'],
    hr:['Record yourself and review your delivery','Prepare 10+ STAR stories','Research company culture deeply'],
    full:['Build and deploy a full-stack project','Practise both DSA and system design together','Contribute to open source']
  };
  const tipList = tips[S.type] || tips.dsa;
  document.getElementById('rp-tips').innerHTML = `<h4>🎯 Improvement Plan</h4><ul>${tipList.map(t=>`<li>${t}</li>`).join('')}</ul>`;
}

window.restartInterview = function() {
  S.synth?.cancel(); clearInterval(S.timerInterval);
  S.scores=[]; S.spokenAnswers=[]; S.current=0;
  document.getElementById('screen-results').style.display='none';
  document.getElementById('screen-setup').style.display='block';
};

// ===== UTILS =====
function shuffle(arr) { return arr.sort(()=>Math.random()-.5); }
function cap(s) { return s ? s[0].toUpperCase()+s.slice(1) : ''; }
window.speechSynthesis?.addEventListener?.('voiceschanged', ()=>window.speechSynthesis.getVoices());
