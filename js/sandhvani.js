/**
 * SANDHVANI '26 - Main JavaScript
 * MUONS Media Competition
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
 * Throttle function for performance optimization
 */
function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function () {
  
  // Initialize navigation
  initNavigation();
  
  // Initialize animations
  initHeroParticles();
  initCategoriesBackground();
  initRegisterBackground();
  
  // Initialize back to top button
  initBackToTop();
  
  // Initialize form
  initRegistrationForm();
  
  // Initialize smooth scroll
  initSmoothScroll();
  
  // Initialize scroll animations
  initScrollAnimations();
  
  console.log('🎬 Sandhvani \'26 Website Loaded Successfully');
});

// ===================================
// NAVIGATION
// ===================================

function initNavigation() {
  const nav = document.querySelector('.sandhvani-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-menu a');
  
  if (!nav) return;
  
  // Scroll effect
  const handleScroll = throttle(() => {
    if (window.scrollY > 100) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, 100);
  
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

// ===================================
// HERO PARTICLES ANIMATION
// ===================================

function initHeroParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  
  // Particle class
  class Particle {
    constructor() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
      this.opacity = Math.random() * 0.5 + 0.3;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      // Wrap around edges
      if (this.x < 0) this.x = w;
      if (this.x > w) this.x = 0;
      if (this.y < 0) this.y = h;
      if (this.y > h) this.y = 0;
    }
    
    draw() {
      ctx.fillStyle = `rgba(255, 0, 110, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Resize canvas
  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  
  // Initialize particles
  function init() {
    resize();
    particles = [];
    const particleCount = Math.min(Math.floor((w * h) / 15000), 100);
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }
  
  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, w, h);
    
    // Update and draw particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          ctx.strokeStyle = `rgba(255, 0, 110, ${0.2 * (1 - dist / 150)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    
    requestAnimationFrame(animate);
  }
  
  // Event listeners
  window.addEventListener('resize', debounce(resize, 100));
  
  // Start
  init();
  animate();
}

// ===================================
// CATEGORIES BACKGROUND ANIMATION
// ===================================

function initCategoriesBackground() {
  const canvas = document.getElementById('categories-bg');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let w, h;
  let time = 0;
  
  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  
  function drawWave(offset, amplitude, frequency, color, alpha) {
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    
    for (let x = 0; x < w; x++) {
      const y = h / 2 + Math.sin((x + offset) * frequency) * amplitude;
      ctx.lineTo(x, y);
    }
    
    ctx.strokeStyle = `rgba(${color}, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  function animate() {
    ctx.clearRect(0, 0, w, h);
    
    time += 0.5;
    
    // Draw multiple waves
    drawWave(time * 0.5, 30, 0.01, '255, 0, 110', 0.3);
    drawWave(time * 0.7, 40, 0.008, '131, 56, 236', 0.2);
    drawWave(time * 0.3, 25, 0.012, '58, 134, 255', 0.25);
    
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', debounce(resize, 100));
  
  resize();
  animate();
}

// ===================================
// REGISTER BACKGROUND ANIMATION
// ===================================

function initRegisterBackground() {
  const canvas = document.getElementById('register-bg');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let w, h, orbs = [];
  
  class Orb {
    constructor() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.radius = Math.random() * 80 + 40;
      this.hue = Math.random() * 60 + 300; // Purple to pink range
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      
      if (this.x < -this.radius) this.x = w + this.radius;
      if (this.x > w + this.radius) this.x = -this.radius;
      if (this.y < -this.radius) this.y = h + this.radius;
      if (this.y > h + this.radius) this.y = -this.radius;
    }
    
    draw() {
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius
      );
      gradient.addColorStop(0, `hsla(${this.hue}, 100%, 50%, 0.15)`);
      gradient.addColorStop(1, `hsla(${this.hue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  
  function init() {
    resize();
    orbs = [];
    for (let i = 0; i < 6; i++) {
      orbs.push(new Orb());
    }
  }
  
  function animate() {
    ctx.clearRect(0, 0, w, h);
    
    orbs.forEach(orb => {
      orb.update();
      orb.draw();
    });
    
    requestAnimationFrame(animate);
  }
  
  window.addEventListener('resize', debounce(resize, 100));
  
  init();
  animate();
}

// ===================================
// BACK TO TOP BUTTON
// ===================================

function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  
  if (!backToTopBtn) return;
  
  const toggleBackToTop = throttle(() => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  }, 100);
  
  window.addEventListener('scroll', toggleBackToTop);
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ===================================
// REGISTRATION FORM
// ===================================

function initRegistrationForm() {
  const form = document.getElementById('registerForm');
  
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing...</span>';
    
    // Simulate API call (replace with actual API endpoint)
    setTimeout(() => {
      console.log('Form Data:', data);
      
      // Show success message
      showNotification('Success! We\'ll notify you when registration opens.', 'success');
      
      // Reset form
      form.reset();
      
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }, 2000);
  });
  
  // Add input validation animations
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      if (this.value.trim() !== '') {
        this.classList.add('filled');
      } else {
        this.classList.remove('filled');
      }
    });
  });
}

