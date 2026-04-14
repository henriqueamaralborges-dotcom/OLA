const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const finalScoreElement = document.getElementById('final-score');

// Config
canvas.width = 800;
canvas.height = 600;

let gameRunning = false;
let score = 0;
let timeLeft = 60;
let lastTime = 0;
let timerInterval;

const player = {
    x: 400,
    y: 300,
    size: 40,
    speed: 5,
    emoji: '🛵',
    dx: 0,
    dy: 0,
    hasOrder: false
};

// Map Settings
const tileSize = 100; // Size of a city block
const streetWidth = 40;

let restaurants = [];
let houses = [];
let currentOrder = null;
let currentDelivery = null;

const assets = {
    restaurant: '🏪',
    house: '🏠',
    order: '🍔',
    target: '📍'
};

function init() {
    score = 0;
    timeLeft = 60;
    player.x = 420;
    player.y = 320;
    player.hasOrder = false;
    
    // Position restaurants at intersections
    restaurants = [
        { x: 100, y: 100, emoji: assets.restaurant },
        { x: 700, y: 100, emoji: assets.restaurant },
        { x: 100, y: 500, emoji: assets.restaurant },
        { x: 700, y: 500, emoji: assets.restaurant }
    ];
    
    houses = [];
    const gridPoints = [200, 300, 400, 500, 600];
    for(let i = 0; i < 10; i++) {
        houses.push({
            x: gridPoints[Math.floor(Math.random() * gridPoints.length)],
            y: gridPoints[Math.floor(Math.random() * gridPoints.length)],
            emoji: assets.house
        });
    }

    spawnOrder();
}

function spawnOrder() {
    const res = restaurants[Math.floor(Math.random() * restaurants.length)];
    currentOrder = { x: res.x, y: res.y, emoji: assets.order };
    currentDelivery = null;
}

function spawnDelivery() {
    const house = houses[Math.floor(Math.random() * houses.length)];
    currentDelivery = { x: house.x, y: house.y, emoji: assets.target };
}

// Input Handling
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function handleInput() {
    player.dx = 0;
    player.dy = 0;
    if (keys['ArrowUp'] || keys['KeyW']) player.dy = -player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) player.dy = player.speed;
    if (keys['ArrowLeft'] || keys['KeyA']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) player.dx = player.speed;
}

function update(deltaTime) {
    if (!gameRunning) return;

    handleInput();

    player.x += player.dx;
    player.y += player.dy;

    // Bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

    if (!player.hasOrder && currentOrder) {
        if (dist(player.x + 20, player.y + 20, currentOrder.x, currentOrder.y) < 40) {
            player.hasOrder = true;
            currentOrder = null;
            spawnDelivery();
        }
    } else if (player.hasOrder && currentDelivery) {
        if (dist(player.x + 20, player.y + 20, currentDelivery.x, currentDelivery.y) < 40) {
            player.hasOrder = false;
            currentDelivery = null;
            score++;
            timeLeft += 8; // Extra time reward
            scoreElement.innerText = score;
            spawnOrder();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw City Grid (Streets and Blocks)
    drawStreets();

    // 2. Draw Buildings
    ctx.font = '30px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    restaurants.forEach(r => ctx.fillText(r.emoji, r.x, r.y));
    houses.forEach(h => ctx.fillText(h.emoji, h.x, h.y));

    // 3. Draw GPS Route (The "Better GPS")
    const target = player.hasOrder ? currentDelivery : currentOrder;
    if (target) {
        drawGPS(target);
    }

    // 4. Items
    if (currentOrder) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffcc00';
        ctx.fillText(currentOrder.emoji, currentOrder.x, currentOrder.y);
    }
    if (currentDelivery) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff3333';
        ctx.fillText(currentDelivery.emoji, currentDelivery.x, currentDelivery.y);
    }
    ctx.shadowBlur = 0;

    // 5. Draw Player
    ctx.font = '40px serif';
    ctx.fillText(player.emoji, player.x + 20, player.y + 20);
    
    if(player.hasOrder) {
        ctx.font = '20px serif';
        ctx.fillText(assets.order, player.x + 20, player.y - 15);
    }
}

function drawStreets() {
    // Fill Background with Block Color
    ctx.fillStyle = '#2c3e50'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Streets
    ctx.fillStyle = '#34495e'; // Street Color
    
    // Vertical Streets
    for(let x = 0; x <= canvas.width; x += 100) {
        ctx.fillRect(x - streetWidth/2, 0, streetWidth, canvas.height);
        // Paint Lane Lines
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal Streets
    for(let y = 0; y <= canvas.height; y += 100) {
        ctx.fillRect(0, y - streetWidth/2, canvas.width, streetWidth);
        // Paint Lane Lines
        ctx.beginPath();
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawGPS(target) {
    // Draw glowing line to target
    ctx.strokeStyle = player.hasOrder ? 'rgba(255, 51, 51, 0.4)' : 'rgba(255, 204, 0, 0.4)';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y + 20);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance Label near player
    const dx = target.x - (player.x + 20);
    const dy = target.y - (player.y + 20);
    const dist = Math.round(Math.sqrt(dx*dx + dy*dy) / 10);
    
    ctx.font = 'bold 14px Outfit';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${dist}m`, player.x + 20, player.y + 60);

    // Directional Arrow Indicator
    const angle = Math.atan2(dy, dx);
    const radius = 50;
    const ix = player.x + 20 + Math.cos(angle) * radius;
    const iy = player.y + 20 + Math.sin(angle) * radius;
    
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(angle);
    ctx.fillStyle = player.hasOrder ? '#ff3333' : '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(-5, 7); ctx.lineTo(-5, -7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    init();
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    
    if(timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);

    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    clearInterval(timerInterval);
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
    finalScoreElement.innerText = score;
}

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('restart-button').addEventListener('click', startGame);
