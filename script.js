// ─── State ─────────────────────────────────────────────────────────────────
let mode = 'pomodoro'; // 'pomodoro' | 'stopwatch'
let phase = 'focus'; // 'focus' | 'break'
let isActive = false;
let intervalId = null;
let notifAsked = false;
let isEditing = false;

// Pomodoro
let focusDurSec = 25 * 60;
let breakDurSec = 5 * 60;
let phaseDurSec = focusDurSec; // current phase total (editable baseline)
let remainingMs = focusDurSec * 1000;
let endTime = null; // Date.now() + remainingMs when running
let pomCount = 0;

// Stopwatch
let swAccMs = 0;
let swT0 = null;

// ─── DOM ───────────────────────────────────────────────────────────────────
const modePill = document.getElementById('mode-pill');
const modeBtns = document.querySelectorAll('.mode-btn');
const lblFocus = document.getElementById('lbl-focus');
const lblBreak = document.getElementById('lbl-break');
const phaseLabel = document.getElementById('phase-label');
const timeDisplay = document.getElementById('time-display');
const timeEdit = document.getElementById('time-edit');
const editMm = document.getElementById('edit-mm');
const editSs = document.getElementById('edit-ss');
const completedEl = document.getElementById('completed-count');
const barTrack = document.getElementById('bar-track');
const barFill = document.getElementById('bar-fill');
const barFillInner = document.getElementById('bar-fill-inner');
const barGlow = document.getElementById('bar-glow');
const playBtn = document.getElementById('play-btn');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const resetBtn = document.getElementById('reset-btn');
const fsBtn = document.getElementById('fs-btn');
const iconExpand = document.getElementById('icon-expand');
const iconCompress = document.getElementById('icon-compress');

// ─── Helpers ───────────────────────────────────────────────────────────────
function stopTiming() {
  isActive = false;
  clearInterval(intervalId);
  intervalId = null;
  endTime = null;
}

