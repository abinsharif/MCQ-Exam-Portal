/* ══════════════════════════════════════════════════════════
   MCQ EXAM PORTAL — MAIN SCRIPT
   ══════════════════════════════════════════════════════════ */

// ── SETTINGS ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  theme: 'dark',
  fontSize: 'medium',
  questionsPerPage: 'all',
  soundEnabled: true,
  keyboardEnabled: true,
  practiceMode: false,
  userName: '',
  pauseBtn: false,
};

let SETTINGS = { ...DEFAULT_SETTINGS };

function loadSettings() {
  try {
    const s = localStorage.getItem('mcq_settings');
    if (s) SETTINGS = { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch(e) {}
  applySettings();
}

function saveSettings() {
  localStorage.setItem('mcq_settings', JSON.stringify(SETTINGS));
}

function applySettings() {
  document.body.setAttribute('data-theme', SETTINGS.theme);
  updateThemeIcon();

  const fs = { small: '13px', medium: '15px', large: '17px', xlarge: '19px' };
  document.documentElement.style.setProperty('--font-size-base', fs[SETTINGS.fontSize] || '15px');

  if (typeof updateSettingsUI === 'function') updateSettingsUI();
}

// ── THEME ─────────────────────────────────────────────────────────────────────
function toggleTheme() {
  SETTINGS.theme = SETTINGS.theme === 'dark' ? 'light' : 'dark';
  saveSettings();
  applySettings();
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (!icon) return;
  icon.className = SETTINGS.theme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 2800) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
  const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--accent)' };
  const el = document.createElement('div');
  el.className = `toast-msg ${type}`;
  el.innerHTML = `<i class="bi ${icons[type]}" style="color:${colors[type]}"></i>${escHtml(msg)}`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity 0.3s'; setTimeout(()=>el.remove(), 300); }, duration);
}

// ── SOUND ─────────────────────────────────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playClick() {
  if (!SETTINGS.soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    o.start(); o.stop(ctx.currentTime + 0.08);
  } catch(e) {}
}

function playWarning() {
  if (!SETTINGS.soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    [440, 550, 440].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.18;
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.start(t); o.stop(t + 0.15);
    });
  } catch(e) {}
}

function playSuccess() {
  if (!SETTINGS.soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    });
  } catch(e) {}
}

function playFail() {
  if (!SETTINGS.soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    [300, 250].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sawtooth'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.2;
      g.gain.setValueAtTime(0.1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.25);
    });
  } catch(e) {}
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function findLibraryExamByB64(b64) {
  const clean = b64.trim();
  return EXAM_DB.find(e => (e.b64 || '').trim() === clean) || null;
}

function copyToClipboard(text, msg = 'Copied!') {
  navigator.clipboard.writeText(text).then(() => showToast(msg, 'success')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast(msg, 'success'); } catch(e) { showToast('Copy failed', 'error'); }
    ta.remove();
  });
}

// ── CONFETTI ──────────────────────────────────────────────────────────────────
function launchConfetti(intense = false) {
  const colors = ['#f0a500','#ff6b35','#3fb950','#58a6ff','#bc8cff','#ffffff'];
  const count = intense ? 120 : 60;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const p = document.createElement('div');
      p.className = 'conf-particle';
      p.style.cssText = `left:${Math.random()*100}vw;top:-10px;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${1.5+Math.random()*2.5}s;animation-delay:${Math.random()*0.5}s;transform:rotate(${Math.random()*360}deg);width:${5+Math.random()*7}px;height:${5+Math.random()*7}px;border-radius:${Math.random()>0.5?'50%':'2px'}`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 3500);
    }, i * 25);
  }
}

// ── SETTINGS MODAL ────────────────────────────────────────────────────────────
function openSettings() {
  document.getElementById('settings-modal').classList.add('open');
  updateSettingsUI();
}
function closeSettings() {
  document.getElementById('settings-modal').classList.remove('open');
}

function updateSettingsUI() {
  const el = (id) => document.getElementById(id);
  if (el('set-sound')) el('set-sound').checked = SETTINGS.soundEnabled;
  if (el('set-keyboard')) el('set-keyboard').checked = SETTINGS.keyboardEnabled;
  if (el('set-practice')) el('set-practice').checked = SETTINGS.practiceMode;
  if (el('set-pausebtn')) el('set-pausebtn').checked = SETTINGS.pauseBtn;
  if (el('set-username')) el('set-username').value = SETTINGS.userName || '';
  if (el('set-fontsize')) el('set-fontsize').value = SETTINGS.fontSize || 'medium';
  if (el('set-qpp')) el('set-qpp').value = SETTINGS.questionsPerPage || 'all';
}