// ===================================
// NOTIFICATION SYSTEM
// ===================================

function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'linear-gradient(135deg, #ff006e, #d90058)'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
    max-width: 300px;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Add animation styles if not already present
  if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// ===================================
// SMOOTH SCROLL
// ===================================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      
      if (href === '#') return;
      
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        const offsetTop = target.getBoundingClientRect().top + window.pageYOffset - 80;
        
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ===================================
// SCROLL ANIMATIONS
// ===================================

function initScrollAnimations() {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        
        // Stagger child animations if present
        const children = entry.target.querySelectorAll('.stagger-item');
        children.forEach((child, index) => {
          setTimeout(() => {
            child.classList.add('animate-in');
          }, index * 100);
        });
      }
    });
  }, observerOptions);
  
  // Observe elements
  document.querySelectorAll('.category-card, .feature-item, .timeline-item').forEach(el => {
    el.classList.add('fade-up');
    observer.observe(el);
  });
  
  // Add CSS for animations if not present
  if (!document.getElementById('scroll-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'scroll-animation-styles';
    style.textContent = `
      .fade-up {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
      }
      .fade-up.animate-in {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }
}

// ===================================
// PERFORMANCE MONITORING
// ===================================

// Log performance metrics (development only)
if (window.performance && console.table) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType("navigation")[0];
      if (perfData) {
        console.table({
          'DNS Lookup': `${Math.round(perfData.domainLookupEnd - perfData.domainLookupStart)}ms`,
          'TCP Connection': `${Math.round(perfData.connectEnd - perfData.connectStart)}ms`,
          'Request Time': `${Math.round(perfData.responseStart - perfData.requestStart)}ms`,
          'Response Time': `${Math.round(perfData.responseEnd - perfData.responseStart)}ms`,
          'DOM Processing': `${Math.round(perfData.domComplete - perfData.domLoading)}ms`,
          'Total Load Time': `${Math.round(perfData.loadEventEnd - perfData.fetchStart)}ms`
        });
      }
    }, 0);
  });
}

// ===================================
// EASTER EGGS & FUN INTERACTIONS
// ===================================

// Konami Code Easter Egg
(function() {
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;
  
  document.addEventListener('keydown', (e) => {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        activateEasterEgg();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });
  
  function activateEasterEgg() {
    showNotification('🎉 Sandhvani Mode Activated! You found the secret!', 'success');
    document.body.style.animation = 'rainbow 5s linear';
    
    setTimeout(() => {
      document.body.style.animation = '';
    }, 5000);
    
    // Add rainbow animation
    if (!document.getElementById('easter-egg-styles')) {
      const style = document.createElement('style');
      style.id = 'easter-egg-styles';
      style.textContent = `
        @keyframes rainbow {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }
})();

// Mouse trail effect (optional - can be resource intensive)
let mouseTrailEnabled = false;

function initMouseTrail() {
  if (mouseTrailEnabled) return;
  mouseTrailEnabled = true;
  
  let particles = [];
  let animationFrame;
  
  class TrailParticle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 3 + 1;
      this.speedX = Math.random() * 2 - 1;
      this.speedY = Math.random() * 2 - 1;
      this.life = 1;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= 0.02;
    }
  }
  
  document.addEventListener('mousemove', (e) => {
    particles.push(new TrailParticle(e.clientX, e.clientY));
    
    if (particles.length > 20) {
      particles.shift();
    }
  });
  
  function animateParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.update());
    
    animationFrame = requestAnimationFrame(animateParticles);
  }
  
  animateParticles();
}

// Uncomment to enable mouse trail
// initMouseTrail();