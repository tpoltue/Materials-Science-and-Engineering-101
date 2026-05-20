/* ===============================================================
   Ch4_Imperfections_gates.js — Snap-in pro-gating layer for Ch.4
   ---------------------------------------------------------------
   PURPOSE: Edge dislocation stays fully free. For the SCREW
   dislocation only, gate:
     - Play button (deforming animation)
     - Trace b button (Burgers circuit animation)
     - "Dislocation line (screw axis)" toggle
     - "Burgers vector b" toggle

   The play buttons are shared across edge & screw modes, so each
   gate is conditional on screw mode being active.

   The visibility toggles are rebuilt dynamically by the chapter
   (rebuildToggles()), so we use a MutationObserver to re-apply
   the gate every time the toggle list refreshes.

   REQUIRES: auth.js loaded before this script.

   ANCHORS (stable contract with the chapter HTML):
     • .back-btn               — back link to wrap
     • #playBtn                — formation play button
     • #circuitPlayBtn         — Burgers circuit play button
     • #sec-screw              — screw section container
     • #togs                   — toggles container (children re-rendered)
     • window.togglePlay       — chapter's play toggle function
     • window.circuitToggle    — chapter's circuit toggle function
   =============================================================== */

(function () {
  if (!window.AuthMock) {
    console.error('Ch4_Imperfections_gates.js: AuthMock not found. Load auth.js first.');
    return;
  }

  function isScrewMode() {
    const sec = document.getElementById('sec-screw');
    return !!(sec && sec.classList.contains('active'));
  }

  function init() {
    AuthMock.initChapterPage();

    // ─── Gate the play buttons (only when on screw section) ─────────
    AuthMock.gatePlayButton('#playBtn', {
      title: 'Screw dislocation animation',
      body:  'Watch the lattice shear into a spiral around the screw axis.',
      whenActive: isScrewMode,
      lockedInputs: ['#tSlider'],
      runPreview: () => {
        if (typeof window.togglePlay === 'function') window.togglePlay();
      }
    });

    AuthMock.gatePlayButton('#circuitPlayBtn', {
      title: 'Burgers circuit trace (screw)',
      body:  'Trace the helical Burgers circuit that closes with a vertical offset.',
      whenActive: isScrewMode,
      lockedInputs: ['#circuitSlider'],
      runPreview: () => {
        if (typeof window.circuitToggle === 'function') window.circuitToggle();
      }
    });

    // ─── Gate the screw-mode visibility toggles via MutationObserver ──
    // The chapter rebuilds the toggle rows whenever mode changes. We
    // re-apply gates after each rebuild, scoped to screw mode only.
    const togsContainer = document.getElementById('togs');
    if (togsContainer) {
      const applyToggleGates = () => {
        if (!isScrewMode()) return;  // edge mode → leave toggles free
        Array.from(togsContainer.querySelectorAll('.tog-row')).forEach(row => {
          const labelEl = row.querySelector('.tog-lbl span:last-child');
          if (!labelEl) return;
          const label = labelEl.textContent.trim();
          const shouldGate = label.startsWith('Dislocation line') ||
                             label.startsWith('Burgers vector');
          if (!shouldGate) return;
          if (row.dataset.proGated === '1') return;
          row.dataset.proGated = '1';

          // Add lock badge
          if (!row.querySelector('.pro-lock-inline')) {
            const lock = document.createElement('span');
            lock.className = 'pro-lock-inline';
            lock.textContent = '🔒';
            labelEl.parentElement.appendChild(lock);
          }

          // Wrap the chapter's onclick handler
          const originalOnclick = row.onclick;
          row.onclick = function (e) {
            if (AuthMock.isProUser()) {
              if (originalOnclick) originalOnclick.call(row, e);
              return;
            }
            AuthMock.showPaywall({
              title: 'Screw dislocation toggles',
              body:  'See the dislocation line and Burgers vector on the screw spiral.',
              price: '฿199'
            });
          };
        });
      };

      // Initial pass (in case toggles already exist when we run)
      applyToggleGates();

      // Re-apply on every rebuild
      new MutationObserver(applyToggleGates).observe(togsContainer, { childList: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
