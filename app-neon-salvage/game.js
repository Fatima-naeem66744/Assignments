const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const levelEl = document.querySelector("#level");
const energyEl = document.querySelector("#energy");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const startBtn = document.querySelector("#startBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const restartBtn = document.querySelector("#restartBtn");

const keys = new Set();
const pointer = { active: false, x: 0, y: 0 };

let best = Number(localStorage.getItem("neon-salvage-best") || 0);
let lastTime = 0;
let game;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rand = (min, max) => Math.random() * (max - min) + min;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function makeGame() {
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 18,
    speed: 245,
    shield: 0,
    shieldCooldown: 0,
  };

  return {
    running: false,
    paused: false,
    ended: false,
    score: 0,
    level: 1,
    cellsCollected: 0,
    energy: 100,
    message: "Start Mission",
    player,
    cells: [spawnCell(false)],
    drones: [spawnDrone(1), spawnDrone(1)],
    particles: [],
    stars: Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: rand(0.6, 2.2),
      speed: rand(8, 28),
      alpha: rand(0.25, 0.85),
    })),
  };
}

function spawnCell(forceBonus) {
  const bonus = forceBonus || Math.random() < 0.18;
  return {
    x: rand(42, canvas.width - 42),
    y: rand(42, canvas.height - 42),
    r: bonus ? 16 : 12,
    bonus,
    pulse: Math.random() * Math.PI * 2,
  };
}

function spawnDrone(level) {
  const edge = Math.floor(Math.random() * 4);
  const drone = {
    x: edge === 0 ? -28 : edge === 1 ? canvas.width + 28 : rand(0, canvas.width),
    y: edge === 2 ? -28 : edge === 3 ? canvas.height + 28 : rand(0, canvas.height),
    r: rand(15, 22),
    speed: rand(74, 104) + level * 9,
    wobble: rand(0, Math.PI * 2),
    hitTimer: 0,
  };
  return drone;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(300, Math.floor(rect.width * ratio));
  const height = Math.max(320, Math.floor(rect.height * ratio));

  if (canvas.width === width && canvas.height === height) return;

  const oldWidth = canvas.width;
  const oldHeight = canvas.height;
  canvas.width = width;
  canvas.height = height;

  if (game) {
    const xScale = width / oldWidth;
    const yScale = height / oldHeight;
    game.player.x *= xScale;
    game.player.y *= yScale;
    game.cells.forEach((cell) => {
      cell.x *= xScale;
      cell.y *= yScale;
    });
    game.drones.forEach((drone) => {
      drone.x *= xScale;
      drone.y *= yScale;
    });
  }
}

function startGame() {
  resizeCanvas();
  game = makeGame();
  game.running = true;
  game.paused = false;
  game.ended = false;
  overlay.classList.add("hidden");
  updateHud();
  lastTime = performance.now();
}

function endGame() {
  game.running = false;
  game.ended = true;
  if (game.score > best) {
    best = game.score;
    localStorage.setItem("neon-salvage-best", String(best));
  }
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").textContent = "Mission Over";
  overlay.querySelector("p").textContent = `Final score: ${game.score}. Level reached: ${game.level}.`;
  startBtn.textContent = "Try Again";
  updateHud();
}

function togglePause() {
  if (!game.running || game.ended) return;
  game.paused = !game.paused;
  overlay.classList.toggle("hidden", !game.paused);
  if (game.paused) {
    overlay.querySelector("h1").textContent = "Paused";
    overlay.querySelector("p").textContent = "Catch your breath, then resume the salvage run.";
    startBtn.textContent = "Resume";
  } else {
    lastTime = performance.now();
  }
}

function updateHud() {
  scoreEl.textContent = game.score;
  levelEl.textContent = game.level;
  energyEl.textContent = Math.max(0, Math.ceil(game.energy));
  bestEl.textContent = best;
}

function activateShield() {
  if (!game.running || game.paused || game.ended) return;
  if (game.player.shieldCooldown > 0) return;
  game.player.shield = 1.15;
  game.player.shieldCooldown = 4.2;
  game.energy = clamp(game.energy - 7, 0, 100);
  burst(game.player.x, game.player.y, "#6aa8ff", 18);
}

