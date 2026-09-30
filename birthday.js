/**
 * birthday.js — self-contained birthday surprise overlay
 * Inject with <script src="birthday.js"></script> at top of <body>
 * Zero impact on existing site logic/styles/functionality.
 *
 * ── CONFIG ────────────────────────────────────────────────────────────────
 */
const BDAY_CONFIG = {
  BIRTHDAY_DATE : "2026-09-30",   // ← YYYY-MM-DD  change to actual date
  NAME          : "My Love: Suryash",
  VIDEO_URL     : "https://www.youtube.com/watch?v=AsEeyYCG-7Q",
  STORAGE_KEY   : "bday_seen_2026",

  // ── ITINERARY ── edit times and activities below ──────────────────────
  ITINERARY: [
    { time: "09:30 AM", icon: "🌸", title: "Be Ready, My Love",   desc: "Dress up hoke meet me at NSP, u can also be late today. Aj maaf hai tumhhe" },
    { time: "10:00 AM", icon: "☕", title: "Monestary visit",     desc: "Monestary is the new mandir." },
    { time: "10:30 AM", icon: "🌹", title: "Photobooth",   desc: "We will click sundr sundr pics, this time maybe thoda kam shy." },
    { time: "11:00 PM", icon: "🎁", title: "Breakfast and market stall",           desc: "Majnu ke tila mai ek do chize try karenge light hi" },
    { time: "12:00 noon", icon: "🌅", title: "Nehru planetarium",    desc: "We will leave for Nehru planatarium show" },
    { time: "2:30 PM", icon: "🍽️", title: "Lunch",              desc: "No fancy restaurants this time. Koi acha north indian lunch we will have" },
    { time: "3:30 PM", icon: "🎂", title: "Bowling and deserts",       desc: "We will end ur day apko bowling mai beat krke" },
    { time: "4:30 PM", icon: "🎂", title: "Hugs and kisses",       desc: "Farewell hugs and mat jao mayt jao ka rona" },
  ],
};
/* ─────────────────────────────────────────────────────────────────────── */