function fmt(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${String(h).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

function lerp(a, b, t) {
  return [
    Math.round(a[0] + t * (b[0] - a[0])),
    Math.round(a[1] + t * (b[1] - a[1])),
    Math.round(a[2] + t * (b[2] - a[2])),
  ];
}

function barColor(p) {
  const neutral = [100, 116, 139];
  const amber = [252, 211, 77];
  const red = [248, 113, 113];
  if (p < 0.8) return `rgb(${neutral})`;
  const t = (p - 0.8) / 0.2;
  const c = t < 0.5 ? lerp(neutral, amber, t * 2) : lerp(amber, red, (t - 0.5) * 2);
  return `rgb(${c})`;
}

// #region UI Render
function render() {
  if (isEditing) return;

  if (mode === 'pomodoro') {
    const ms = Math.max(0, remainingMs);
    const str = fmt(ms);

    timeDisplay.textContent = str;
    completedEl.textContent = `Completed: ${pomCount}`;

    const progress = Math.max(0, Math.min(1, 1 - ms / (phaseDurSec * 1000)));
    const pct = progress * 100;
    const color = barColor(progress);

    barFill.style.width = pct + '%';
    barFillInner.style.background = color;

    const showGlow = pct > 0.5;
    barGlow.style.opacity = showGlow ? (isActive ? '0.8' : '0.4') : '0';
    barGlow.style.background = color;
    barGlow.style.boxShadow = `0 0 20px 8px ${color}`;

    barTrack.classList.remove('sw-active');

    lblFocus.classList.toggle('on', phase === 'focus');
    lblBreak.classList.toggle('on', phase === 'break');

    document.title = `${str} — ${phase === 'focus' ? 'Focus' : 'Break'}`;
  } else {
    const elapsed = isActive && swT0 !== null ? swAccMs + (Date.now() - swT0) : swAccMs;
    const str = fmt(elapsed);

    timeDisplay.textContent = str;
    barFill.style.width = '0%';
    barGlow.style.opacity = '0';
    barTrack.classList.toggle('sw-active', isActive);

    document.title = `${str} — Stopwatch`;
  }

  iconPlay.classList.toggle('hidden', isActive);
  iconPause.classList.toggle('hidden', !isActive);
  playBtn.setAttribute('aria-label', isActive ? 'Pause' : 'Start');
}

// #endregion UI Render

// ─── Tick ──────────────────────────────────────────────────────────────────
function tick() {
  if (!isActive) return;

  if (mode === 'pomodoro') {
    const rem = endTime - Date.now();
    if (rem <= 0) {
      phaseComplete();
      return;
    }
    remainingMs = rem;
  }
  render();
}

// ─── Phase Complete ────────────────────────────────────────────────────────
function phaseComplete() {
  const done = phase;

  if (Notification.permission === 'granted') {
    const msg =
      done === 'focus' ? 'Focus complete! Time for a break.' : 'Break over! Back to focus.';
    try {
      new Notification(msg, { body: 'Super Simple Clock' });
    } catch {}
  }

  if (done === 'focus') {
    pomCount++;
    phase = 'break';
    phaseDurSec = breakDurSec;
  } else {
    phase = 'focus';
    phaseDurSec = focusDurSec;
  }

  remainingMs = phaseDurSec * 1000;
  endTime = Date.now() + remainingMs;

  render();
}

// ─── Start / Pause / Resume ────────────────────────────────────────────────
function toggleTimer() {
  if (isActive) {
    if (mode === 'pomodoro') {
      remainingMs = Math.max(0, endTime - Date.now());
    } else {
      if (swT0 !== null) swAccMs += Date.now() - swT0;
      swT0 = null;
    }
    stopTiming();
  } else {
    if (!notifAsked && Notification.permission === 'default') {
      notifAsked = true;
      Notification.requestPermission();
    }

    isActive = true;

    if (mode === 'pomodoro') {
      endTime = Date.now() + remainingMs;
    } else {
      swT0 = Date.now();
    }

    intervalId = setInterval(tick, 100);
  }

  render();
}

// ─── Reset ─────────────────────────────────────────────────────────────────
function resetTimer() {
  stopTiming();

  if (mode === 'pomodoro') {
    remainingMs = phaseDurSec * 1000;
  } else {
    swAccMs = 0;
    swT0 = null;
  }

  render();
}

// ─── Mode Switch ───────────────────────────────────────────────────────────
function switchMode(newMode) {
  if (newMode === mode) return;

  stopTiming();
  swT0 = null;
  mode = newMode;

  modeBtns.forEach((b) => b.classList.toggle('active', b.dataset.mode === newMode));

  if (newMode === 'stopwatch') {
    modePill.style.left = '50%';
    phaseLabel.classList.add('invisible');
    completedEl.classList.add('invisible');
    timeDisplay.classList.remove('editable');
    swAccMs = 0;
  } else {
    modePill.style.left = '4px';
    phaseLabel.classList.remove('invisible');
    completedEl.classList.remove('invisible');
    timeDisplay.classList.add('editable');
    remainingMs = phaseDurSec * 1000;
  }

  render();
}

// ─── Phase Switch ──────────────────────────────────────────────────────────
function switchPhase(newPhase) {
  if (mode !== 'pomodoro' || phase === newPhase) return;
  stopTiming();
  phase = newPhase;
  phaseDurSec = newPhase === 'focus' ? focusDurSec : breakDurSec;
  remainingMs = phaseDurSec * 1000;
  render();
}

// ─── Inline Edit ───────────────────────────────────────────────────────────
function openEdit() {
  if (mode !== 'pomodoro' || isEditing) return;
  isEditing = true;

  editMm.value = String(Math.floor(phaseDurSec / 60)).padStart(2, '0');
  editSs.value = String(phaseDurSec % 60).padStart(2, '0');

  timeDisplay.classList.add('hidden');
  timeEdit.style.display = 'flex';
  editMm.focus();
  editMm.select();
}

function confirmEdit() {
  if (!isEditing) return;

  let mm = parseInt(editMm.value, 10);
  let ss = parseInt(editSs.value, 10);
  if (isNaN(mm)) mm = 0;
  if (isNaN(ss)) ss = 0;
  mm = Math.max(0, Math.min(99, mm));
  ss = Math.max(0, Math.min(59, ss));

  const newSec = mm * 60 + ss;
  if (newSec === 0) {
    cancelEdit();
    return;
  }

  if (phase === 'focus') focusDurSec = newSec;
  else breakDurSec = newSec;
  phaseDurSec = newSec;

  const newMs = newSec * 1000;
  if (!isActive) {
    remainingMs = newMs;
  } else if (remainingMs > newMs) {
    remainingMs = newMs;
    endTime = Date.now() + remainingMs;
  }

  closeEdit();
}

function cancelEdit() {
  if (!isEditing) return;
  closeEdit();
}

function closeEdit() {
  isEditing = false;
  timeDisplay.classList.remove('hidden');
  timeEdit.style.display = 'none';
  render();
}

// ─── Fullscreen ────────────────────────────────────────────────────────────
function isFullscreen() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function updateFsIcon() {
  const full = isFullscreen();
  iconExpand.classList.toggle('hidden', full);
  iconCompress.classList.toggle('hidden', !full);
  fsBtn.setAttribute('aria-label', full ? 'Exit fullscreen' : 'Enter fullscreen');
}

function toggleFullscreen() {
  if (isFullscreen()) {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  }
}

// ─── Event Wiring ──────────────────────────────────────────────────────────
modeBtns.forEach((b) => b.addEventListener('click', () => switchMode(b.dataset.mode)));
playBtn.addEventListener('click', toggleTimer);
resetBtn.addEventListener('click', resetTimer);
timeDisplay.addEventListener('click', openEdit);
lblFocus.addEventListener('click', () => switchPhase('focus'));
lblBreak.addEventListener('click', () => switchPhase('break'));

editMm.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    editSs.focus();
    editSs.select();
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
  }
});
editSs.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    confirmEdit();
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    cancelEdit();
  }
});

// small delay so tabbing between the two inputs doesn't fire confirm prematurely
let blurTimer = null;
function onInputBlur() {
  blurTimer = setTimeout(() => {
    if (isEditing && document.activeElement !== editMm && document.activeElement !== editSs) {
      confirmEdit();
    }
  }, 120);
}
editMm.addEventListener('blur', onInputBlur);
editSs.addEventListener('blur', onInputBlur);
editMm.addEventListener('focus', () => clearTimeout(blurTimer));
editSs.addEventListener('focus', () => clearTimeout(blurTimer));

fsBtn.addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', updateFsIcon);
document.addEventListener('webkitfullscreenchange', updateFsIcon);

document.addEventListener('keydown', (e) => {
  if (e.key === 'f' || e.key === 'F') {
    if (isEditing) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    toggleFullscreen();
  }
});

// ─── Init ──────────────────────────────────────────────────────────────────
// Hide fullscreen button on devices that don't support the API (e.g. iOS Safari)
if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) {
  fsBtn.style.display = 'none';
}

render();