function settingChanged(key, val) {
  SETTINGS[key] = val;
  saveSettings();
  applySettings();
  if (key === 'pauseBtn') {
    const pb = document.getElementById('pause-btn-wrap');
    if (pb) pb.style.display = val ? 'flex' : 'none';
  }
}

function clearAllData() {
  if (!confirm('Clear ALL saved data? (scores, settings, progress) This cannot be undone.')) return;
  localStorage.clear();
  SETTINGS = { ...DEFAULT_SETTINGS };
  saveSettings();
  applySettings();
  showToast('All data cleared', 'info');
  updateSettingsUI();
}

// ── EXAM ENGINE ───────────────────────────────────────────────────────────────
let questions = [];
let userAnswers = [];
let currentPage = 0;
let qpp = Infinity; // questions per page
let timerInterval = null;
let remainingSeconds = 0;
let totalSeconds = 0;
let examStartTime = null;
let paused = false;
let autoSubmitted = false;
let warningPlayed = false;

const AUTOSAVE_KEY = 'mcq_autosave';

function getQPP() {
  const v = SETTINGS.questionsPerPage;
  if (v === 'all' || !v) return Infinity;
  return parseInt(v) || Infinity;
}

function startExamFromB64(b64, meta = {}) {
  const decoded = decodeB64(b64);
  if (!decoded.success) { showToast(decoded.error, 'error'); return false; }

  const libraryExam = typeof EXAM_DB !== 'undefined' ? findLibraryExamByB64(b64) : null;
  const finalMeta = {
    ...(libraryExam ? {
      title: libraryExam.title,
      subject: libraryExam.subject,
      chapter: libraryExam.chapter,
      difficulty: libraryExam.difficulty,
      language: libraryExam.language
    } : {}),
    ...decoded.meta,
    ...meta
  };

  questions = decoded.questions;
  userAnswers = new Array(questions.length).fill(null);
  currentPage = 0;
  qpp = getQPP();
  autoSubmitted = false;
  warningPlayed = false;
  paused = false;
  examStartTime = Date.now();
  totalSeconds = Math.min(questions.length * 90, 3600);
  remainingSeconds = totalSeconds;
  window._examMeta = { ...finalMeta, questionCount: questions.length, b64: b64.trim() };

  renderExam();
  startTimer();
  autoSave();
  return true;
}

function decodeB64(b64) {
  try {
    const decoded = atob(b64.trim());
    const utf8 = decodeURIComponent(escape(decoded));
    const data = JSON.parse(utf8);

    let meta = {};
    let q = data;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      meta = data.meta || {};
      q = data.questions || [];
    }

    if (!Array.isArray(q) || !q.length) return { success: false, error: 'Invalid question format' };

    for (let i = 0; i < q.length; i++) {
      if (!q[i].question || !q[i].options || !q[i].answer) return { success: false, error: `Q${i+1} missing fields` };
      if (!Array.isArray(q[i].options) || q[i].options.length !== 4) return { success: false, error: `Q${i+1} must have 4 options` };
    }

    return { success: true, questions: q, meta };
  } catch(e) {
    return { success: false, error: 'Invalid Base64 or JSON: ' + e.message };
  }
}

// ── AUTOSAVE / RESTORE ────────────────────────────────────────────────────────
function autoSave() {
  if (SETTINGS.practiceMode) return;
  if (!questions.length) return;
  const state = {
    questions, userAnswers, currentPage,
    remainingSeconds, totalSeconds, examStartTime,
    meta: window._examMeta || {}
  };
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
}

function clearAutoSave() {
  localStorage.removeItem(AUTOSAVE_KEY);
}

function checkAutoSave() {
  try {
    const s = localStorage.getItem(AUTOSAVE_KEY);
    if (!s) return false;
    const state = JSON.parse(s);
    if (!state.questions || !state.questions.length) return false;
    // Check if more than 2 hours old
    if (state.examStartTime && Date.now() - state.examStartTime > 7200000) {
      clearAutoSave(); return false;
    }
    return state;
  } catch(e) { return false; }
}

