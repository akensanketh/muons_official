/**
 * MUONS - Main JavaScript
 * Designed & Developed by Aken Sanketh
 */

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * Debounce function to limit how often a function can fire
 */
function debounce(func, wait = 10) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function () {
  
  // Update copyright year
  updateCopyrightYear();
  
  // Initialize team card hide functionality
  initTeamCardHide();
  
  // Initialize back to top button
  initBackToTop();
  
  // Initialize canvas animations
  initAuroraCanvas();
  initNetworkCanvas();
  
  // Initialize smooth scroll for anchor links
  initSmoothScroll();
  
  console.log('🎬 MUONS Website Loaded Successfully');
});

// ===================================
// COPYRIGHT YEAR
// ===================================

function updateCopyrightYear() {
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}

// ===================================
// TEAM CARD HIDE FUNCTIONALITY
// ===================================

function initTeamCardHide() {
  const card = document.getElementById('muons-team-card');
  const btn = document.getElementById('muons-team-card-hide');
  
  if (!card || !btn) return;
  
  btn.addEventListener('click', function () {
    card.classList.add('is-hiding');
    
    setTimeout(() => {
      card.style.display = 'none';
      
      // Show a subtle notification (optional)
      console.log('Team card hidden');
    }, 350);
  });
}

// ===================================
// BACK TO TOP BUTTON
// ===================================

function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  
  if (!backToTopBtn) return;
  
  // Show/hide button based on scroll position
  const toggleBackToTop = debounce(() => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  }, 10);
  
  window.addEventListener('scroll', toggleBackToTop);
  
  // Scroll to top on click
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ===================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ===================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      // Ignore empty anchors
      if (href === '#') return;
      
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ===================================
// AURORA CANVAS ANIMATION
// ===================================

function initAuroraCanvas() {
  const canvas = document.getElementById('mcj-aurora');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  
  // Particle constructor
  function Particle() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.radius = Math.random() * 60 + 40;
    this.color = `rgba(0, ${Math.floor(Math.random() * 100 + 150)}, 255, 0.15)`;
  }
  
  Particle.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Wrap around edges
    if (this.x < -this.radius) this.x = w + this.radius;
    if (this.x > w + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = h + this.radius;
    if (this.y > h + this.radius) this.y = -this.radius;
  };
  
  // Resize canvas
  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  
  // Initialize particles
  function init() {
    resize();
    particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push(new Particle());
    }
  }
  
  // Animation loop
  function draw() {
    ctx.clearRect(0, 0, w, h);
    
    particles.forEach(p => {
      p.update();
      
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'rgba(0, 170, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    requestAnimationFrame(draw);
  }
  
  // Event listeners
  window.addEventListener('resize', debounce(resize, 100));
  
  // Start animation
  init();
  draw();
}

// ===================================
// NETWORK CANVAS ANIMATION
// ===================================

function initNetworkCanvas() {
  const canvas = document.getElementById('mcj-net');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let w, h, nodes = [];
  
  // Node constructor
  function Node() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
  }
  
  Node.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Bounce off edges
    if (this.x < 0 || this.x > w) this.vx *= -1;
    if (this.y < 0 || this.y > h) this.vy *= -1;
  };
  
  // Resize canvas
  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  
  // Initialize nodes
  function init() {
    resize();
    nodes = [];
    for (let i = 0; i < 40; i++) {
      nodes.push(new Node());
    }
  }
  
  // Animation loop
  function draw() {
    ctx.clearRect(0, 0, w, h);
    
    nodes.forEach((n, i) => {
      n.update();
      
      // Draw node
      ctx.fillStyle = 'rgba(0, 170, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw connections
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - n.x;
        const dy = nodes[j].y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 120) {
          ctx.strokeStyle = `rgba(0, 170, 255, ${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    });
    
    requestAnimationFrame(draw);
  }
  
  // Event listeners
  window.addEventListener('resize', debounce(resize, 100));
  
  // Start animation
  init();
  draw();
}

// ===================================
// LAZY LOADING IMAGES (Optional Enhancement)
// ===================================

if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
  });
}

// ===================================
// PERFORMANCE MONITORING (Development Only)
// ===================================

if (window.performance && console.table) {
  const perfData = window.performance.getEntriesByType("navigation")[0];
  console.table({
    'DNS Lookup': `${perfData.domainLookupEnd - perfData.domainLookupStart}ms`,
    'TCP Connection': `${perfData.connectEnd - perfData.connectStart}ms`,
    'Request Time': `${perfData.responseStart - perfData.requestStart}ms`,
    'Response Time': `${perfData.responseEnd - perfData.responseStart}ms`,
    'DOM Processing': `${perfData.domComplete - perfData.domLoading}ms`,
    'Total Load Time': `${perfData.loadEventEnd - perfData.fetchStart}ms`
  });
}


// Add this to the initialization section in main.js

// ===================================
// MAIN NAVIGATION
// ===================================

function initMainNavigation() {
  const nav = document.querySelector('.main-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu a');
  
  if (!nav) return;
  
  // Scroll effect
  const handleScroll = debounce(() => {
    if (window.scrollY > 100) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, 10);
  
  window.addEventListener('scroll', handleScroll);
  
  // Mobile menu toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
      
      // Animate hamburger
      const spans = navToggle.querySelectorAll('span');
      if (navMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
    
    // Close menu on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      });
    });
  }
}

// Add this function call to DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
  
  // Initialize main navigation
  initMainNavigation();
  
  // ... rest of your initialization code
});