function getMoveVector() {
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

  if (pointer.active) {
    dx += pointer.x - game.player.x;
    dy += pointer.y - game.player.y;
  }

  const mag = Math.hypot(dx, dy) || 1;
  return { x: dx / mag, y: dy / mag };
}

function update(dt) {
  if (!game.running || game.paused || game.ended) return;

  game.energy -= dt * (2.2 + game.level * 0.24);
  if (game.energy <= 0) {
    game.energy = 0;
    endGame();
    return;
  }

  const move = getMoveVector();
  game.player.x = clamp(game.player.x + move.x * game.player.speed * dt, game.player.r, canvas.width - game.player.r);
  game.player.y = clamp(game.player.y + move.y * game.player.speed * dt, game.player.r, canvas.height - game.player.r);
  game.player.shield = Math.max(0, game.player.shield - dt);
  game.player.shieldCooldown = Math.max(0, game.player.shieldCooldown - dt);

  updateCells(dt);
  updateDrones(dt);
  updateParticles(dt);
  updateStars(dt);
  updateHud();
}

function updateCells(dt) {
  for (const cell of game.cells) {
    cell.pulse += dt * 5;
    if (distance(game.player, cell) < game.player.r + cell.r) {
      const points = cell.bonus ? 25 : 10;
      game.score += points;
      game.energy = clamp(game.energy + (cell.bonus ? 18 : 9), 0, 100);
      game.cellsCollected += 1;
      burst(cell.x, cell.y, cell.bonus ? "#ffbf47" : "#36d1bf", cell.bonus ? 24 : 16);

      game.cells.splice(game.cells.indexOf(cell), 1);
      game.cells.push(spawnCell(game.cellsCollected % 5 === 0));

      if (game.cellsCollected % 4 === 0) {
        game.level += 1;
        game.drones.push(spawnDrone(game.level));
        if (game.cells.length < 3) game.cells.push(spawnCell(false));
      }
      break;
    }
  }
}

function updateDrones(dt) {
  for (const drone of game.drones) {
    drone.wobble += dt * 2.7;
    drone.hitTimer = Math.max(0, drone.hitTimer - dt);

    const angle = Math.atan2(game.player.y - drone.y, game.player.x - drone.x);
    const flank = Math.sin(drone.wobble) * 0.72;
    drone.x += Math.cos(angle + flank) * drone.speed * dt;
    drone.y += Math.sin(angle + flank) * drone.speed * dt;

    if (distance(game.player, drone) < game.player.r + drone.r && drone.hitTimer <= 0) {
      if (game.player.shield > 0) {
        const away = Math.atan2(drone.y - game.player.y, drone.x - game.player.x);
        drone.x += Math.cos(away) * 90;
        drone.y += Math.sin(away) * 90;
        game.score += 5;
        burst(drone.x, drone.y, "#6aa8ff", 18);
      } else {
        game.energy -= 18;
        drone.hitTimer = 0.85;
        burst(game.player.x, game.player.y, "#ff5d8f", 22);
      }
    }
  }
}

function updateParticles(dt) {
  game.particles = game.particles.filter((particle) => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.985;
    particle.vy *= 0.985;
    return particle.life > 0;
  });
}

