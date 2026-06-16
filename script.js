/* ===================================================
   CÂMARA ESCURA — Interactive Physics Site
   =================================================== */

/* ── Navbar scroll effect ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

/* ── Smooth scroll helper ── */
function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ── Reveal on scroll (IntersectionObserver) ── */
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const delay = parseFloat(getComputedStyle(el).getPropertyValue('--delay') || '0');
      setTimeout(() => el.classList.add('visible'), delay * 1000);
      revealObserver.unobserve(el);
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => revealObserver.observe(el));

/* ══════════════════════════════════════════════════
   HERO — Particle Canvas
══════════════════════════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); spawnParticles(); });

  class Particle {
    constructor() { this.reset(true); }
    reset(initial = false) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : H + 10;
      this.r = Math.random() * 1.5 + 0.4;
      this.speed = Math.random() * 0.4 + 0.1;
      this.opacity = Math.random() * 0.6 + 0.1;
      this.hue = Math.random() * 40 + 190; // 190–230: blue/cyan range
    }
    update() {
      this.y -= this.speed;
      if (this.y < -10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, ${this.opacity})`;
      ctx.fill();
    }
  }

  function spawnParticles() {
    particles = Array.from({ length: 120 }, () => new Particle());
  }
  spawnParticles();

  // Connection lines between nearby particles
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 90) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 191, 255, ${0.04 * (1 - dist / 90)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ══════════════════════════════════════════════════
   HOW IT WORKS — Ray Animation
══════════════════════════════════════════════════ */
let animPlaying = false;
let animTimeout = null;

function animateLine(lineId, duration, delay, onComplete) {
  return new Promise(resolve => {
    setTimeout(() => {
      const line = document.getElementById(lineId);
      if (!line) { resolve(); return; }
      const length = line.getTotalLength ? line.getTotalLength() : 400;
      line.style.strokeDasharray = length;
      line.style.strokeDashoffset = length;
      line.style.transition = `stroke-dashoffset ${duration}ms ease`;
      // Force reflow
      line.getBoundingClientRect();
      line.style.strokeDashoffset = '0';
      setTimeout(() => { if (onComplete) onComplete(); resolve(); }, duration);
    }, delay);
  });
}

async function playAnimation() {
  if (animPlaying) return;
  animPlaying = true;

  const btn = document.getElementById('animPlayBtn');
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Animando...`;
  btn.disabled = true;

  // Reset first
  ['rayTop','rayTopExt','rayBot','rayBotExt','rayMid'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const len = el.getTotalLength ? el.getTotalLength() : 400;
      el.style.transition = 'none';
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    }
  });
  document.getElementById('screenTop')?.classList.remove('lit');
  document.getElementById('screenBot')?.classList.remove('lit');

  await new Promise(r => setTimeout(r, 100));

  // Animate rays: top ray (blue) from object to pinhole
  await animateLine('rayTop', 600, 0);
  // Bottom ray (orange) from object to pinhole simultaneously
  await animateLine('rayBot', 600, 0);
  // Middle ray
  animateLine('rayMid', 500, 100);

  // After crossing at pinhole, extend to screen (inverted)
  await animateLine('rayTopExt', 600, 200, () => {
    document.getElementById('screenBot')?.classList.add('lit'); // top ray → bottom
  });
  await animateLine('rayBotExt', 600, 0, () => {
    document.getElementById('screenTop')?.classList.add('lit'); // bot ray → top
  });

  await new Promise(r => setTimeout(r, 800));

  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg> Repetir`;
  btn.disabled = false;
  animPlaying = false;
}

