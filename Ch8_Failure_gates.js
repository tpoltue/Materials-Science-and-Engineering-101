/* ===============================================================
   Ch8_Failure_gates.js — Snap-in gating for Ch.8 Failure
   ---------------------------------------------------------------
   Fatigue / S–N panel stays fully free. Gate ONLY the crack-growth
   animation Play button (all materials).

   REQUIRES: auth.js loaded before this script.

   ANCHORS:
     • .back-btn               — back link to wrap
     • #cgPlay                 — crack-growth Play / Pause button
     • #panel-crackgrowth      — Paris-law panel (gate only active here)
   =============================================================== */

(function () {
  if (!window.AuthMock) {
    console.error('Ch8 gates: AuthMock not found. Load auth.js first.');
    return;
  }

  function isCrackGrowthTab() {
    const p = document.getElementById('panel-crackgrowth');
    return !!(p && p.classList.contains('active'));
  }

  function init() {
    AuthMock.initChapterPage();

    AuthMock.gatePlayButton('#cgPlay', {
      title: 'Crack-growth animation',
      body:  'Watch a sub-critical flaw propagate by the Paris law to final rupture.',
      whenActive: isCrackGrowthTab,
      lockedInputs: ['#cgScrub'],
      runPreview: () => {
        // Chapter uses inline addEventListener, no global toggle exposed.
        // Dispatch a synthetic click with the bypass marker.
        const btn = document.getElementById('cgPlay');
        if (!btn) return;
        const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
        ev.__proSynthetic = true;
        btn.dispatchEvent(ev);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
