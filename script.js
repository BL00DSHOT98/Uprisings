const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d", { alpha: true });

const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // cap for performance
let W = 0, H = 0;

function resize() {
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener("resize", resize);
resize();

// Line field settings (tweak these)
const settings = {
  lineCount: 42,
  speed: 0.28,
  tilt: -0.65,          // negative = slant down to the right
  spacing: 26,
  jitter: 10,
  glow: 10,
  opacity: 0.18
};

function rand(min, max) { return min + Math.random() * (max - min); }

const lines = [];
function initLines() {
  lines.length = 0;
  // create a bunch of parallel lines offset across the screen
  const diag = Math.sqrt(W * W + H * H);
  const total = settings.lineCount;
  for (let i = 0; i < total; i++) {
    lines.push({
      // position along a perpendicular axis
      offset: (i / total) * diag + rand(-settings.spacing, settings.spacing),
      phase: rand(0, Math.PI * 2),
      width: rand(1, 2.2),
      bright: rand(0.6, 1.0),
    });
  }
}
initLines();

function drawBackground(t) {
  // clear
  ctx.clearRect(0, 0, W, H);

  // soft vignette
  const g = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.65);
  g.addColorStop(0, "rgba(12, 16, 28, 0)");
  g.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // line direction vector
  const angle = settings.tilt;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  // perpendicular direction
  const px = -dy;
  const py = dx;

  // animate drift
  const drift = (t * 0.001) * settings.speed * 60;

  // two accent strokes blended
  ctx.globalCompositeOperation = "lighter";

  for (const L of lines) {
    const wobble = Math.sin(L.phase + t * 0.0012) * settings.jitter;
    const off = (L.offset + drift * settings.spacing + wobble) % (Math.sqrt(W*W + H*H) + settings.spacing);

    // a point on the perpendicular axis through the center
    const cx = W * 0.5 + px * (off - Math.sqrt(W*W + H*H) * 0.5);
    const cy = H * 0.5 + py * (off - Math.sqrt(W*W + H*H) * 0.5);

    // long segment across screen
    const len = Math.max(W, H) * 1.6;
    const x1 = cx - dx * len;
    const y1 = cy - dy * len;
    const x2 = cx + dx * len;
    const y2 = cy + dy * len;

    // gradient stroke (subtle neon)
    const lg = ctx.createLinearGradient(x1, y1, x2, y2);
    lg.addColorStop(0, `rgba(123,92,255,${settings.opacity * 0.25 * L.bright})`);
    lg.addColorStop(0.5, `rgba(34,211,238,${settings.opacity * 0.55 * L.bright})`);
    lg.addColorStop(1, `rgba(255,59,212,${settings.opacity * 0.20 * L.bright})`);

    ctx.strokeStyle = lg;
    ctx.lineWidth = L.width;
    ctx.shadowBlur = settings.glow;
    ctx.shadowColor = "rgba(123,92,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // reset
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "source-over";
}

let raf = 0;
function loop(t) {
  drawBackground(t);
  raf = requestAnimationFrame(loop);
}
raf = requestAnimationFrame(loop);

// UI helpers
const toast = (msg) => {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.display = "block";
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => (el.style.display = "none"), 2200);
};

document.getElementById("year").textContent = new Date().getFullYear();

document.getElementById("copyPage").addEventListener("click", async () => {
  const link = location.href || "index.html";
  try {
    await navigator.clipboard.writeText(link);
    toast("Copied page link!");
  } catch {
    toast("Copy blocked — copy from address bar.");
  }
});