function restoreFromAutosave(state) {
  questions = state.questions;
  userAnswers = state.userAnswers || new Array(questions.length).fill(null);
  currentPage = state.currentPage || 0;
  qpp = getQPP();
  totalSeconds = state.totalSeconds || questions.length * 90;
  remainingSeconds = state.remainingSeconds || totalSeconds;
  examStartTime = state.examStartTime || Date.now();
  paused = false;
  autoSubmitted = false;
  warningPlayed = false;
  window._examMeta = state.meta || {};
}

// ── RENDER EXAM ───────────────────────────────────────────────────────────────
function renderExam() {
  const page = document.getElementById('exam-page');
  const landing = document.getElementById('landing-page');
  const results = document.getElementById('results-page');
  const timerBar = document.getElementById('timer-bar');

  if (landing) landing.style.display = 'none';
  if (results) results.style.display = 'none';
  if (page) page.style.display = 'block';
  if (timerBar) timerBar.style.display = 'block';

  renderQuestionPage();
  window.scrollTo(0, 0);
  updatePauseBtn();
}

function getPageQuestions() {
  if (qpp === Infinity) return { start: 0, end: questions.length };
  const start = currentPage * qpp;
  const end = Math.min(start + qpp, questions.length);
  return { start, end };
}

function renderQuestionPage() {
  const { start, end } = getPageQuestions();
  const container = document.getElementById('questions-container');
  if (!container) return;

  container.innerHTML = '';

  for (let i = start; i < end; i++) {
    container.appendChild(buildQuestionCard(i));
  }

  container.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi = parseInt(btn.dataset.qi, 10);
      const value = decodeURIComponent(btn.dataset.opt);
      selectAnswer(qi, value);
    });
  });

  // Progress
  const answered = userAnswers.filter(a => a !== null).length;
  const prog = document.getElementById('q-progress');
  if (prog) prog.textContent = `${answered} / ${questions.length} answered`;

  renderPageNav();
  window.scrollTo(0, 0);

  const pbw = document.getElementById('pause-btn-wrap');
  if (pbw) pbw.style.display = SETTINGS.pauseBtn ? 'flex' : 'none';
}

function buildQuestionCard(i) {
  const q = questions[i];
  const card = document.createElement('div');
  card.className = 'question-card';
  card.style.animationDelay = `${(i % (qpp === Infinity ? 0 : qpp)) * 0.04}s`;
  card.id = `qcard-${i}`;

  const answered = userAnswers[i] !== null;
  const opts = q.options.map((opt, oi) => {
    const selected = userAnswers[i] === opt;
    return `
    <button class="option-btn ${selected ? 'selected' : ''}"
            data-qi="${i}"
            data-opt="${encodeURIComponent(opt)}">
      <span class="opt-letter">${['A','B','C','D'][oi]}</span>
      <span class="opt-text">${escHtml(opt)}</span>
    </button>`;
  }).join('');

  card.innerHTML = `
    <div class="q-header">
      <span class="q-num">Q${i+1}</span>
      <span class="q-status-dot ${answered ? 'answered' : 'unanswered'}"></span>
    </div>
    <p class="q-text">${escHtml(q.question)}</p>
    <div class="options-grid">${opts}</div>
  `;
  return card;
}

function selectAnswer(qi, value) {
  playClick();
  userAnswers[qi] = value;
  autoSave();

  // Update UI without full re-render
  const card = document.getElementById(`qcard-${qi}`);
  if (card) {
    card.querySelectorAll('.option-btn').forEach(btn => {
      const text = btn.querySelector('.opt-text')?.textContent;
      if (text === value) btn.classList.add('selected');
      else btn.classList.remove('selected');
    });
    const dot = card.querySelector('.q-status-dot');
    if (dot) { dot.classList.remove('unanswered'); dot.classList.add('answered'); }
  }

  // Update progress
  const answered = userAnswers.filter(a => a !== null).length;
  const prog = document.getElementById('q-progress');
  if (prog) prog.textContent = `${answered} / ${questions.length} answered`;

  updateMiniMap();
}

