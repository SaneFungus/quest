/**
 * tasks.js — ładowanie tasks.json i renderowanie kart zadań
 */

/* global LAYER, App */

const Tasks = (() => {
  let _tasks = [];

  /** Load tasks from JSON file */
  async function load() {
    const res = await fetch('./tasks.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _tasks = await res.json();
    return _tasks;
  }

  /** Get all loaded tasks */
  function all() { return _tasks; }

  /** Filter by layer set */
  function byLayers(layerSet) {
    return _tasks.filter(t => layerSet.has(t.layer));
  }

  /** Filter by IDs */
  function byIds(ids) {
    return _tasks.filter(t => ids.includes(t.id));
  }

  /** Filter Warsaw-only */
  function warsaw() {
    return _tasks.filter(t => t.layer === 'W');
  }

  /** Filter non-Warsaw */
  function nonWarsaw() {
    return _tasks.filter(t => t.layer !== 'W');
  }

  /** Build badge HTML */
  function badgeHTML(layer) {
    const meta = LAYER[layer] || { name: layer, badgeClass: 'badge-W' };
    return `<span class="badge ${meta.badgeClass}">${meta.name}</span>`;
  }

  /** Render a task card (collapsed or open) */
  function cardHTML(task, alwaysOpen) {
    const openCls = alwaysOpen ? ' open' : '';
    return `
      <div class="card${openCls}" id="card-${task.id}" onclick="App.toggleCard('${task.id}')">
        <div class="card-head">
          <div class="card-title">${task.title}</div>
          ${badgeHTML(task.layer)}
        </div>
        <div class="card-body">${task.body}</div>
        <div class="expand-zone${openCls}" id="ez-${task.id}">
          <div class="zone-label">Pytanie refleksyjne</div>
          <div class="zone-text">${task.reflect}</div>
          <div class="note-block${openCls}">
            <div class="zone-label">Adnotacja dla prowadzącego</div>
            <div class="zone-text">${task.note_instructor}</div>
          </div>
        </div>
      </div>`;
  }

  /** Render inline task (for sequence level 0) */
  function inlineTaskHTML(inlineTask) {
    return `
      <div class="card open">
        <div class="card-head">
          <div class="card-title">${inlineTask.title}</div>
          <span class="badge badge-W">${inlineTask.badgeLabel}</span>
        </div>
        <div class="card-body">${inlineTask.body}</div>
        <div class="expand-zone open">
          <div class="zone-label">Pytanie refleksyjne</div>
          <div class="zone-text">${inlineTask.reflect}</div>
          <div class="note-block open">
            <div class="zone-label">Adnotacja dla prowadzącego</div>
            <div class="zone-text">${inlineTask.note_instructor}</div>
          </div>
        </div>
      </div>`;
  }

  return { load, all, byLayers, byIds, warsaw, nonWarsaw, badgeHTML, cardHTML, inlineTaskHTML };
})();