function updateStars(dt) {
  for (const star of game.stars) {
    star.y += star.speed * dt;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  }
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = rand(80, 260);
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: rand(0.35, 0.8),
      maxLife: 0.8,
      size: rand(2, 5),
    });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  if (!game) return;
  drawCells();
  drawDrones();
  drawPlayer();
  drawParticles();
  drawShieldMeter();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#071014");
  gradient.addColorStop(0.5, "#0b1a1f");
  gradient.addColorStop(1, "#12161f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!game) return;

  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = "#24404a";
  ctx.lineWidth = 1;
  const grid = 48 * (window.devicePixelRatio || 1);
  for (let x = 0; x < canvas.width; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  for (const star of game.stars) {
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#b7fff7";
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCells() {
  for (const cell of game.cells) {
    const pulse = Math.sin(cell.pulse) * 4;
    ctx.save();
    ctx.shadowColor = cell.bonus ? "#ffbf47" : "#36d1bf";
    ctx.shadowBlur = 24;
    ctx.fillStyle = cell.bonus ? "#ffbf47" : "#36d1bf";
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, cell.r + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#071014";
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, cell.r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawDrones() {
  for (const drone of game.drones) {
    ctx.save();
    ctx.translate(drone.x, drone.y);
    ctx.rotate(drone.wobble);
    ctx.shadowColor = drone.hitTimer > 0 ? "#ff5d8f" : "#6aa8ff";
    ctx.shadowBlur = 18;
    ctx.fillStyle = drone.hitTimer > 0 ? "#ff5d8f" : "#263d4c";
    roundedRect(-drone.r, -drone.r, drone.r * 2, drone.r * 2, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#6aa8ff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-drone.r - 8, 0);
    ctx.lineTo(drone.r + 8, 0);
    ctx.moveTo(0, -drone.r - 8);
    ctx.lineTo(0, drone.r + 8);
    ctx.stroke();
    ctx.fillStyle = "#ff5d8f";
    ctx.beginPath();
    ctx.arc(0, 0, drone.r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPlayer() {
  const player = game.player;
  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.shield > 0) {
    const alpha = 0.2 + player.shield * 0.28;
    ctx.strokeStyle = `rgba(106, 168, 255, ${alpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, player.r + 18 + Math.sin(performance.now() / 80) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.shadowColor = "#36d1bf";
  ctx.shadowBlur = 22;
  ctx.fillStyle = "#36d1bf";
  ctx.beginPath();
  ctx.moveTo(0, -player.r - 8);
  ctx.lineTo(player.r + 13, player.r + 10);
  ctx.lineTo(0, player.r * 0.45);
  ctx.lineTo(-player.r - 13, player.r + 10);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#071014";
  ctx.beginPath();
  ctx.arc(0, 2, player.r * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  for (const p of game.particles) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawShieldMeter() {
  const player = game.player;
  const x = 18;
  const y = canvas.height - 28;
  const width = 180;
  const height = 10;
  const ready = player.shieldCooldown <= 0;
  const fill = ready ? 1 : 1 - player.shieldCooldown / 4.2;

  ctx.save();
  ctx.fillStyle = "rgba(237, 246, 245, 0.12)";
  roundedRect(x, y, width, height, 5);
  ctx.fill();
  ctx.fillStyle = ready ? "#6aa8ff" : "#ffbf47";
  roundedRect(x, y, width * clamp(fill, 0, 1), height, 5);
  ctx.fill();
  ctx.fillStyle = "#edf6f5";
  ctx.font = `${13 * (window.devicePixelRatio || 1)}px system-ui, sans-serif`;
  ctx.fillText(ready ? "Shield ready" : "Shield charging", x, y - 8);
  ctx.restore();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loop(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  resizeCanvas();
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }
  if (key === " ") activateShield();
  if (key === "p") togglePause();
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});

canvas.addEventListener("pointerdown", (event) => {
  pointer.active = true;
  canvas.setPointerCapture(event.pointerId);
  setPointer(event);
});

canvas.addEventListener("pointermove", (event) => {
  if (pointer.active) setPointer(event);
});

canvas.addEventListener("pointerup", () => {
  pointer.active = false;
});

canvas.addEventListener("pointercancel", () => {
  pointer.active = false;
});

canvas.addEventListener("dblclick", activateShield);

function setPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const ratioX = canvas.width / rect.width;
  const ratioY = canvas.height / rect.height;
  pointer.x = (event.clientX - rect.left) * ratioX;
  pointer.y = (event.clientY - rect.top) * ratioY;
}

startBtn.addEventListener("click", () => {
  if (game && game.paused) {
    togglePause();
    overlay.classList.add("hidden");
    return;
  }
  overlay.querySelector("h1").textContent = "Neon Salvage";
  overlay.querySelector("p").textContent = "Collect power cells, avoid sentry drones, and survive as the station speeds up.";
  startBtn.textContent = "Start Mission";
  startGame();
});

pauseBtn.addEventListener("click", togglePause);
restartBtn.addEventListener("click", startGame);

window.addEventListener("resize", resizeCanvas);

bestEl.textContent = best;
game = makeGame();
updateHud();
requestAnimationFrame(loop);