function renderPageNav() {
  const nav = document.getElementById('page-nav');
  if (!nav) return;
  if (qpp === Infinity || questions.length <= qpp) { nav.innerHTML = ''; return; }

  const totalPages = Math.ceil(questions.length / qpp);
  let html = `<div class="page-nav-inner">`;

  html += `<button class="pnav-btn" onclick="goPage(${currentPage-1})" ${currentPage===0?'disabled':''}>
    <i class="bi bi-chevron-left"></i>
  </button>`;

  for (let p = 0; p < totalPages; p++) {
    const { start, end } = { start: p*qpp, end: Math.min((p+1)*qpp, questions.length) };
    const pageAnswered = userAnswers.slice(start, end).filter(a => a !== null).length;
    const pageTotal = end - start;
    const complete = pageAnswered === pageTotal;
    html += `<button class="pnav-btn ${p===currentPage?'active':''} ${complete?'complete':''}" onclick="goPage(${p})">${p+1}</button>`;
  }

  html += `<button class="pnav-btn" onclick="goPage(${currentPage+1})" ${currentPage===totalPages-1?'disabled':''}>
    <i class="bi bi-chevron-right"></i>
  </button></div>`;

  nav.innerHTML = html;
}

function goPage(p) {
  const totalPages = Math.ceil(questions.length / qpp);
  if (p < 0 || p >= totalPages) return;
  currentPage = p;
  renderQuestionPage();
  window.scrollTo(0, 0);
}

// Mini Map
function updateMiniMap() {
  const map = document.getElementById('mini-map');
  if (!map) return;
  let html = '';
  questions.forEach((_, i) => {
    const ans = userAnswers[i] !== null;
    const { start, end } = getPageQuestions();
    const onPage = i >= start && i < end;
    html += `<div class="mm-dot ${ans?'answered':''} ${onPage?'current':''}" onclick="jumpToQuestion(${i})" title="Q${i+1}"></div>`;
  });
  map.innerHTML = html;
}

