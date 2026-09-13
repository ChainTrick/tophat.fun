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

// The PDFs live next to index.html in the repo root — there is no
// IllusionPlans/ subfolder on the published site. Filenames contain
// spaces, so they must be percent-encoded before they go in a URL.
function illusionUrl(filename) {
  return encodeURIComponent(filename);
}

let illusionsData = null;

async function getIllusions() {
  if (illusionsData) return illusionsData;
  try {
    const response = await fetch('data/illusions.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    illusionsData = await response.json();
  } catch (fetchErr) {
    // Fallback for file:// protocol — index.html exposes the same array inline.
    console.warn('fetch of data/illusions.json failed, using inline fallback:', fetchErr.message);
    if (Array.isArray(window.__illusionsData) && window.__illusionsData.length) {
      illusionsData = window.__illusionsData;
    } else {
      throw fetchErr;
    }
  }
  return illusionsData;
}

async function loadIllusions() {
  const container = document.getElementById('illusionsGrid');
  if (!container) return;

  try {
    renderIllusions(container, await getIllusions());
    initIllusionFilters();
    initIllusionSearch();
  } catch (err) {
    console.warn('Failed to load illusions:', err);
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem;">
      <p style="font-size:2rem; margin-bottom:0.5rem;">⚠️</p>
      <p>Content not available. Make sure the site is served via HTTP (not file://).</p>
    </div>`;
  }
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
        <a class="download-btn" href="${illusionUrl(item.filename)}"
           download="${item.filename}" data-filename="${item.filename}">
          <span>⬇</span> Download
        </a>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.illusion-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.1}s`;
  });

  // Real <a download> links do the work; this only reports progress.
  // Never preventDefault here — a plain same-origin link streams the file
  // and shows the browser's own download UI, instead of buffering up to
  // 24MB into memory via fetch+blob.
  container.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast(`⬇ Downloading ${btn.dataset.filename}`);
    });
  });
}

/* ── Download toast ── */
function showToast(message) {
  document.querySelectorAll('.download-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'download-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => toast.classList.remove('show'), 3000);
  setTimeout(() => toast.remove(), 3500);
}

function initIllusionFilters() {
  const bar = document.getElementById('illusionFilterBar');
  if (!bar) return;
  if (bar.dataset.bound) return; // loadIllusions() can run more than once
  bar.dataset.bound = '1';

  bar.querySelectorAll('.illusion-filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      bar.querySelectorAll('.illusion-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentIllusionFilter = btn.dataset.filter;
      const container = document.getElementById('illusionsGrid');
      if (!container) return;
      try {
        renderIllusions(container, await getIllusions());
      } catch (err) {
        console.warn('Failed to filter illusions:', err);
      }
    });
  });
}

function initIllusionSearch() {
  const input = document.getElementById('illusionSearchInput');
  if (!input) return;
  if (input.dataset.bound) return;
  input.dataset.bound = '1';

  input.addEventListener('input', async (e) => {
    currentIllusionSearch = e.target.value;
    const container = document.getElementById('illusionsGrid');
    if (!container) return;
    try {
      renderIllusions(container, await getIllusions());
    } catch (err) {
      console.warn('Failed to search illusions:', err);
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

  // Scene pages sit in the repo root too — there is no splats/ folder live.
  function sceneUrl(scene) {
    return `${scene}.html`;
  }

  function loadViewer() {
    if (loading) return;
    loading = true;
    if (loadBtn) {
      loadBtn.textContent = '✦ Loading scene…';
      loadBtn.disabled = true;
    }
    const iframe = document.createElement('iframe');
    iframe.src = sceneUrl(currentScene);
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
    if (newTabLink) newTabLink.href = sceneUrl(scene);
    // If a viewer is already embedded, point it at the newly selected scene (it reloads itself)
    const existing = stage.querySelector('iframe');
    if (existing) {
      existing.src = sceneUrl(scene);
      return;
    }
  }

  document.querySelectorAll('.splat-pick-btn').forEach(btn => {
    btn.addEventListener('click', () => selectScene(btn));
  });

  if (loadBtn) loadBtn.addEventListener('click', loadViewer);
})();
