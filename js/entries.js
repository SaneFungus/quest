/**
 * entries.js — zapis i odczyt wpisów studenta
 * 
 * PLACEHOLDER — integracja Supabase zostanie dodana w następnej sesji.
 * Docelowo odpowiada za:
 *   - Zapisywanie notatki po wykonaniu zadania
 *   - Dołączanie zdjęcia (Supabase Storage)
 *   - Przełączanie prywatne/udostępnione prowadzącemu
 *   - Wyświetlanie historii wpisów studenta
 */

// eslint-disable-next-line no-unused-vars
const Entries = (() => {

  /**
   * Save a new entry.
   * @param {Object} entry
   * @param {string} entry.taskId
   * @param {string} entry.privateNote
   * @param {boolean} entry.isShared
   * @param {File|null} entry.photo
   */
  async function save(entry) {
    // TODO: Supabase insert into entries table + Storage upload
    console.log('[Entries] Save not yet implemented', entry);
    return null;
  }

  /**
   * Load entries for current user.
   * @param {string} [workshopId] — optional filter by workshop
   */
  async function loadMine(workshopId) {
    // TODO: Supabase select with RLS
    console.log('[Entries] Load not yet implemented', workshopId);
    return [];
  }

  /**
   * Toggle sharing of an entry.
   * @param {string} entryId
   * @param {boolean} shared
   */
  async function setShared(entryId, shared) {
    // TODO: Supabase update is_shared
    console.log('[Entries] setShared not yet implemented', entryId, shared);
  }

  return { save, loadMine, setShared };
})();
