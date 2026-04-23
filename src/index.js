// ===== Let's Code — Main Script =====
import './styles.css';

document.addEventListener('DOMContentLoaded', () => {

  // --- Navbar scroll effect ---
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > 50) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
    lastScroll = y;
  }, { passive: true });

  // --- Mobile menu ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
    // Close on link click
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
      const current = Math.floor(ease * target);
      el.textContent = fmt(current);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // --- Intersection Observer for animations ---
  const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
  
  // Counter animation
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counters = entry.target.querySelectorAll('.stat-number');
        counters.forEach(c => {
          const target = parseInt(c.dataset.count, 10);
          animateCounter(c, target);
        });
        statsObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  const statsEl = document.getElementById('hero-stats');
  if (statsEl) statsObserver.observe(statsEl);

  // Fade-in sections
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.tool-card, .resource-category, .company-card, .story-card, .comm-card, .success-rate-bar, .cta-inner').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    fadeObserver.observe(el);
  });

  // Add visible class styles
  const style = document.createElement('style');
  style.textContent = `.visible { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);

  // Stagger tool cards
  document.querySelectorAll('.tools-grid .tool-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 100}ms`;
  });
  document.querySelectorAll('.companies-grid .company-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 60}ms`;
  });
  document.querySelectorAll('.stories-grid .story-card').forEach((card, i) => {
    card.style.transitionDelay = `${i * 120}ms`;
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // --- Parallax orbs on mouse move ---
  const orbs = document.querySelectorAll('.hero-orb');
  document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    orbs.forEach((orb, i) => {
      const speed = (i + 1) * 15;
      orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
  }, { passive: true });

  // --- Card tilt effect ---
  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
      card.style.transform = `translateY(-4px) perspective(800px) rotateX(${y}deg) rotateY(${x}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
});