function resetAnimation() {
  animPlaying = false;
  clearTimeout(animTimeout);
  const btn = document.getElementById('animPlayBtn');
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg> Iniciar Animação`;
  btn.disabled = false;

  ['rayTop','rayTopExt','rayBot','rayBotExt','rayMid'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const len = el.getTotalLength ? el.getTotalLength() : 400;
      el.style.transition = 'none';
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
    }
  });
  document.getElementById('screenTop')?.classList.remove('lit');
  document.getElementById('screenBot')?.classList.remove('lit');
}

/* ══════════════════════════════════════════════════
   SIMULATION CANVAS — Pinhole Camera
══════════════════════════════════════════════════ */
const simCanvas = document.getElementById('simCanvas');
const simCtx = simCanvas.getContext('2d');

// Responsive canvas sizing
function resizeSimCanvas() {
  const wrapper = simCanvas.parentElement;
  const ratio = 380 / 700;
  const w = Math.min(wrapper.clientWidth, 700);
  simCanvas.style.width = w + 'px';
  simCanvas.style.height = (w * ratio) + 'px';
}
resizeSimCanvas();
window.addEventListener('resize', () => { resizeSimCanvas(); drawSim(); });

// Camera geometry (in canvas coordinate space: 700x380)
const CAM = {
  wallX: 330,        // x position of wall with pinhole
  screenX: 570,      // x position of projection screen
  boxTop: 80,        // y top of camera box interior
  boxBot: 300,       // y bottom of camera box interior
  objX: 100,         // x position of object
  objTopY: 80,       // y of top of object (arrow tip)
  objBotY: 300,      // y of base of object
};

function getHoleY() { return (CAM.boxTop + CAM.boxBot) / 2; } // center of wall

function drawSim() {
  const holeSize = parseInt(document.getElementById('holeSize').value, 10);
  const W = 700, H = 380;
  simCtx.clearRect(0, 0, W, H);

  // Background gradient
  const bg = simCtx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#040810');
  bg.addColorStop(1, '#070d1a');
  simCtx.fillStyle = bg;
  simCtx.fillRect(0, 0, W, H);

  // Grid lines (subtle)
  simCtx.strokeStyle = 'rgba(0,191,255,0.04)';
  simCtx.lineWidth = 1;
  for (let x = 0; x <= W; x += 40) {
    simCtx.beginPath(); simCtx.moveTo(x, 0); simCtx.lineTo(x, H); simCtx.stroke();
  }
  for (let y = 0; y <= H; y += 40) {
    simCtx.beginPath(); simCtx.moveTo(0, y); simCtx.lineTo(W, y); simCtx.stroke();
  }

  // === OBJECT (arrow) ===
  simCtx.save();
  // Arrow shaft
  simCtx.strokeStyle = '#ffd700';
  simCtx.lineWidth = 3;
  simCtx.lineCap = 'round';
  simCtx.beginPath();
  simCtx.moveTo(CAM.objX, CAM.objTopY);
  simCtx.lineTo(CAM.objX, CAM.objBotY);
  simCtx.stroke();
  // Arrow head (top)
  simCtx.fillStyle = '#ffd700';
  simCtx.beginPath();
  simCtx.moveTo(CAM.objX, CAM.objTopY - 14);
  simCtx.lineTo(CAM.objX - 7, CAM.objTopY + 2);
  simCtx.lineTo(CAM.objX + 7, CAM.objTopY + 2);
  simCtx.closePath(); simCtx.fill();
  // Glow
  simCtx.shadowColor = '#ffd700'; simCtx.shadowBlur = 12;
  simCtx.strokeStyle = 'rgba(255,215,0,0.3)'; simCtx.lineWidth = 8;
  simCtx.beginPath(); simCtx.moveTo(CAM.objX, CAM.objTopY); simCtx.lineTo(CAM.objX, CAM.objBotY); simCtx.stroke();
  simCtx.shadowBlur = 0;
  // Label
  simCtx.fillStyle = 'rgba(255,215,0,0.7)'; simCtx.font = '600 11px Space Grotesk, Inter, sans-serif';
  simCtx.textAlign = 'center'; simCtx.fillText('Objeto', CAM.objX, CAM.objBotY + 18);
  simCtx.restore();

  // === CAMERA WALL (with pinhole) ===
  const holeY = getHoleY();
  const halfHole = holeSize / 2;
  // Wall above hole
  simCtx.fillStyle = 'rgba(13,31,60,0.95)';
  simCtx.strokeStyle = 'rgba(0,191,255,0.35)'; simCtx.lineWidth = 1.5;
  // full wall rect then cut out hole via composite
  simCtx.beginPath();
  simCtx.rect(CAM.wallX - 6, CAM.boxTop, 12, holeY - halfHole - CAM.boxTop);
  simCtx.fill(); simCtx.stroke();
  // Wall below hole
  simCtx.beginPath();
  simCtx.rect(CAM.wallX - 6, holeY + halfHole, 12, CAM.boxBot - holeY - halfHole);
  simCtx.fill(); simCtx.stroke();
  // Hole glow
  simCtx.fillStyle = '#00bfff';
  simCtx.shadowColor = '#00bfff'; simCtx.shadowBlur = 16;
  simCtx.beginPath();
  simCtx.arc(CAM.wallX, holeY, Math.max(halfHole, 2), 0, Math.PI * 2);
  simCtx.fill();
  simCtx.shadowBlur = 0;

  // === CAMERA BOX INTERIOR ===
  const intGrad = simCtx.createLinearGradient(CAM.wallX, 0, CAM.screenX, 0);
  intGrad.addColorStop(0, 'rgba(2,6,16,0.85)');
  intGrad.addColorStop(1, 'rgba(7,13,26,0.95)');
  simCtx.fillStyle = intGrad;
  simCtx.beginPath();
  simCtx.rect(CAM.wallX, CAM.boxTop, CAM.screenX - CAM.wallX, CAM.boxBot - CAM.boxTop);
  simCtx.fill();
  // Box border (top & bottom)
  simCtx.strokeStyle = 'rgba(0,191,255,0.2)'; simCtx.lineWidth = 1;
  simCtx.beginPath();
  simCtx.moveTo(CAM.wallX, CAM.boxTop); simCtx.lineTo(CAM.screenX, CAM.boxTop);
  simCtx.moveTo(CAM.wallX, CAM.boxBot); simCtx.lineTo(CAM.screenX, CAM.boxBot);
  simCtx.stroke();

  // === PROJECTION SCREEN ===
  simCtx.fillStyle = 'rgba(20,40,70,0.5)';
  simCtx.strokeStyle = 'rgba(0,191,255,0.4)'; simCtx.lineWidth = 2;
  simCtx.beginPath();
  simCtx.rect(CAM.screenX - 6, CAM.boxTop, 6, CAM.boxBot - CAM.boxTop);
  simCtx.fill(); simCtx.stroke();

  // === LIGHT RAYS ===
  // Multiple rays from different heights of the object, through the hole
  // Number of rays proportional to hole size (more rays = blurrier)
  const numRays = Math.max(1, Math.min(holeSize * 2, 24));
  const objPoints = [];
  for (let i = 0; i <= 12; i++) {
    objPoints.push(CAM.objTopY + (CAM.objBotY - CAM.objTopY) * (i / 12));
  }

  objPoints.forEach((objY, idx) => {
    const isTop = objY < getHoleY();
    const color = isTop ? '0,191,255' : '255,107,53';
    const alpha = 0.15;

    // For each hole offset
    for (let r = 0; r < numRays; r++) {
      const hOffset = (r / (numRays - 1 || 1) - 0.5) * holeSize;
      const hY = holeY + hOffset;

      // Direction from objY to hY, extended to screen
      const slope = (hY - objY) / (CAM.wallX - CAM.objX);
      const projY = hY + slope * (CAM.screenX - CAM.wallX);

      // Clip to box
      if (projY < CAM.boxTop || projY > CAM.boxBot) continue;

      // Ray: object → hole
      simCtx.beginPath();
      simCtx.moveTo(CAM.objX + 5, objY);
      simCtx.lineTo(CAM.wallX - 6, hY);
      const grad1 = simCtx.createLinearGradient(CAM.objX, objY, CAM.wallX, hY);
      grad1.addColorStop(0, `rgba(${color},0)`);
      grad1.addColorStop(1, `rgba(${color},${alpha})`);
      simCtx.strokeStyle = grad1; simCtx.lineWidth = 1;
      simCtx.stroke();

      // Ray: hole → screen
      simCtx.beginPath();
      simCtx.moveTo(CAM.wallX, hY);
      simCtx.lineTo(CAM.screenX - 6, projY);
      const grad2 = simCtx.createLinearGradient(CAM.wallX, hY, CAM.screenX, projY);
      grad2.addColorStop(0, `rgba(${color},${alpha * 2})`);
      grad2.addColorStop(1, `rgba(${color},${alpha * 0.5})`);
      simCtx.strokeStyle = grad2; simCtx.lineWidth = 1;
      simCtx.stroke();
    }
  });

  // === PROJECTED IMAGE ON SCREEN ===
  // Compute projected positions of top and bottom of object
  const topSlope = (holeY - CAM.objTopY) / (CAM.wallX - CAM.objX);
  const projTop = holeY + topSlope * (CAM.screenX - CAM.wallX);
  const botSlope = (holeY - CAM.objBotY) / (CAM.wallX - CAM.objX);
  const projBot = holeY + botSlope * (CAM.screenX - CAM.wallX);

  // Blur / sharpness based on hole size
  const blur = Math.max(0, (holeSize - 3) * 0.8);
  const projScreenX = CAM.screenX - 10;

  simCtx.save();
  if (blur > 0) {
    simCtx.filter = `blur(${Math.min(blur, 8)}px)`;
  }
  // Projected arrow (inverted: top becomes bot on screen)
  const projMid = (projTop + projBot) / 2;
  // Arrow shaft
  simCtx.strokeStyle = '#ffd700'; simCtx.lineWidth = 2.5; simCtx.lineCap = 'round';
  simCtx.shadowColor = '#ffd700'; simCtx.shadowBlur = 8;
  simCtx.beginPath();
  simCtx.moveTo(projScreenX, projTop);
  simCtx.lineTo(projScreenX, projBot);
  simCtx.stroke();
  // Arrow head (pointing down since inverted)
  simCtx.fillStyle = '#ffd700';
  simCtx.beginPath();
  simCtx.moveTo(projScreenX, projTop + 14);
  simCtx.lineTo(projScreenX - 5, projTop);
  simCtx.lineTo(projScreenX + 5, projTop);
  simCtx.closePath(); simCtx.fill();
  simCtx.shadowBlur = 0;
  simCtx.restore();

  // "Invertida" label
  simCtx.fillStyle = 'rgba(0,191,255,0.6)';
  simCtx.font = '600 9px Space Grotesk, Inter, sans-serif';
  simCtx.textAlign = 'center';
  simCtx.fillText('invertida', projScreenX, CAM.boxBot + 16);

  // === LABELS ===
  simCtx.fillStyle = 'rgba(122,139,168,0.7)';
  simCtx.font = '600 10px Space Grotesk, Inter, sans-serif';
  simCtx.textAlign = 'center';
  simCtx.fillText('FURO', CAM.wallX, CAM.boxBot + 16);
  simCtx.fillText('TELA', CAM.screenX - 3, CAM.boxBot + 16);

  // Nitidez indicator
  const sharpness = Math.max(0, 1 - (holeSize - 1) / 30);
  const sharpText = holeSize <= 4 ? 'Nítida' : holeSize <= 12 ? 'Moderada' : 'Desfocada';
  simCtx.fillStyle = holeSize <= 4 ? '#a0f0a0' : holeSize <= 12 ? '#ffd700' : '#ff6b35';
  simCtx.font = '700 11px Space Grotesk, Inter, sans-serif';
  simCtx.textAlign = 'left';
  simCtx.fillText(`Nitidez: ${sharpText}`, 16, H - 14);
  simCtx.fillStyle = 'rgba(0,191,255,0.5)';
  simCtx.textAlign = 'right';
  simCtx.fillText(`Furo: ${holeSize}px`, W - 16, H - 14);
}

function updateSim() {
  const val = parseInt(document.getElementById('holeSize').value, 10);
  document.getElementById('holeSizeVal').textContent = val + ' px';

  const infoEl = document.getElementById('simInfo');
  if (val <= 4) {
    infoEl.innerHTML = `<div class="sim-info-icon">◎</div><div><strong>Furo pequeno</strong><span>Imagem nítida, pouca luz</span></div>`;
    infoEl.style.borderColor = 'rgba(160,240,160,0.3)';
  } else if (val <= 14) {
    infoEl.innerHTML = `<div class="sim-info-icon">◎</div><div><strong>Furo médio</strong><span>Equilíbrio entre luz e nitidez</span></div>`;
    infoEl.style.borderColor = 'rgba(255,215,0,0.3)';
  } else {
    infoEl.innerHTML = `<div class="sim-info-icon">◎</div><div><strong>Furo grande</strong><span>Muita luz, imagem desfocada</span></div>`;
    infoEl.style.borderColor = 'rgba(255,107,53,0.3)';
  }
  drawSim();
}

// Initial draw
drawSim();
