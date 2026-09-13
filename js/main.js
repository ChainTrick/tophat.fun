/* ═══════════════════════════════════════════
   TopHat.fun — Main JavaScript
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  loadContent();
  initParticles();
  initNav();
  initScrollReveal();
  initBackToTop();
});

/* ── Load Content from JSON ── */
async function loadContent() {
  await loadCards('magicGrid', 'data/tricks.json', renderTrickCard);
  await loadCards('scienceGrid', 'data/science.json', renderScienceCard);
  await loadCards('factsGrid', 'data/facts.json', renderFactCard);
  await loadPuzzles();
  await loadHistory();
  await loadIllusions();
  await loadDailyFact();
}

/* ── Generic Card Loader ── */
async function loadCards(containerId, jsonPath, renderFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const response = await fetch(jsonPath);
    const data = await response.json();
    container.innerHTML = data.map(renderFn).join('');
    container.querySelectorAll('.card').forEach((card, i) => {
      card.style.animationDelay = `${i * 0.1}s`;
    });
  } catch (err) {
    console.warn(`Failed to load ${jsonPath}:`, err);
    container.innerHTML = '<p class="card-desc">Content loading...</p>';
  }
}

/* ── Card Renderers ── */
function renderTrickCard(trick) {
  return `
    <div class="card reveal">
      <span class="card-tag">${trick.category}</span>
      <h3 class="card-title">${trick.title}</h3>
      <p class="card-desc">${trick.description}</p>
      <div class="card-meta">
        <span>⚡ ${trick.difficulty}</span>
        <span>⏱ ${trick.timeNeeded}</span>
      </div>
    </div>
  `;
}

function renderScienceCard(science) {
  return `
    <div class="card reveal">
      <span class="card-tag">${science.category}</span>
      <h3 class="card-title">${science.title}</h3>
      <p class="card-desc">${science.description}</p>
      <div class="card-meta">
        <span>⚡ ${science.difficulty}</span>
        <span>🛡 ${science.safetyLevel}</span>
        <span>⏱ ${science.timeNeeded}</span>
      </div>
    </div>
  `;
}

function renderFactCard(fact) {
  return `
    <div class="card reveal">
      <span class="card-tag">${fact.category}</span>
      <h3 class="card-title">${fact.title}</h3>
      <p class="card-desc">${fact.body}</p>
      <div class="card-meta">
        <span>📚 ${fact.source}</span>
      </div>
    </div>
  `;
}

/* ── Puzzles ── */
async function loadPuzzles() {
  const container = document.getElementById('puzzlesGrid');
  if (!container) return;

  try {
    const response = await fetch('data/puzzles.json');
    const data = await response.json();
    container.innerHTML = data.map(puzzle => `
      <div class="card reveal">
        <span class="card-tag">${puzzle.category}</span>
        <h3 class="card-title">${puzzle.question}</h3>
        <div class="card-meta">
          <span>⚡ ${puzzle.difficulty}</span>
        </div>
      </div>
    `).join('');

    // Set daily puzzle
    const today = new Date();
    const idx = today.getDate() % data.length;
    const daily = data[idx];
    document.getElementById('puzzleQuestion').textContent = daily.question;
    document.getElementById('puzzleAnswer').textContent = daily.answer;
  } catch (err) {
    console.warn('Failed to load puzzles:', err);
  }
}

/* ── History Timeline ── */
async function loadHistory() {
  const container = document.getElementById('historyTimeline');
  if (!container) return;

  try {
    const response = await fetch('data/history.json');
    const data = await response.json();
    container.innerHTML = data.map(item => `
      <div class="timeline-item reveal">
        <div class="timeline-year">${item.year}</div>
        <h3 class="timeline-title">${item.title}</h3>
        <p class="timeline-desc">${item.description}</p>
      </div>
    `).join('');
  } catch (err) {
    console.warn('Failed to load history:', err);
  }
}

/* ── Illusions Library ── */
let currentIllusionFilter = 'all';
let currentIllusionSearch = '';

async function loadIllusions() {
  const container = document.getElementById('illusionsGrid');
  if (!container) return;

  try {
    let data;
    // Try fetch first (works on HTTP servers)
    try {
      const response = await fetch('data/illusions.json');
      data = await response.json();
    } catch (fetchErr) {
      // Fallback for file:// protocol — parse from HTML comment
      console.warn('fetch failed, using fallback:', fetchErr.message);
      data = loadIllusionsFromFallback();
    }
    renderIllusions(container, data);
    initIllusionFilters();
    initIllusionSearch();
  } catch (err) {
    console.warn('Failed to load illusions:', err);
    container.innerHTML = `<p class="card-desc" style="text-align:center; padding:2rem;">
      <p style="font-size:2rem; margin-bottom:0.5rem;">⚠️</p>
      <p>Content not available. Make sure the site is served via HTTP (not file://).</p>
      <p style="margin-top:1rem; font-size:0.8rem; color:var(--accent-light);">
        Run: <code style="background:rgba(255,255,255,0.05); padding:0.2rem 0.5rem; border-radius:4px;">python3 -m http.server 8080</code><br>
        Then open: <a href="http://localhost:8080" style="color:var(--accent-light);">http://localhost:8080</a>
      </p>
    </p>`;
  }
}

