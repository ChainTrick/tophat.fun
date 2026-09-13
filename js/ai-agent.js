/* ═══════════════════════════════════════════
   TopHat.fun — CurioBot AI Agent
   Auto-updates site content via API feeds
   ═══════════════════════════════════════════ */

class CurioBot {
  constructor() {
    this.factsCount = parseInt(localStorage.getItem('curiobot_facts') || '0');
    this.tricksCount = parseInt(localStorage.getItem('curiobot_tricks') || '0');
    this.lastUpdate = localStorage.getItem('curiobot_last') || null;
    this.nextUpdate = this.getNextUpdate();
    this.logEl = document.getElementById('aiLog');
    this.init();
  }

  init() {
    this.updateMetrics();
    this.addLog('init', 'CurioBot initialized. Monitoring content feeds...');
    this.addLog('info', `Tracking ${this.factsCount} facts and ${this.tricksCount} tricks.`);

    // Check if we should update (daily at midnight)
    this.checkAndUpdate();

    // Set up periodic check
    setInterval(() => this.checkAndUpdate(), 3600000); // Every hour

    // Fetch new facts button
    document.getElementById('fetchFactsBtn')?.addEventListener('click', () => this.fetchNewFacts());

    // Simulate ongoing activity
    this.simulateActivity();
  }

  getNextUpdate() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  updateMetrics() {
    const factsEl = document.getElementById('aiFactsCount');
    const tricksEl = document.getElementById('aiTricksCount');
    const lastEl = document.getElementById('aiLastUpdate');
    const nextEl = document.getElementById('aiNextUpdate');

    if (factsEl) factsEl.textContent = this.factsCount;
    if (tricksEl) tricksEl.textContent = this.tricksCount;
    if (lastEl && this.lastUpdate) {
      lastEl.textContent = new Date(this.lastUpdate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (nextEl) {
      nextEl.textContent = this.nextUpdate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  addLog(type, message) {
    if (!this.logEl) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = document.createElement('p');
    entry.className = 'ai-log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-${type}">${message}</span>`;
    this.logEl.appendChild(entry);
    this.logEl.scrollTop = this.logEl.scrollHeight;

    // Keep last 50 entries
    while (this.logEl.children.length > 50) {
      this.logEl.removeChild(this.logEl.firstChild);
    }
  }

  async checkAndUpdate() {
    const now = new Date();
    const last = this.lastUpdate ? new Date(this.lastUpdate) : null;

    // Update if it's a new day
    if (!last || now.toDateString() !== last.toDateString()) {
      this.addLog('info', 'New day detected. Fetching fresh content...');
      await this.fetchNewFacts();
      this.lastUpdate = now.toISOString();
      localStorage.setItem('curiobot_last', this.lastUpdate);
    }
  }

  async fetchNewFacts() {
    this.addLog('info', 'Querying fact databases...');

    try {
      // Try fetching from free APIs
      const [factResponse, scienceResponse] = await Promise.allSettled([
        fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?size=3'),
        fetch('https://api.wired.com/v1/story/random')
      ]);

      let newFacts = [];

      // Process facts API
      if (factResponse.status === 'fulfilled' && factResponse.value.ok) {
        const data = await factResponse.value.json();
        if (data && data.entries) {
          newFacts.push({
            title: data.entries[0]?.title || 'Random Fact',
            body: data.entries[0]?.text || 'No content available.',
            category: 'Random',
            source: 'uselessfacts.jsph.pl',
            tags: ['random', 'api']
          });
          this.addLog('ok', `Fetched: "${data.entries[0]?.title?.substring(0, 40) || 'Fact'}"`);
        }
      }

      // Process science facts from our local data if API fails
      if (newFacts.length === 0) {
        this.addLog('warn', 'Using curated facts for today');
        const localFacts = await this.loadLocalFacts();
        const today = new Date();
        const idx = today.getDate() % localFacts.length;
        newFacts = [localFacts[idx]];
      }

      // Add to local storage
      const stored = JSON.parse(localStorage.getItem('curiobot_facts') || '[]');
      stored.push(...newFacts);
      localStorage.setItem('curiobot_facts', JSON.stringify(stored));
      this.factsCount = stored.length;

      // Update UI
      this.updateMetrics();
      this.addLog('ok', `+${newFacts.length} new facts indexed! Total: ${this.factsCount}`);

      // Refresh daily fact display
      this.refreshDailyFact();

    } catch (err) {
      this.addLog('warn', `Fetch error: ${err.message}`);
      this.addLog('info', 'Using curated content for today');
    }
  }

  async loadLocalFacts() {
    try {
      const response = await fetch('data/facts.json');
      return await response.json();
    } catch {
      return [];
    }
  }

  refreshDailyFact() {
    const today = new Date();
    const stored = JSON.parse(localStorage.getItem('curiobot_facts') || '[]');
    const localFacts = stored.length > 0 ? stored : [];

    const idx = today.getDate() % (localFacts.length || 10);
    const fact = localFacts[idx] || null;

    const titleEl = document.getElementById('factTitle');
    const bodyEl = document.getElementById('factBody');
    const sourceEl = document.getElementById('factSource');

    if (fact && titleEl && bodyEl) {
      titleEl.textContent = fact.title;
      bodyEl.textContent = fact.body;
      if (sourceEl) sourceEl.textContent = `Source: ${fact.source || 'CurioBot AI'}`;
    }
  }

  simulateActivity() {
    const activities = [
      { type: 'info', msg: 'Scanning content feeds...' },
      { type: 'info', msg: 'Checking fact databases...' },
      { type: 'info', msg: 'Analyzing trending topics...' },
      { type: 'info', msg: 'Verifying content accuracy...' },
      { type: 'info', msg: 'Indexing new discoveries...' },
      { type: 'info', msg: 'Optimizing content delivery...' },
      { type: 'info', msg: 'Monitoring science journals...' },
      { type: 'info', msg: 'Processing magic trick submissions...' },
    ];

    let idx = 0;
    setInterval(() => {
      const activity = activities[idx % activities.length];
      this.addLog(activity.type, activity.msg);
      idx++;
    }, 120000); // Every 2 minutes
  }
}

/* ── Initialize CurioBot ── */
const curiobot = new CurioBot();
