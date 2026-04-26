import './resume-builder.css';

// ===== THEME =====
const saved = localStorage.getItem('theme');
if (saved) document.documentElement.setAttribute('data-theme', saved);
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('theme-toggle').textContent = next === 'light' ? '🌙' : '☀️';
});

// ===== 8 LATEX TEMPLATES =====
export const TEMPLATES = [
  {
    id: 'jakes',
    name: "Jake's Resume",
    desc: 'Most popular on Overleaf. Clean two-column header with bold section titles.',
    cat: 'classic',
    tags: ['Popular','Two-col header','ATS Friendly'],
    class: '',
    tex: `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[margin=1in]{geometry}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{Jake Ryan}} \\\\
  \\vspace{4pt}
  \\small +1-123-456-7890 $|$ \\href{mailto:jake@email.com}{jake@email.com} $|$
  \\href{https://linkedin.com/in/jake}{linkedin.com/in/jake} $|$
  \\href{https://github.com/jake}{github.com/jake}
\\end{center}

\\section{Education}
  \\resumeSubheading
    {Southwestern University}{Georgetown, TX}
    {Bachelor of Arts in Computer Science, Minor in Business}{Aug 2018 -- May 2021}

\\section{Experience}
  \\resumeSubheading
    {Software Engineer Intern}{May 2020 -- August 2020}
    {Startup, LLC}{San Francisco, CA}
    \\resumeItemListStart
      \\resumeItem{Developed a REST API serving 10,000+ daily active users using Node.js}
      \\resumeItem{Reduced database query time by 40\\% through indexing and caching strategies}
      \\resumeItem{Collaborated with cross-functional teams to deliver features 2 weeks ahead of schedule}
    \\resumeItemListEnd

  \\resumeSubheading
    {Software Developer}{Jan 2020 -- Present}
    {XYZ Corp}{Austin, TX}
    \\resumeItemListStart
      \\resumeItem{Architected microservices architecture reducing system latency by 35\\%}
      \\resumeItem{Led a team of 4 engineers to deliver a real-time dashboard using React and WebSockets}
    \\resumeItemListEnd

\\section{Projects}
  \\resumeProjectHeading
    {\\textbf{CodeCollab} $|$ \\emph{React, Node.js, WebSockets}}{2023}
    \\resumeItemListStart
      \\resumeItem{Built a real-time collaborative code editor with 200+ GitHub stars}
      \\resumeItem{Implemented OT algorithm for conflict-free simultaneous editing}
    \\resumeItemListEnd

  \\resumeProjectHeading
    {\\textbf{SmartResume AI} $|$ \\emph{Python, Flask, OpenAI API}}{2022}
    \\resumeItemListStart
      \\resumeItem{AI-powered resume builder generating ATS-optimised resumes in 30 seconds}
    \\resumeItemListEnd

\\section{Technical Skills}
  \\resumeSkill{Languages}{JavaScript, TypeScript, Python, Java, C++, SQL}
  \\resumeSkill{Frameworks}{React, Node.js, Express, Spring Boot, Flask}
  \\resumeSkill{DevOps}{Docker, Kubernetes, AWS, GitHub Actions, Linux}
  \\resumeSkill{Databases}{PostgreSQL, MongoDB, Redis, DynamoDB}

\\end{document}`
  },
  {
    id: 'modern',
    name: 'Modern Blue',
    desc: 'Contemporary design with a blue accent header and clean section dividers.',
    cat: 'modern',
    tags: ['Modern','Coloured','ATS Friendly'],
    class: 'tmpl-modern',
    tex: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0.75in]{geometry}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{Alex Johnson}} \\\\
  \\vspace{4pt}
  \\small +1-555-987-6543 $|$ \\href{mailto:alex@email.com}{alex@email.com} $|$
  \\href{https://linkedin.com/in/alexj}{linkedin.com/in/alexj} $|$
  \\href{https://github.com/alexj}{github.com/alexj}
\\end{center}

\\section{Summary}
Results-driven Software Engineer with 3+ years building scalable web applications. Expertise in full-stack development, cloud architecture, and agile methodologies. Passionate about clean code and impactful products.

\\section{Experience}
  \\resumeSubheading
    {Senior Frontend Engineer}{March 2022 -- Present}
    {TechCorp Inc.}{San Francisco, CA}
    \\resumeItemListStart
      \\resumeItem{Led migration from React Class to Hooks, reducing bundle size by 28\\%}
      \\resumeItem{Mentored 3 junior developers and conducted weekly code reviews}
      \\resumeItem{Built design system adopted across 6 product teams}
    \\resumeItemListEnd

\\section{Education}
  \\resumeSubheading
    {University of California, Berkeley}{Berkeley, CA}
    {B.S. Electrical Engineering and Computer Science}{2019}

\\section{Skills}
  \\resumeSkill{Frontend}{React, Next.js, TypeScript, Tailwind CSS, GraphQL}
  \\resumeSkill{Backend}{Node.js, Python, Go, REST APIs, gRPC}
  \\resumeSkill{Cloud}{AWS (EC2, S3, Lambda), GCP, Docker, Terraform}

\\end{document}`
  },
  {
    id: 'minimal',
    name: 'Ultra Minimal',
    desc: 'Clean whitespace-driven layout. Lets your content speak for itself.',
    cat: 'minimal',
    tags: ['Minimal','Clean','Elegant'],
    class: 'tmpl-minimal',
    tex: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=1in]{geometry}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{Sarah Chen}} \\\\
  \\vspace{6pt}
  \\small sarah@email.com $|$ +1-444-333-2211 $|$ github.com/sarahchen
\\end{center}

\\section{Experience}
  \\resumeSubheading
    {Full Stack Engineer}{2022 -- Present}
    {Stripe}{Remote}
    \\resumeItemListStart
      \\resumeItem{Built payment reconciliation system handling \\$2M daily transactions}
      \\resumeItem{Reduced API latency by 60\\% through caching and query optimisation}
    \\resumeItemListEnd

  \\resumeSubheading
    {Software Engineer}{2020 -- 2022}
    {Figma}{San Francisco, CA}
    \\resumeItemListStart
      \\resumeItem{Implemented real-time multiplayer sync for 1M+ concurrent users}
    \\resumeItemListEnd

\\section{Education}
  \\resumeSubheading
    {MIT}{Cambridge, MA}
    {B.S. Computer Science}{2020}

\\section{Skills}
  \\resumeSkill{Core}{TypeScript, Rust, Go, Python}
  \\resumeSkill{Infrastructure}{AWS, Kubernetes, PostgreSQL, Redis}

\\end{document}`
  },
  {
    id: 'creative',
    name: 'Creative Gradient',
    desc: 'Bold gradient name with purple accents. Great for design/frontend roles.',
    cat: 'creative',
    tags: ['Creative','Bold','Frontend'],
    class: 'tmpl-creative',
    tex: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0.8in]{geometry}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{Maya Patel}} \\\\
  \\vspace{4pt}
  \\small \\href{mailto:maya@design.io}{maya@design.io} $|$
  \\href{https://maya.design}{maya.design} $|$
  \\href{https://github.com/mayap}{github.com/mayap}
\\end{center}

\\section{About}
Creative Frontend Engineer blending design sensibility with technical excellence. Shipped products used by 5M+ users across fintech and consumer apps.

\\section{Experience}
  \\resumeSubheading
    {Lead Frontend Engineer}{2023 -- Present}
    {Notion}{San Francisco, CA}
    \\resumeItemListStart
      \\resumeItem{Re-architected editor rendering pipeline, cutting paint time by 45\\%}
      \\resumeItem{Built accessibility layer achieving WCAG 2.1 AA compliance}
      \\resumeItem{Open-sourced block editor used by 300+ developers}
    \\resumeItemListEnd

\\section{Projects}
  \\resumeProjectHeading
    {\\textbf{Aurora UI} $|$ \\emph{React, CSS, Storybook}}{2023}
    \\resumeItemListStart
      \\resumeItem{Component library with 50+ components, 1.2k GitHub stars}
    \\resumeItemListEnd

\\section{Skills}
  \\resumeSkill{Design}{Figma, Framer, Adobe XD, Motion Design}
  \\resumeSkill{Code}{React, TypeScript, CSS-in-JS, WebGL, Three.js}
  \\resumeSkill{Tools}{Storybook, Jest, Playwright, Vercel}

\\end{document}`
  },
  {
    id: 'tech',
    name: 'Tech / Dev',
    desc: 'Monospace name, green accents — made for developers and engineers.',
    cat: 'modern',
    tags: ['Tech','Developer','Green'],
    class: 'tmpl-tech',
    tex: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0.9in]{geometry}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{Rahul Tomar}} \\\\
  \\vspace{4pt}
  \\small rahul@email.com $|$ +91-98765-43210 $|$
  github.com/rahul $|$ linkedin.com/in/rahul
\\end{center}

\\section{Education}
  \\resumeSubheading
    {IIT Delhi}{New Delhi, India}
    {B.Tech Computer Science Engineering — CGPA: 8.6/10}{2024}

\\section{Experience}
  \\resumeSubheading
    {SDE Intern}{May 2023 -- Aug 2023}
    {Amazon}{Bangalore, India}
    \\resumeItemListStart
      \\resumeItem{Built internal tool reducing manual ops effort by 70\\% using AWS Lambda + DynamoDB}
      \\resumeItem{Optimised CI/CD pipeline reducing deployment time from 40min to 8min}
      \\resumeItem{Resolved 15+ high-priority tickets in first month; rated top intern cohort}
    \\resumeItemListEnd

\\section{Projects}
  \\resumeProjectHeading
    {\\textbf{AlgoViz} $|$ \\emph{React, D3.js, Python}}{2023}
    \\resumeItemListStart
      \\resumeItem{Algorithm visualiser with 20+ algorithms, 500 daily users}
    \\resumeItemListEnd

  \\resumeProjectHeading
    {\\textbf{DevBoard} $|$ \\emph{Next.js, Prisma, PostgreSQL}}{2022}
    \\resumeItemListStart
      \\resumeItem{Developer productivity dashboard tracking 10 metrics in real-time}
    \\resumeItemListEnd

\\section{Achievements}
  \\resumeItemListStart
    \\resumeItem{LeetCode: 1780 rating (Knight badge) — 350+ problems solved}
    \\resumeItem{Winner — Smart India Hackathon 2023 (10,000+ participants)}
    \\resumeItem{Google Summer of Code 2023 contributor — 3 PRs merged}
  \\resumeItemListEnd

\\section{Technical Skills}
  \\resumeSkill{Languages}{Java, Python, JavaScript, TypeScript, C++, Go}
  \\resumeSkill{Frameworks}{React, Spring Boot, Node.js, FastAPI}
  \\resumeSkill{Cloud/DevOps}{AWS, Docker, Kubernetes, Terraform, GitHub Actions}
  \\resumeSkill{DSA}{Trees, Graphs, DP, Segment Trees, Trie}

\\end{document}`
  },
  {
    id: 'executive',
    name: 'Executive',
    desc: 'Serif fonts, formal layout for senior/leadership roles.',
    cat: 'classic',
    tags: ['Executive','Senior','Formal'],
    class: 'tmpl-executive',
    tex: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=1in]{geometry}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{David Mitchell}} \\\\
  \\vspace{6pt}
  \\small VP of Engineering $|$ david@email.com $|$ +1-212-555-0100 $|$ linkedin.com/in/davidm