function loadIllusionsFromFallback() {
  // Parse the inline illusion data script directly from the DOM
  // This works even when the inline script hasn't executed yet
  const scripts = document.querySelectorAll('script');
  for (const script of scripts) {
    if (script.textContent && script.textContent.includes('window.__illusionsData')) {
      try {
        // Extract the JSON array from the inline script
        const match = script.textContent.match(/window\.__illusionsData\s*=\s*(\[.*?\]);\s*<\/script>/s);
        if (match) {
          return JSON.parse(match[1]);
        }
      } catch (e) {
        console.warn('Failed to parse inline illusions data:', e);
      }
    }
  }
  return [];
}

function renderIllusions(container, data) {
  // Filter by category
  let filtered = currentIllusionFilter === 'all'
    ? data
    : data.filter(item => item.category === currentIllusionFilter);

  // Filter by search
  if (currentIllusionSearch.trim()) {
    const q = currentIllusionSearch.toLowerCase();
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.author.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <p style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</p>
        <p>No illusions found matching your criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map((item, i) => `
    <div class="card illusion-card reveal" data-category="${item.category}">
      <span class="card-tag">${item.category}</span>
      <h3 class="card-title">${item.title}</h3>
      <p class="card-author">by ${item.author}</p>
      <p class="card-desc">${item.description}</p>
      <div class="card-footer">
        <span class="file-size">📄 ${item.size_mb} MB</span>
        <a class="download-btn" data-path="IllusionPlans/${item.filename}" data-filename="${item.filename}">
          <span>⬇</span> Download
        </a>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.illusion-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.1}s`;
  });

  // Attach download handlers to all download buttons
  container.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const path = btn.dataset.path;
      const filename = btn.dataset.filename;
      downloadFile(path, filename);
    });
  });
}

async function downloadFile(path, filename) {
  // Show toast
  const toast = document.createElement('div');
  toast.className = 'download-toast';
  toast.textContent = '⬇ Preparing download...';
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => toast.classList.remove('show'), 3000);
  setTimeout(() => toast.remove(), 3500);

  try {
    // Try fetch-based download first (works on HTTP servers)
    const response = await fetch(path);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    // Update toast
    const toastEl = document.querySelector('.download-toast');
    if (toastEl) {
      toastEl.textContent = '✓ Download started!';
      toastEl.classList.add('show');
      setTimeout(() => toastEl.classList.remove('show'), 3000);
      setTimeout(() => toastEl.remove(), 3500);
    }
  } catch (err) {
    console.warn('Fetch download failed, trying direct link:', err);
    // Fallback: open in new tab (user can manually save)
    window.open(path, '_blank');
    const toastEl = document.querySelector('.download-toast');
    if (toastEl) {
      toastEl.textContent = '⚠ Opened in new tab — press Ctrl+S to save';
      toastEl.classList.add('show');
      setTimeout(() => toastEl.classList.remove('show'), 4000);
      setTimeout(() => toastEl.remove(), 4500);
    }
  }
}

function initIllusionFilters() {
  const bar = document.getElementById('illusionFilterBar');
  if (!bar) return;

  bar.querySelectorAll('.illusion-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.illusion-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentIllusionFilter = btn.dataset.filter;
      const container = document.getElementById('illusionsGrid');
      if (container) {
        // Use inline data or fetch (for HTTP servers)
        let data;
        try {
          data = loadIllusionsFromFallback();
        } catch (e) {
          fetch('data/illusions.json')
            .then(r => r.json())
            .then(d => { window.__cachedIllusionsData = d; renderIllusions(container, d); });
          return;
        }
        if (data.length > 0) {
          window.__cachedIllusionsData = data;
          renderIllusions(container, data);
        }
      }
    });
  });
}

function initIllusionSearch() {
  const input = document.getElementById('illusionSearchInput');
  if (!input) return;

  input.addEventListener('input', (e) => {
    currentIllusionSearch = e.target.value;
    const container = document.getElementById('illusionsGrid');
    if (container) {
      // Use cached inline data or fetch (for HTTP servers)
      let data = window.__cachedIllusionsData;
      if (!data) {
        try {
          data = loadIllusionsFromFallback();
        } catch (err) {
          console.warn('Failed to load illusions data for search:', err);
          return;
        }
      }
      if (data) {
        window.__cachedIllusionsData = data;
        renderIllusions(container, data);
      }
    }
  });
}

