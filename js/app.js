/**
 * app.js — główna logika aplikacji Quest
 * 
 * Routing między sekcjami, losowanie, katalog, sekwencja, Warszawa.
 * + Integracja auth (logowanie) i entries (notatki studenta).
 * 
 * Zależy od: Tasks, LEVELS, Auth, Entries, LAYER (ładowane przed tym plikiem).
 */

/* global Tasks, LEVELS, Auth, Entries */

/** Layer metadata — used across all modules */
// eslint-disable-next-line no-unused-vars
var LAYER = {
  A: { name: 'A — percepcja', badgeClass: 'badge-A' },
  B: { name: 'B — relacja',   badgeClass: 'badge-B' },
  C: { name: 'C — narracja',  badgeClass: 'badge-C' },
  M: { name: 'Ekspozycja',      badgeClass: 'badge-M' },
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
  let entryFormVisible = false;

  /* ── DOM refs ── */
  const $ = id => document.getElementById(id);

  /* ═══════════════════════
     AUTH UI
     ═══════════════════════ */

  function updateAuthUI(user) {
    const loginForm = $('auth-login-form');
    const loggedInBar = $('auth-logged-in');
    const userName = $('auth-user-name');
    const entryBtn = $('btn-entry');

    if (!loginForm) return;

    if (user) {
      loginForm.style.display = 'none';
      loggedInBar.style.display = 'flex';
      userName.textContent = user.email || '';
      if (entryBtn) entryBtn.style.display = 'inline-block';
    } else {
      loginForm.style.display = 'flex';
      loggedInBar.style.display = 'none';
      userName.textContent = '';
      if (entryBtn) entryBtn.style.display = 'none';
      hideEntryForm();
    }

    // Reset magic link form state
    const status = $('auth-status');
    if (status && user) {
      status.textContent = '';
      status.className = 'auth-status';
    }
  }

  async function handleMagicLink() {
    const emailEl = $('auth-email');
    const btn = $('auth-send-btn');
    const status = $('auth-status');
    const email = emailEl.value.trim();

    if (!email || !email.includes('@')) {
      status.textContent = 'Wpisz poprawny email.';
      status.className = 'auth-status auth-status--error';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Wysyłam…';
    status.textContent = '';
    status.className = 'auth-status';

    const { error } = await Auth.sendMagicLink(email);

    if (error) {
      status.textContent = 'Błąd: ' + error;
      status.className = 'auth-status auth-status--error';
    } else {
      status.textContent = 'Sprawdź skrzynkę — kliknij link w mailu.';
      status.className = 'auth-status auth-status--ok';
      emailEl.value = '';
    }

    btn.disabled = false;
    btn.textContent = 'Wyślij link';
  }

  function handleLogout() {
    Auth.signOut();
    hideEntryForm();
  }

  /* ═══════════════════════
     ENTRY FORM
     ═══════════════════════ */

  function toggleEntryForm() {
    if (!Auth.isLoggedIn() || !lastDrawn) return;

    entryFormVisible = !entryFormVisible;
    const form = $('entry-form');
    const btn = $('btn-entry');

    if (entryFormVisible) {
      form.classList.add('open');
      btn.textContent = 'Ukryj wpis';
      btn.classList.add('is-open');
      // Show task ID context
      $('entry-task-label').textContent = lastDrawn.title;
      // Load existing entries for this task
      loadTaskEntries(lastDrawn.id);
    } else {
      hideEntryForm();
    }
  }

  function hideEntryForm() {
    entryFormVisible = false;
    const form = $('entry-form');
    const btn = $('btn-entry');
    if (form) form.classList.remove('open');
    if (btn) {
      btn.textContent = 'Mój wpis';
      btn.classList.remove('is-open');
    }
  }

  async function submitEntry() {
    if (!Auth.isLoggedIn() || !lastDrawn) return;

    const noteEl = $('entry-note');
    const photoEl = $('entry-photo');
    const sharedEl = $('entry-shared');
    const submitBtn = $('entry-submit');
    const statusEl = $('entry-status');

    const privateNote = noteEl.value.trim();
    if (!privateNote) {
      statusEl.textContent = 'Wpisz notatkę.';
      statusEl.className = 'entry-status entry-status--error';
      return;
    }

    // Disable button during save
    submitBtn.disabled = true;
    submitBtn.textContent = 'Zapisuję…';
    statusEl.textContent = '';
    statusEl.className = 'entry-status';

    try {
      const photo = photoEl.files[0] || null;

      await Entries.save({
        taskId: lastDrawn.id,
        privateNote: privateNote,
        isShared: sharedEl.checked,
        photo: photo,
      });

      // Success — clear form
      noteEl.value = '';
      photoEl.value = '';
      sharedEl.checked = false;
      statusEl.textContent = 'Zapisano!';
      statusEl.className = 'entry-status entry-status--ok';

      // Refresh entries list
      loadTaskEntries(lastDrawn.id);

    } catch (e) {
      statusEl.textContent = 'Błąd zapisu: ' + e.message;
      statusEl.className = 'entry-status entry-status--error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Zapisz';
    }
  }

  async function loadTaskEntries(taskId) {
    const list = $('entry-list');
    if (!list || !Auth.isLoggedIn()) {
      if (list) list.innerHTML = '';
      return;
    }

    const entries = await Entries.loadForTask(taskId);

    if (entries.length === 0) {
      list.innerHTML = '<div class="entry-empty">Brak wpisów dla tego zadania.</div>';
      return;
    }

    list.innerHTML = entries.map(e => {
      const date = new Date(e.created_at).toLocaleDateString('pl-PL', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const photoHTML = e.photo_path
        ? `<img class="entry-photo-thumb" src="${Entries.getPhotoUrl(e.photo_path)}" alt="zdjęcie" loading="lazy">`
        : '';
      const sharedIcon = e.is_shared
        ? '<span class="entry-shared-icon" title="Udostępnione prowadzącemu">👁</span>'
        : '';

      return `
        <div class="entry-item" id="entry-${e.id}">
          <div class="entry-item-head">
            <span class="entry-date">${date}</span>
            ${sharedIcon}
            <button class="entry-toggle-share" onclick="App.toggleEntryShare('${e.id}', ${!e.is_shared})" title="${e.is_shared ? 'Ukryj przed prowadzącym' : 'Udostępnij prowadzącemu'}">
              ${e.is_shared ? 'Cofnij udostępnienie' : 'Udostępnij'}
            </button>
          </div>
          <div class="entry-item-note">${escapeHTML(e.private_note)}</div>
          ${photoHTML}
        </div>`;
    }).join('');
  }

  async function toggleEntryShare(entryId, shared) {
    try {
      await Entries.setShared(entryId, shared);
      if (lastDrawn) loadTaskEntries(lastDrawn.id);
    } catch (e) {
      console.error('[App] toggleEntryShare error:', e);
    }
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

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

    const emptyState = $('draw-empty');
    const cardState = $('draw-card');

    if (emptyState) emptyState.style.display = 'none';
    cardState.style.display = 'block';

    $('hero-badge').innerHTML = Tasks.badgeHTML(task.layer);
    $('hero-title').textContent = task.title;
    $('hero-body').textContent = task.body;
    $('hero-reflect-text').textContent = task.reflect || '';
    $('hero-note-text').textContent = task.note_instructor || '';

    $('hero-expand').classList.remove('open');
    $('hero-notebox').classList.remove('open');

    const btnReflect = $('btn-reflect');
    const btnNote = $('btn-note');
    btnReflect.style.display = task.reflect ? 'inline-block' : 'none';
    btnReflect.textContent = 'Refleksja';
    btnReflect.classList.remove('is-open');
    btnNote.style.display = task.note_instructor ? 'inline-block' : 'none';
    btnNote.textContent = 'Adnotacja';
    btnNote.classList.remove('is-open');

    // Show entry button if logged in
    const entryBtn = $('btn-entry');
    if (entryBtn) {
      entryBtn.style.display = Auth.isLoggedIn() ? 'inline-block' : 'none';
    }

    // Reset entry form
    hideEntryForm();

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
    const nav = $('lvl-nav');
    nav.innerHTML = LEVELS.map(l =>
      `<button class="lvl-btn${l.id === seqLevel ? ' active' : ''}" onclick="App.switchLevel(${l.id})">${l.label}</button>`
    ).join('');

    const lv = LEVELS.find(l => l.id === seqLevel);
    $('lvl-desc').innerHTML = '<strong>' + lv.title + '</strong> — ' + lv.desc;

    $('lvl-axes').innerHTML = lv.axes.map(a =>
      '<span class="axis-pill">' + a + '</span>'
    ).join('');

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

      // Initialize auth and register UI callback
      Auth.onAuthChange(updateAuthUI);
      await Auth.init();

      // Set initial auth UI state
      updateAuthUI(Auth.currentUser());

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
    init,
    showSection,
    draw,
    toggleReflect,
    toggleNote,
    toggleCard,
    switchLevel,
    handleMagicLink,
    handleLogout,
    toggleEntryForm,
    submitEntry,
    toggleEntryShare,
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
