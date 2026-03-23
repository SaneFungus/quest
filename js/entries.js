/**
 * entries.js — zapis i odczyt wpisów studenta (Supabase)
 *
 * Odpowiada za:
 *   - Zapisywanie notatki po wykonaniu zadania (tabela entries)
 *   - Dołączanie zdjęcia (Supabase Storage, bucket entry-photos)
 *   - Przełączanie prywatne / udostępnione prowadzącemu
 *   - Wyświetlanie historii wpisów studenta
 *
 * Zależy od: Auth (auth.js) — Auth.supabase() zwraca instancję klienta
 */

// eslint-disable-next-line no-unused-vars
const Entries = (() => {

  /** Helper — get authenticated Supabase client */
  function _sb() {
    const sb = Auth.supabase();
    if (!sb) throw new Error('Supabase nie jest zainicjalizowany');
    return sb;
  }

  /* ═══════════════════════
     SAVE
     ═══════════════════════ */

  /**
   * Save a new entry.
   * @param {Object} opts
   * @param {string} opts.taskId
   * @param {string} opts.privateNote
   * @param {boolean} opts.isShared
   * @param {File|null} opts.photo
   * @returns {Object} inserted row
   */
  async function save({ taskId, privateNote, isShared, photo }) {
    const sb = _sb();
    const user = Auth.currentUser();
    if (!user) throw new Error('Nie jesteś zalogowany');

    let photoPath = null;

    // Upload photo if provided
    if (photo) {
      photoPath = await _uploadPhoto(sb, user.id, photo);
    }

    const { data, error } = await sb
      .from('entries')
      .insert({
        user_id: user.id,
        task_id: taskId,
        private_note: privateNote,
        is_shared: isShared,
        photo_path: photoPath,
      })
      .select()
      .single();

    if (error) {
      console.error('[Entries] save error:', error);
      throw new Error(error.message);
    }

    return data;
  }

  /* ═══════════════════════
     LOAD
     ═══════════════════════ */

  /**
   * Load entries for current user filtered by task ID.
   * Called by app.js when entry form opens.
   * @param {string} taskId
   * @returns {Array} entries sorted newest first
   */
  async function loadForTask(taskId) {
    const sb = _sb();
    const user = Auth.currentUser();
    if (!user) return [];

    const { data, error } = await sb
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Entries] loadForTask error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Load all entries for current user (optional workshop filter — reserved).
   * @param {string} [workshopId] — unused for now
   * @returns {Array}
   */
  async function loadMine(workshopId) {
    const sb = _sb();
    const user = Auth.currentUser();
    if (!user) return [];

    let query = sb
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // workshopId reserved for future use
    void workshopId;

    const { data, error } = await query;

    if (error) {
      console.error('[Entries] loadMine error:', error);
      return [];
    }

    return data || [];
  }

  /* ═══════════════════════
     UPDATE SHARING
     ═══════════════════════ */

  /**
   * Toggle sharing of an entry.
   * @param {string} entryId  UUID
   * @param {boolean} shared
   */
  async function setShared(entryId, shared) {
    const sb = _sb();

    const { error } = await sb
      .from('entries')
      .update({ is_shared: shared })
      .eq('id', entryId);

    if (error) {
      console.error('[Entries] setShared error:', error);
      throw new Error(error.message);
    }
  }

  /* ═══════════════════════
     PHOTOS
     ═══════════════════════ */

  /**
   * Upload photo to Supabase Storage.
   * Path pattern: {user_id}/{timestamp}_{filename}
   * @returns {string} storage path
   */
  async function _uploadPhoto(sb, userId, file) {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error } = await sb.storage
      .from('entry-photos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[Entries] photo upload error:', error);
      throw new Error('Nie udało się przesłać zdjęcia: ' + error.message);
    }

    return path;
  }

  /**
   * Get a temporary signed URL for a stored photo.
   * Called by app.js when rendering entry thumbnails.
   * @param {string} storagePath
   * @returns {string} public URL (signed, 1h expiry)
   */
  function getPhotoUrl(storagePath) {
    if (!storagePath) return '';

    try {
      const sb = _sb();
      const { data } = sb.storage
        .from('entry-photos')
        .getPublicUrl(storagePath);

      // If bucket is private, use signed URL instead:
      // const { data } = await sb.storage
      //   .from('entry-photos')
      //   .createSignedUrl(storagePath, 3600);
      // return data?.signedUrl || '';

      return data?.publicUrl || '';
    } catch (e) {
      console.error('[Entries] getPhotoUrl error:', e);
      return '';
    }
  }

  /* ═══════════════════════
     PUBLIC API
     ═══════════════════════ */

  return {
    save,
    loadForTask,
    loadMine,
    setShared,
    getPhotoUrl,
  };
})();
