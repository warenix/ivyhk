/* ============================================================
   IVY.HK · 老婆生日快樂
   接住蛋糕 → 有禮物收
   Zero-build, no dependencies.
   ============================================================ */
(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     1 · stage manager
     --------------------------------------------------------- */
  const stages = {
    intro:  $('#stage-intro'),
    game:   $('#stage-game'),
    victory: $('#stage-victory')
  };
  let current = null;

  function showStage(name) {
    const next = stages[name];
    if (!next) return;

    if (current && current !== next) {
      const prev = current;
      prev.classList.remove('is-active');
      prev.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => {
        if (!prev.classList.contains('is-active')) prev.hidden = true;
      }, 460);
    }

    next.hidden = false;
    next.removeAttribute('aria-hidden');
    void next.offsetWidth;            // reflow so the transition runs
    next.classList.add('is-active');
    current = next;
  }

  /* ---------------------------------------------------------
     2 · sound (synthesised, no asset files)
     --------------------------------------------------------- */
  const Sound = (() => {
    let ctx = null, master = null, noise = null, muted = false;

    function ensure() {
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);

      const len = Math.floor(ctx.sampleRate * 0.6);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      return ctx;
    }

    function tone({ freq, to, dur = 0.15, type = 'sine', gain = 0.08, delay = 0 }) {
      if (muted) return;
      const c = ensure();
      if (!c) return;
      const t0 = c.currentTime + delay;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g).connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    function rustle({ dur = 0.5, gain = 0.12, freq = 2000 }) {
      if (muted) return;
      const c = ensure();
      if (!c || !noise) return;
      const t0 = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = noise;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 0.7;
      bp.frequency.setValueAtTime(freq, t0);
      bp.frequency.exponentialRampToValueAtTime(500, t0 + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp).connect(g).connect(master);
      src.start(t0);
      src.stop(t0 + dur);
    }

    return {
      catchCake() { tone({ freq: 740, to: 1180, dur: 0.13, type: 'triangle', gain: 0.09 }); },
      miss()      { tone({ freq: 300, to: 185, dur: 0.22, type: 'sine', gain: 0.045 }); },
      combo(n)    { tone({ freq: 900 + n * 110, to: 1400 + n * 110, dur: 0.14, type: 'triangle', gain: 0.07 }); },
      win()       { [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.32, type: 'triangle', gain: 0.07, delay: i * 0.1 })); },
      rustle,
      click()     { tone({ freq: 520, to: 720, dur: 0.07, type: 'square', gain: 0.03 }); },
      setMuted(m) { muted = m; if (!m) ensure(); }
    };
  })();

  /* ---------------------------------------------------------
     3 · confetti & floating text
     --------------------------------------------------------- */
  const fx = $('#fxLayer');
  const COLORS = ['#f36363', '#d94f4f', '#e8b64c', '#7bb7a4', '#f0a5b8', '#8fb8dd', '#f88b7f'];

  function burst(x, y, count = 16) {
    const n = reduced ? Math.min(count, 6) : count;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      el.className = 'confetti' + (Math.random() < 0.35 ? ' confetti--round' : '');
      const ang = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 200;
      el.style.cssText =
        `--w:${6 + Math.random() * 8}px;` +
        `--c:${COLORS[(Math.random() * COLORS.length) | 0]};` +
        `--dx:${(Math.cos(ang) * speed).toFixed(0)}px;` +
        `--dy:${(Math.sin(ang) * speed + 170 + Math.random() * 130).toFixed(0)}px;` +
        `--rot:${((Math.random() * 900 - 450) | 0)}deg;` +
        `--dur:${(0.7 + Math.random() * 0.7).toFixed(2)}s;` +
        `left:${x}px;top:${y}px;`;
      fx.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
  }

  function rain(count = 80) {
    const n = reduced ? 22 : count;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      el.className = 'confetti' + (Math.random() < 0.4 ? ' confetti--round' : '');
      el.style.cssText =
        `--w:${6 + Math.random() * 9}px;` +
        `--c:${COLORS[(Math.random() * COLORS.length) | 0]};` +
        `--dx:${((Math.random() * 320 - 160) | 0)}px;` +
        `--dy:${window.innerHeight + 140}px;` +
        `--rot:${((Math.random() * 1400 - 700) | 0)}deg;` +
        `--dur:${(1.7 + Math.random() * 1.9).toFixed(2)}s;` +
        `left:${(Math.random() * 100).toFixed(2)}vw;top:-40px;`;
      fx.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
  }

  function popText(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'pop-text';
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    if (color) el.style.color = color;
    fx.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }

  /* ---------------------------------------------------------
     4 · the catching game
     --------------------------------------------------------- */
  const GOAL = 5;
  const GRAVITY = 1150;

  const playfield = $('#playfield');
  const thrower   = $('.thrower');
  const heartsEl  = $('#hearts');
  const comboEl   = $('#combo');
  const tipEl     = $('#tip');
  const replayBtn = $('#replayBtn');

  let cakes = [];
  let raf = null, lastTs = 0, spawnTimer = null;
  let caught = 0, combo = 0, level = 0, running = false;

  const HEART_SVG = '<svg viewBox="0 0 32 29.6"><path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,9.5,11.9,16,21.2c6.1-9.3,16-12.1,16-21.2C32,3.8,28.2,0,23.6,0z"/></svg>';

  function buildHearts() {
    heartsEl.innerHTML = '';
    for (let i = 0; i < GOAL; i++) {
      const slot = document.createElement('span');
      slot.className = 'heart-slot';
      slot.innerHTML = HEART_SVG;
      heartsEl.appendChild(slot);
    }
    heartsEl.setAttribute('aria-label', `進度 0 / ${GOAL}`);
  }

  function spawnCake() {
    const field = playfield.getBoundingClientRect();
    const pig = thrower.getBoundingClientRect();
    const originX = pig.left + pig.width / 2 - field.left;
    const originY = pig.top - field.top - 18;

    const el = document.createElement('button');
    el.className = 'cake';
    el.type = 'button';
    el.setAttribute('aria-label', '接住蛋糕');
    el.innerHTML = '<img src="image/cake_64.svg" alt="" width="68" height="68">';

    const cake = {
      el,
      x: originX - 46,
      y: originY - 46,
      vx: (Math.random() * 2 - 1) * (200 + level * 22),
      vy: -(860 + Math.random() * 200 + level * 42),
      rot: (Math.random() * 2 - 1) * 14,
      vr: (Math.random() * 2 - 1) * 26,
      alive: true
    };

    el.addEventListener('pointerdown', (ev) => { ev.preventDefault(); onCatch(cake); });
    el.addEventListener('click', () => onCatch(cake));

    playfield.appendChild(el);
    cakes.push(cake);

    thrower.classList.add('is-throwing');
    window.setTimeout(() => thrower.classList.remove('is-throwing'), 440);
  }

  function onCatch(cake) {
    if (!cake.alive || !running) return;
    cake.alive = false;
    cake.el.classList.add('is-caught');
    window.setTimeout(() => cake.el.remove(), 420);

    const r = cake.el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    burst(cx, cy, 18);
    Sound.catchCake();

    caught += 1;
    combo += 1;
    const slot = heartsEl.children[caught - 1];
    if (slot) slot.classList.add('is-on');
    heartsEl.setAttribute('aria-label', `進度 ${caught} / ${GOAL}`);

    if (combo > 1) {
      comboEl.textContent = `連中 x${combo}`;
      comboEl.hidden = false;
      popText(cx, cy - 26, '連中!');
      Sound.combo(combo);
    }

    if (caught >= GOAL) win();
    else if (caught >= 2) tipEl.classList.add('is-gone');
  }

  function onMiss(cake) {
    if (!cake.alive) return;
    cake.alive = false;
    cake.el.remove();
    if (combo > 0) {
      combo = 0;
      comboEl.hidden = true;
      popText(window.innerWidth / 2, window.innerHeight * 0.62, '走雞', '#8a7a7a');
    }
    Sound.miss();
  }

  function win() {
    running = false;
    cancelAnimationFrame(raf);
    clearTimeout(spawnTimer);
    cakes.forEach((c) => { c.alive = false; c.el.remove(); });
    cakes = [];

    Sound.win();
    thrower.classList.add('is-cheer');
    rain(90);
    popText(window.innerWidth / 2, window.innerHeight / 2 - 90, '夠啦! 🎉');
    tipEl.textContent = '好嘢! 🎉';
    tipEl.classList.remove('is-gone');

    window.setTimeout(() => {
      thrower.classList.remove('is-cheer');
      Sound.rustle({ dur: 0.6, gain: 0.09, freq: 1800 });
      showStage('victory');
    }, 1500);
  }

  function frame(ts) {
    if (!running) return;
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    const fieldH = playfield.getBoundingClientRect().height;

    for (const c of cakes) {
      if (!c.alive) continue;
      c.vy += GRAVITY * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.vr * dt;
      c.el.style.transform = `translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0) rotate(${c.rot.toFixed(1)}deg)`;
      if (c.y > fieldH + 60) onMiss(c);
    }

    raf = requestAnimationFrame(frame);
  }

  function scheduleSpawn() {
    const delay = 1250 - level * 110;
    spawnTimer = window.setTimeout(() => {
      if (!running) return;
      spawnCake();
      level = Math.min(level + 0.5, 4);
      scheduleSpawn();
    }, delay);
  }

  function startGame() {
    buildHearts();
    caught = 0; combo = 0; level = 0;
    comboEl.hidden = true;
    tipEl.textContent = '撳一下空中的蛋糕';
    tipEl.classList.remove('is-gone');

    showStage('game');
    requestAnimationFrame(() => {
      running = true;
      lastTs = performance.now();
      raf = requestAnimationFrame(frame);
      scheduleSpawn();
    });
  }

  /* keyboard shortcut: space catches the oldest cake */
  document.addEventListener('keydown', (ev) => {
    if (!running || ev.code !== 'Space') return;
    const t = ev.target;
    if (t && t.closest && t.closest('.cake')) return;   // let the button handle it
    ev.preventDefault();
    const oldest = cakes.find((c) => c.alive);
    if (oldest) onCatch(oldest);
  });

  /* ---------------------------------------------------------
     5 · buttons
     --------------------------------------------------------- */
  $('#startBtn').addEventListener('click', () => { Sound.click(); startGame(); });

  replayBtn.addEventListener('click', () => { Sound.click(); startGame(); });

  const soundBtn = $('#soundBtn');
  soundBtn.addEventListener('click', () => {
    const on = soundBtn.getAttribute('aria-pressed') === 'true';
    soundBtn.setAttribute('aria-pressed', String(!on));
    soundBtn.setAttribute('aria-label', on ? '開啟音效' : '關閉音效');
    Sound.setMuted(on);
    if (!on) Sound.click();
  });

  const shareBtn = $('#shareBtn');
  shareBtn.addEventListener('click', async () => {
    const shareData = {
      title: '老婆生日快樂 🎂',
      text: '接住蛋糕, 就有驚喜。試下你可以唔跌一塊!',
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        flash(shareBtn, '連結已複製 💛');
      }
    } catch (err) {
      /* user dismissed the share sheet */
    }
  });

  function flash(btn, msg) {
    const original = btn.textContent;
    btn.textContent = msg;
    window.setTimeout(() => { btn.textContent = original; }, 1800);
  }

  /* ---------------------------------------------------------
     6 · boot
     --------------------------------------------------------- */
  showStage('intro');

  /* ---------------------------------------------------------
     7 · service worker (offline + auto-update)
     --------------------------------------------------------- */  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return;           // first install — do not bounce the user
      window.location.reload();
    });
  }
})();
