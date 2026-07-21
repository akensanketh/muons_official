/**
 * MUONS - Main JavaScript
 * Designed & Developed by Aken Sanketh
 */

// ---------- Utilities ----------
function debounce(fn, wait = 100) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function throttle(fn, limit = 100) {
  let inThrottle = false;
  return (...args) => {
    if (inThrottle) return;
    inThrottle = true;
    fn(...args);
    setTimeout(() => (inThrottle = false), limit);
  };
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  updateCopyrightYear();
  initMainNavigation();
  initTeamCardHide();
  initBackToTop();
  initSmoothScroll();

  initAuroraCanvas();
  initNetworkCanvas();
});

// ---------- Year ----------
function updateCopyrightYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// ---------- Navigation ----------
function initMainNavigation() {
  const nav = document.getElementById("mainNav");
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  if (!nav || !toggle || !menu) return;

  // scrolled shadow
  window.addEventListener(
    "scroll",
    throttle(() => {
      nav.classList.toggle("scrolled", window.scrollY > 100);
    }, 100)
  );

  // toggle mobile menu
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("active");
    toggle.setAttribute("aria-expanded", String(isOpen));

    const spans = toggle.querySelectorAll("span");
    if (isOpen) {
      spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
      spans[1].style.opacity = "0";
      spans[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
    } else {
      spans[0].style.transform = "";
      spans[1].style.opacity = "";
      spans[2].style.transform = "";
    }
  });

  // close after click
  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      menu.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
      const spans = toggle.querySelectorAll("span");
      spans[0].style.transform = "";
      spans[1].style.opacity = "";
      spans[2].style.transform = "";
    });
  });
}

// ---------- Team card hide ----------
function initTeamCardHide() {
  const card = document.getElementById("muons-team-card");
  const btn = document.getElementById("muons-team-card-hide");
  if (!card || !btn) return;

  btn.addEventListener("click", () => {
    card.classList.add("is-hiding");
    setTimeout(() => {
      card.style.display = "none";
    }, 350);
  });
}

// ---------- Back to top ----------
function initBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  window.addEventListener(
    "scroll",
    throttle(() => {
      btn.classList.toggle("show", window.scrollY > 300);
    }, 100)
  );

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ---------- Smooth scroll ----------
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const navH = 70;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;

      window.scrollTo({ top, behavior: "smooth" });
    });
  });
}

// ---------- Canvas: Aurora ----------
function initAuroraCanvas() {
  const canvas = document.getElementById("mcj-aurora");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w = 0, h = 0;
  let particles = [];

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }

  function Particle() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.r = Math.random() * 60 + 40;
    this.g = Math.floor(Math.random() * 100 + 150);
  }

  function init() {
    resize();
    particles = [];
    for (let i = 0; i < 8; i++) particles.push(new Particle());
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -p.r) p.x = w + p.r;
      if (p.x > w + p.r) p.x = -p.r;
      if (p.y < -p.r) p.y = h + p.r;
      if (p.y > h + p.r) p.y = -p.r;

      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(0, ${p.g}, 255, 0.15)`);
      grad.addColorStop(1, "rgba(0, 170, 255, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", debounce(() => {
    resize();
  }, 150));

  init();
  draw();
}

// ---------- Canvas: Network ----------
function initNetworkCanvas() {
  const canvas = document.getElementById("mcj-net");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w = 0, h = 0;
  let nodes = [];

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }

  function Node() {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
  }

  function init() {
    resize();
    nodes = [];
    for (let i = 0; i < 40; i++) nodes.push(new Node());
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;

      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;

      ctx.fillStyle = "rgba(0, 170, 255, 0.4)";
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        const dx = m.x - n.x;
        const dy = m.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.strokeStyle = `rgba(0, 170, 255, ${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", debounce(() => {
    resize();
  }, 150));

  init();
  draw();
}