(function () {
  "use strict";

  /* ── Helper: convert any YouTube URL to embed URL ── */
  function toEmbedUrl(url) {
    if (!url) return "";
    if (url.includes("youtube.com/embed/")) return url;
    let vid = null;
    const watchMatch = url.match(/[?&]v=([\w-]{11})/);
    const shortMatch = url.match(/youtu\.be\/([\w-]{11})/);
    if (watchMatch) vid = watchMatch[1];
    else if (shortMatch) vid = shortMatch[1];
    if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`;
    return url;
  }

  /* ── 1. Date check ── */
  function isBirthday() {
    const today = new Date();
    const [y, m, d] = BDAY_CONFIG.BIRTHDAY_DATE.split("-").map(Number);
    return today.getFullYear() === y &&
           today.getMonth() + 1 === m &&
           today.getDate()       === d;
  }

  const forceBday = new URLSearchParams(location.search).has("bday");
  if (!forceBday && !isBirthday()) return;

  /* ── 2. Block body scroll ── */
  document.documentElement.style.overflow = "hidden";

  /* ── 3. Inject CSS ── */
  const style = document.createElement("style");
  style.textContent = `
  #bday-overlay {
    position: fixed; inset: 0; z-index: 99999;
    background: #0a0010;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    overflow: hidden;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
  #bday-overlay::before {
    content:'';
    position:absolute; inset:0;
    background:
      radial-gradient(ellipse at 20% 10%,  rgba(255,60,120,.18) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%,  rgba(160,30,255,.18) 0%, transparent 55%),
      radial-gradient(ellipse at 50% 50%,  rgba(255,120,0,.08)  0%, transparent 60%);
    animation: bdayBgPulse 8s ease-in-out infinite alternate;
  }
  @keyframes bdayBgPulse { 0%{opacity:.7} 100%{opacity:1} }

  #bday-canvas { position:absolute; inset:0; pointer-events:none; }

  .bday-slide {
    position:absolute; inset:0;
    display:flex; flex-direction:column;
    align-items:center; justify-content:center;
    padding:24px;
    opacity:0; pointer-events:none;
    transition: opacity .7s ease;
    text-align:center;
  }
  .bday-slide.active { opacity:1; pointer-events:all; }

  .bday-hey {
    font-size: clamp(2.2rem, 8vw, 5rem);
    font-weight: 900; letter-spacing: -1px;
    background: linear-gradient(135deg, #ff6b8a, #ffb347, #ff6b8a);
    background-size: 200%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: bdayShimmer 3s linear infinite; margin-bottom: 10px;
  }
  @keyframes bdayShimmer {
    0%   { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
  .bday-sub {
    font-size: clamp(1rem, 3.5vw, 1.5rem);
    color: rgba(255,255,255,.65); line-height: 1.6; max-width: 520px;
  }
  .bday-name {
    font-size: clamp(2.8rem, 10vw, 6.5rem);
    font-weight: 900; letter-spacing: -2px;
    background: linear-gradient(135deg, #ff6b8a 0%, #c850c0 40%, #ffb347 80%, #ff6b8a 100%);
    background-size: 300%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: bdayShimmer 4s linear infinite; margin-bottom: 6px; line-height: 1.1;
  }
  .bday-made { font-size: clamp(.95rem, 3vw, 1.3rem); color: rgba(255,255,255,.5); margin-top: 10px; }
  .bday-cake {
    font-size: clamp(3rem, 12vw, 7rem);
    animation: bdayCakeBounce 1s ease infinite alternate;
    display: block; margin-bottom: 14px;
  }
  @keyframes bdayCakeBounce {
    0%   { transform: scale(1) rotate(-3deg); }
    100% { transform: scale(1.12) rotate(3deg); }
  }

  /* floating hearts */
  .bday-float-hearts { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .bday-fh {
    position: absolute; bottom: -40px; font-size: 1.2rem;
    animation: bdayFH linear infinite; opacity: 0;
  }
  @keyframes bdayFH {
    0%   { transform: translateY(0) rotate(0);   opacity: 0; }
    10%  { opacity: .9; }
    90%  { opacity: .3; }
    100% { transform: translateY(-105vh) rotate(360deg); opacity: 0; }
  }

  /* ── photo wish slide ── */
  .bday-photo-slide { padding: 0 !important; }
  .bday-photo-wrap {
    position: relative;
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .bday-photo-wrap img {
    width: 100%; height: 100%;
    object-fit: contain;
    object-position: center;
    display: block;
  }
  /* dark vignette so text is readable over the photo */
  .bday-photo-wrap::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,.15) 0%,
      transparent 25%,
      transparent 55%,
      rgba(0,0,0,.75) 100%
    );
    pointer-events: none;
  }
  .bday-photo-wish {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 20px 24px 32px;
    text-align: center;
    z-index: 2;
  }
  .bday-photo-wish h2 {
    font-size: clamp(1.4rem, 5vw, 2.6rem);
    font-weight: 900; line-height: 1.2;
    background: linear-gradient(135deg, #fff 40%, #ffb3c8, #ffd700);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    text-shadow: none;
    margin-bottom: 6px;
  }
  .bday-photo-wish p {
    font-size: clamp(.85rem, 2.5vw, 1.1rem);
    color: rgba(255,255,255,.8);
    font-style: italic;
  }
  .bday-photo-skip {
    position: absolute; bottom: 14px; right: 18px;
    font-size:.75rem; color:rgba(255,255,255,.35);
    cursor:pointer; border:none; background:transparent;
    text-decoration:underline; z-index: 3; transition:color .2s;
  }
  .bday-photo-skip:hover { color:rgba(255,255,255,.7); }

  /* choice */
  .bday-question { font-size: clamp(1.4rem, 5vw, 2.2rem); font-weight: 800; color: #fff; margin-bottom: 30px; line-height: 1.3; }
  .bday-choice-btns { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
  .bday-choice {
    padding: 14px 32px; border-radius: 50px; border: none; cursor: pointer;
    font-size: clamp(.95rem, 3vw, 1.2rem); font-weight: 800; letter-spacing: .04em;
    transition: transform .2s, box-shadow .2s; position: relative; overflow: hidden;
  }
  .bday-choice.yes { background: linear-gradient(135deg, #ff6b8a, #c850c0); color: #fff; box-shadow: 0 6px 30px rgba(255,60,120,.45); }
  .bday-choice.obv { background: rgba(255,255,255,.08); color: rgba(255,255,255,.8); border: 1px solid rgba(255,255,255,.18); }
  .bday-choice:hover { transform: scale(1.06); }
  .bday-choice.yes:hover { box-shadow: 0 8px 40px rgba(255,60,120,.65); }

  /* enter */
  .bday-enter {
    margin-top: 28px; padding: 18px 44px; border-radius: 50px; border: none; cursor: pointer;
    font-size: clamp(1rem, 3.5vw, 1.3rem); font-weight: 900; letter-spacing: .08em;
    background: linear-gradient(135deg, #ff6b8a 0%, #c850c0 40%, #ffb347 80%);
    background-size: 200%; color: #fff; box-shadow: 0 8px 40px rgba(255,60,120,.5);
    animation: bdayShimmer 3s linear infinite, bdayEnterPulse 2s ease-in-out infinite; transition: transform .2s;
  }
  .bday-enter:hover { transform: scale(1.05); }
  @keyframes bdayEnterPulse {
    0%, 100% { box-shadow: 0 8px 40px rgba(255,60,120,.5); }
    50%       { box-shadow: 0 12px 60px rgba(255,60,120,.8); }
  }

  /* fade out */
  #bday-overlay.fade-out { transition: opacity .9s ease !important; opacity: 0 !important; pointer-events: none !important; }

  /* dots */
  .bday-dots { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); display: flex; gap: 7px; z-index: 100000; }
  .bday-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,.2); transition: background .3s, transform .3s; }
  .bday-dot.active { background: #ff6b8a; transform: scale(1.4); }

  /* confetti */
  .bday-confetti {
    position: fixed; width: 10px; height: 10px; border-radius: 2px;
    pointer-events: none; z-index: 100001; animation: bdayConfettiFall linear forwards;
  }
  @keyframes bdayConfettiFall {
    0%   { transform: translateY(-10px) rotate(0);   opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }

  /* ══════════════════════════════════════════════
     ITINERARY INVITE CARD
  ══════════════════════════════════════════════ */
  .bday-invite-slide {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    align-items: center;
    justify-content: flex-start;
    padding: 20px 16px 80px;
    /* position:absolute + inset:0 gives us the dimensions,
       but we need an explicit height for overflow-y to kick in */
    height: 100%;
    display: block;        /* switch from flex so block scroll works */
  }

  /* re-center the card inside the now-block slide */
  .bday-invite-slide .bday-invite-card {
    margin: 0 auto;
  }
  .bday-invite-slide .invite-cta {
    display: block;
    margin: 22px auto 0;
  }

  /* pink scrollbar for the invite slide */
  .bday-invite-slide::-webkit-scrollbar { width: 4px; }
  .bday-invite-slide::-webkit-scrollbar-track { background: transparent; }
  .bday-invite-slide::-webkit-scrollbar-thumb { background: rgba(255,107,138,.5); border-radius: 2px; }
  .bday-invite-slide { scrollbar-width: thin; scrollbar-color: rgba(255,107,138,.5) transparent; }

  .bday-invite-card {
    position: relative;
    width: min(560px, 95vw);
    margin: 0 auto;
    background: linear-gradient(160deg, #fffdf7 0%, #fff5f8 40%, #fdf0ff 100%);
    border-radius: 24px;
    padding: 0;
    overflow: hidden;
    box-shadow:
      0 0 0 2px #e8b4c8,
      0 0 0 5px rgba(232,180,200,.3),
      0 20px 80px rgba(180,40,100,.35),
      0 0 120px rgba(255,107,138,.15);
  }

  /* top floral border strip */
  .invite-floral-top {
    width: 100%; font-size: 1.6rem; text-align: center;
    padding: 14px 10px 6px; letter-spacing: 4px;
    background: linear-gradient(135deg, #ffe4f0, #ffd6e8);
    border-bottom: 1px solid rgba(220,100,150,.2);
    line-height: 1;
  }
  /* bottom floral border strip */
  .invite-floral-bot {
    width: 100%; font-size: 1.6rem; text-align: center;
    padding: 6px 10px 14px; letter-spacing: 4px;
    background: linear-gradient(135deg, #ffd6e8, #ffe4f0);
    border-top: 1px solid rgba(220,100,150,.2);
    line-height: 1;
  }

  /* inner content */
  .invite-inner {
    padding: 28px 32px 24px;
    background:
      radial-gradient(ellipse at 10% 0%,   rgba(255,182,193,.25) 0%, transparent 50%),
      radial-gradient(ellipse at 90% 100%, rgba(221,160,221,.2)  0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%,  rgba(255,240,245,.5)  0%, transparent 70%);
  }

  /* corner roses */
  .invite-corner {
    position: absolute;
    font-size: 2.2rem;
    line-height: 1;
    opacity: .85;
  }
  .invite-corner.tl { top: 52px;  left: 12px;  transform: rotate(-15deg); }
  .invite-corner.tr { top: 52px;  right: 12px; transform: rotate(15deg); }
  .invite-corner.bl { bottom: 52px; left: 12px;  transform: rotate(15deg); }
  .invite-corner.br { bottom: 52px; right: 12px; transform: rotate(-15deg); }

  /* header */
  .invite-eyebrow {
    font-size: .72rem; letter-spacing: .3em; text-transform: uppercase;
    color: #c2668a; font-weight: 700; margin-bottom: 6px;
  }
  .invite-title {
    font-size: clamp(1.6rem, 6vw, 2.4rem);
    font-weight: 900; line-height: 1.1;
    background: linear-gradient(135deg, #b5336a, #c850c0, #e8a020);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    margin-bottom: 4px;
  }
  .invite-subtitle {
    font-size: clamp(.82rem, 2.5vw, 1rem);
    color: #b07090; font-style: italic; margin-bottom: 18px;
  }

  /* divider */
  .invite-divider {
    display: flex; align-items: center; gap: 10px; margin: 14px 0;
  }
  .invite-divider-line { flex: 1; height: 1px; background: linear-gradient(to right, transparent, #e8b4c8, transparent); }
  .invite-divider-icon { font-size: 1rem; color: #e8608a; }

  /* intro note */
  .invite-note {
    font-size: clamp(.82rem, 2.5vw, .95rem);
    color: #8a4060; line-height: 1.7; margin-bottom: 20px;
    font-style: italic;
    background: rgba(255,182,193,.15);
    border-left: 3px solid #f0a0c0;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
  }

  /* itinerary list */
  .invite-items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0; }
  .invite-item {
    display: grid;
    grid-template-columns: 62px 36px 1fr;
    align-items: flex-start;
    gap: 0 10px;
    padding: 10px 0;
    border-bottom: 1px dashed rgba(220,140,170,.3);
    position: relative;
  }
  .invite-item:last-child { border-bottom: none; }

  .invite-time {
    font-size: .72rem; font-weight: 800; color: #c2668a;
    letter-spacing: .05em; padding-top: 2px; text-align: right;
    white-space: nowrap;
  }
  .invite-icon-wrap {
    display: flex; flex-direction: column; align-items: center;
  }
  .invite-item-icon { font-size: 1.3rem; line-height: 1; margin-bottom: 4px; }
  .invite-dot-line {
    width: 1px; flex: 1; min-height: 24px;
    background: linear-gradient(to bottom, #e8b4c8, transparent);
  }
  .invite-item:last-child .invite-dot-line { display: none; }

  .invite-item-body { padding-bottom: 6px; }
  .invite-item-title { font-size: clamp(.85rem, 2.5vw, 1rem); font-weight: 800; color: #6a2040; margin-bottom: 2px; }
  .invite-item-desc  { font-size: clamp(.74rem, 2vw, .85rem); color: #a06080; line-height: 1.5; }

  /* sign-off */
  .invite-signoff {
    margin-top: 18px; text-align: center;
  }
  .invite-signoff p {
    font-size: clamp(.82rem, 2.5vw, .95rem); color: #b07090; font-style: italic; line-height: 1.7;
  }
  .invite-signoff .invite-sig {
    font-size: clamp(1.1rem, 4vw, 1.5rem); font-weight: 900; margin-top: 8px;
    background: linear-gradient(135deg, #e05080, #c850c0);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  /* scroll-to-enter btn */
  .invite-cta {
    margin-top: 22px; padding: 15px 36px; border-radius: 50px; border: none; cursor: pointer;
    font-size: clamp(.95rem, 3vw, 1.1rem); font-weight: 900; letter-spacing: .06em;
    background: linear-gradient(135deg, #e05080, #c850c0, #ff9060);
    background-size: 200%; color: #fff;
    box-shadow: 0 6px 30px rgba(200,50,150,.45);
    animation: bdayShimmer 3s linear infinite; transition: transform .2s;
    display: block; width: fit-content; margin-left: auto; margin-right: auto;
  }
  .invite-cta:hover { transform: scale(1.04); }

  @media (max-width: 480px) {
    .bday-choice-btns { flex-direction: column; align-items: center; }
    .bday-choice { width: 200px; text-align: center; }
    .invite-inner { padding: 20px 18px 18px; }
    .invite-corner { font-size: 1.6rem; }
  }
  `;
  document.head.appendChild(style);

  /* ── 4. Build itinerary HTML ── */
  // Photo slide is always shown (replaces video)
  const S = { photo:3, ready:4, choice:5, invite:6, enter:7 };
  const totalSlides = 8;

  const itineraryHTML = BDAY_CONFIG.ITINERARY.map(item => `
    <li class="invite-item">
      <span class="invite-time">${item.time}</span>
      <div class="invite-icon-wrap">
        <span class="invite-item-icon">${item.icon}</span>
        <div class="invite-dot-line"></div>
      </div>
      <div class="invite-item-body">
        <div class="invite-item-title">${item.title}</div>
        <div class="invite-item-desc">${item.desc}</div>
      </div>
    </li>`).join("");

  const overlay = document.createElement("div");
  overlay.id = "bday-overlay";

  overlay.innerHTML = `
  <canvas id="bday-canvas"></canvas>
  <div class="bday-float-hearts" id="bday-fh"></div>

  <!-- SLIDE 0 -->
  <div class="bday-slide active" id="bday-s0">
    <div class="bday-hey">RAM RAM... ❤️</div>
    <div class="bday-sub">Your non-tech girlfriend tried a little something for you...</div>
  </div>

  <!-- SLIDE 1 -->
  <div class="bday-slide" id="bday-s1">
    <span class="bday-cake">🎂</span>
    <div class="bday-hey" style="font-size:clamp(1.4rem,5vw,2.8rem)">Because today is YOUR day.</div>
    <div class="bday-sub" style="margin-top:8px">Never been this excited for apna birthday.</div>
  </div>

  <!-- SLIDE 2 -->
  <div class="bday-slide" id="bday-s2">
    <div class="bday-sub" style="margin-bottom:14px;font-size:clamp(.9rem,2.5vw,1.1rem);letter-spacing:.12em;text-transform:uppercase">Happy Birthday</div>
    <div class="bday-name">${BDAY_CONFIG.NAME} ❤️</div>
    <div class="bday-made">I tried something in your love language...</div>
  </div>

  <!-- SLIDE 3: Birthday photo wish -->
  <div class="bday-slide bday-photo-slide" id="bday-s${S.photo}">
    <div class="bday-photo-wrap">
      <img src="media/photos/bday.jpeg" alt="Happy Birthday">
      <div class="bday-photo-wish">
        <h2>🎂 Many Many Returns of the Day 🎂</h2>
        <p>Wishing you all the love, joy and cake in the world ❤️</p>
      </div>
    </div>
    <button class="bday-photo-skip" id="bday-photo-skip">Continue →</button>
  </div>

  <!-- Okay ready -->
  <div class="bday-slide" id="bday-s${S.ready}">
    <div style="font-size:clamp(3rem,12vw,7rem);animation:bdayCakeBounce 1s ease infinite alternate;display:block;margin-bottom:16px">🥰</div>
    <div class="bday-hey" style="font-size:clamp(1.4rem,5vw,2.6rem)">Okay... now that you seem to be ready.</div>
    <div class="bday-sub" style="margin-top:10px">Get ready to witness what I and Kiro built just for you.</div>
  </div>

  <!-- Ready? choice -->
  <div class="bday-slide" id="bday-s${S.choice}">
    <div class="bday-question">Are you excited? (Please be 🥺)</div>
    <div class="bday-choice-btns">
      <button class="bday-choice yes" id="bday-yes">YES ❤️</button>
      <button class="bday-choice obv" id="bday-obv">Obviously 😌</button>
    </div>
  </div>

  <!-- ══ ITINERARY INVITE SLIDE ══ -->
  <div class="bday-slide bday-invite-slide" id="bday-s${S.invite}">
    <div class="bday-invite-card">

      <!-- corner roses -->
      <span class="invite-corner tl">🌸</span>
      <span class="invite-corner tr">🌷</span>
      <span class="invite-corner bl">🌺</span>
      <span class="invite-corner br">🌸</span>

      <!-- top floral strip -->
      <div class="invite-floral-top">🌹 🌸 🌺 🌷 🌼 🌷 🌺 🌸 🌹</div>

      <div class="invite-inner">
        <div class="invite-eyebrow">✨ A Special Invitation ✨</div>
        <div class="invite-title">Your Birthday Itinerary</div>
        <div class="invite-subtitle">Curated with love, just for you 🎀</div>

        <div class="invite-divider">
          <div class="invite-divider-line"></div>
          <span class="invite-divider-icon">💕</span>
          <div class="invite-divider-line"></div>
        </div>

        <div class="invite-note">
          Dear ${BDAY_CONFIG.NAME.split(":").pop().trim()}, today is entirely yours.
          I have tried planning thoda thoda which I doubt will be executed but tried making an itineary.
          Please show up to your celebration. ❤️
        </div>

        <ul class="invite-items">
          ${itineraryHTML}
        </ul>

        <div class="invite-divider" style="margin-top:16px">
          <div class="invite-divider-line"></div>
          <span class="invite-divider-icon">🌸</span>
          <div class="invite-divider-line"></div>
        </div>

        <div class="invite-signoff">
          <p>You deserve every bit of today and so much more.<br>Happy Birthday, my love.</p>
          <div class="invite-sig">With all my love 💌</div>
        </div>
      </div>

      <!-- bottom floral strip -->
      <div class="invite-floral-bot">🌼 🌷 🌸 🌹 💐 🌹 🌸 🌷 🌼</div>
    </div>

    <button class="invite-cta" id="bday-invite-next">I'm so ready → Enter My Surprise 🎉</button>
  </div>

  <!-- Enter -->
  <div class="bday-slide" id="bday-s${S.enter}">
    <div class="bday-hey" style="font-size:clamp(1.3rem,4.5vw,2.4rem)">Okay birthday boy...</div>
    <div class="bday-sub" style="margin:12px 0 4px">Your surprise awaits. ❤️</div>
    <button class="bday-enter" id="bday-enter">ENTER YOUR SURPRISE &nbsp;→</button>
  </div>

  <div class="bday-dots" id="bday-dots"></div>
  `;

  document.body.insertBefore(overlay, document.body.firstChild);

  /* ── 5. Dots ── */
  const dotsEl = document.getElementById("bday-dots");
  for (let i = 0; i < totalSlides; i++) {
    const d = document.createElement("div");
    d.className = "bday-dot" + (i === 0 ? " active" : "");
    dotsEl.appendChild(d);
  }

  /* ── 6. Slide engine ── */
  const manualSlides = new Set([S.photo, S.choice, S.invite, S.enter]);

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
    // scroll invite slide back to top when entering it
    if (n === S.invite) {
      const sl = overlay.querySelector(`#bday-s${S.invite}`);
      if (sl) sl.scrollTop = 0;
    }
    if (!manualSlides.has(n)) {
      autoTimer = setTimeout(() => goTo(n + 1), 5000);
    }
  }
  goTo(0);

  /* ── Photo slide skip button ── */
  document.getElementById("bday-photo-skip").addEventListener("click", () => goTo(S.ready));

  /* ── Choice buttons ── */
  function onChoice() {
    burstConfetti(80);
    burstHearts(30);
    setTimeout(() => goTo(S.invite), 900);
  }
  document.getElementById("bday-yes").addEventListener("click", onChoice);
  document.getElementById("bday-obv").addEventListener("click", onChoice);

  /* ── Invite CTA ── */
  document.getElementById("bday-invite-next").addEventListener("click", () => {
    burstConfetti(60);
    burstHearts(20);
    setTimeout(() => goTo(S.enter), 600);
  });

  /* ── Enter button ── */
  document.getElementById("bday-enter").addEventListener("click", () => {
    burstConfetti(120);
    overlay.classList.add("fade-out");
    setTimeout(() => {
      overlay.remove();
      document.documentElement.style.overflow = "";
    }, 950);
  });

  /* ── Tap anywhere on auto slides to skip ── */
  overlay.addEventListener("click", e => {
    if (e.target.closest("button,video,iframe,a")) return;
    if (!manualSlides.has(current)) {
      clearTimeout(autoTimer);
      goTo(current + 1);
    }
  });

  /* ── Floating hearts ── */
  const fhEl   = document.getElementById("bday-fh");
  const fhSyms = ["❤","♥","💕","💖","💗","✨","⭐","🌸","🌹","🌷"];
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

  /* ── Particle canvas ── */
  const canvas = document.getElementById("bday-canvas");
  const ctx = canvas.getContext("2d");
  let W, H;

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);

  const pColors = ["#ff6b8a","#c850c0","#ffb347","#ffd700","#ff4466","#ff90c0","#e040fb"];
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.r = .5 + Math.random() * 2.5;
      this.vx = (Math.random() - .5) * .4; this.vy = (Math.random() - .5) * .4;
      this.color = pColors[Math.floor(Math.random() * pColors.length)];
      this.alpha = .2 + Math.random() * .5;
      this.life = 0; this.maxLife = 200 + Math.random() * 300;
    }
    update() {
      this.x += this.vx; this.y += this.vy; this.life++;
      if (this.life > this.maxLife || this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha * (1 - this.life / this.maxLife);
      ctx.shadowBlur = 8; ctx.shadowColor = this.color; ctx.fill();
    }
  }
  const particles = [];
  for (let i = 0; i < 120; i++) particles.push(new Particle());
  function animCanvas() {
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animCanvas);
  }
  animCanvas();

  /* ── Confetti ── */
  const confColors = ["#ff6b8a","#ffb347","#ffd700","#c850c0","#ff4466","#60efff","#fff"];
  function burstConfetti(count) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "bday-confetti";
      el.style.left = Math.random() * 100 + "vw"; el.style.top = "-10px";
      el.style.background = confColors[Math.floor(Math.random() * confColors.length)];
      el.style.width  = (6 + Math.random() * 10) + "px";
      el.style.height = (6 + Math.random() * 10) + "px";
      el.style.borderRadius = Math.random() > .5 ? "50%" : "2px";
      const dur = 1.5 + Math.random() * 2;
      el.style.animationDuration = dur + "s";
      el.style.animationDelay = Math.random() * .8 + "s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (dur + 1) * 1000);
    }
  }

  /* ── Heart burst ── */
  function burstHearts(count) {
    for (let i = 0; i < count; i++) {
      const h = document.createElement("span");
      h.className = "bday-fh";
      h.textContent = ["❤","💕","💖","✨","🌸"][Math.floor(Math.random() * 5)];
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
