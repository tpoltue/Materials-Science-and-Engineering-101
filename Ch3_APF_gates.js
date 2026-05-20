/* ===============================================================
   Ch3_APF_gates.js — Snap-in pro-gating layer for Ch.3 APF
   ---------------------------------------------------------------
   PURPOSE: All pro-gating wiring for this chapter lives here, so
   the chapter HTML can be regenerated freely. As long as element
   IDs / structure stay stable (see "Anchors" below), the gates
   survive chapter content changes.

   REQUIRES: auth.js loaded before this script.

   ANCHORS (stable contract with the chapter HTML):
     • .back-btn                — back link to wrap in .top-bar
     • #deriv                   — Derivation panel (we walk up to .card)
     • .tetra-panel             — HCP c/a derivation 3-panel set
     • #showCropped             — "Crop atoms to cell" checkbox

   If any of these disappear from a regenerated chapter, the gate
   for that feature is silently skipped (no errors).
   =============================================================== */

(function () {
  if (!window.AuthMock) {
    console.error('Ch3_APF_gates.js: AuthMock not found. Load auth.js first.');
    return;
  }

  function init() {
    // 1. Universal chapter setup: wrap back-btn in top-bar + render account widget
    AuthMock.initChapterPage();

    // 2. Gate the Derivation panel (all 4 structures share this card)
    const derivCard = document.getElementById('deriv') &&
                      document.getElementById('deriv').closest('.card');
    if (derivCard) {
      AuthMock.makeProCard(derivCard, 'ch3_apf_derivation', {
        title: 'Pro · See the derivation',
        sub:   'Step-by-step math behind APF for SC, BCC, FCC, HCP.'
      });
    }

    // 3. Gate the HCP c/a derivation panels (only visible on HCP + tetrahedron toggle)
    AuthMock.makeProCard('.tetra-panel', 'ch3_apf_hcp_ca_derivation', {
      title: 'Pro · c/a derivation panels',
      sub:   'See the step-by-step Pythagorean derivation of the ideal c/a ratio.'
    });

    // 4. Wire up overlay click handlers on the cards we just created
    AuthMock.setupProGates();

    // 5. Gate the "Crop atoms to cell" checkbox — 3-second preview pattern
    AuthMock.gateCheckbox('#showCropped', {
      title: 'Crop atoms to cell',
      body:  'See atoms clipped exactly to the unit cell boundary — pro feature.'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