/* ── Daily Fact ── */
async function loadDailyFact() {
  const today = new Date();
  const dateEl = document.getElementById('factDate');
  if (dateEl) {
    dateEl.textContent = today.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  try {
    const response = await fetch('data/facts.json');
    const data = await response.json();
    const idx = today.getDate() % data.length;
    const fact = data[idx];

    document.getElementById('factTitle').textContent = fact.title;
    document.getElementById('factBody').textContent = fact.body;
    document.getElementById('factSource').textContent = `Source: ${fact.source}`;
  } catch (err) {
    console.warn('Failed to load daily fact:', err);
  }
}

/* ── Particle Background ── */
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let w, h;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((w * h) / 15000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 130, 246, ${p.alpha})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  resize();
  createParticles();
  animate();
  window.addEventListener('resize', () => { resize(); createParticles(); });
}

/* ── Navigation ── */
function initNav() {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  // Scroll effect
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Mobile toggle
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
  });

  // Active section tracking
  const sections = document.querySelectorAll('.section[data-section]');
  const navLinksAll = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const section = entry.target.dataset.section;
        navLinksAll.forEach(link => {
          link.classList.toggle('active', link.dataset.section === section);
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(section => observer.observe(section));

  // Close mobile nav on link click
  navLinksAll.forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
    });
  });
}

/* ── Scroll Reveal ── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

/* ── Back to Top ── */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 600);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ── Puzzle Reveal ── */
document.getElementById('revealBtn')?.addEventListener('click', function() {
  const answer = document.getElementById('puzzleAnswer');
  if (answer.style.display === 'none') {
    answer.style.display = 'block';
    this.textContent = 'Hide Answer';
  } else {
    answer.style.display = 'none';
    this.textContent = 'Show Answer';
  }
});

/* ── New Puzzle Button ── */
document.getElementById('regeneratePuzzleBtn')?.addEventListener('click', async function() {
  try {
    const response = await fetch('data/puzzles.json');
    const data = await response.json();
    const puzzle = data[Math.floor(Math.random() * data.length)];
    document.getElementById('puzzleQuestion').textContent = puzzle.question;
    document.getElementById('puzzleAnswer').textContent = puzzle.answer;
    document.getElementById('puzzleAnswer').style.display = 'none';
    this.textContent = '🔄 New Puzzle';
  } catch (err) {
    console.warn('Failed to load new puzzle:', err);
  }
});

/* ── Splat Gallery: lazy-load the gaussian splat viewer ── */
(function initSplatGallery() {
  const stage = document.getElementById('splatStage');
  const placeholder = document.getElementById('splatPlaceholder');
  const loadBtn = document.getElementById('loadSplatBtn');
  const titleEl = document.getElementById('splatTitle');
  const descEl = document.getElementById('splatDesc');
  const newTabLink = document.getElementById('openNewTabLink');
  if (!stage || !placeholder) return;

  let currentScene = 'splat_van';
  let loading = false;

  function loadViewer() {
    if (loading) return;
    loading = true;
    if (loadBtn) {
      loadBtn.textContent = '✦ Loading scene…';
      loadBtn.disabled = true;
    }
    const iframe = document.createElement('iframe');
    iframe.src = `splats/${currentScene}.html`;
    iframe.title = `Gaussian splat viewer — ${titleEl ? titleEl.textContent : currentScene}`;
    iframe.allowFullscreen = true;
    // WebGPU needs GPU access in the embedded frame
    iframe.setAttribute('allow', 'fullscreen; web-share; autoplay');
    stage.appendChild(iframe);
    placeholder.style.display = 'none';
  }

  function selectScene(btn) {
    const scene = btn.dataset.scene;
    if (scene === currentScene && loading) return; // already showing it
    document.querySelectorAll('.splat-pick-btn').forEach(b => b.classList.toggle('active', b === btn));
    currentScene = scene;
    if (titleEl) titleEl.textContent = btn.dataset.title || scene;
    if (descEl) descEl.textContent = btn.dataset.desc || '';
    if (newTabLink) newTabLink.href = `splats/${scene}.html`;
    // If a viewer is already embedded, point it at the newly selected scene (it reloads itself)
    const existing = stage.querySelector('iframe');
    if (existing) {
      existing.src = `splats/${scene}.html`;
      return;
    }
  }

  document.querySelectorAll('.splat-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => selectScene(btn));
  });

  if (loadBtn) loadBtn.addEventListener('click', loadViewer);
})();
