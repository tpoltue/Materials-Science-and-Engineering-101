/* ===============================================================
   Ch6_Mechanical_Properties_gates.js — Snap-in gating for Ch.6
   ---------------------------------------------------------------
   Loads Types panel stays fully free. Gate ONLY the tensile-test
   animation Play button on the right panel (all materials).

   REQUIRES: auth.js loaded before this script.

   ANCHORS:
     • .back-btn               — back link to wrap
     • #btn-play               — Play / Pause button on tensile tab
     • #panel-tensile          — tensile panel (gate only active here)
   =============================================================== */

(function () {
  if (!window.AuthMock) {
    console.error('Ch6 gates: AuthMock not found. Load auth.js first.');
    return;
  }

  function isTensileTab() {
    const p = document.getElementById('panel-tensile');
    return !!(p && p.classList.contains('active'));
  }

  function init() {
    AuthMock.initChapterPage();

    AuthMock.gatePlayButton('#btn-play', {
      title: 'Tensile test animation',
      body:  'Watch the specimen deform through elastic, yield, UTS, and fracture.',
      whenActive: isTensileTab,
      lockedInputs: ['#scrub'],
      runPreview: () => {
        // Ch.6 doesn't expose togglePlay globally; dispatch a synthetic
        // click marked with __proSynthetic so our own gate lets it through.
        const btn = document.getElementById('btn-play');
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
