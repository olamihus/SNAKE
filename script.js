// Game Configuration
const config = {
    gridSize: 20,
    initialSpeed: 200,
    minSpeed: 80,
    speedIncrease: 10,
    pointsPerFood: 10,
    localStorageKey: 'neonSnakeHighScore'
};

// Game State
const gameState = {
    gridSize: config.gridSize,
    snake: [],
    food: { x: 0, y: 0 },
    direction: 'right',
    nextDirection: 'right',
    score: 0,
    highScore: 0,
    gameRunning: false,
    gamePaused: false,
    gameSpeed: config.initialSpeed,
    foodEaten: 0,
    level: 1
};

// DOM Elements
const elements = {
    gameBoard: document.getElementById('game-board'),
    score: document.getElementById('score'),
    highScore: document.getElementById('high-score'),
    level: document.getElementById('level'),
    speed: document.getElementById('speed'),
    foodCount: document.getElementById('food-count'),
    length: document.getElementById('length'),
    
    // Buttons
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    restartBtn: document.getElementById('restart-btn'),
    startGameBtn: document.getElementById('start-game-btn'),
    playAgainBtn: document.getElementById('play-again-btn'),
    backToMenuBtn: document.getElementById('back-to-menu'),
    
    // Overlays
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    
    // Game Over Stats
    finalScore: document.getElementById('final-score'),
    finalLength: document.getElementById('final-length'),
    finalFood: document.getElementById('final-food'),
    
    // Touch Controls
    upBtn: document.getElementById('up-btn'),
    leftBtn: document.getElementById('left-btn'),
    downBtn: document.getElementById('down-btn'),
    rightBtn: document.getElementById('right-btn'),
    
    // Audio
    eatSound: document.getElementById('eat-sound'),
    gameOverSound: document.getElementById('game-over-sound'),
    moveSound: document.getElementById('move-sound'),
    
    // Settings
    soundToggle: document.getElementById('sound-toggle'),
    themeToggle: document.getElementById('theme-toggle')
};

// Initialize Game
function initGame() {
    loadHighScore();
    createGameGrid();
    setupEventListeners();
    resetGame();
    render();
}

