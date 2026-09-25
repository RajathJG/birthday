/* ===========================================================================
   NITALI — Annual Review FY26
   ---------------------------------------------------------------------------
   Five independent pieces, each set up by its own function and each a no-op
   if the markup it needs is absent. Nothing here depends on anything else
   having run, so a failure in one never takes the page down with it.
   ======================================================================== */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --- The loading run -------------------------------------------------------
 * The page underneath is already final. This only drives the rule, the
 * percentage, and the one class that releases the chrome.
 *
 * The tasks are not real work — they are the joke, paced so each one is
 * readable before it is replaced.
 */
function setupLoader() {
  const loader = document.querySelector('[data-loader]');
  const fill   = document.querySelector('[data-loader-fill]');
  const pct    = document.querySelector('[data-loader-pct]');
  const task   = document.querySelector('[data-loader-task]');
  if (!loader || !fill || !pct || !task) { document.body.classList.remove('is-loading'); return; }

  const tasks = [
    'Establishing connection',
    'Indexing snarky remarks',
    'Cross-referencing gym attendance',
    'Detecting Playboy vibes',
    'Counting unshared desserts',
    'Verifying Gen-Z credentials',
    'Compiling findings',
  ];

  const finish = () => {
    if (document.body.classList.contains('is-loading') === false) return;
    pct.textContent = '100';
    fill.style.width = '100%';
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    // taken out of the flow once it has faded, so it can never trap a tap
    window.setTimeout(() => { loader.style.display = 'none'; }, 500);
  };

  if (prefersReducedMotion()) { finish(); return; }

  const DURATION = 2600;
  const start = performance.now();
  let lastTask = -1;

  const step = (now) => {
    // eased so the run decelerates into 100 rather than stopping dead
    const raw = Math.min(1, (now - start) / DURATION);
    const eased = 1 - Math.pow(1 - raw, 2.2);

    pct.textContent = String(Math.round(eased * 100)).padStart(3, '0');
    fill.style.width = `${eased * 100}%`;

    const i = Math.min(tasks.length - 1, Math.floor(raw * tasks.length));
    if (i !== lastTask) { task.textContent = tasks[i]; lastTask = i; }

    if (raw < 1) requestAnimationFrame(step); else finish();
  };
  requestAnimationFrame(step);

  // the failsafe in JS as well as CSS: if a frame never lands, release anyway
  window.setTimeout(finish, DURATION + 2500);
}

/* --- The reveal band -------------------------------------------------------
 * A vertical band of pure black tracks the pointer across the shell. Inside
 * it the page renders inverted.
 *
 * The inverted layer is a CLONE of the base layer rather than a second copy
 * written by hand: the two have to stay pixel-identical, and any hand-written
 * duplicate drifts the first time someone edits one of them and not the other.
 * The clone is inert — no ids, no focusable children, hidden from the
 * accessibility tree — so it is decoration and nothing else.
 */
function setupReveal() {
  const shell = document.querySelector('[data-reveal]');
  const base  = document.querySelector('[data-reveal-base]');
  if (!shell || !base) return;
  if (window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

  const clone = base.cloneNode(true);
  clone.classList.remove('reveal__layer--base');
  clone.classList.add('reveal__layer--reveal');
  clone.removeAttribute('data-reveal-base');
  clone.setAttribute('aria-hidden', 'true');
  clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  // nothing inside a decorative clone may ever take focus
  clone.querySelectorAll('a, button, input, [tabindex]').forEach((el) => {
    el.setAttribute('tabindex', '-1');
  });
  // the clone must not replay the entrance stagger a second time
  clone.querySelectorAll('[data-enter]').forEach((el) => el.removeAttribute('data-enter'));
  base.insertAdjacentElement('afterend', clone);
  shell.dataset.revealEnabled = 'true';

  let targetX = window.innerWidth * 0.6;
  let frame = 0;

  const write = () => {
    frame = 0;
    shell.style.setProperty('--reveal-position', `${targetX}px`);
  };

  const onMove = (event) => {
    const rect = shell.getBoundingClientRect();
    targetX = event.clientX - rect.left;
    if (!frame) frame = requestAnimationFrame(write);
  };

  shell.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    // the first move places the band without animating it in from wherever
    // it happened to be parked, which otherwise reads as a swipe
    if (shell.dataset.revealActive !== 'true') {
      shell.dataset.revealInstant = 'true';
      onMove(event);
      requestAnimationFrame(() => {
        shell.dataset.revealActive = 'true';
        window.setTimeout(() => { delete shell.dataset.revealInstant; }, 40);
      });
      return;
    }
    onMove(event);
  });

  shell.addEventListener('pointerleave', () => {
    shell.dataset.revealActive = 'false';
    delete shell.dataset.revealAnchor;
  });

  // The band parks on top of the call to action, so what the pointer sees
  // there is the clone. Hand the hover to the shell and both layers roll
  // together; :hover alone only ever reaches the base layer.
  const cta = base.querySelector('[data-reveal-anchor-name]');
  if (cta) {
    cta.addEventListener('pointerenter', () => {
      shell.dataset.revealAnchor = cta.dataset.revealAnchorName;
    });
    cta.addEventListener('pointerleave', () => { delete shell.dataset.revealAnchor; });
  }
}

