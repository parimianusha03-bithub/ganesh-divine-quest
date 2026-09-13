const menu = document.getElementById("menu");
const game = document.getElementById("game");
const gameOver = document.getElementById("gameOver");
const win = document.getElementById("win");
const instructions = document.getElementById("instructions");
const player = document.getElementById("player");
const world = document.getElementById("world");
const items = document.getElementById("items");
const obstacles = document.getElementById("obstacles");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const pausePanel = document.getElementById("pausePanel");

let x = 90, y = 0, vx = 0, vy = 0;
let score = 0, lives = 3, level = 1;
let jumping = false, paused = false, running = false;
let collectibles = [], rocks = [];
let lastTime = 0, spawnTimer = 0, rockTimer = 0, collected = 0;
const gravity = 1500;
const speed = 300;

function startGame() {
  menu.classList.add("hidden");
  gameOver.classList.add("hidden");
  win.classList.add("hidden");
  game.classList.remove("hidden");
  score = 0; lives = 3; level = 1; x = 90; y = 0; vx = 0; vy = 0;
  jumping = false; paused = false; running = true; collected = 0;
  collectibles = []; rocks = [];
  items.innerHTML = ""; obstacles.innerHTML = "";
  updateHUD();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function updateHUD() {
  scoreEl.textContent = score;
  levelEl.textContent = level;
  livesEl.textContent = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
}

function spawnCollectible() {
  const el = document.createElement("div");
  el.className = "collectible";
  const types = [
    { icon: "🌺", points: 10 },
    { icon: "🪔", points: 20 },
    { icon: "🍬", points: 30 }
  ];
  const t = types[Math.floor(Math.random() * types.length)];
  el.textContent = t.icon;
  el.dataset.points = t.points;
  el.style.left = (world.clientWidth + 30) + "px";
  el.style.bottom = (125 + Math.random() * 115) + "px";
  items.appendChild(el);
  collectibles.push({ el, x: world.clientWidth + 30, y: parseFloat(el.style.bottom), points: t.points });
}

function spawnRock() {
  const el = document.createElement("div");
  el.className = "rock";
  el.textContent = "🪨";
  el.style.left = (world.clientWidth + 30) + "px";
  el.style.bottom = "105px";
  obstacles.appendChild(el);
  rocks.push({ el, x: world.clientWidth + 30 });
}

function rectsOverlap(a, b) {
  const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
  return A.left < B.right && A.right > B.left && A.top < B.bottom && A.bottom > B.top;
}

function loseLife() {
  lives--;
  updateHUD();
  x = Math.max(50, x - 70);
  if (lives <= 0) {
    running = false;
    document.getElementById("finalScore").textContent = score;
    game.classList.add("hidden");
    gameOver.classList.remove("hidden");
  }
}

function loop(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;

  if (!paused) {
    vx *= 0.85;
    x += vx * dt;
    x = Math.max(10, Math.min(world.clientWidth - 70, x));

    if (jumping) {
      y += vy * dt;
      vy -= gravity * dt;
      if (y <= 0) { y = 0; vy = 0; jumping = false; }
    }

    spawnTimer += dt;
    rockTimer += dt;
    if (spawnTimer > Math.max(0.8, 1.5 - level * .15)) {
      spawnCollectible(); spawnTimer = 0;
    }
    if (rockTimer > Math.max(1.0, 1.9 - level * .1)) {
      spawnRock(); rockTimer = 0;
    }

    const scroll = (220 + level * 35) * dt;
    collectibles.forEach(c => c.x -= scroll);
    rocks.forEach(r => r.x -= scroll);

    collectibles = collectibles.filter(c => {
      c.el.style.left = c.x + "px";
      if (rectsOverlap(player, c.el)) {
        score += c.points; collected++;
        c.el.remove(); updateHUD();
        if (collected >= 10 && level === 1) {
          level = 2; collected = 0; updateHUD();
        } else if (collected >= 12 && level === 2) {
          level = 3; collected = 0; updateHUD();
        } else if (collected >= 15 && level === 3) {
          running = false;
          document.getElementById("winScore").textContent = score;
          game.classList.add("hidden"); win.classList.remove("hidden");
        }
        return false;
      }
      if (c.x < -60) { c.el.remove(); return false; }
      return true;
    });

    rocks = rocks.filter(r => {
      r.el.style.left = r.x + "px";
      if (rectsOverlap(player, r.el)) {
        r.el.remove(); loseLife(); return false;
      }
      if (r.x < -70) { r.el.remove(); return false; }
      return true;
    });

    player.style.left = x + "px";
    player.style.bottom = (105 + y) + "px";
  }
  requestAnimationFrame(loop);
}

function moveLeft() { vx = -speed; }
function moveRight() { vx = speed; }
function jump() {
  if (!jumping && running && !paused) { jumping = true; vy = 650; }
}

document.getElementById("playBtn").onclick = startGame;
document.getElementById("againBtn").onclick = startGame;
document.getElementById("winAgainBtn").onclick = startGame;
document.getElementById("howBtn").onclick = () => instructions.classList.toggle("hidden");
document.getElementById("leftBtn").onpointerdown = moveLeft;
document.getElementById("rightBtn").onpointerdown = moveRight;
document.getElementById("jumpBtn").onpointerdown = jump;
document.getElementById("resumeBtn").onclick = () => { paused = false; pausePanel.classList.add("hidden"); };

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") moveLeft();
  if (e.key === "ArrowRight") moveRight();
  if (e.key === "ArrowUp" || e.code === "Space") jump();
  if (e.key.toLowerCase() === "p" && running) {
    paused = !paused;
    pausePanel.classList.toggle("hidden", !paused);
  }
});
