/**
 * app.js — główna logika aplikacji Quest
 * 
 * Routing między sekcjami, losowanie, katalog, sekwencja, Warszawa.
 * Zależy od: Tasks, LEVELS, LAYER (ładowane przed tym plikiem).
 */

/* global Tasks, LEVELS, Auth */

/** Layer metadata — used across all modules */
// eslint-disable-next-line no-unused-vars
var LAYER = {
  A: { name: 'A — percepcja', badgeClass: 'badge-A' },
  B: { name: 'B — relacja',   badgeClass: 'badge-B' },
  C: { name: 'C — narracja',  badgeClass: 'badge-C' },
  M: { name: 'musarowe',      badgeClass: 'badge-M' },
  W: { name: 'Warszawa',      badgeClass: 'badge-W' },
};

var App = (() => {
  /* ── state ── */
  let randFilters = new Set(['A','B','C','M','W']);
  let catFilters  = new Set(['A','B','C','M']);
  let seqLevel    = 1;
  let lastDrawn   = null;
  let reflectOpen = false;
  let noteOpen    = false;
  let heroCardAnimating = false;

  /* ── DOM refs ── */
  const $ = id => document.getElementById(id);

  /* ═══════════════════════
     NAVIGATION
     ═══════════════════════ */

  function showSection(name) {
    const sections = { rand: 's-rand', cat: 's-cat', seq: 's-seq', war: 's-war' };

    Object.values(sections).forEach(id => {
      const el = $(id);
      el.style.display = 'none';
      el.classList.remove('active');
    });

    const target = $(sections[name]);
    target.style.display = 'block';
    // Trigger reflow for animation
    void target.offsetWidth;
    target.classList.add('active');

    document.querySelectorAll('.nav button').forEach((btn, i) => {
      btn.classList.toggle('active', ['rand','cat','seq','war'][i] === name);
    });
  }

  /* ═══════════════════════
     RANDOM / DRAW
     ═══════════════════════ */

  function getPool() {
    return Tasks.all().filter(t => randFilters.has(t.layer));
  }

  function updatePoolCount() {
    const counter = $('rand-pool-count');
    if (!counter) return;
    const count = getPool().length;
    counter.textContent = count + ' ' + pluralize(count);
  }

  function pluralize(n) {
    if (n === 1) return 'zadanie';
    if (n >= 2 && n <= 4) return 'zadania';
    return 'zadań';
  }

  function buildRandChips() {
    const container = $('rand-chips');
    const layers = ['A','B','C','M','W'];
    container.innerHTML = '<span class="chip-label">Filtruj:</span>';
    layers.forEach(l => {
      const btn = document.createElement('button');
      btn.className = 'chip active';
      btn.textContent = LAYER[l].name;
      btn.addEventListener('click', function() {
        if (randFilters.has(l)) {
          randFilters.delete(l);
        } else {
          randFilters.add(l);
        }
        this.classList.toggle('active', randFilters.has(l));
        updatePoolCount();
      });
      container.appendChild(btn);
    });

    // Pool counter
    const counter = document.createElement('span');
    counter.id = 'rand-pool-count';
    counter.className = 'pool-count';
    container.appendChild(counter);

    updatePoolCount();
  }

  function draw() {
    if (heroCardAnimating) return;

    const pool = getPool().filter(t => !lastDrawn || t.id !== lastDrawn.id);
    if (!pool.length) return;

    const task = pool[Math.floor(Math.random() * pool.length)];
    lastDrawn = task;
    reflectOpen = false;
    noteOpen = false;

    // Switch from empty state to card state
    const emptyState = $('draw-empty');
    const cardState = $('draw-card');

    if (emptyState) emptyState.style.display = 'none';
    cardState.style.display = 'block';

    // Populate card
    $('hero-badge').innerHTML = Tasks.badgeHTML(task.layer);
    $('hero-title').textContent = task.title;
    $('hero-body').textContent = task.body;
    $('hero-reflect-text').textContent = task.reflect || '';
    $('hero-note-text').textContent = task.note_instructor || '';

    // Reset expand states
    $('hero-expand').classList.remove('open');
    $('hero-notebox').classList.remove('open');

    // Toggle button visibility
    const btnReflect = $('btn-reflect');
    const btnNote = $('btn-note');
    btnReflect.style.display = task.reflect ? 'inline-block' : 'none';
    btnReflect.textContent = 'Refleksja';
    btnReflect.classList.remove('is-open');
    btnNote.style.display = task.note_instructor ? 'inline-block' : 'none';
    btnNote.textContent = 'Adnotacja';
    btnNote.classList.remove('is-open');

    // Re-trigger animation
    heroCardAnimating = true;
    const heroCard = $('hero-card');
    heroCard.style.animation = 'none';
    void heroCard.offsetWidth;
    heroCard.style.animation = '';
    setTimeout(() => { heroCardAnimating = false; }, 500);
  }

  function toggleReflect() {
    reflectOpen = !reflectOpen;
    $('hero-expand').classList.toggle('open', reflectOpen);
    $('btn-reflect').textContent = reflectOpen ? 'Ukryj refleksję' : 'Refleksja';
    $('btn-reflect').classList.toggle('is-open', reflectOpen);

    if (!reflectOpen) {
      noteOpen = false;
      $('hero-notebox').classList.remove('open');
      $('btn-note').textContent = 'Adnotacja';
      $('btn-note').classList.remove('is-open');
    }
  }

  function toggleNote() {
    if (!reflectOpen) toggleReflect();
    noteOpen = !noteOpen;
    $('hero-notebox').classList.toggle('open', noteOpen);
    $('btn-note').textContent = noteOpen ? 'Ukryj adnotację' : 'Adnotacja';
    $('btn-note').classList.toggle('is-open', noteOpen);
  }

  /* ═══════════════════════
     CATALOG
     ═══════════════════════ */

  function buildCatChips() {
    const container = $('cat-chips');
    const layers = ['A','B','C','M'];
    container.innerHTML = '<span class="chip-label">Warstwa:</span>';
    layers.forEach(l => {
      const btn = document.createElement('button');
      btn.className = 'chip active';
      btn.textContent = LAYER[l].name;
      btn.addEventListener('click', function() {
        if (catFilters.has(l)) {
          catFilters.delete(l);
        } else {
          catFilters.add(l);
        }
        this.classList.toggle('active', catFilters.has(l));
        renderCat();
      });
      container.appendChild(btn);
    });
  }

  function renderCat() {
    const grid = $('cat-grid');
    const visible = Tasks.all().filter(t => catFilters.has(t.layer) && t.layer !== 'W');
    grid.innerHTML = visible.map(t => Tasks.cardHTML(t, false)).join('');
  }

  /* ═══════════════════════
     CARD TOGGLE (shared)
     ═══════════════════════ */

  function toggleCard(id) {
    const card = $('card-' + id);
    const ez   = $('ez-' + id);
    if (!card || !ez) return;
    const isOpen = card.classList.contains('open');
    card.classList.toggle('open', !isOpen);
    ez.classList.toggle('open', !isOpen);
  }

  /* ═══════════════════════
     SEQUENCE
     ═══════════════════════ */

  function renderSeq() {
    // Level navigation
    const nav = $('lvl-nav');
    nav.innerHTML = LEVELS.map(l =>
      `<button class="lvl-btn${l.id === seqLevel ? ' active' : ''}" onclick="App.switchLevel(${l.id})">${l.label}</button>`
    ).join('');

    const lv = LEVELS.find(l => l.id === seqLevel);
    $('lvl-desc').innerHTML = '<strong>' + lv.title + '</strong> — ' + lv.desc;

    // Axes
    $('lvl-axes').innerHTML = lv.axes.map(a =>
      '<span class="axis-pill">' + a + '</span>'
    ).join('');

    // Task cards
    const grid = $('seq-grid');

    if (lv.inlineTask) {
      grid.innerHTML = Tasks.inlineTaskHTML(lv.inlineTask);
    } else {
      const tasks = Tasks.byIds(lv.tasks);
      grid.innerHTML = tasks.map(t => Tasks.cardHTML(t, true)).join('');
    }

    if (lv.warn) {
      grid.innerHTML += '<div class="warn-box">Poziom 5 wymaga wcześniej zbudowanego zaufania w grupie. Student może odmówić bez tłumaczenia. Prowadzący powinien przejść przez analogiczne ćwiczenie wcześniej.</div>';
    }
  }

  function switchLevel(id) {
    seqLevel = id;
    renderSeq();
  }

  /* ═══════════════════════
     WARSAW
     ═══════════════════════ */

  function renderWar() {
    const grid = $('war-grid');
    grid.innerHTML = Tasks.warsaw().map(t => Tasks.cardHTML(t, false)).join('');
  }

  /* ═══════════════════════
     INIT
     ═══════════════════════ */

  async function init() {
    try {
      await Tasks.load();

      $('loading').style.display = 'none';

      buildRandChips();
      buildCatChips();
      renderCat();
      renderSeq();
      renderWar();
      showSection('rand');

      // Initialize auth (no-op for now)
      await Auth.init();

    } catch (e) {
      $('loading').style.display = 'none';
      const err = $('error');
      err.style.display = 'block';
      err.textContent = 'Nie można wczytać pliku tasks.json. Upewnij się, że plik istnieje i że strona jest serwowana przez HTTP (nie otwierana z dysku). Błąd: ' + e.message;
    }
  }

  /* ═══════════════════════
     PUBLIC API
     ═══════════════════════ */

  return {
    init: init,
    showSection: showSection,
    draw: draw,
    toggleReflect: toggleReflect,
    toggleNote: toggleNote,
    toggleCard: toggleCard,
    switchLevel: switchLevel,
  };
})();

/* Start the app */
document.addEventListener('DOMContentLoaded', App.init);
