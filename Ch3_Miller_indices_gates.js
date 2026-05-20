/* ===============================================================
   Ch3_Miller_indices_gates.js — Snap-in pro-gating for Ch.3 Miller
   ---------------------------------------------------------------
   Per the gating spec:
     • Grid divisions slider → free user limited to max 2 (pro: 12)
     • "Show origin cell" checkbox → pro only
     • Animation step buttons (Play / Prev / Next) → pro only
   Direction and plane visualizers themselves stay fully free —
   every (hkl)/[uvw] configuration remains reachable.

   REQUIRES: auth.js loaded before this script.

   ANCHORS:
     • .back-btn          — back link to wrap
     • #snapSlider        — grid divisions range input (1..12)
     • #show-src-cell     — "Show origin cell" checkbox
     • #anim-play         — Play / Pause animation button
     • #anim-prev         — Prev step button
     • #anim-next         — Next step button
   =============================================================== */

(function () {
  if (!window.AuthMock) {
    console.error('Ch3 Miller gates: AuthMock not found. Load auth.js first.');
    return;
  }

  function init() {
    AuthMock.initChapterPage();

    // Cap grid divisions slider at 2 for non-pro users.
    AuthMock.gateRangeLimit('#snapSlider', 2);

    // Gate the "Show origin cell" checkbox.
    AuthMock.gateCheckbox('#show-src-cell', {
      title: 'Show origin cell',
      body:  'See the neighbouring cell where each direction or plane originates.'
    });

    // Gate the animation step buttons (free user sees only the final state).
    AuthMock.gatePlayButton('#anim-play', {
      title: 'Translation animation',
      body:  'Step through the translation from origin to its in-cell position.'
    });
    AuthMock.gatePlayButton('#anim-prev', {
      title: 'Translation animation',
      body:  'Step through the translation from origin to its in-cell position.'
    });
    AuthMock.gatePlayButton('#anim-next', {
      title: 'Translation animation',
      body:  'Step through the translation from origin to its in-cell position.'
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
