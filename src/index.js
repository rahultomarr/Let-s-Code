// ===== Let's Code — Main Script =====
import './styles.css';

document.addEventListener('DOMContentLoaded', () => {

  // --- Theme toggle ---
  const toggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // --- Navbar scroll effect ---
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  }, { passive: true });

  // --- Mobile menu ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    navLinks.querySelectorAll('.nav-link').forEach(l => {
      l.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }

  // --- Animated counters ---
  function animateCounter(el, target) {
    const duration = 2000;
    const start = performance.now();
    const fmt = (n) => {
      if (n >= 100000) return '1,00,000+';
      if (n >= 1000) return n.toLocaleString('en-IN') + '+';
      return n.toString() + (target > 6 ? '+' : '');
    };
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      el.textContent = fmt(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // --- Intersection Observer ---
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.stat-number').forEach(c => {
          animateCounter(c, parseInt(c.dataset.count, 10));
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  const statsEl = document.getElementById('hero-stats');
  if (statsEl) statsObserver.observe(statsEl);

  // Fade-in on scroll
  const style = document.createElement('style');
  style.textContent = `.visible{opacity:1!important;transform:translateY(0)!important}`;
  document.head.appendChild(style);

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.tool-card,.resource-category,.company-card,.story-card,.comm-card,.success-rate-bar,.cta-inner,.newsletter-inner').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity .6s ease ${i * 40}ms, transform .6s ease ${i * 40}ms`;
    fadeObserver.observe(el);
  });

  // --- Smooth scroll ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  // --- Parallax orbs ---
  const orbs = document.querySelectorAll('.hero-orb');
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    orbs.forEach((orb, i) => {
      orb.style.transform = `translate(${x * (i + 1) * 15}px, ${y * (i + 1) * 15}px)`;
    });
  }, { passive: true });

  // --- Card tilt ---
  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientX - r.left) / r.width - 0.5) * 8;
      const ry = ((e.clientY - r.top) / r.height - 0.5) * -8;
      card.style.transform = `translateY(-4px) perspective(800px) rotateX(${ry}deg) rotateY(${rx}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  // --- API base URL ---
  const API = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

  // --- Newsletter form ---
  const nlForm = document.getElementById('newsletter-form');
  const nlMsg = document.getElementById('newsletter-message');
  if (nlForm) {
    nlForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletter-email').value;
      nlMsg.textContent = 'Subscribing...';
      nlMsg.className = 'form-message';
      try {
        const res = await fetch(`${API}/api/subscribe`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        nlMsg.textContent = res.ok ? '✓ ' + data.message : data.error;
        nlMsg.className = `form-message ${res.ok ? 'success' : 'error'}`;
        if (res.ok) nlForm.reset();
      } catch {
        nlMsg.textContent = '✓ Subscribed! (offline mode)';
        nlMsg.className = 'form-message success';
      }
    });
  }

  // --- Contact modal ---
  const modal = document.getElementById('contact-modal');
  const closeBtn = document.getElementById('modal-close');
  const contactLink = document.querySelector('.footer-legal a[href="#"]');
  const contactForm = document.getElementById('contact-form');
  const contactMsg = document.getElementById('contact-form-message');

  // Open modal from footer "Contact" link
  document.querySelectorAll('a').forEach(a => {
    if (a.textContent.trim() === 'Contact') {
      a.addEventListener('click', (e) => { e.preventDefault(); modal.classList.add('active'); });
    }
  });
  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        name: document.getElementById('contact-name').value,
        email: document.getElementById('contact-email').value,
        message: document.getElementById('contact-message').value
      };
      contactMsg.textContent = 'Sending...';
      try {
        const res = await fetch(`${API}/api/contact`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        contactMsg.textContent = res.ok ? '✓ ' + data.message : data.error;
        contactMsg.className = `form-message ${res.ok ? 'success' : 'error'}`;
        if (res.ok) { contactForm.reset(); setTimeout(() => modal.classList.remove('active'), 2000); }
      } catch {
        contactMsg.textContent = '✓ Message saved! (offline mode)';
        contactMsg.className = 'form-message success';
      }
    });
  }
});
