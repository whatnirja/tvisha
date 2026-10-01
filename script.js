(() => {
  const NAME = "tvisha";
  // candle look — change these to restyle the candles
  const CANDLE_STYLE = {
    wax: "#f7e4cc",      // candle base colour
    stripe: "#b0233c",   // stripe colour
    stripes: false,       // false = plain candles
    outline: "#b0233c",  // outline colour
    outlineWidth: 7,   // outline thickness
    sticker: false,      // true = cream cut-out border like the cake
  };
  const AR = 1545 / 2000;            // page aspect (w/h)
  const LETTER = { x: 351, y: 359, w: 884, h: 1279 }; // letter on page 2, in source px
  // candle base positions on the cake page (source px) + height
  const CANDLES = [
    { x: 455,  y: 1380, h: 165 },
    { x: 700,  y: 1355, h: 180 },
    { x: 860,  y: 1315, h: 195 },
    { x: 1010, y: 1350, h: 175 },
    { x: 1250, y: 1405, h: 160 },
  ];

  const $ = (id) => document.getElementById(id);
  const body = document.body, book = $("book"), root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let isOpen = false;
  let letterOut = false, letterBusy = false;
  let lit = true;

  /* ---------- layout ---------- */
  function layout() {
    const vw = innerWidth, vh = innerHeight;
    const barH = vw < 560 ? 132 : 84;
    const topPad = Math.max(20, vh * .04);
    const P = Math.max(120, Math.min((vw - 24) / 2, (vh - barH - topPad - 12) * AR));
    const H = P / AR;
    const cy = topPad + (vh - barH - topPad) / 2;
    // closed: cover larger and centered, space above it
    const coverMaxW = Math.min(vw - 40, 560);
    const coverMaxH = vh - topPad * 2 - 70;
    const s = Math.max(1, Math.min(coverMaxW / P, coverMaxH / H));
    const coverCy = topPad * 1.6 + (H * s) / 2;
    root.style.setProperty("--P", P + "px");
    root.style.setProperty("--H", H + "px");
    root.style.setProperty("--cy", cy + "px");
    root.style.setProperty("--s", s);
    root.style.setProperty("--tx", (-P / 2 * s) + "px");
    root.style.setProperty("--ty", (coverCy - cy) + "px");
    if (letterOut) placeLetterFinal();
  }

  /* ---------- open / close ---------- */
  function openCard() {
    if (isOpen) return;
    isOpen = true;
    book.classList.add("open");
    body.classList.add("is-open");
    $("cover").setAttribute("aria-hidden", "true");
    startMic();
  }
  async function closeCard() {
    if (!isOpen) return;
    if (letterOut) await toggleLetter();
    hideWish();
    isOpen = false;
    book.classList.remove("open");
    body.classList.remove("is-open");
    $("cover").removeAttribute("aria-hidden");
    setHold(false);
  }
  $("cover").addEventListener("click", openCard);
  $("cover").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCard(); }
  });
  $("backBtn").addEventListener("click", closeCard);

  /* ---------- letter ---------- */
  const layer = $("letterLayer"), letterImg = $("letterImg");
  let finalRect = null;
  function placeLetterFinal() {
    const vw = innerWidth, vh = innerHeight;
    const la = LETTER.w / LETTER.h;
    const h = Math.min(vh * .86, (vw * .9) / la);
    const w = h * la;
    finalRect = { left: (vw - w) / 2, top: (vh - h) / 2, w, h };
    Object.assign(letterImg.style, {
      left: finalRect.left + "px", top: finalRect.top + "px",
      width: w + "px", height: h + "px",
    });
  }
  function homeTransforms() {
    const r = $("letterPage").getBoundingClientRect();
    const k = r.width / 1545;
    const hx = r.left + LETTER.x * k, hy = r.top + LETTER.y * k, hw = LETTER.w * k;
    const sc = hw / finalRect.w;
    const dx = hx - finalRect.left, dy = hy - finalRect.top;
    return {
      home: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(0deg)`,
      pulled: `translate(${dx - hw * .55}px, ${dy - hw * .06}px) scale(${sc * 1.04}) rotate(-6deg)`,
      final: `translate(0px, 0px) scale(1) rotate(-1.2deg)`,
    };
  }
  function toggleLetter() {
    if (letterBusy) return Promise.resolve();
    letterBusy = true;
    placeLetterFinal();
    const t = homeTransforms();
    const dur = reduceMotion ? 10 : 950;
    let anim;
    if (!letterOut) {
      layer.classList.remove("leaving");
      layer.classList.add("show");
      layer.setAttribute("aria-hidden", "false");
      anim = letterImg.animate([
        { transform: t.home, opacity: 0 },
        { transform: t.pulled, opacity: 1, offset: .38 },
        { transform: t.final, opacity: 1 },
      ], { duration: dur, easing: "cubic-bezier(.45,.05,.25,1)", fill: "forwards" });
    } else {
      layer.classList.add("leaving");
      anim = letterImg.animate([
        { transform: t.final, opacity: 1 },
        { transform: t.pulled, opacity: 1, offset: .62 },
        { transform: t.home, opacity: 0 },
      ], { duration: dur * .85, easing: "cubic-bezier(.45,.05,.3,1)", fill: "forwards" });
    }
    return anim.finished.then(() => {
      letterOut = !letterOut;
      if (!letterOut) {
        layer.classList.remove("show", "leaving");
        layer.setAttribute("aria-hidden", "true");
      }
      letterBusy = false;
    });
  }
  $("letterHit").addEventListener("click", () => { if (isOpen) toggleLetter(); });
  $("labelHit").addEventListener("click", () => { if (isOpen && !letterOut) toggleLetter(); });
  layer.addEventListener("click", () => { if (letterOut) toggleLetter(); });

  /* ---------- candles ---------- */
  const stripeRects = document.querySelectorAll("#stripes rect");
  stripeRects[0].setAttribute("fill", CANDLE_STYLE.wax);
  stripeRects[1].setAttribute("fill", CANDLE_STYLE.stripe);
  const waxFill = CANDLE_STYLE.stripes ? "url(#stripes)" : CANDLE_STYLE.wax;
  const candleWrap = $("candles");
  const flames = [];
  const candleEls = [];
  CANDLES.forEach((c, i) => {
    const el = document.createElement("div");
    el.className = "candle" + (CANDLE_STYLE.sticker ? " sticker" : "");
    el.style.left = (c.x / 1545 * 100) + "%";
    el.style.top = ((c.y - c.h) / 2000 * 100) + "%";
    el.style.height = (c.h / 2000 * 100) + "%";
    el.style.setProperty("--drift", (i % 2 ? -1 : 1) * (6 + i * 2) + "px");
    el.innerHTML = `
      <svg class="body" viewBox="0 0 44 170" preserveAspectRatio="none" aria-hidden="true">
        <path d="M4 10 Q4 3 12 3 L32 3 Q40 3 40 10 L41 170 L3 170 Z" fill="${waxFill}" stroke="${CANDLE_STYLE.outline}" stroke-width="${CANDLE_STYLE.outlineWidth}" filter="url(#rough)"/>
        <ellipse cx="22" cy="6" rx="16" ry="4" fill="${CANDLE_STYLE.wax}" stroke="${CANDLE_STYLE.outline}" stroke-width="${CANDLE_STYLE.outlineWidth * .66}"/>
      </svg>
      <span class="wick"></span>
      <span class="smoke"><i></i><i></i><i></i></span>
      <span class="flame">
        <span class="glow"></span>
        <span class="tongue">
          <svg viewBox="0 0 40 70" aria-hidden="true">
            <path d="M20 2 C29 20 37 36 36 49 C35 61 28 68 20 68 C12 68 5 61 4 49 C3 36 11 20 20 2 Z" fill="url(#flameGrad)" stroke="#b0233c" stroke-width="2.4" filter="url(#rough)"/>
            <path d="M20 30 C25 40 28 47 27 54 C26 60 23 63 20 63 C17 63 14 60 13 54 C12 47 15 40 20 30 Z" fill="#fff4c2"/>
          </svg>
        </span>
      </span>`;
    candleWrap.appendChild(el);
    candleEls.push(el);
    flames.push({ el: el.querySelector(".flame"), jitter: .75 + Math.random() * .5, bend: 0 });
  });

  function extinguish() {
    if (!lit) return;
    lit = false;
    blowTime = 0;
    candleEls.forEach((el, i) => {
      setTimeout(() => { el.classList.remove("lighting"); el.classList.add("out"); }, reduceMotion ? 0 : i * 70);
    });
    setTimeout(() => { body.classList.remove("lit"); setHold(false); showWish(); }, reduceMotion ? 50 : 650);
  }
  function relight() {
    hideWish();
    lit = true;
    body.classList.add("lit");
    candleEls.forEach((el, i) => {
      setTimeout(() => {
        el.classList.remove("out");
        el.classList.remove("lighting"); void el.offsetWidth;
        el.classList.add("lighting");
        setTimeout(() => el.classList.remove("lighting"), 600);
      }, reduceMotion ? 0 : i * 110);
    });
  }
  $("relightBtn").addEventListener("click", relight);

  /* ---------- wish ---------- */
  const wish = $("wish");
  const PAPERS = [
    ["#f2d44e", "#a8235a"], ["#efe3cb", "#3f5a2a"], ["#4b2f86", "#f0c9a6"], ["#b0233c", "#ffd2e0"],
    ["#a7d46a", "#c22d8e"], ["#d9e3dd", "#2c6f8c"], ["#efe3cb", "#b0233c"], ["#1f2e1a", "#f2d44e"],
    ["#f19ac0", "#6b1a2a"], ["#8f6bb3", "#f5ec7a"], ["#e85d4a", "#f2e1b0"], ["#ccdbe7", "#2a3b2a"],
  ];
  const FONTS = [
    "'Abril Fatface', Georgia, serif",
    "'Playfair Display', Georgia, serif",
    "'Alfa Slab One', Georgia, serif",
    "'Bodoni Moda', Georgia, serif",
  ];
  function cutPoly() {
    const j = () => (Math.random() * 7).toFixed(1);
    return `polygon(${j()}% ${j()}%, ${100 - j()}% ${j()}%, ${100 - j()}% ${100 - j()}%, ${j()}% ${100 - j()}%)`;
  }
  function buildWish() {
    wish.innerHTML = "";
    const lines = ["make a wish"];
    let n = 0;
    lines.forEach((text) => {
      const line = document.createElement("div");
      line.className = "line";
      [...text].forEach((ch) => {
        if (ch === " ") { const g = document.createElement("span"); g.className = "gap"; line.appendChild(g); return; }
        const s = document.createElement("span");
        s.className = "cut";
        const [bg, fg] = PAPERS[(n * 7 + Math.floor(Math.random() * 3)) % PAPERS.length];
        const f = FONTS[(n * 3 + Math.floor(Math.random() * 2)) % FONTS.length];
        s.textContent = ch;
        s.style.background = bg;
        s.style.color = fg;
        s.style.fontFamily = f;
        s.style.fontStyle = f.includes("Playfair") ? "italic" : "normal";
        s.style.fontWeight = f.includes("Playfair") ? "900" : f.includes("Bodoni") ? "800" : "400";
        s.style.clipPath = cutPoly();
        s.style.setProperty("--r", (Math.random() * 14 - 7).toFixed(1) + "deg");
        s.style.animationDelay = (reduceMotion ? 0 : n * 45) + "ms";
        s.style.transform = `scale(.3) translateY(${(Math.random() * .1 - .05).toFixed(2)}em)`;
        line.appendChild(s);
        n++;
      });
      wish.appendChild(line);
    });
  }
  function showWish() {
    buildWish();
    wish.classList.remove("hide");
    void wish.offsetWidth;
    wish.classList.add("show");
    confetti();
  }
  function hideWish() {
    wish.classList.remove("show");
    wish.classList.add("hide");
    stopConfetti();
  }

  /* ---------- confetti ---------- */
  const cv = $("confetti"), cx = cv.getContext("2d");
  let parts = [], confRaf = 0;
  const CONF_COLORS = ["#f2d44e", "#b0233c", "#556b3c", "#efe3cb", "#4b2f86", "#f19ac0", "#a7d46a", "#2c6f8c"];
  function confetti() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = reduceMotion ? 40 : Math.min(220, Math.round(innerWidth / 5));
    parts = Array.from({ length: count }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * innerWidth * .3,
      y: innerHeight * .45,
      vx: (Math.random() - .5) * 14,
      vy: -Math.random() * 15 - 5,
      w: 6 + Math.random() * 8, h: 4 + Math.random() * 6,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .35,
      t: Math.random() * 10, c: CONF_COLORS[(Math.random() * CONF_COLORS.length) | 0],
    }));
    cancelAnimationFrame(confRaf);
    const step = () => {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = 0;
      for (const p of parts) {
        p.vy += .32; p.vx *= .985; p.vy = Math.min(p.vy, 5.5);
        p.t += .12; p.x += p.vx + Math.sin(p.t) * .8; p.y += p.vy; p.r += p.vr;
        if (p.y < innerHeight + 20) alive++;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
        cx.scale(1, Math.abs(Math.cos(p.t)) * .8 + .2);
        cx.fillStyle = p.c; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        cx.restore();
      }
      if (alive) confRaf = requestAnimationFrame(step); else cx.clearRect(0, 0, innerWidth, innerHeight);
    };
    step();
  }
  function stopConfetti() { cancelAnimationFrame(confRaf); cx.clearRect(0, 0, cv.width, cv.height); }

  /* ---------- mic + blowing ---------- */
  let audioCtx = null, analyser = null, buf = null, micState = "idle";
  let floor = .012, holding = false, blowTime = 0;
  const note = $("micNote");
  function setNote(t) { note.textContent = t; }

  function startMic() {
    if (micState !== "idle") return;
    const hosted = window.isSecureContext && location.protocol !== "file:";
    if (!hosted || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      micState = "unavailable";
      setNote("the mic only works when this is opened from its link (https). hold the button or spacebar to blow.");
      return;
    }
    micState = "starting";
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audioCtx = null; }
    navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    }).then((stream) => {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume();
      const src = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = .2;
      src.connect(analyser);
      buf = new Float32Array(analyser.fftSize);
      micState = "on";
      setNote("blow into your mic to blow out the candles");
    }).catch(() => {
      micState = "blocked";
      setNote("mic is blocked. hold the button or spacebar to blow.");
    });
  }

  function setHold(v) {
    holding = v;
    $("holdBtn").classList.toggle("pressed", v);
  }
  const hb = $("holdBtn");
  hb.addEventListener("pointerdown", (e) => { e.preventDefault(); hb.setPointerCapture?.(e.pointerId); setHold(true); });
  ["pointerup", "pointercancel", "lostpointercapture"].forEach((ev) => hb.addEventListener(ev, () => setHold(false)));
  hb.addEventListener("contextmenu", (e) => e.preventDefault());
  hb.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); setHold(true); } });
  hb.addEventListener("keyup", (e) => { if (e.key === "Enter") setHold(false); });

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && letterOut) { toggleLetter(); return; }
    if (e.code === "Space" && isOpen && !letterOut) {
      const a = document.activeElement;
      if (a && (a.id === "backBtn" || a.id === "relightBtn")) return;
      e.preventDefault();
      if (!e.repeat) setHold(true);
    }
  });
  addEventListener("keyup", (e) => {
    if (e.code !== "Space") return;
    const a = document.activeElement;
    if (holding && !(a && (a.id === "backBtn" || a.id === "relightBtn"))) e.preventDefault();
    setHold(false);
  });
  addEventListener("blur", () => setHold(false));

  const fill = $("meterFill");
  let last = performance.now(), holdPhase = 0;
  function tick(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    let rms = 0;
    if (analyser) {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      rms = Math.sqrt(sum / buf.length);
    }
    let thr = Math.max(.045, floor * 3.5);
    if (rms < thr) floor = floor * .985 + rms * .015;
    thr = Math.max(.045, floor * 3.5);

    let intensity = Math.max(0, Math.min(1, (rms - thr * .55) / (thr * 1.3)));
    let blowing = rms > thr;
    if (holding) {
      holdPhase += dt * 9;
      intensity = Math.max(intensity, .85 + Math.sin(holdPhase) * .12);
      blowing = true;
    }
    const meter = holding ? Math.max(.62, intensity * .9) : Math.min(1, rms / (thr * 2));
    fill.style.width = (meter * 100).toFixed(1) + "%";
    fill.classList.toggle("hot", blowing);

    const active = isOpen && lit && !letterOut;
    if (active && blowing) blowTime += dt;
    else blowTime = Math.max(0, blowTime - dt * .6);

    for (const f of flames) {
      const target = active ? intensity * 34 * f.jitter : 0;
      f.bend += (target - f.bend) * Math.min(1, dt * 14);
      f.el.style.setProperty("--bend", f.bend.toFixed(2) + "deg");
      f.el.style.setProperty("--sq", (1 - Math.min(.18, f.bend / 200)).toFixed(3));
    }
    if (active && blowTime >= .5) extinguish();
    requestAnimationFrame(tick);
  }

  /* ---------- init ---------- */
  body.classList.add("lit");
  book.classList.add("no-anim");
  layout();
  requestAnimationFrame(() => requestAnimationFrame(() => book.classList.remove("no-anim")));
  addEventListener("resize", () => { book.classList.add("no-anim"); layout(); requestAnimationFrame(() => book.classList.remove("no-anim")); });
  requestAnimationFrame(tick);
})();