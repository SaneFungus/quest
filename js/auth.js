/**
 * auth.js — logowanie Magic Link przez Supabase Auth
 * 
 * Student wpisuje email → dostaje link → klika → zalogowany.
 * Zero haseł, zero Google, działa z każdym mailem.
 * 
 * Zależy od: SUPABASE_CONFIG (config.js), supabase-js (CDN w index.html)
 */

// eslint-disable-next-line no-unused-vars
const Auth = (() => {
  let _supabase = null;
  let _user = null;
  let _listeners = [];

  /** Initialize Supabase client and listen for auth changes */
  async function init() {
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.warn('[Auth] supabase-js not loaded — auth disabled');
      return;
    }

    _supabase = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey
    );

    _supabase.auth.onAuthStateChange((event, session) => {
      const prev = _user;
      _user = session?.user ?? null;
      console.log('[Auth]', event, _user?.email ?? 'anonymous');

      if (prev !== _user) {
        _listeners.forEach(fn => {
          try { fn(_user, event); } catch (e) { console.error('[Auth] listener error', e); }
        });
      }
    });

    try {
      const { data } = await _supabase.auth.getSession();
      _user = data.session?.user ?? null;
    } catch (e) {
      console.error('[Auth] getSession failed', e);
    }
  }

  function isLoggedIn() { return _user !== null; }
  function currentUser() { return _user; }
  function getSupabase() { return _supabase; }

  /**
   * Send magic link to email.
   * @param {string} email
   * @returns {{ error: string|null }}
   */
  async function sendMagicLink(email) {
    if (!_supabase) return { error: 'Supabase not initialized' };

    const { error } = await _supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      }
    });

    if (error) {
      console.error('[Auth] Magic link error:', error.message);
      return { error: error.message };
    }

    return { error: null };
  }

  async function signOut() {
    if (!_supabase) return;
    const { error } = await _supabase.auth.signOut();
    if (error) console.error('[Auth] Sign-out error:', error.message);
    _user = null;
  }

  function onAuthChange(fn) {
    _listeners.push(fn);
  }

  return {
    init,
    isLoggedIn,
    currentUser,
    supabase: getSupabase,
    sendMagicLink,
    signOut,
    onAuthChange,
  };
})();
