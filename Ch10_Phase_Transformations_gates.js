/* ===============================================================
   Ch10_Phase_Transformations_gates.js — Snap-in pro-gating
   ---------------------------------------------------------------
   Per the gating spec:
     • Microstructure card → pro for both modes.
     • Phase-fraction numbers → pro (graphical bar stays free).
     • 4-point path shape → pro (3-point stays free).

   REQUIRES: auth.js loaded before this script.

   ANCHORS:
     • .back-btn
     • #micro                       — microstructure canvas (we walk up to .card)
     • #lever-endpoints             — phase-fraction container (re-rendered)
     • .frac, .comp                 — number rows inside it
     • #lever-head                  — "Phase fractions" heading (textContent rewritten)
     • button[data-shape="4pt"]    — 4-point path-shape toggle
   =============================================================== */

(function () {
  if (!window.AuthMock) {
    console.error('Ch10 gates: AuthMock not found. Load auth.js first.');
    return;
  }

  function init() {
    AuthMock.initChapterPage();

    // ─── Microstructure card: panel-level lock ──────────────────────
    const microCanvas = document.getElementById('micro');
    const microCard = microCanvas && microCanvas.closest('.card');
    if (microCard) {
      AuthMock.makeProCard(microCard, 'ch10_microstructure', {
        title: 'Pro · Microstructure',
        sub:   'See how the microstructure evolves along the TTT / CCT path.'
      });
    }
    AuthMock.setupProGates();

    // ─── Phase-fraction numbers: blur .frac and .comp values ───────
    AuthMock.gateNumber('#lever-endpoints', {
      childSelector: '.frac, .comp',
      title: 'Pro · Phase fractions',
      body:  'See the exact phase fractions at the current playhead position.'
    });

    // Add 🔒 to the "Phase fractions" section heading. The chapter
    // rewrites textContent on this element, but the ::after pseudo
    // injected by .pro-gated-btn survives textContent reassignment.
    const leverHead = document.getElementById('lever-head');
    if (leverHead) leverHead.classList.add('pro-gated-btn');

    // ─── 4-point path shape: instant paywall on click ──────────────
    AuthMock.gatePlayButton('button[data-shape="4pt"]', {
      title: 'Pro · 4-point heat-treatment path',
      body:  'Model more complex schedules (e.g. quench → temper → soak) with a 4th control point.'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