// Create Game Grid
function createGameGrid() {
    elements.gameBoard.innerHTML = '';
    elements.gameBoard.style.gridTemplateColumns = `repeat(${gameState.gridSize}, 1fr)`;
    elements.gameBoard.style.gridTemplateRows = `repeat(${gameState.gridSize}, 1fr)`;
    
    for (let row = 0; row < gameState.gridSize; row++) {
        for (let col = 0; col < gameState.gridSize; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            elements.gameBoard.appendChild(cell);
        }
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Keyboard Controls
    document.addEventListener('keydown', handleKeyDown);
    
    // Button Events
    elements.startBtn.addEventListener('click', startGame);
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.restartBtn.addEventListener('click', resetGame);
    elements.startGameBtn.addEventListener('click', startGame);
    elements.playAgainBtn.addEventListener('click', resetGame);
    elements.backToMenuBtn.addEventListener('click', showStartScreen);
    
    // Touch Controls (buttons only - no swipe)
    elements.upBtn.addEventListener('click', () => changeDirection('up'));
    elements.leftBtn.addEventListener('click', () => changeDirection('left'));
    elements.downBtn.addEventListener('click', () => changeDirection('down'));
    elements.rightBtn.addEventListener('click', () => changeDirection('right'));
    
    // Settings
    elements.soundToggle.addEventListener('click', toggleSound);
    elements.themeToggle.addEventListener('click', toggleTheme);
}

// Handle Keyboard Input
function handleKeyDown(e) {
    if (!gameState.gameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            if (gameState.direction !== 'down') changeDirection('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            if (gameState.direction !== 'up') changeDirection('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            if (gameState.direction !== 'right') changeDirection('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            if (gameState.direction !== 'left') changeDirection('right');
            break;
        case ' ':
            e.preventDefault();
            togglePause();
            break;
    }
}

// Change Direction
function changeDirection(newDirection) {
    if (gameState.gamePaused) return;
    gameState.nextDirection = newDirection;
    playSound(elements.moveSound);
}

// Update Direction
function updateDirection() {
    gameState.direction = gameState.nextDirection;
}

// Start Game
function startGame() {
    if (gameState.gameRunning) return;
    
    gameState.gameRunning = true;
    gameState.gamePaused = false;
    
    elements.startScreen.style.display = 'none';
    elements.gameOverScreen.style.display = 'none';
    
    updateUI();
    gameLoop();
}

// Toggle Pause
function togglePause() {
    if (!gameState.gameRunning) return;
    
    gameState.gamePaused = !gameState.gamePaused;
    
    if (gameState.gamePaused) {
        elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i> RESUME';
        elements.pauseBtn.classList.remove('btn-secondary');
        elements.pauseBtn.classList.add('btn-primary');
    } else {
        elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
        elements.pauseBtn.classList.remove('btn-primary');
        elements.pauseBtn.classList.add('btn-secondary');
        gameLoop();
    }
    
    updateUI();
}

// Reset Game
function resetGame() {
    gameState.snake = [
        { x: 5, y: 10 },
        { x: 4, y: 10 },
        { x: 3, y: 10 }
    ];
    
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.gameSpeed = config.initialSpeed;
    gameState.foodEaten = 0;
    gameState.level = 1;
    
    generateFood();
    
    elements.startScreen.style.display = 'none';
    elements.gameOverScreen.style.display = 'none';
    
    if (gameState.gameRunning) {
        gameState.gameRunning = false;
        clearTimeout(gameState.gameLoop);
    }
    
    startGame();
}

// Game Loop
function gameLoop() {
    if (!gameState.gameRunning || gameState.gamePaused) return;
    
    updateDirection();
    moveSnake();
    checkCollisions();
    render();
    
    if (gameState.gameRunning) {
        gameState.gameLoop = setTimeout(gameLoop, gameState.gameSpeed);
    }
}

// Move Snake
function moveSnake() {
    const head = { ...gameState.snake[0] };
    
    switch (gameState.direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Wrap around edges
    if (head.x < 0) head.x = gameState.gridSize - 1;
    if (head.x >= gameState.gridSize) head.x = 0;
    if (head.y < 0) head.y = gameState.gridSize - 1;
    if (head.y >= gameState.gridSize) head.y = 0;
    
    gameState.snake.unshift(head);
    
    // Check if food was eaten
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        eatFood();
    } else {
        gameState.snake.pop();
    }
}

// Eat Food
function eatFood() {
    gameState.score += config.pointsPerFood;
    gameState.foodEaten++;
    
    // Increase speed every 5 foods
    if (gameState.foodEaten % 5 === 0) {
        gameState.gameSpeed = Math.max(config.minSpeed, gameState.gameSpeed - config.speedIncrease);
        gameState.level = Math.floor(gameState.foodEaten / 5) + 1;
    }
    
    // Update high score
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        saveHighScore();
    }
    
    playSound(elements.eatSound);
    generateFood();
    animateScore();
}

// Generate Food
function generateFood() {
    let foodPlaced = false;
    
    while (!foodPlaced) {
        gameState.food = {
            x: Math.floor(Math.random() * gameState.gridSize),
            y: Math.floor(Math.random() * gameState.gridSize)
        };
        
        // Make sure food doesn't spawn on snake
        foodPlaced = !gameState.snake.some(segment => 
            segment.x === gameState.food.x && segment.y === gameState.food.y
        );
    }
}

// Check Collisions
function checkCollisions() {
    const head = gameState.snake[0];
    
    // Check self collision (skip first segment - it's the head)
    for (let i = 1; i < gameState.snake.length; i++) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            gameOver();
            return;
        }
    }
}

// Game Over
function gameOver() {
    gameState.gameRunning = false;
    clearTimeout(gameState.gameLoop);
    
    // Update final stats
    elements.finalScore.textContent = gameState.score;
    elements.finalLength.textContent = gameState.snake.length;
    elements.finalFood.textContent = gameState.foodEaten;
    
    playSound(elements.gameOverSound);
    
    // Show game over screen with delay for dramatic effect
    setTimeout(() => {
        elements.gameOverScreen.style.display = 'flex';
    }, 500);
}

