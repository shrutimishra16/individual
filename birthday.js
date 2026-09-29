/**
 * birthday.js — self-contained birthday surprise overlay
 * Inject with <script src="birthday.js"></script> at top of <body>
 * Zero impact on existing site logic/styles/functionality.
 *
 * ── CONFIG ────────────────────────────────────────────────────────────────
 */
const BDAY_CONFIG = {
  BIRTHDAY_DATE : "2026-09-29",   // ← YYYY-MM-DD  change to actual date
  NAME          : "My Love: Suryash",      // ← his name or nickname
  VIDEO_URL     : "https://www.youtube.com/watch?v=AsEeyYCG-7Q",  // ← YouTube watch or embed URL
  // sessionStorage key — overlay shows once per browser session on birthday date
  STORAGE_KEY   : "bday_seen_2026",
};
/* ─────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  /* ── Helper: convert any YouTube URL to embed URL ── */
  function toEmbedUrl(url) {
    if (!url) return "";
    // already an embed URL
    if (url.includes("youtube.com/embed/")) return url;
    // extract video id from watch or youtu.be URLs
    let vid = null;
    const watchMatch = url.match(/[?&]v=([\w-]{11})/);
    const shortMatch = url.match(/youtu\.be\/([\w-]{11})/);
    if (watchMatch) vid = watchMatch[1];
    else if (shortMatch) vid = shortMatch[1];
    if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
    return url; // fallback as-is
  }

  /* ── 1. Date check ── */
  function isBirthday() {
    const today = new Date();
    const [y, m, d] = BDAY_CONFIG.BIRTHDAY_DATE.split("-").map(Number);
    return today.getFullYear() === y &&
           today.getMonth() + 1 === m &&
           today.getDate()       === d;
  }

  // Add ?bday=1 to URL to force-open the overlay any day (for testing/preview)
  const forceBday = new URLSearchParams(location.search).has("bday");

  if (!forceBday && !isBirthday()) return;           // not the day — skip

  /* ── 2. Block body scroll while overlay is up ── */
  document.documentElement.style.overflow = "hidden";

  /* ── 3. Inject CSS ── */
  const style = document.createElement("style");
  style.textContent = `
  /* ── overlay shell ── */
  #bday-overlay {
    position: fixed; inset: 0; z-index: 99999;
    background: #0a0010;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    overflow: hidden;
    font-family: 'Segoe UI', Arial, sans-serif;
  }

  /* gradient bg layers */
  #bday-overlay::before {
    content:'';
    position:absolute; inset:0;
    background:
      radial-gradient(ellipse at 20% 10%,  rgba(255,60,120,.18) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%,  rgba(160,30,255,.18) 0%, transparent 55%),
      radial-gradient(ellipse at 50% 50%,  rgba(255,120,0,.08)  0%, transparent 60%);
    animation: bdayBgPulse 8s ease-in-out infinite alternate;
  }
  @keyframes bdayBgPulse {
    0%   { opacity:.7; }
    100% { opacity:1; }
  }

  /* ── canvas for particles ── */
  #bday-canvas {
    position:absolute; inset:0; pointer-events:none;
  }

  /* ── slides ── */
  .bday-slide {
    position:absolute; inset:0;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:24px;
    opacity:0; pointer-events:none;
    transition: opacity .7s ease;
    text-align:center;
  }
  .bday-slide.active {
    opacity:1; pointer-events:all;
  }

  /* ── typography ── */
  .bday-hey {
    font-size: clamp(2.2rem, 8vw, 5rem);
    font-weight: 900;
    letter-spacing: -1px;
    background: linear-gradient(135deg, #ff6b8a, #ffb347, #ff6b8a);
    background-size: 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: bdayShimmer 3s linear infinite;
    margin-bottom: 10px;
  }
  @keyframes bdayShimmer {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }

  .bday-sub {
    font-size: clamp(1rem, 3.5vw, 1.5rem);
    color: rgba(255,255,255,.65);
    line-height: 1.6;
    max-width: 520px;
  }

  .bday-name {
    font-size: clamp(2.8rem, 10vw, 6.5rem);
    font-weight: 900;
    letter-spacing: -2px;
    background: linear-gradient(135deg, #ff6b8a 0%, #c850c0 40%, #ffb347 80%, #ff6b8a 100%);
    background-size: 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: bdayShimmer 4s linear infinite;
    margin-bottom: 6px;
    line-height: 1.1;
  }

  .bday-made {
    font-size: clamp(.95rem, 3vw, 1.3rem);
    color: rgba(255,255,255,.5);
    margin-top: 10px;
  }

  .bday-cake {
    font-size: clamp(3rem, 12vw, 7rem);
    animation: bdayCakeBounce 1s ease infinite alternate;
    display: block; margin-bottom: 14px;
  }
  @keyframes bdayCakeBounce {
    0%   { transform: scale(1) rotate(-3deg); }
    100% { transform: scale(1.12) rotate(3deg); }
  }

  /* ── floating hearts on text slides ── */
  .bday-float-hearts {
    position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  }
  .bday-fh {
    position: absolute; bottom: -40px; font-size: 1.2rem;
    animation: bdayFH linear infinite;
    opacity: 0;
  }
  @keyframes bdayFH {
    0%   { transform: translateY(0) rotate(0);   opacity: 0; }
    10%  { opacity: .9; }
    90%  { opacity: .3; }
    100% { transform: translateY(-105vh) rotate(360deg); opacity: 0; }
  }

  /* ── video slide ── */
  .bday-video-label {
    font-size: clamp(.9rem, 2.5vw, 1.1rem);
    color: rgba(255,255,255,.5);
    margin-bottom: 18px;
    letter-spacing: .08em;
  }
  .bday-video-wrap {
    position: relative;
    width: min(540px, 90vw);
    aspect-ratio: 16/9;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 0 60px rgba(255,60,120,.35), 0 0 0 2px rgba(255,100,150,.25);
    background: #100010;
    margin-bottom: 22px;
  }
  .bday-video-wrap video,
  .bday-video-wrap iframe {
    width:100%; height:100%; border:none; display:block;
  }
  /* overlay play button (only for mp4 videos) */
  .bday-video-wrap .bday-play-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    background: rgba(0,0,0,.4);
    transition: opacity .3s;
  }
  .bday-video-wrap .bday-play-overlay.hidden { opacity:0; pointer-events:none; }
  .bday-play-circle {
    width: 70px; height: 70px; border-radius: 50%;
    background: linear-gradient(135deg, #ff6b8a, #c850c0);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.8rem; color: #fff;
    box-shadow: 0 0 30px rgba(255,60,120,.6);
    transition: transform .2s;
  }
  .bday-play-circle:hover { transform: scale(1.1); }

  /* ── skip video link ── */
  .bday-skip {
    font-size:.8rem; color:rgba(255,255,255,.3);
    cursor:pointer; border:none; background:transparent;
    text-decoration:underline; margin-top:6px;
    transition:color .2s;
  }
  .bday-skip:hover { color:rgba(255,255,255,.6); }

  /* ── interaction slide (YES / Obviously) ── */
  .bday-question {
    font-size: clamp(1.4rem, 5vw, 2.2rem);
    font-weight: 800; color: #fff;
    margin-bottom: 30px; line-height: 1.3;
  }
  .bday-choice-btns {
    display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
  }
  .bday-choice {
    padding: 14px 32px;
    border-radius: 50px; border: none; cursor: pointer;
    font-size: clamp(.95rem, 3vw, 1.2rem); font-weight: 800;
    letter-spacing: .04em;
    transition: transform .2s, box-shadow .2s;
    position: relative; overflow: hidden;
  }
  .bday-choice.yes {
    background: linear-gradient(135deg, #ff6b8a, #c850c0);
    color: #fff;
    box-shadow: 0 6px 30px rgba(255,60,120,.45);
  }
  .bday-choice.obv {
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.8);
    border: 1px solid rgba(255,255,255,.18);
  }
  .bday-choice:hover { transform: scale(1.06); }
  .bday-choice.yes:hover { box-shadow: 0 8px 40px rgba(255,60,120,.65); }

  /* ── enter button ── */
  .bday-enter {
    margin-top: 28px;
    padding: 18px 44px;
    border-radius: 50px; border: none; cursor: pointer;
    font-size: clamp(1rem, 3.5vw, 1.3rem); font-weight: 900;
    letter-spacing: .08em;
    background: linear-gradient(135deg, #ff6b8a 0%, #c850c0 40%, #ffb347 80%);
    background-size: 200%;
    color: #fff;
    box-shadow: 0 8px 40px rgba(255,60,120,.5);
    animation: bdayShimmer 3s linear infinite, bdayEnterPulse 2s ease-in-out infinite;
    transition: transform .2s;
  }
  .bday-enter:hover { transform: scale(1.05); }
  @keyframes bdayEnterPulse {
    0%, 100% { box-shadow: 0 8px 40px rgba(255,60,120,.5); }
    50%       { box-shadow: 0 12px 60px rgba(255,60,120,.8); }
  }

  /* ── final fade out ── */
  #bday-overlay.fade-out {
    transition: opacity .9s ease !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* ── step dots ── */
  .bday-dots {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 7px; z-index: 100000;
  }
  .bday-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,.2); transition: background .3s, transform .3s;
  }
  .bday-dot.active { background: #ff6b8a; transform: scale(1.4); }

  /* ── confetti piece ── */
  .bday-confetti {
    position: fixed; width: 10px; height: 10px;
    border-radius: 2px; pointer-events: none; z-index: 100001;
    animation: bdayConfettiFall linear forwards;
  }
  @keyframes bdayConfettiFall {
    0%   { transform: translateY(-10px) rotate(0);   opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  /* responsive tweak */
  @media (max-width: 480px) {
    .bday-choice-btns { flex-direction: column; align-items: center; }
    .bday-choice { width: 200px; text-align: center; }
  }
  `;
  document.head.appendChild(style);

  /* ── 4. Build HTML ── */
  const hasVideo = BDAY_CONFIG.VIDEO_URL.trim() !== "";

  const overlay = document.createElement("div");
  overlay.id = "bday-overlay";

  overlay.innerHTML = `
  <!-- particle canvas -->
  <canvas id="bday-canvas"></canvas>

  <!-- floating hearts layer (shared) -->
  <div class="bday-float-hearts" id="bday-fh"></div>

  <!-- SLIDE 0: Hey you -->
  <div class="bday-slide active" id="bday-s0">
    <div class="bday-hey">RAM RAM... ❤️</div>
    <div class="bday-sub">Your non-tech girlfriend tried a little something for you...</div>
  </div>

  <!-- SLIDE 1: Because today -->
  <div class="bday-slide" id="bday-s1">
    <span class="bday-cake">🎂</span>
    <div class="bday-hey" style="font-size:clamp(1.4rem,5vw,2.8rem)">Because today is YOUR day.</div>
    <div class="bday-sub" style="margin-top:8px">Never been this excited for apna birthday.</div>
  </div>

  <!-- SLIDE 2: Happy Birthday NAME -->
  <div class="bday-slide" id="bday-s2">
    <div class="bday-sub" style="margin-bottom:14px;font-size:clamp(.9rem,2.5vw,1.1rem);letter-spacing:.12em;text-transform:uppercase">Happy Birthday</div>
    <div class="bday-name">${BDAY_CONFIG.NAME} ❤️</div>
    <div class="bday-made">I tried something in your love language...</div>
  </div>

  <!-- SLIDE 3: Video (conditional) -->
  ${hasVideo ? `
  <div class="bday-slide" id="bday-s3">
    <div class="bday-video-label">First... a chota video from me to you ❤️</div>
    <div class="bday-video-wrap" id="bday-vwrap">
      ${BDAY_CONFIG.VIDEO_URL.includes("youtube") || BDAY_CONFIG.VIDEO_URL.includes("youtu.be")
        ? `<iframe src="${toEmbedUrl(BDAY_CONFIG.VIDEO_URL)}" allow="autoplay; fullscreen" allowfullscreen></iframe>`
        : `<video id="bday-vid" src="${BDAY_CONFIG.VIDEO_URL}" playsinline></video>
           <div class="bday-play-overlay" id="bday-play-overlay">
             <div class="bday-play-circle">&#9654;</div>
           </div>`
      }
    </div>
    <button class="bday-skip" id="bday-skip-video">Skip video →</button>
  </div>
  ` : ""}

  <!-- SLIDE 4 (or 3 if no video): After video / okay ready -->
  <div class="bday-slide" id="bday-s${hasVideo ? 4 : 3}">
    <div style="font-size:clamp(3rem,12vw,7rem);animation:bdayCakeBounce 1s ease infinite alternate;display:block;margin-bottom:16px">🥰</div>
    <div class="bday-hey" style="font-size:clamp(1.4rem,5vw,2.6rem)">Okay... now that you seem to be ready.</div>
    <div class="bday-sub" style="margin-top:10px">Get ready to witness what I and kiro built just for you.</div>
  </div>

  <!-- SLIDE 5 (or 4): Ready? interaction -->
  <div class="bday-slide" id="bday-s${hasVideo ? 5 : 4}">
    <div class="bday-question">Are you excited (Please be)</div>
    <div class="bday-choice-btns">
      <button class="bday-choice yes" id="bday-yes">YES ❤️</button>
      <button class="bday-choice obv" id="bday-obv">Obviously 😌</button>
    </div>
  </div>

  <!-- SLIDE 6 (or 5): Enter -->
  <div class="bday-slide" id="bday-s${hasVideo ? 6 : 5}">
    <div class="bday-hey" style="font-size:clamp(1.3rem,4.5vw,2.4rem)">Okay birthday boy...</div>
    <div class="bday-sub" style="margin:12px 0 4px">Your surprise awaits. ❤️</div>
    <button class="bday-enter" id="bday-enter">ENTER YOUR SURPRISE &nbsp;→</button>
  </div>

  <!-- dots -->
  <div class="bday-dots" id="bday-dots"></div>
  `;

  document.body.insertBefore(overlay, document.body.firstChild);

  /* ── 5. Dots ── */
  const totalSlides = hasVideo ? 7 : 6;
  const dotsEl = document.getElementById("bday-dots");
  for (let i = 0; i < totalSlides; i++) {
    const d = document.createElement("div");
    d.className = "bday-dot" + (i === 0 ? " active" : "");
    dotsEl.appendChild(d);
  }

  /* ═══════════════════════════════════════════════════════════
     SLIDE ENGINE — clean flat state machine
     Slides that are "manual" wait for user action.
     All others auto-advance after 5 s.

     Slide map (hasVideo = true):
       0  Hey you
       1  Because today
       2  Happy Birthday NAME
       3  Video          ← manual (skip button / video end)
       4  Okay ready     ← auto 5 s
       5  Ready?         ← manual (choice buttons)
       6  Enter          ← manual (enter button)

     Slide map (hasVideo = false):
       0  Hey you
       1  Because today
       2  Happy Birthday NAME
       3  Okay ready     ← auto 5 s
       4  Ready?         ← manual
       5  Enter          ← manual
  ═══════════════════════════════════════════════════════════ */

  // Which slide indices require manual user action (no auto-advance)
  const manualSlides = hasVideo
    ? new Set([3, 5, 6])   // video, choice, enter
    : new Set([4, 5]);     // choice, enter

  let current = 0;
  let autoTimer = null;

  function goTo(n) {
    if (n < 0 || n >= totalSlides) return;
    clearTimeout(autoTimer);

    const slides = overlay.querySelectorAll(".bday-slide");
    const dots   = dotsEl.querySelectorAll(".bday-dot");
    slides.forEach((s, i) => s.classList.toggle("active", i === n));
    dots.forEach((d, i)   => d.classList.toggle("active", i === n));
    current = n;

    // Schedule auto-advance unless this slide needs user action
    if (!manualSlides.has(n)) {
      autoTimer = setTimeout(() => goTo(n + 1), 5000);
    }
  }

  // Kick off from slide 0
  goTo(0);

  /* ── Video slide wiring ── */
  if (hasVideo) {
    // mp4 play button
    const isYT = BDAY_CONFIG.VIDEO_URL.includes("youtube") || BDAY_CONFIG.VIDEO_URL.includes("youtu.be");
    if (!isYT) {
      const vid = document.getElementById("bday-vid");
      const po  = document.getElementById("bday-play-overlay");
      if (vid && po) {
        po.addEventListener("click", () => { vid.play(); po.classList.add("hidden"); });
        vid.addEventListener("pause",  () => { if (!vid.ended) po.classList.remove("hidden"); });
        vid.addEventListener("ended",  () => goTo(4)); // auto-advance when video finishes
      }
    }
    // Skip button — always present on video slide
    const skipBtn = document.getElementById("bday-skip-video");
    if (skipBtn) skipBtn.addEventListener("click", () => goTo(4));
  }

  /* ── Choice buttons ── */
  function onChoice() {
    burstConfetti(80);
    burstHearts(30);
    setTimeout(() => goTo(hasVideo ? 6 : 5), 900);
  }
  document.getElementById("bday-yes").addEventListener("click", onChoice);
  document.getElementById("bday-obv").addEventListener("click", onChoice);

  /* ── Enter button ── */
  document.getElementById("bday-enter").addEventListener("click", () => {
    burstConfetti(120);
    overlay.classList.add("fade-out");
    setTimeout(() => {
      overlay.remove();
      document.documentElement.style.overflow = "";
    }, 950);
  });

  /* ── Tap anywhere on auto slides to skip ahead early ── */
  overlay.addEventListener("click", e => {
    if (e.target.closest("button,video,iframe,a")) return;
    if (!manualSlides.has(current)) {
      clearTimeout(autoTimer);
      goTo(current + 1);
    }
  });
  const fhEl = document.getElementById("bday-fh");
  const fhSyms = ["❤","♥","💕","💖","💗","✨","⭐","🌸"];
  function spawnHeart() {
    const h = document.createElement("span");
    h.className = "bday-fh";
    h.textContent = fhSyms[Math.floor(Math.random() * fhSyms.length)];
    h.style.left = Math.random() * 100 + "vw";
    h.style.fontSize = (.6 + Math.random() * 1.4) + "rem";
    const dur = 7 + Math.random() * 8;
    h.style.animationDuration = dur + "s";
    h.style.animationDelay = Math.random() * 2 + "s";
    fhEl.appendChild(h);
    setTimeout(() => h.remove(), (dur + 3) * 1000);
  }
  setInterval(spawnHeart, 600);
  for (let i = 0; i < 12; i++) spawnHeart();

  /* ── 14. Glowing particle canvas ── */
  const canvas = document.getElementById("bday-canvas");
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  const colors = ["#ff6b8a","#c850c0","#ffb347","#ffd700","#ff4466","#ff90c0","#e040fb"];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = .5 + Math.random() * 2.5;
      this.vx = (Math.random() - .5) * .4;
      this.vy = (Math.random() - .5) * .4;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.alpha = .2 + Math.random() * .5;
      this.life  = 0;
      this.maxLife = 200 + Math.random() * 300;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.life++;
      if (this.life > this.maxLife || this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha * (1 - this.life / this.maxLife);
      ctx.shadowBlur  = 8;
      ctx.shadowColor = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  function animCanvas() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animCanvas);
  }
  animCanvas();

  /* ── 15. Confetti burst ── */
  const confColors = ["#ff6b8a","#ffb347","#ffd700","#c850c0","#ff4466","#60efff","#fff"];
  function burstConfetti(count) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "bday-confetti";
      el.style.left      = Math.random() * 100 + "vw";
      el.style.top       = "-10px";
      el.style.background = confColors[Math.floor(Math.random() * confColors.length)];
      el.style.width      = (6 + Math.random() * 10) + "px";
      el.style.height     = (6 + Math.random() * 10) + "px";
      el.style.borderRadius = Math.random() > .5 ? "50%" : "2px";
      const dur = 1.5 + Math.random() * 2;
      el.style.animationDuration = dur + "s";
      el.style.animationDelay    = Math.random() * .8 + "s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (dur + 1) * 1000);
    }
  }

  /* ── 16. Heart burst ── */
  function burstHearts(count) {
    for (let i = 0; i < count; i++) {
      const h = document.createElement("span");
      h.className = "bday-fh";
      h.textContent = ["❤","💕","💖","✨"][Math.floor(Math.random() * 4)];
      h.style.left = Math.random() * 100 + "vw";
      h.style.fontSize = (1 + Math.random() * 2) + "rem";
      const dur = 3 + Math.random() * 3;
      h.style.animationDuration = dur + "s";
      h.style.animationDelay = Math.random() * .5 + "s";
      fhEl.appendChild(h);
      setTimeout(() => h.remove(), (dur + 1) * 1000);
    }
  }

})();