function jumpToQuestion(qi) {
  if (qpp === Infinity) {
    document.getElementById(`qcard-${qi}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const page = Math.floor(qi / qpp);
  goPage(page);
  setTimeout(() => document.getElementById(`qcard-${qi}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
}

// ── TIMER ─────────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    if (paused) return;
    remainingSeconds--;
    updateTimerDisplay();
    if (remainingSeconds === 60 && !warningPlayed) { playWarning(); warningPlayed = true; }
    if (remainingSeconds <= 0) { clearInterval(timerInterval); autoSubmit(); }
    if (remainingSeconds % 30 === 0) autoSave();
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(remainingSeconds / 60);
  const s = remainingSeconds % 60;
  const disp = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  const el = document.getElementById('timer-display');
  const fill = document.getElementById('timer-fill');
  if (el) el.textContent = disp;
  if (fill) {
    const pct = (remainingSeconds / totalSeconds) * 100;
    fill.style.width = pct + '%';
    fill.className = 'timer-fill' + (remainingSeconds <= totalSeconds*0.1 ? ' danger' : remainingSeconds <= totalSeconds*0.2 ? ' warning' : '');
  }
  if (el) {
    el.className = 'timer-display' + (remainingSeconds <= totalSeconds*0.1 ? ' danger' : remainingSeconds <= totalSeconds*0.2 ? ' warning' : '');
  }
}

function togglePause() {
  paused = !paused;
  updatePauseBtn();
  if (!paused) updateTimerDisplay();
  showToast(paused ? 'Exam paused ⏸' : 'Exam resumed ▶', 'info');
}

function updatePauseBtn() {
  const btn = document.getElementById('pause-btn');
  if (!btn) return;
  btn.innerHTML = paused ? '<i class="bi bi-play-fill"></i> Resume' : '<i class="bi bi-pause-fill"></i> Pause';
  btn.style.background = paused ? 'var(--green)' : '';
}

// ── SUBMIT ────────────────────────────────────────────────────────────────────
function trySubmitExam() {
  const unanswered = userAnswers.filter(a => a === null).length;
  if (unanswered > 0) {
    const warn = document.getElementById('unanswered-warn');
    if (warn) {
      warn.style.display = 'block';
      warn.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> <strong>${unanswered}</strong> question${unanswered>1?'s':''} unanswered. &nbsp;<button onclick="finalSubmit()" class="btn-warn-yes">Submit anyway</button>`;
      return;
    }
  }
  finalSubmit();
}

function autoSubmit() {
  autoSubmitted = true;
  finalSubmit();
}

function finalSubmit() {
  clearInterval(timerInterval);
  const timeTaken = Math.round((Date.now() - examStartTime) / 1000);

  const results = questions.map((q, i) => {
    const user = userAnswers[i];
    const correct = user === q.answer;
    return { question: q.question, options: q.options, user, correct: q.answer, is_correct: correct, solution: q.solution || '' };
  });

  const score = results.filter(r => r.is_correct).length;
  const total = questions.length;

  // Save to history
  if (!SETTINGS.practiceMode) {
    saveToHistory({ score, total, timeTaken, meta: window._examMeta || {} });
  }
  clearAutoSave();

  showResults({ score, total, results, timeTaken, wasAuto: autoSubmitted });
}

// ── RESULTS ───────────────────────────────────────────────────────────────────
function showResults(data) {
  const { score, total, results, timeTaken, wasAuto } = data;
  const pct = Math.round((score / total) * 100);

  document.getElementById('exam-page').style.display = 'none';
  document.getElementById('timer-bar').style.display = 'none';
  document.getElementById('results-page').style.display = 'block';
  window.scrollTo(0, 0);

  // Store for share/export
  window._lastResults = data;

  // Ring
  setTimeout(() => {
    const fill = document.getElementById('ring-fill');
    if (fill) {
      const circ = 2 * Math.PI * 55;
      fill.style.strokeDasharray = circ;
      fill.style.strokeDashoffset = circ - (pct / 100) * circ;
      fill.style.stroke = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent)' : 'var(--red)';
    }
  }, 150);

  const scoreEl = document.getElementById('score-number');
  if (scoreEl) scoreEl.textContent = score;
  const denomEl = document.getElementById('score-denom');
  if (denomEl) denomEl.textContent = `/ ${total}`;

  const pctEl = document.getElementById('score-pct');
  if (pctEl) pctEl.textContent = pct + '%';

  const badge = getBadge(pct);
  const badgeEl = document.getElementById('result-badge');
  if (badgeEl) badgeEl.innerHTML = `<span style="font-size:1.8rem">${badge.emoji}</span><span style="font-size:1rem;font-weight:700;color:${badge.color}">${badge.label}</span>`;

  const nameEl = document.getElementById('result-name');
  if (nameEl && SETTINGS.userName) nameEl.textContent = SETTINGS.userName + "'s Result";

  const subEl = document.getElementById('result-sub');
  if (subEl) subEl.textContent = `${score}/${total} — ${pct}%${wasAuto ? ' (auto-submitted)' : ''}${SETTINGS.practiceMode ? ' · Practice Mode' : ''}`;

  const wrong = total - score;
  const skipped = results.filter(r => r.user === null).length;
  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;
  const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  const avgTime = total > 0 ? Math.round(timeTaken / total) : 0;

  const statsEl = document.getElementById('stats-row');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat-chip"><div class="val" style="color:var(--green)">${score}</div><div class="lbl">Correct</div></div>
    <div class="stat-chip"><div class="val" style="color:var(--red)">${wrong}</div><div class="lbl">Wrong</div></div>
    <div class="stat-chip"><div class="val" style="color:var(--muted)">${skipped}</div><div class="lbl">Skipped</div></div>
    <div class="stat-chip"><div class="val" style="color:var(--accent)">${pct}%</div><div class="lbl">Score</div></div>
    <div class="stat-chip"><div class="val" style="color:var(--blue)">${timeStr}</div><div class="lbl">Time</div></div>
    <div class="stat-chip"><div class="val" style="color:var(--purple)">${avgTime}s</div><div class="lbl">Avg/Q</div></div>`;

  // Analytics chart
  renderAnalyticsChart(results);

  // Review cards
  const body = document.getElementById('results-body');
  if (body) {
    body.innerHTML = '';
    results.forEach((r, i) => {
      const opts = questions[i].options.map(opt => {
        let cls = 'neutral', icon = 'bi-circle';
        if (opt === r.correct) { cls = 'correct-opt'; icon = 'bi-check-circle-fill'; }
        else if (opt === r.user && !r.is_correct) { cls = 'wrong-opt'; icon = 'bi-x-circle-fill'; }
        return `<div class="r-opt ${cls}"><i class="bi ${icon}"></i>${escHtml(opt)}</div>`;
      }).join('');

      const solutionHtml = r.solution ? `<div class="solution-box" data-correct="${r.is_correct}"><i class="bi bi-lightbulb-fill"></i> <strong>Solution:</strong> ${escHtml(r.solution)}</div>` : '';

      body.innerHTML += `
        <div class="r-card ${r.is_correct ? 'r-correct' : r.user ? 'r-wrong' : 'r-skipped'}" style="animation-delay:${i*0.04}s">
          <div class="r-card-header">
            <span class="r-status-badge ${r.is_correct ? 'correct' : r.user ? 'wrong' : 'skipped'}">
              <i class="bi ${r.is_correct ? 'bi-check-circle-fill' : r.user ? 'bi-x-circle-fill' : 'bi-dash-circle'}"></i>
              ${r.is_correct ? 'Correct' : r.user ? 'Wrong' : 'Skipped'}
            </span>
            <span class="q-num-sm">Q${i+1}</span>
          </div>
          <p class="r-question">${escHtml(r.question)}</p>
          <div class="r-opts-grid">${opts}</div>
          ${solutionHtml}
        </div>`;
    });
    setSolutionVisibility('wrong');
  }

  if (pct === 100) launchConfetti(true);
  else if (pct >= 70) launchConfetti(false);

  if (pct >= 70) playSuccess();
  else if (pct < 40) playFail();
}

function getBadge(pct) {
  if (pct === 100) return { emoji: '🏆', label: 'Perfect Score!', color: 'var(--accent)' };
  if (pct >= 90) return { emoji: '🥇', label: 'Excellent!', color: 'var(--green)' };
  if (pct >= 80) return { emoji: '🥈', label: 'Great Job!', color: 'var(--blue)' };
  if (pct >= 70) return { emoji: '🥉', label: 'Good Work!', color: 'var(--purple)' };
  if (pct >= 60) return { emoji: '📚', label: 'Keep Going!', color: 'var(--accent2)' };
  if (pct >= 40) return { emoji: '💪', label: 'Keep Trying!', color: 'var(--accent)' };
  return { emoji: '📖', label: 'Study More!', color: 'var(--red)' };
}

function renderAnalyticsChart(results) {
  const canvas = document.getElementById('result-chart');
  if (!canvas) return;

  const correct = results.filter(r => r.is_correct).length;
  const wrong = results.filter(r => !r.is_correct && r.user).length;
  const skipped = results.filter(r => r.user === null).length;

  const ctx = canvas.getContext('2d');
  const total = correct + wrong + skipped;
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.offsetWidth || 200;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.scale(dpr, dpr);

  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const segments = [
    { val: correct, color: getComputedStyle(document.documentElement).getPropertyValue('--green').trim() || '#3fb950' },
    { val: wrong, color: getComputedStyle(document.documentElement).getPropertyValue('--red').trim() || '#f85149' },
    { val: skipped, color: getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#8b949e' },
  ];

  let start = -Math.PI / 2;
  ctx.clearRect(0, 0, size, size);

  segments.forEach(seg => {
    if (!seg.val) return;
    const angle = (seg.val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += angle;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, 2 * Math.PI);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#161b22';
  ctx.fill();
}

function setSolutionVisibility(mode) {
  document.querySelectorAll('.solution-box').forEach(el => {
    const correct = el.getAttribute('data-correct') === 'true';
    el.style.display = mode === 'all' ? 'block' : mode === 'hide' ? 'none' : (!correct ? 'block' : 'none');
  });
  document.querySelectorAll('.sol-btn').forEach(b => b.classList.remove('active'));
  const activeMap = { hide: 0, wrong: 1, all: 2 };
  const btns = document.querySelectorAll('.sol-btn');
  if (btns[activeMap[mode]]) btns[activeMap[mode]].classList.add('active');
}

// ── SHARE ─────────────────────────────────────────────────────────────────────
function shareResult(platform) {
  const data = window._lastResults;
  if (!data) return;
  const { score, total } = data;
  const pct = Math.round((score / total) * 100);
  const name = SETTINGS.userName ? `${SETTINGS.userName} scored` : 'Score:';
  const badge = getBadge(pct).emoji;
  const meta = window._examMeta || {};
  const subject = meta.subject ? ` | ${meta.subject}` : '';
  const text = `${badge} ${name} ${score}/${total} (${pct}%)${subject}\n📚 MCQ Exam Portal`;

  if (platform === 'whatsapp') {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  } else if (platform === 'telegram') {
    window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(text)}`, '_blank');
  } else if (platform === 'copy') {
    copyToClipboard(text, 'Result copied!');
  }
}

function exportResultPDF() {
  showToast('Preparing PDF...', 'info');
  setTimeout(() => {
    const el = document.getElementById('results-page');
    if (!el) return;

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => {
      const script2 = document.createElement('script');
      script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script2.onload = () => {
        html2canvas(el, { backgroundColor: getComputedStyle(document.body).backgroundColor, scale: 2 }).then(canvas => {
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const w = pdf.internal.pageSize.getWidth();
          const h = (canvas.height * w) / canvas.width;
          let y = 0;
          const pageH = pdf.internal.pageSize.getHeight();
          while (y < h) {
            pdf.addImage(canvas, 'PNG', 0, -y, w, h);
            y += pageH;
            if (y < h) pdf.addPage();
          }
          const name = SETTINGS.userName ? `${SETTINGS.userName}_` : '';
          pdf.save(`${name}MCQ_Result.pdf`);
          showToast('PDF downloaded!', 'success');
        });
      };
      document.head.appendChild(script2);
    };
    document.head.appendChild(script);
  }, 300);
}

// ── HISTORY ───────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'mcq_history';

function saveToHistory(entry) {
  try {
    const h = getHistory();
    h.unshift({
      date: new Date().toISOString(),
      score: entry.score,
      total: entry.total,
      timeTaken: entry.timeTaken,
      subject: entry.meta?.subject || 'Unknown',
      chapter: entry.meta?.chapter || '',
      title: entry.meta?.title || '',
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 100)));
  } catch(e) {}
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch(e) { return []; }
}

// ── RESTART ───────────────────────────────────────────────────────────────────
function restartExam() {/*
  questions = [];
  userAnswers = [];
  currentPage = 0;
  if (timerInterval) clearInterval(timerInterval);
  autoSubmitted = false;
  paused = false;

  const rp = document.getElementById('results-page');
  const ep = document.getElementById('exam-page');
  const lp = document.getElementById('landing-page');
  const tb = document.getElementById('timer-bar');

  if (rp) rp.style.display = 'none';
  if (ep) ep.style.display = 'none';
  if (tb) tb.style.display = 'none';
  if (lp) lp.style.display = 'block';

  const warn = document.getElementById('unanswered-warn');
  if (warn) warn.style.display = 'none';

  window.scrollTo(0, 0);
  */
 window.location.href ='./index.html';
}

// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!SETTINGS.keyboardEnabled) return;
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const examVisible = document.getElementById('exam-page')?.style.display !== 'none' &&
                      document.getElementById('exam-page')?.style.display !== '';

  if (!examVisible) return;
  if (paused) return;

  // P = Pause (only in exam)
  if (e.key === 'p' || e.key === 'P') {
    if (SETTINGS.pauseBtn) togglePause();
    return;
  }

  // Left / Right arrows = previous / next page
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (qpp !== Infinity) goPage(currentPage - 1);
    return;
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (qpp !== Infinity) goPage(currentPage + 1);
    return;
  }

  // Space = next page / scroll
  if (e.code === 'Space') {
    e.preventDefault();
    if (qpp !== Infinity) {
      const totalPages = Math.ceil(questions.length / qpp);
      if (currentPage < totalPages - 1) goPage(currentPage + 1);
    }
    return;
  }

  // Enter = submit
  if (e.key === 'Enter') {
    e.preventDefault();
    trySubmitExam();
    return;
  }

  // 1-4 = select option for first visible question
  if (['1','2','3','4'].includes(e.key)) {
    const { start } = getPageQuestions();
    const qi = start;
    const q = questions[qi];
    if (q) selectAnswer(qi, q.options[parseInt(e.key) - 1]);
  }
});
// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();

  // Restore autosave
  const saved = checkAutoSave();
  if (saved) {
    const restore = confirm(`You have an unfinished exam (${saved.questions?.length} questions, ${Math.floor(saved.remainingSeconds/60)}m left). Restore it?`);
    if (restore) {
      restoreFromAutosave(saved);
      renderExam();
      startTimer();
      updateMiniMap();
      return;
    } else {
      clearAutoSave();
    }
  }
});