/* --- The Q12 accordion -----------------------------------------------------
 * One open at a time: the verdicts are one-liners and a wall of them at once
 * kills every punchline after the first.
 */
function setupAccordion() {
  const list = document.querySelector('[data-q12]');
  if (!list) return;

  list.addEventListener('click', (event) => {
    const head = event.target.closest('.q__head');
    if (!head || !list.contains(head)) return;

    const open = head.getAttribute('aria-expanded') === 'true';
    list.querySelectorAll('.q__head[aria-expanded="true"]').forEach((other) => {
      other.setAttribute('aria-expanded', 'false');
    });
    head.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
}

/* --- The action plan -------------------------------------------------------
 * Ticks are kept in localStorage. Every read and write is guarded: in a
 * private window, or with site data blocked, the accessor itself throws, and
 * the list still has to work.
 */
function setupPlan() {
  const list   = document.querySelector('[data-plan]');
  const status = document.querySelector('[data-plan-status]');
  if (!list) return;

  const KEY = 'nitali.plan.v1';
  const boxes = [...list.querySelectorAll('input[data-plan-item]')];

  const read = () => {
    try { return JSON.parse(window.localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  };
  const write = (value) => {
    try { window.localStorage.setItem(KEY, JSON.stringify(value)); }
    catch { /* storage unavailable; the ticks just do not survive a reload */ }
  };

  const render = () => {
    const done = boxes.filter((box) => box.checked).length;
    if (!status) return;
    status.textContent = done === boxes.length
      ? `${boxes.length} of ${boxes.length} complete. The committee is stunned, and slightly suspicious.`
      : `${done} of ${boxes.length} complete. The committee is watching.`;
  };

  const saved = read();
  boxes.forEach((box) => { box.checked = saved.includes(box.dataset.planItem); });

  list.addEventListener('change', () => {
    write(boxes.filter((box) => box.checked).map((box) => box.dataset.planItem));
    render();
  });

  render();
}

/* --- The disclosure overlay ------------------------------------------------ */
function setupOverlay() {
  const overlay = document.querySelector('[data-overlay]');
  if (!overlay) return;

  let lastFocused = null;

  const open = () => {
    lastFocused = document.activeElement;
    overlay.dataset.overlayState = 'open';
    overlay.querySelector('[data-overlay-close]')?.focus();
  };
  const close = () => {
    overlay.dataset.overlayState = 'closed';
    if (lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-overlay-open]')) { open(); return; }
    if (event.target.closest('[data-overlay-close]')) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.dataset.overlayState === 'open') close();
  });
}

/* --- The hero clock --------------------------------------------------------
 * Her local time, in her timezone, not the viewer's — the report is about
 * her, so the clock on it is hers.
 */
function setupClock() {
  const node = document.querySelector('[data-clock]');
  if (!node) return;

  const tick = () => {
    const time = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata',
    }).format(new Date());
    node.textContent = `${time} her time`;
  };
  tick();
  window.setInterval(tick, 10_000);
}

setupLoader();
setupReveal();
setupAccordion();
setupPlan();
setupOverlay();
setupClock();
