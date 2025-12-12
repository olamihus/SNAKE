// Game Configuration
const config = {
    gridSize: 15,  // Changed from 20 to 15
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
    level: 1,
    gameLoop: null
};

// DOM Elements
const elements = {
    gameBoard: document.getElementById('game-board'),
    score: document.getElementById('score'),
    highScore: document.getElementById('high-score'),
    level: document.getElementById('level'),
    foodCount: document.getElementById('food-count'),
    
    // Buttons
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
    resetGameState();
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
    elements.pauseBtn.addEventListener('click', togglePause);
    elements.restartBtn.addEventListener('click', resetGame);
    elements.startGameBtn.addEventListener('click', startGameFromButton);
    elements.playAgainBtn.addEventListener('click', resetGame);
    elements.backToMenuBtn.addEventListener('click', showStartScreen);
    
    // Touch Controls (buttons only)
    elements.upBtn.addEventListener('click', () => changeDirection('up'));
    elements.leftBtn.addEventListener('click', () => changeDirection('left'));
    elements.downBtn.addEventListener('click', () => changeDirection('down'));
    elements.rightBtn.addEventListener('click', () => changeDirection('right'));
    
    // Settings
    elements.soundToggle.addEventListener('click', toggleSound);
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Also allow spacebar to start from start screen
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && elements.startScreen.style.display !== 'none') {
            e.preventDefault();
            startGameFromButton();
        }
    });
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
    if (gameState.gamePaused || !gameState.gameRunning) return;
    gameState.nextDirection = newDirection;
    playSound(elements.moveSound);
}

// Update Direction
function updateDirection() {
    gameState.direction = gameState.nextDirection;
}

// Start Game from Button
function startGameFromButton() {
    // If game is already running, do nothing
    if (gameState.gameRunning) return;
    
    // Hide start screen
    elements.startScreen.style.display = 'none';
    
    // Reset game state if needed
    if (!gameState.gameRunning) {
        resetGameState();
    }
    
    // Start the game
    startGame();
}

// Start Game Logic
function startGame() {
    // Clear any existing game loop
    if (gameState.gameLoop) {
        clearTimeout(gameState.gameLoop);
    }
    
    gameState.gameRunning = true;
    gameState.gamePaused = false;
    
    // Hide game over screen if visible
    elements.gameOverScreen.style.display = 'none';
    
    // Update UI
    updateUI();
    
    // Start the game loop
    gameLoop();
}

// Toggle Pause
function togglePause() {
    if (!gameState.gameRunning) return;
    
    gameState.gamePaused = !gameState.gamePaused;
    
    if (gameState.gamePaused) {
        elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>RESUME</span>';
        elements.pauseBtn.classList.remove('btn-primary');
        elements.pauseBtn.classList.add('btn-secondary');
        
        // Clear the game loop
        if (gameState.gameLoop) {
            clearTimeout(gameState.gameLoop);
        }
    } else {
        elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>PAUSE</span>';
        elements.pauseBtn.classList.remove('btn-secondary');
        elements.pauseBtn.classList.add('btn-primary');
        
        // Resume the game loop
        gameLoop();
    }
    
    updateUI();
}

// Reset Game State (without starting)
function resetGameState() {
    // Adjusted starting position for 15x15 grid
    gameState.snake = [
        { x: 4, y: 7 },  // Adjusted from (5, 10) for 15x15
        { x: 3, y: 7 },  // Adjusted from (4, 10) for 15x15
        { x: 2, y: 7 }   // Adjusted from (3, 10) for 15x15
    ];
    
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
    gameState.score = 0;
    gameState.gameSpeed = config.initialSpeed;
    gameState.foodEaten = 0;
    gameState.level = 1;
    
    generateFood();
    
    // Clear any existing game loop
    if (gameState.gameLoop) {
        clearTimeout(gameState.gameLoop);
        gameState.gameLoop = null;
    }
    
    // Update UI immediately
    updateUI();
    render();
}

// Reset Game (and start immediately)
function resetGame() {
    // Reset game state
    resetGameState();
    
    // Hide overlays
    elements.startScreen.style.display = 'none';
    elements.gameOverScreen.style.display = 'none';
    
    // Start the game
    startGame();
}

// Game Loop
function gameLoop() {
    if (!gameState.gameRunning || gameState.gamePaused) return;
    
    updateDirection();
    moveSnake();
    checkCollisions();
    render();
    
    if (gameState.gameRunning && !gameState.gamePaused) {
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
    gameState.gamePaused = false;
    
    // Clear game loop
    if (gameState.gameLoop) {
        clearTimeout(gameState.gameLoop);
        gameState.gameLoop = null;
    }
    
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
    
    // Update button states
    elements.pauseBtn.disabled = !gameState.gameRunning;
    
    if (gameState.gamePaused) {
        elements.pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>RESUME</span>';
        elements.pauseBtn.classList.remove('btn-primary');
        elements.pauseBtn.classList.add('btn-secondary');
    } else {
        elements.pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>PAUSE</span>';
        elements.pauseBtn.classList.remove('btn-secondary');
        elements.pauseBtn.classList.add('btn-primary');
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
    elements.soundToggle.innerHTML = `<i class="fas fa-volume-${isSoundOn ? 'up' : 'mute'}"></i>`;
    
    // Default to sound on
    if (!elements.soundToggle.classList.contains('sound-on')) {
        elements.soundToggle.classList.add('sound-on');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    elements.themeToggle.innerHTML = `<i class="fas fa-${document.body.classList.contains('light-theme') ? 'moon' : 'sun'}"></i>`;
}

function showStartScreen() {
    // Stop game if running
    if (gameState.gameRunning) {
        gameState.gameRunning = false;
        if (gameState.gameLoop) {
            clearTimeout(gameState.gameLoop);
            gameState.gameLoop = null;
        }
    }
    
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
    
    // Make sure start screen is visible
    elements.startScreen.style.display = 'flex';
    
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

.light-theme .top-stats-bar,
.light-theme .touch-controls-container,
.light-theme .game-overlay {
    background: rgba(255, 255, 255, 0.95);
}

.light-theme .stat-item {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(0, 0, 0, 0.1);
}

.light-theme .btn-secondary {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
}

.light-theme .overlay-content {
    background: linear-gradient(145deg, #ffffff, #f0f2f5);
    color: var(--text-primary);
}

.light-theme .overlay-content p {
    color: var(--text-secondary);
}

.light-theme .game-board {
    background: var(--grid-bg);
    border-color: rgba(0, 0, 0, 0.2);
}

.light-theme .touch-btn {
    background: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.1);
}

.light-theme .touch-btn:hover, .light-theme .touch-btn:active {
    background: rgba(0, 255, 157, 0.15);
    border-color: var(--primary-color);
}
`;

// Add light theme styles
const styleSheet = document.createElement('style');
styleSheet.textContent = lightThemeCSS;
document.head.appendChild(styleSheet);
