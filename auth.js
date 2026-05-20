/* ===============================================================
   auth.js — Freemium gating layer (PROOF OF CONCEPT — MOCKED)
   ---------------------------------------------------------------
   This module simulates the full Firebase Auth + Firestore + Stripe
   flow using localStorage so the UX can be tested without any
   accounts, credentials, or network calls.

   WHAT'S MOCKED vs. WHAT'S REAL (for the production wiring):
     • User identity    → localStorage 'mock_auth_user'
       REAL: firebase.auth().currentUser  (Firebase Authentication)
     • Pro entitlement  → localStorage 'mock_auth_pro'
       REAL: /users/{uid}.pro field in Firestore, gated by rules
     • Payment          → unlockPro() just flips the flag
       REAL: Stripe Checkout → webhook → Cloud Function → Firestore

   Every place that needs replacement is marked with `// REAL:`.
   =============================================================== */

(function () {
  /* ─── Firebase project config ────────────────────────────────
     These keys are public — they identify the project, not authorize
     access. Access is enforced by Firestore Security Rules server-side. */
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCNttftRRePOiZiYoYbCk7LYAyZjLTyNzg",
    authDomain: "tpoltue-2b68e.firebaseapp.com",
    projectId: "tpoltue-2b68e",
    storageBucket: "tpoltue-2b68e.firebasestorage.app",
    messagingSenderId: "320277910502",
    appId: "1:320277910502:web:1b7948cf5d9661e2a77c27"
  };

  const FIREBASE_VERSION = '10.13.0';
  const FIREBASE_SCRIPTS = [
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`,
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth-compat.js`,
    `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore-compat.js`,
  ];

  // Local cache of auth + entitlement state. Updated when Firebase
  // resolves onAuthStateChanged and reads /users/{uid} from Firestore.
  // The public API (getCurrentUser, isProUser) reads from these
  // synchronously so the rest of the codebase remains unchanged.
  let cachedUser = null;       // null | { uid, email, displayName }
  let cachedPro  = false;      // boolean
  let firebaseReady = false;
  const onReadyCallbacks = [];

  function onAuthReady(fn) {
    if (firebaseReady) fn();
    else onReadyCallbacks.push(fn);
  }

  // Load Firebase SDK scripts sequentially, then initialize.
  (async function bootFirebase() {
    try {
      for (const src of FIREBASE_SCRIPTS) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = resolve;
          s.onerror = () => reject(new Error('Failed to load ' + src));
          document.head.appendChild(s);
        });
      }

      firebase.initializeApp(FIREBASE_CONFIG);
      const auth = firebase.auth();
      const db   = firebase.firestore();

      auth.onAuthStateChanged(async (user) => {
        if (user) {
          cachedUser = {
            uid: user.uid,
            email: user.email || '(no email)',
            displayName: user.displayName || null
          };
          try {
            const ref  = db.collection('users').doc(user.uid);
            const snap = await ref.get();
            if (snap.exists) {
              cachedPro = !!snap.data().pro;
            } else {
              // First sign-in: create the user doc with pro:false.
              // Security rules permit this create only when uid matches.
              await ref.set({
                pro: false,
                email: user.email || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
              });
              cachedPro = false;
            }
          } catch (e) {
            console.error('AuthMock: failed to read /users/' + user.uid, e);
            cachedPro = false;
          }
        } else {
          cachedUser = null;
          cachedPro  = false;
        }

        // Sync DOM-level state for all the gating helpers that read it.
        if (document.body) {
          document.body.classList.toggle('pro-user', cachedPro);
        }
        // Re-render the account widget on any auth state change.
        if (document.getElementById('accountWidget')) {
          renderAccountWidget('accountWidget');
        }

        if (!firebaseReady) {
          firebaseReady = true;
          onReadyCallbacks.forEach(fn => fn());
          onReadyCallbacks.length = 0;
        }
      });
    } catch (e) {
      console.error('AuthMock: Firebase bootstrap failed —', e);
    }
  })();

  /* ─── injected styles for shared UI components ───────────────── */
  const css = `
    /* Account widget — pill height tuned to match stat-column visual weight */
    .account-widget {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: "IBM Plex Sans Thai Looped", -apple-system, sans-serif;
      color: var(--ink, #1a1a1a);
    }
    .account-widget .account-email {
      font-weight: 500; font-size: 13px;
      color: var(--ink, #1a1a1a);
      max-width: 200px; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap;
      line-height: 1;
    }
    .account-widget .account-btn,
    .account-widget .badge-free,
    .account-widget .badge-pro,
    .account-widget .account-signout {
      display: inline-flex; align-items: center; gap: 5px;
      border-radius: 999px;
      font-weight: 700;
      letter-spacing: 1.2px; text-transform: uppercase;
      text-decoration: none; cursor: pointer;
      line-height: 1;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
      font-family: inherit;
    }
    /* Primary CTA — sized to match the visual height of stat columns */
    .account-widget .account-btn {
      padding: 13px 20px;
      font-size: 12.5px;
      border: 1px solid var(--ink, #1a1a1a);
      background: #fff; color: var(--ink, #1a1a1a);
    }
    .account-widget .account-btn:hover { background: var(--ink, #1a1a1a); color: #fff; }
    .account-widget .badge-pro {
      padding: 10px 16px; font-size: 11.5px;
      background: var(--ink, #1a1a1a); color: #fff;
      border: 1px solid var(--ink, #1a1a1a);
      cursor: default;
    }
    .account-widget .badge-free {
      padding: 10px 16px; font-size: 11.5px;
      background: #fffbe6; color: #6b5800;
      border: 1px solid #d9c560;
    }
    .account-widget .badge-free:hover { background: #ffeb99; }
    .account-widget .account-signout {
      padding: 9px 12px; font-size: 13px;
      color: var(--ink-soft, #666);
      border: 1px solid var(--line, rgba(26,26,26,0.10));
      background: transparent;
    }
    .account-widget .account-signout:hover {
      background: var(--ink, #1a1a1a); color: #fff; border-color: var(--ink, #1a1a1a);
    }

    /* Pro lock badge for gated UI elements (tabs, cards, etc.) */
    .pro-lock {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 9px; font-weight: 700; letter-spacing: 1px;
      padding: 2px 6px; border-radius: 999px;
      background: #1a1a1a; color: #fff;
      margin-left: 6px; vertical-align: middle;
      line-height: 1.3;
    }
    .pro-lock::before {
      content: "🔒"; font-size: 8px;
    }

    /* ─── Universal top-bar (back button + account widget) ────────── */
    .top-bar {
      display: flex; align-items: center; justify-content: space-between;
      gap: 14px; margin-bottom: 18px; flex-wrap: wrap;
    }
    .top-bar .back-btn { margin-bottom: 0 !important; }

    /* ─── Pro-gated content (panel-level lock — click Unlock to pay) ─── */
    .pro-card {
      position: relative;
    }
    /* Overlay covers the gated content for non-pro users */
    .pro-overlay {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      border-radius: inherit;
      text-align: center;
      padding: 16px;
      z-index: 10;
      font-family: "IBM Plex Sans Thai Looped", sans-serif;
    }
    .pro-overlay-title {
      font-size: 13px; font-weight: 700;
      letter-spacing: 0.5px; text-transform: uppercase;
      color: var(--ink, #1a1a1a);
    }
    .pro-overlay-sub {
      font-size: 11.5px; color: var(--ink-soft, #666);
      line-height: 1.4; max-width: 260px;
    }
    .pro-overlay-actions {
      display: flex; gap: 8px; margin-top: 4px;
      flex-wrap: wrap; justify-content: center;
    }
    .pro-unlock-btn {
      border: 1px solid var(--ink, #1a1a1a);
      background: var(--ink, #1a1a1a); color: #fff;
      padding: 7px 13px; border-radius: 999px;
      font-size: 10.5px; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase;
      cursor: pointer; text-decoration: none;
      font-family: inherit;
      transition: background 0.15s, color 0.15s, border-color 0.15s;
    }
    .pro-unlock-btn:hover { background: #2a2a2c; }

    /* Pro users see everything — overlays hide entirely */
    body.pro-user .pro-overlay { display: none !important; }

    /* Inline lock badge for gated single controls (e.g., checkbox labels) */
    .pro-lock-inline {
      display: inline-block;
      margin-left: 6px;
      font-size: 11px;
      vertical-align: middle;
      opacity: 0.65;
    }
    body.pro-user .pro-lock-inline { display: none; }

    /* CSS-only lock indicator for buttons whose textContent gets
       rewritten by the chapter's own JS (e.g., "▶ Play" ⇄ "⏸ Pause").
       Survives textContent reassignment because ::after is a pseudo. */
    .pro-gated-btn::after {
      content: "🔒";
      display: inline-block;
      margin-left: 6px;
      font-size: 12px;
      vertical-align: middle;
      opacity: 0.7;
    }
    body.pro-user .pro-gated-btn::after { display: none; }

    /* Blurred numeric value — keep layout / surrounding visuals intact
       (e.g., the lever-rule bar stays visible) but hide the actual digit
       behind a CSS blur. Clicking the blur opens the paywall. */
    .pro-num-blur {
      filter: blur(4.5px);
      user-select: none;
      cursor: pointer !important;
      transition: filter 0.15s;
    }
    .pro-num-blur:hover {
      filter: blur(3.5px);
    }
    body.pro-user .pro-num-blur {
      filter: none;
      cursor: default !important;
      user-select: auto;
    }

    /* Belt-and-braces locked input: native disabled + CSS pointer-events.
       Separate rules per vendor prefix — combining them in one selector
       list makes the engine discard the whole rule if one selector is
       not recognised. */
    .pro-gated-input {
      pointer-events: none !important;
      opacity: 0.5 !important;
      cursor: not-allowed !important;
      filter: grayscale(0.6);
    }
    .pro-gated-input::-webkit-slider-thumb {
      pointer-events: none !important;
    }
    .pro-gated-input::-moz-range-thumb {
      pointer-events: none !important;
    }
    .pro-gated-input::-webkit-slider-runnable-track {
      pointer-events: none !important;
    }
    .pro-gated-input::-moz-range-track {
      pointer-events: none !important;
    }

    /* Overlay used by gated content (full-screen modal) */
    .pro-paywall-backdrop {
      position: fixed; inset: 0; background: rgba(15,15,16,0.55);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; z-index: 2000;
    }
    .pro-paywall {
      background: #fff; border-radius: 18px;
      max-width: 420px; width: 100%;
      padding: 28px 26px 22px;
      box-shadow: 0 30px 80px -20px rgba(0,0,0,0.4);
      border: 1px solid rgba(26,26,26,0.10);
      text-align: center;
      font-family: "IBM Plex Sans Thai Looped", sans-serif;
    }
    .pro-paywall h3 {
      font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.6px; font-size: 16px;
      margin: 0 0 8px;
    }
    .pro-paywall p {
      color: #666; font-size: 13.5px; margin: 0 0 18px;
      line-height: 1.5;
    }
    .pro-paywall .price {
      font-size: 28px; font-weight: 700; color: #1a1a1a;
      margin: 4px 0 18px;
    }
    .pro-paywall .pp-actions { display: flex; gap: 10px; justify-content: center; }
    .pro-paywall button {
      border: none; padding: 10px 20px; border-radius: 10px;
      font: inherit; font-size: 12.5px; font-weight: 700;
      letter-spacing: 1px; text-transform: uppercase;
      cursor: pointer;
    }
    .pro-paywall .pp-cancel {
      background: #fff; color: #1a1a1a;
      border: 1px solid rgba(26,26,26,0.18);
    }
    .pro-paywall .pp-cta {
      background: #1a1a1a; color: #fff;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ─── core state accessors (Firebase-backed, sync API preserved) ───
     Reads return cached values populated by the onAuthStateChanged
     handler above. On first page load before Firebase resolves, the
     cache is empty → getCurrentUser() === null, isProUser() === false,
     and the gating helpers correctly apply locked state. When Firebase
     resolves, the cache fills + the body.pro-user class flips, CSS
     auto-updates, and the polling intervals pick up the change. */
  function getCurrentUser() {
    return cachedUser;
  }

  function isProUser() {
    return cachedPro;
  }

  // Sign in with Google popup. Used by the "Continue with Google" button
  // on login.html. Returns the Firebase user on success.
  async function signInWithGoogle() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      throw new Error('Firebase Auth not loaded yet. Try again in a second.');
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebase.auth().signInWithPopup(provider);
    return result.user;
  }

  // Sign in / sign up with email + password. Tries sign-in first; if the
  // account doesn't exist, creates it. Used by the email form on login.html.
  async function signIn(email, password) {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      throw new Error('Firebase Auth not loaded yet. Try again in a second.');
    }
    const auth = firebase.auth();
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      return result.user;
    } catch (e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        const result = await auth.createUserWithEmailAndPassword(email, password);
        return result.user;
      }
      throw e;
    }
  }

  async function signOut() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      await firebase.auth().signOut();
    }
  }

  // Pro unlock — DEFERRED until Stripe is wired.
  // Until then, the unlock.html page shows manual-grant instructions and
  // Mark flips /users/{uid}.pro = true in the Firestore console after
  // verifying the PromptPay receipt. The Firestore security rules block
  // any client from writing the pro flag, so this function intentionally
  // does nothing payment-related.
  async function unlockPro() {
    throw new Error(
      'Automatic unlock is not yet enabled. Follow the instructions on the unlock page to upgrade.'
    );
  }

  /* ─── navigation guards ─────────────────────────────────────── */
  function requireAuth(returnUrl) {
    if (!getCurrentUser()) {
      window.location.href = 'login.html?return=' +
        encodeURIComponent(returnUrl || window.location.href);
      return false;
    }
    return true;
  }

  function requirePro(returnUrl) {
    if (!requireAuth(returnUrl)) return false;
    if (!isProUser()) {
      window.location.href = 'unlock.html?return=' +
        encodeURIComponent(returnUrl || window.location.href);
      return false;
    }
    return true;
  }

  /* ─── UI: account widget (header pill) ──────────────────────── */
  function renderAccountWidget(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.classList.add('account-widget');

    const user = getCurrentUser();
    const pro  = isProUser();
    const ret  = encodeURIComponent(window.location.href);

    // Keep body class in sync so all CSS pro-gates resolve correctly.
    if (document.body) document.body.classList.toggle('pro-user', pro);

    if (!user) {
      el.innerHTML =
        `<a class="account-btn" href="login.html?return=${ret}">Sign in</a>`;
      return;
    }
    const badge = pro
      ? `<span class="badge-pro">Pro</span>`
      : `<a class="badge-free" href="unlock.html?return=${ret}">Free · Unlock</a>`;
    el.innerHTML = `
      <span class="account-email">${user.email}</span>
      ${badge}
      <button class="account-signout" type="button" aria-label="Sign out">↪</button>
    `;
    el.querySelector('.account-signout').addEventListener('click', async () => {
      await signOut();
      window.location.reload();
    });
  }

  /* ─── UI: paywall modal for inline gating ──────────────────── */
  function showPaywall(opts) {
    opts = opts || {};
    const title = opts.title  || 'Pro Feature';
    const body  = opts.body   || 'This visualizer is part of the Pro tier.';
    const price = opts.price  || '฿199';
    const ret   = encodeURIComponent(window.location.href);

    const back = document.createElement('div');
    back.className = 'pro-paywall-backdrop';
    back.innerHTML = `
      <div class="pro-paywall" role="dialog" aria-modal="true">
        <h3>${title}</h3>
        <p>${body}</p>
        <div class="price">${price} · One-time unlock</div>
        <div class="pp-actions">
          <button type="button" class="pp-cancel">Cancel</button>
          <button type="button" class="pp-cta">${getCurrentUser() ? 'Unlock' : 'Sign in to unlock'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(back);

    back.querySelector('.pp-cancel').addEventListener('click', () => back.remove());
    back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
    back.querySelector('.pp-cta').addEventListener('click', () => {
      const next = getCurrentUser() ? 'unlock.html' : 'login.html';
      window.location.href = `${next}?return=${ret}`;
    });
  }

  /* ─── Global event-level guard for any .pro-gated-input ──────
     Belt-and-braces backup to the CSS pointer-events rule and native
     disabled attribute. Captures pointerdown / touchstart / keydown /
     input in the capture phase before any chapter handler can run. */
  let proInputGuardInstalled = false;
  function installProInputGuard() {
    if (proInputGuardInstalled) return;
    proInputGuardInstalled = true;
    const stop = (e) => {
      const t = e.target;
      if (!t || !t.classList || !t.classList.contains('pro-gated-input')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    ['pointerdown', 'touchstart', 'mousedown', 'keydown', 'input', 'change']
      .forEach(type => document.body.addEventListener(type, stop, true));
  }

  /* ─── Pro-state body class (drives CSS overlay show/hide) ───── */
  function syncProBodyClass() {
    if (!document.body) return;
    document.body.classList.toggle('pro-user', isProUser());
  }

  /* ─── Universal chapter-page init ───────────────────────────────
     Wraps the chapter's .back-btn in a .top-bar, injects #accountWidget,
     renders it, and syncs the pro-user body class. Idempotent. Called
     once per chapter from that chapter's gates.js file. */
  function initChapterPage(opts) {
    opts = opts || {};
    const backBtnSelector = opts.backBtnSelector || '.back-btn';
    const backBtn = document.querySelector(backBtnSelector);

    if (backBtn && !backBtn.closest('.top-bar')) {
      const topBar = document.createElement('div');
      topBar.className = 'top-bar';
      backBtn.parentNode.insertBefore(topBar, backBtn);
      topBar.appendChild(backBtn);

      const widget = document.createElement('div');
      widget.id = 'accountWidget';
      topBar.appendChild(widget);
    } else if (backBtn && !document.getElementById('accountWidget')) {
      const widget = document.createElement('div');
      widget.id = 'accountWidget';
      backBtn.closest('.top-bar').appendChild(widget);
    }

    renderAccountWidget('accountWidget');
  }

  /* ─── Programmatically convert any element into a pro-gated card ─
     Adds .pro-card class + injects the overlay. Idempotent — safe to
     call multiple times on the same element. Returns the element. */
  function makeProCard(elementOrSelector, featureId, opts) {
    const el = (typeof elementOrSelector === 'string')
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;
    if (!el) return null;
    if (el.classList.contains('pro-card')) return el;  // already done
    opts = opts || {};

    el.classList.add('pro-card');
    if (featureId) el.dataset.feature = featureId;

    const overlay = document.createElement('div');
    overlay.className = 'pro-overlay';
    overlay.innerHTML = `
      <div class="pro-overlay-title">${opts.title || 'Pro feature'}</div>
      <div class="pro-overlay-sub">${opts.sub || 'Unlock to use this feature.'}</div>
      <div class="pro-overlay-actions">
        <a class="pro-unlock-btn" href="unlock.html">Unlock</a>
      </div>
    `;
    el.appendChild(overlay);
    return el;
  }

  /* ─── Setup pro gates on .pro-card elements ─────────────────── */
  function setupProGates(root) {
    root = root || document;
    syncProBodyClass();
    root.querySelectorAll('.pro-card').forEach(card => {
      if (card.dataset.proWired === '1') return;
      card.dataset.proWired = '1';

      const unlockBtn = card.querySelector('.pro-unlock-btn');
      if (unlockBtn && !unlockBtn.href.includes('return=')) {
        const next = getCurrentUser() ? 'unlock.html' : 'login.html';
        unlockBtn.href = `${next}?return=${encodeURIComponent(location.href)}`;
      }
    });
  }

  /* ─── Gate a play/action button ──────────────────────────────
     Intercepts clicks on a play button. If the gate is active and the
     user is not pro, shows the paywall immediately (no preview). Any
     linked input elements (lockedInputs) are fully disabled — disabled
     attribute, inline pointer-events:none, plus a global capture-phase
     event guard.

     opts:
       title, body  — paywall content
       whenActive   — optional () => boolean. Gate is dormant if false.
       lockedInputs — optional [selector|element, ...] to disable
  */
  function gatePlayButton(elementOrSelector, opts) {
    const btn = (typeof elementOrSelector === 'string')
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;
    if (!btn) return;
    opts = opts || {};

    const lockedInputs = (opts.lockedInputs || []).map(sel =>
      typeof sel === 'string' ? document.querySelector(sel) : sel
    ).filter(Boolean);
    if (lockedInputs.length) installProInputGuard();

    function refreshLockVisibility() {
      const active = opts.whenActive ? !!opts.whenActive() : true;
      const lockNow = active && !isProUser();
      btn.classList.toggle('pro-gated-btn', active);
      lockedInputs.forEach(input => {
        input.disabled = lockNow;
        input.classList.toggle('pro-gated-input', lockNow);
        // Direct inline styles — highest specificity, beats any chapter CSS
        input.style.pointerEvents = lockNow ? 'none' : '';
        input.style.opacity       = lockNow ? '0.45' : '';
        input.style.cursor        = lockNow ? 'not-allowed' : '';
        input.style.filter        = lockNow ? 'grayscale(0.6)' : '';
      });
    }
    refreshLockVisibility();
    if (opts.whenActive || lockedInputs.length) {
      setInterval(refreshLockVisibility, 250);
    }

    // Capture-phase listener on document.body — fires BEFORE any chapter
    // handler. Click → paywall immediately, no preview.
    document.body.addEventListener('click', (e) => {
      if (e.target !== btn && !btn.contains(e.target)) return;
      if (isProUser()) return;
      if (opts.whenActive && !opts.whenActive()) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      showPaywall({
        title: opts.title || 'Pro Feature',
        body:  opts.body  || 'Unlock to use this animation.',
        price: '฿199'
      });
    }, true);
  }

  /* ─── Gate a numeric readout by blurring it ─────────────────
     Two modes:
       (a) Direct: gateNumber('#some-element') → blurs that element.
       (b) Container: gateNumber('#parent', { childSelector: '.frac' })
           → blurs every matching descendant. A MutationObserver
             keeps re-applying as the chapter re-renders children.
     Free user: blurred + cursor:pointer + click → paywall.
     Pro user: filter:none + cursor:default. */
  function gateNumber(elementOrSelector, opts) {
    const el = (typeof elementOrSelector === 'string')
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;
    if (!el) return;
    opts = opts || {};
    const childSel = opts.childSelector || null;

    function applyMask() {
      if (childSel) {
        el.querySelectorAll(childSel).forEach(c => c.classList.add('pro-num-blur'));
      } else {
        el.classList.add('pro-num-blur');
      }
    }
    applyMask();

    // Watch for chapter re-renders of the inner content.
    if (childSel) {
      new MutationObserver(applyMask).observe(el, { childList: true, subtree: true });
    }

    // Click anywhere on the gated region → paywall.
    el.addEventListener('click', (e) => {
      if (isProUser()) return;
      // Only fire if a blurred child was actually the target (for container mode).
      if (childSel) {
        const t = e.target;
        if (!t || !t.classList || !t.classList.contains('pro-num-blur')) return;
      }
      e.preventDefault();
      e.stopImmediatePropagation();
      showPaywall({
        title: opts.title || 'Pro · numeric values',
        body:  opts.body  || 'Unlock to see exact percentages.',
        price: '฿199'
      });
    }, true);
  }

  /* ─── Cap a numeric range input at maxFree for non-pro users ───
     Free user: slider keeps its full visible range so the affordance is
       discoverable. Dragging past maxFree reverts to maxFree and pops
       the paywall (once per drag/keystroke cycle).
     Pro user: no clamping.
     A 🔒 badge is added next to the preceding <label>. */
  function gateRangeLimit(elementOrSelector, maxFree, opts) {
    const input = (typeof elementOrSelector === 'string')
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;
    if (!input) return;
    opts = opts || {};

    // 🔒 badge next to the preceding label, if findable.
    let labelEl = null;
    const row = input.closest('.ctrl-row, .field, label, div');
    if (row) labelEl = row.querySelector('label');
    if (labelEl && !labelEl.querySelector('.pro-lock-inline')) {
      const lock = document.createElement('span');
      lock.className = 'pro-lock-inline';
      lock.textContent = '🔒';
      labelEl.appendChild(lock);
    }

    // Clamp current value if it sits above the free cap on first load.
    if (!isProUser() && parseFloat(input.value) > maxFree) {
      input.value = String(maxFree);
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('change'));
    }

    let paywallCooling = false;
    function maybePaywall() {
      if (paywallCooling) return;
      paywallCooling = true;
      showPaywall({
        title: opts.title || 'Pro: finer grid',
        body:  opts.body  || `Grids above ${maxFree} divisions are pro features.`,
        price: '฿199'
      });
      // ~1.2 s cooldown so a single drag past the cap doesn't fire multiple modals.
      setTimeout(() => { paywallCooling = false; }, 1200);
    }

    input.addEventListener('input', () => {
      if (isProUser()) return;
      if (parseFloat(input.value) > maxFree) {
        input.value = String(maxFree);
        input.dispatchEvent(new Event('change'));
        maybePaywall();
      }
    });
  }

  /* ─── Gate a single checkbox control ────────────────────────
     Free user: checkbox shows 🔒 next to label; clicking it shows the
     paywall immediately. The click is intercepted in the capture phase
     so the checkbox never toggles and chapter handlers never fire.
     Pro user: no-op, native behavior. */
  function gateCheckbox(elementOrSelector, opts) {
    const cb = (typeof elementOrSelector === 'string')
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;
    if (!cb) return;
    opts = opts || {};

    // Inline 🔒 badge appended to the checkbox's label (hidden for pro users via CSS)
    const label = cb.closest('label');
    if (label && !label.querySelector('.pro-lock-inline')) {
      const lock = document.createElement('span');
      lock.className = 'pro-lock-inline';
      lock.textContent = '🔒';
      label.appendChild(lock);
    }

    // Intercept clicks on the checkbox or its label in capture phase.
    // Clicking a <label> that wraps a checkbox also triggers the toggle,
    // so we listen on document.body to catch both target paths.
    document.body.addEventListener('click', (e) => {
      const t = e.target;
      const onCb    = (t === cb);
      const onLabel = !!(label && (t === label || label.contains(t)));
      if (!onCb && !onLabel) return;
      if (isProUser()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      showPaywall({
        title: opts.title || 'Pro Feature',
        body:  opts.body  || 'Unlock to use this control.',
        price: '฿199'
      });
    }, true);
  }

  /* ─── public API ────────────────────────────────────────────── */
  window.AuthMock = {
    getCurrentUser,
    isProUser,
    signIn,
    signInWithGoogle,
    signOut,
    unlockPro,
    requireAuth,
    requirePro,
    renderAccountWidget,
    showPaywall,
    setupProGates,
    syncProBodyClass,
    gateCheckbox,
    gatePlayButton,
    gateRangeLimit,
    gateNumber,
    makeProCard,
    initChapterPage,
    onAuthReady
  };
})();
