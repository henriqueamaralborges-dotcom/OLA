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
    x: 420,
    y: 320,
    size: 40,
    speed: 5,
    emoji: '🛵',
    dx: 0,
    dy: 0,
    hasOrder: false
};

// Map Settings
const tileSize = 200; 
const streetWidth = 60;
const sidewalkWidth = 15;

let restaurants = [];
let houses = [];
let decorationBuildings = [];
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
    
    // Position entities carefully
    restaurants = [
        { x: 100, y: 100, emoji: assets.restaurant },
        { x: 700, y: 100, emoji: assets.restaurant },
        { x: 100, y: 500, emoji: assets.restaurant },
        { x: 700, y: 500, emoji: assets.restaurant }
    ];
    
    houses = [];
    const points = [100, 300, 500, 700];
    for(let i = 0; i < 8; i++) {
        houses.push({
            x: points[Math.floor(Math.random() * points.length)],
            y: points[Math.floor(Math.random() * points.length)],
            emoji: assets.house
        });
    }

    // Generate random decoration buildings for blocks
    decorationBuildings = [];
    for(let x = tileSize/2; x < canvas.width; x += tileSize) {
        for(let y = tileSize/2; y < canvas.height; y += tileSize) {
            // Randomize building variations
            decorationBuildings.push({
                x: x, y: y,
                width: 70 + Math.random() * 40,
                height: 70 + Math.random() * 40,
                color: `hsl(${200 + Math.random() * 40}, 30%, ${20 + Math.random() * 20}%)`,
                windows: Math.random() > 0.5
            });
        }
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

// Input
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function handleInput() {
    player.dx = 0; player.dy = 0;
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
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    if (!player.hasOrder && currentOrder) {
        if (dist(player.x + 20, player.y + 20, currentOrder.x, currentOrder.y) < 40) {
            player.hasOrder = true; currentOrder = null; spawnDelivery();
        }
    } else if (player.hasOrder && currentDelivery) {
        if (dist(player.x + 20, player.y + 20, currentDelivery.x, currentDelivery.y) < 40) {
            player.hasOrder = false; currentDelivery = null;
            score++; timeLeft += 10; scoreElement.innerText = score;
            spawnOrder();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCity();
    
    // Buildings & Labels
    decorationBuildings.forEach(b => drawBuildingShape(b));
    
    ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    restaurants.forEach(r => ctx.fillText(r.emoji, r.x, r.y));
    houses.forEach(h => ctx.fillText(h.emoji, h.x, h.y));

    const target = player.hasOrder ? currentDelivery : currentOrder;
    if (target) drawGPS(target);

    if (currentOrder) {
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffcc00';
        ctx.fillText(currentOrder.emoji, currentOrder.x, currentOrder.y);
    }
    if (currentDelivery) {
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff3333';
        ctx.fillText(currentDelivery.emoji, currentDelivery.x, currentDelivery.y);
    }
    ctx.shadowBlur = 0;

    // Player
    ctx.font = '40px serif';
    ctx.fillText(player.emoji, player.x + 20, player.y + 20);
    if(player.hasOrder) {
        ctx.font = '20px serif';
        ctx.fillText(assets.order, player.x + 20, player.y - 15);
    }
}

function drawCity() {
    // Fill with grass/base color
    ctx.fillStyle = '#1e272e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Streets
    ctx.fillStyle = '#3d3d3d';
    for(let x = 100; x <= canvas.width; x += 200) {
        ctx.fillRect(x - streetWidth/2, 0, streetWidth, canvas.height);
        // Paint Sidewalks
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(x - streetWidth/2 - sidewalkWidth, 0, sidewalkWidth, canvas.height);
        ctx.fillRect(x + streetWidth/2, 0, sidewalkWidth, canvas.height);
        ctx.fillStyle = '#3d3d3d'; // Reset
    }
    for(let y = 100; y <= canvas.height; y += 200) {
        ctx.fillRect(0, y - streetWidth/2, canvas.width, streetWidth);
        // Paint Sidewalks
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(0, y - streetWidth/2 - sidewalkWidth, canvas.width, sidewalkWidth);
        ctx.fillRect(0, y + streetWidth/2, canvas.width, sidewalkWidth);
        ctx.fillStyle = '#3d3d3d';
        
        // Crosswalks
        for(let x = 100; x <= canvas.width; x += 200) {
            drawCrosswalk(x, y);
        }
    }
}

function drawCrosswalk(x, y) {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for(let i = -20; i <= 20; i += 10) {
        ctx.fillRect(x + i - 2, y - 25, 4, 15);
        ctx.fillRect(x + i - 2, y + 10, 4, 15);
        ctx.fillRect(x - 25, y + i - 2, 15, 4);
        ctx.fillRect(x + 10, y + i - 2, 15, 4);
    }
}

function drawBuildingShape(b) {
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(b.x - b.width/2 + 5, b.y - b.height/2 + 5, b.width, b.height);
    
    // body
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - b.width/2, b.y - b.height/2, b.width, b.height);
    
    // roof (lighter)
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(b.x - b.width/2, b.y - b.height/2, b.width, 10);

    // windows
    if(b.windows) {
        ctx.fillStyle = '#f1c40f';
        for(let wx = -20; wx <= 20; wx += 15) {
            for(let wy = -20; wy <= 20; wy += 15) {
                if(Math.random() > 0.3) {
                    ctx.fillRect(b.x + wx, b.y + wy, 5, 5);
                }
            }
        }
    }
}

function drawGPS(target) {
    const dx = target.x - (player.x + 20);
    const dy = target.y - (player.y + 20);
    const distance = Math.sqrt(dx*dx + dy*dy);
    const distMeters = Math.round(distance / 5);

    // Route Line (Neon effect)
    ctx.strokeStyle = player.hasOrder ? '#ff3333' : '#ffcc00';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 10]);
    ctx.shadowBlur = 10;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(player.x + 20, player.y + 20);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);

    // GPS Text
    ctx.font = 'bold 16px Outfit';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${distMeters}m`, player.x + 20, player.y + 65);

    // Arrow
    const angle = Math.atan2(dy, dx);
    const ix = player.x + 20 + Math.cos(angle) * 60;
    const iy = player.y + 20 + Math.sin(angle) * 60;
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(angle);
    ctx.fillStyle = player.hasOrder ? '#ff3333' : '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(12, 0); ctx.lineTo(-6, 8); ctx.lineTo(-6, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    update(deltaTime);
    draw();
    if (gameRunning) requestAnimationFrame(gameLoop);
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
        if (timeLeft <= 0) endGame();
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
