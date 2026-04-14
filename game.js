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
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 40,
    speed: 5,
    emoji: '🛵',
    dx: 0,
    dy: 0,
    hasOrder: false,
    target: null
};

// Map Objects
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
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.hasOrder = false;
    player.target = null;
    
    // Generate static buildings
    restaurants = [
        { x: 50, y: 50, emoji: assets.restaurant },
        { x: 700, y: 50, emoji: assets.restaurant },
        { x: 50, y: 500, emoji: assets.restaurant },
        { x: 700, y: 500, emoji: assets.restaurant }
    ];
    
    houses = [];
    for(let i = 0; i < 8; i++) {
        houses.push({
            x: 150 + Math.random() * 500,
            y: 100 + Math.random() * 400,
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

    // Move player
    player.x += player.dx;
    player.y += player.dy;

    // Bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Collision Check
    const dist = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

    if (!player.hasOrder && currentOrder) {
        if (dist(player.x + 20, player.y + 20, currentOrder.x + 20, currentOrder.y + 20) < 40) {
            player.hasOrder = true;
            currentOrder = null;
            spawnDelivery();
        }
    } else if (player.hasOrder && currentDelivery) {
        if (dist(player.x + 20, player.y + 20, currentDelivery.x + 20, currentDelivery.y + 20) < 40) {
            player.hasOrder = false;
            currentDelivery = null;
            score++;
            timeLeft += 5; // Bonus time
            scoreElement.innerText = score;
            spawnOrder();
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Map (Background Detail)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    for(let i = 0; i < canvas.width; i+=50) {
        ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,canvas.height);ctx.stroke();
    }
    for(let i = 0; i < canvas.height; i+=50) {
        ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(canvas.width,i);ctx.stroke();
    }

    // Draw Buildings
    ctx.font = '30px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    restaurants.forEach(r => {
        ctx.fillText(r.emoji, r.x + 20, r.y + 20);
    });

    houses.forEach(h => {
        ctx.fillText(h.emoji, h.x + 20, h.y + 20);
    });

    // Draw Items
    if (currentOrder) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'yellow';
        ctx.fillText(currentOrder.emoji, currentOrder.x + 20, currentOrder.y + 20);
        
        // Indicator
        drawIndicator(currentOrder);
    }

    if (currentDelivery) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'red';
        ctx.fillText(currentDelivery.emoji, currentDelivery.x + 20, currentDelivery.y + 20);
        
        // Indicator
        drawIndicator(currentDelivery);
    }

    ctx.shadowBlur = 0;

    // Draw Player
    ctx.font = '40px serif';
    ctx.fillText(player.emoji, player.x + 20, player.y + 20);
    
    if(player.hasOrder) {
        ctx.font = '20px serif';
        ctx.fillText(assets.order, player.x + 20, player.y - 10);
    }
}

function drawIndicator(target) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if(distance > 150) {
        const angle = Math.atan2(dy, dx);
        const radius = 60;
        const ix = player.x + 20 + Math.cos(angle) * radius;
        const iy = player.y + 20 + Math.sin(angle) * radius;
        
        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(angle);
        ctx.fillStyle = player.hasOrder ? '#ff3333' : '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, 7);
        ctx.lineTo(-5, -7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
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