\\end{center}

\\section{Professional Summary}
Accomplished technology leader with 12+ years building and scaling engineering organisations. Delivered \\$50M+ in product revenue through strategic technical leadership at Series B through IPO stages.

\\section{Experience}
  \\resumeSubheading
    {VP of Engineering}{2021 -- Present}
    {FinTech Scale-up (Series C, \\$200M ARR)}{New York, NY}
    \\resumeItemListStart
      \\resumeItem{Scaled engineering team from 18 to 85 engineers across 6 countries}
      \\resumeItem{Reduced infrastructure costs by 40\\% (\\$2.4M annually) via cloud optimisation}
      \\resumeItem{Delivered core platform rewrite enabling 10x throughput without downtime}
    \\resumeItemListEnd

  \\resumeSubheading
    {Director of Engineering}{2018 -- 2021}
    {Acme Corp}{San Francisco, CA}
    \\resumeItemListStart
      \\resumeItem{Led 3 platform migrations with zero production incidents}
      \\resumeItem{Established engineering culture driving eNPS from 28 to 67}
    \\resumeItemListEnd

\\section{Education}
  \\resumeSubheading
    {Stanford University}{Stanford, CA}
    {M.S. Computer Science}{2012}

\\section{Core Competencies}
  \\resumeSkill{Leadership}{Team Building, OKRs, Hiring, Mentorship, Performance Management}
  \\resumeSkill{Technical}{System Design, Cloud Architecture, Platform Engineering}
  \\resumeSkill{Business}{P\\&L Ownership, Stakeholder Management, Board Presentations}

