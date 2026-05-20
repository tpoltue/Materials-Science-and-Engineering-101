/* ===============================================================
   Ch9_Phase_Diagrams_gates.js — Snap-in pro-gating for Ch.9
   ---------------------------------------------------------------
   Per the gating spec:
     • Microstructure card  → pro (every diagram). Whole card locked
       behind a pro-card overlay.
     • Lever-rule percentages (the .frac rows inside #lever-endpoints)
       → pro. The graphical bar (#lever-bar) and composition (#readout-c)
       stay free.
     • Fe-C zoom buttons (#zoom-toggle-high, #zoom-toggle-low) → pro
       (only visible on the Fe-C tab; gate fires when they're clicked).

   REQUIRES: auth.js loaded before this script.

   ANCHORS:
     • .back-btn
     • #micro                 — microstructure canvas (we walk up to .card)
     • #lever-endpoints       — container that's re-rendered each frame
     • .frac                  — child rows holding the actual %
     • #zoom-toggle-high      — Fe-C "Zoom: low-C, high-T" button
     • #zoom-toggle-low       — Fe-C "Zoom: low-C, low-T" button
   =============================================================== */

(function () {
  if (!window.AuthMock) {
    console.error('Ch9 gates: AuthMock not found. Load auth.js first.');
    return;
  }

  function init() {
    AuthMock.initChapterPage();

    // ─── Microstructure card: panel-level lock ──────────────────────
    const microCanvas = document.getElementById('micro');
    const microCard = microCanvas && microCanvas.closest('.card');
    if (microCard) {
      AuthMock.makeProCard(microCard, 'ch9_microstructure', {
        title: 'Pro · Microstructure',
        sub:   'See how the microstructure evolves as you scan composition and temperature.'
      });
    }

    // Wire the overlay's Unlock button (and any other .pro-card on the page).
    AuthMock.setupProGates();

    // ─── Lever-rule numbers: blur both .frac and .comp values ─────
    // .frac shows the phase fraction percentages, and .comp shows the
    // endpoint compositions c_α and c_β. Both are needed to compute
    // the lever rule, so both must be blurred — otherwise a free user
    // could back-calculate the fractions from c, c_α, c_β.
    // Container is re-rendered on every drag, so we use the
    // childSelector mode which observes mutations.
    AuthMock.gateNumber('#lever-endpoints', {
      childSelector: '.frac, .comp',
      title: 'Pro · Lever-rule values',
      body:  'See the exact phase fractions and endpoint compositions at the current tie line.'
    });

    // Add a 🔒 to the "Tie Line & Lever Rule" section heading so the
    // pro affordance is explicit (the blur alone could read as a bug).
    const leverHeading = document.querySelector('.lever-section h4');
    if (leverHeading && !leverHeading.querySelector('.pro-lock-inline')) {
      const lock = document.createElement('span');
      lock.className = 'pro-lock-inline';
      lock.textContent = '🔒';
      leverHeading.appendChild(lock);
    }

    // ─── Fe-C zoom buttons: instant paywall on click ───────────────
    AuthMock.gatePlayButton('#zoom-toggle-high', {
      title: 'Pro · Fe–C zoom (low-C, high-T)',
      body:  'Inspect the eutectic / peritectic region in detail.'
    });
    AuthMock.gatePlayButton('#zoom-toggle-low', {
      title: 'Pro · Fe–C zoom (low-C, low-T)',
      body:  'Inspect the eutectoid region in detail.'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
