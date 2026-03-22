/**
 * auth.js — logowanie Google przez Supabase Auth
 * 
 * PLACEHOLDER — integracja Supabase zostanie dodana w następnej sesji.
 * Na razie eksportuje minimalny interfejs, żeby reszta kodu mogła
 * sprawdzać stan logowania bez błędów.
 */

// eslint-disable-next-line no-unused-vars
const Auth = (() => {
  let _user = null;

  /** Check if a user is logged in */
  function isLoggedIn() {
    return _user !== null;
  }

  /** Get current user (or null) */
  function currentUser() {
    return _user;
  }

  /**
   * Initialize auth state.
   * Will connect to Supabase in future version.
   */
  async function init() {
    // TODO: Supabase auth initialization
    // const { data } = await supabase.auth.getSession();
    // _user = data.session?.user ?? null;
    _user = null;
  }

  /**
   * Sign in with Google.
   * Will trigger Supabase OAuth in future version.
   */
  async function signInWithGoogle() {
    // TODO: Supabase Google OAuth
    // const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    console.log('[Auth] Google sign-in not yet implemented');
  }

  /** Sign out */
  async function signOut() {
    // TODO: Supabase sign out
    _user = null;
  }

  return { isLoggedIn, currentUser, init, signInWithGoogle, signOut };
})();