\\end{document}`
  },
  {
    id: 'academic',
    name: 'Academic / Research',
    desc: 'Designed for researchers and academics with publications section.',
    cat: 'classic',
    tags: ['Academic','Research','PhD'],
    class: 'tmpl-academic',
    tex: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=1in]{geometry}

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{Dr. Priya Sharma}} \\\\
  \\vspace{4pt}
  \\small priya@university.edu $|$ scholar.google.com/priya $|$ +1-617-555-0199
\\end{center}

\\section{Research Interests}
Machine Learning, Natural Language Processing, Reinforcement Learning, AI Safety

\\section{Education}
  \\resumeSubheading
    {Massachusetts Institute of Technology}{Cambridge, MA}
    {Ph.D. Computer Science — Advisor: Prof. J. Smith}{2019 -- 2024}

  \\resumeSubheading
    {IIT Bombay}{Mumbai, India}
    {B.Tech Computer Science — CPI: 9.7/10}{2015 -- 2019}

\\section{Publications}
  \\resumeItemListStart
    \\resumeItem{\\textbf{Sharma P.} et al. "Efficient Attention Mechanisms for Long-Context LLMs." \\textit{NeurIPS 2024} (Oral, top 0.5\\%)}
    \\resumeItem{\\textbf{Sharma P.}, Smith J. "Reward Shaping for Safe RL." \\textit{ICML 2023}}
    \\resumeItem{\\textbf{Sharma P.} et al. "Cross-lingual Transfer with Minimal Supervision." \\textit{ACL 2022}}
  \\resumeItemListEnd

\\section{Research Experience}
  \\resumeSubheading
    {Research Intern}{Summer 2023}
    {Google DeepMind}{London, UK}
    \\resumeItemListStart
      \\resumeItem{Developed novel attention mechanism reducing compute by 3x on long-context tasks}
    \\resumeItemListEnd

\\section{Awards}
  \\resumeItemListStart
    \\resumeItem{NSF Graduate Research Fellowship (2020)}
    \\resumeItem{Best Paper Award — EMNLP 2023}
  \\resumeItemListEnd

\\section{Skills}
  \\resumeSkill{ML Frameworks}{PyTorch, JAX, HuggingFace, TensorFlow}
  \\resumeSkill{Languages}{Python, C++, Julia, CUDA}

\\end{document}`
  },
  {
    id: 'sidebar',
    name: 'Two-Column Sidebar',
    desc: 'Navy sidebar with contact + skills. Main area for experience.',
    cat: 'creative',
    tags: ['Two-Column','Sidebar','Bold'],
    class: 'tmpl-sidebar',
    tex: `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0in]{geometry}

\\begin{document}

% Sidebar
\\begin{sidebar}
  {\\Large \\textbf{Chris Lee}} \\\\
  \\vspace{8pt}
  \\href{mailto:chris@email.com}{chris@email.com} \\\\
  +1-310-555-0177 \\\\
  github.com/chrislee \\\\
  \\vspace{16pt}
  \\textbf{SKILLS} \\\\
  React $\\cdot$ TypeScript \\\\
  Node.js $\\cdot$ Python \\\\
  AWS $\\cdot$ Docker \\\\
  PostgreSQL $\\cdot$ Redis \\\\
  \\vspace{16pt}
  \\textbf{LANGUAGES} \\\\
  English (Native) \\\\
  Mandarin (Fluent) \\\\
  \\vspace{16pt}
  \\textbf{EDUCATION} \\\\
  UCLA \\\\
  B.S. CS, 2020
\\end{sidebar}

% Main content
\\section{Experience}
  \\resumeSubheading
    {Full Stack Engineer}{2021 -- Present}
    {Netflix}{Los Angeles, CA}
    \\resumeItemListStart
      \\resumeItem{Built A/B testing platform running 200+ concurrent experiments}
      \\resumeItem{Improved recommendation latency by 50ms (p99) via caching overhaul}
      \\resumeItem{Reduced frontend bundle by 35\\% using code splitting and lazy loading}
    \\resumeItemListEnd

  \\resumeSubheading
    {Software Engineer}{2020 -- 2021}
    {Shopify}{Remote}
    \\resumeItemListStart
      \\resumeItem{Developed checkout flow handling 100K+ concurrent sessions on peak days}
    \\resumeItemListEnd

\\section{Projects}
  \\resumeProjectHeading
    {\\textbf{OpenMetrics} $|$ \\emph{Go, Prometheus, Grafana}}{2022}
    \\resumeItemListStart
      \\resumeItem{Open-source metrics aggregator, 2.1k GitHub stars, 80+ contributors}
    \\resumeItemListEnd

\\end{document}`
  }
];