// Render Game
function render() {
    // Clear board
    document.querySelectorAll('.grid-cell').forEach(cell => {
        cell.className = 'grid-cell';
    });
    
    // Render snake
    gameState.snake.forEach((segment, index) => {
        const cell = getCell(segment.x, segment.y);
        if (cell) {
            cell.classList.add(index === 0 ? 'snake-head' : 'snake-body');
            if (index === 0) {
                cell.classList.add('snake-moving');
                setTimeout(() => cell.classList.remove('snake-moving'), 100);
            }
        }
    });
    
    // Render food
    const foodCell = getCell(gameState.food.x, gameState.food.y);
    if (foodCell) {
        foodCell.classList.add('food');
    }
    
    // Update UI
    updateUI();
}

// Update UI
function updateUI() {
    elements.score.textContent = gameState.score;
    elements.highScore.textContent = gameState.highScore;
    elements.level.textContent = gameState.level;
    elements.foodCount.textContent = gameState.foodEaten;
    elements.length.textContent = gameState.snake.length;
    
    // Update speed indicator
    const speedPercentage = Math.round((config.initialSpeed - gameState.gameSpeed) / 
        (config.initialSpeed - config.minSpeed) * 100);
    elements.speed.textContent = `${Math.max(0, speedPercentage)}%`;
    
    // Update button states
    elements.startBtn.disabled = gameState.gameRunning;
    elements.pauseBtn.disabled = !gameState.gameRunning;
    
    if (gameState.gamePaused) {
        elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i> RESUME';
    } else {
        elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> PAUSE';
    }
}

// Helper Functions
function getCell(x, y) {
    return document.querySelector(`.grid-cell[data-row="${y}"][data-col="${x}"]`);
}

function animateScore() {
    elements.score.classList.add('score-update');
    setTimeout(() => {
        elements.score.classList.remove('score-update');
    }, 300);
}

function playSound(audioElement) {
    if (elements.soundToggle.classList.contains('sound-on')) {
        audioElement.currentTime = 0;
        audioElement.play().catch(e => console.log("Audio play failed:", e));
    }
}

function toggleSound() {
    const isSoundOn = elements.soundToggle.classList.toggle('sound-on');
    elements.soundToggle.innerHTML = `<i class="fas fa-volume-${isSoundOn ? 'up' : 'mute'}"></i> SOUND: ${isSoundOn ? 'ON' : 'OFF'}`;
    
    // Default to sound on
    if (!elements.soundToggle.classList.contains('sound-on')) {
        elements.soundToggle.classList.add('sound-on');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    elements.themeToggle.innerHTML = `<i class="fas fa-${document.body.classList.contains('light-theme') ? 'moon' : 'sun'}"></i> ${document.body.classList.contains('light-theme') ? 'DARK' : 'LIGHT'} MODE`;
}

function showStartScreen() {
    elements.startScreen.style.display = 'flex';
    elements.gameOverScreen.style.display = 'none';
}

function loadHighScore() {
    const savedHighScore = localStorage.getItem(config.localStorageKey);
    if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
        elements.highScore.textContent = gameState.highScore;
    }
}

function saveHighScore() {
    localStorage.setItem(config.localStorageKey, gameState.highScore.toString());
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Default to sound on
    elements.soundToggle.classList.add('sound-on');
    initGame();
});

// Add light theme CSS dynamically
const lightThemeCSS = `
.light-theme {
    --background-dark: #f0f2f5;
    --background-darker: #ffffff;
    --background-light: #e4e6eb;
    --text-primary: #1a1a2e;
    --text-secondary: #4a4a6a;
    --grid-line: rgba(0, 0, 0, 0.05);
    --grid-bg: #ffffff;
}

.light-theme .game-board-container,
.light-theme .control-panel,
.light-theme .touch-controls {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.1);
}

.light-theme .score-box {
    background: rgba(255, 255, 255, 0.7);
    border-color: rgba(0, 0, 0, 0.05);
}

.light-theme .btn-secondary {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
}

.light-theme .game-overlay {
    background: rgba(255, 255, 255, 0.95);
}

.light-theme .overlay-content {
    background: linear-gradient(145deg, #ffffff, #f0f2f5);
    color: var(--text-primary);
}

.light-theme .overlay-content p {
    color: var(--text-secondary);
}
`;

// Add light theme styles
const styleSheet = document.createElement('style');
styleSheet.textContent = lightThemeCSS;
document.head.appendChild(styleSheet);
