const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas setup
canvas.width = 800;
canvas.height = 600;

// Game variables
let score = 0;
let lives = 3;
let level = 1;
let gameRunning = false;
let gamePaused = false;
let animationId;
let playerName = '';
let highScores = [];

// Paddle (spaceship)
const paddle = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 40,
    width: 120,
    height: 20,
    speed: 8,
    dx: 0
};

// Balls array (to support multiple balls)
let balls = [];

// Initialize first ball
function createBall(x, y) {
    const baseSpeed = 4 + (level - 1) * 0.3; // Speed increases with level
    return {
        x: x || canvas.width / 2,
        y: y || canvas.height - 60,
        radius: 8,
        speed: baseSpeed,
        dx: baseSpeed,
        dy: -baseSpeed
    };
}

// Bricks (asteroids)
const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 80;
const brickHeight = 30;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 45;

let bricks = [];
let powerUps = [];

// Brick colors (space themed)
const brickColors = [
    { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)' },  // Pink
    { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },  // Purple
    { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },  // Blue
    { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },  // Green
    { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' }   // Orange
];

// Power-up types
const powerUpTypes = [
    { 
        type: 'bomb', 
        emoji: '💣', 
        color: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.8)',
        chance: 0.01  // 1% - ΠΟΛΥ ΣΠΑΝΙΟ!
    },
    { 
        type: 'life', 
        emoji: '❤️', 
        color: '#ec4899',
        glow: 'rgba(236, 72, 153, 0.8)',
        chance: 0.03  // 3% - Σπάνιο
    },
    { 
        type: 'multiBall', 
        emoji: '⚡', 
        color: '#fbbf24',
        glow: 'rgba(251, 191, 36, 0.8)',
        chance: 0.05  // 5% - Μέτριο
    },
    { 
        type: 'bonus', 
        emoji: '💰', 
        color: '#10b981',
        glow: 'rgba(16, 185, 129, 0.8)',
        chance: 0.06  // 6% - Συχνό
    },
    { 
        type: 'skull', 
        emoji: '💀', 
        color: '#6b7280',
        glow: 'rgba(107, 114, 128, 0.8)',
        chance: 0.04  // 4% - BAD! Χάνεις ζωή
    }
];

// Brick patterns for different levels
function getBrickPattern(level) {
    const patterns = {
        1: (c, r) => true, // All bricks
        2: (c, r) => (c + r) % 2 === 0, // Checkerboard
        3: (c, r) => r < 3 || c % 2 === 0, // Pyramid
        4: (c, r) => Math.abs(c - 3.5) + r < 6, // Diamond
        5: (c, r) => (c < 2 || c > 5) || r < 2, // Frame
        6: (c, r) => c % 2 === r % 2, // Diagonal stripes
        7: (c, r) => (c + r) % 3 !== 0, // Sparse pattern
        8: (c, r) => Math.abs(c - 3.5) < 3 || r < 2, // Cross
        9: (c, r) => (c < 3 && r < 3) || (c > 4 && r < 3) || r === 4, // Smiley
        10: (c, r) => true // All bricks (harder version)
    };
    
    // Cycle through patterns if level > 10
    const patternKey = ((level - 1) % 10) + 1;
    return patterns[patternKey] || patterns[1];
}

// Initialize bricks
function initBricks() {
    bricks = [];
    const pattern = getBrickPattern(level);
    
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const colorIndex = r % brickColors.length;
            const shouldHaveBrick = pattern(c, r);
            
            bricks[c][r] = {
                x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                y: r * (brickHeight + brickPadding) + brickOffsetTop,
                status: shouldHaveBrick ? 1 : 0,
                color: brickColors[colorIndex]
            };
        }
    }
}

// Create power-up
function createPowerUp(x, y) {
    const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    powerUps.push({
        x: x,
        y: y,
        width: 40,
        height: 40,
        speed: 2,
        type: randomType.type,
        emoji: randomType.emoji,
        color: randomType.color,
        glow: randomType.glow
    });
}

// Draw paddle (spaceship)
function drawPaddle() {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#3b82f6';
    
    // Main body
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(paddle.x + paddle.width / 2, paddle.y);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height);
    ctx.lineTo(paddle.x, paddle.y + paddle.height);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(paddle.x + paddle.width / 2, paddle.y + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Wings glow
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(paddle.x, paddle.y + paddle.height - 5, 30, 5);
    ctx.fillRect(paddle.x + paddle.width - 30, paddle.y + paddle.height - 5, 30, 5);
    
    ctx.restore();
}

// Draw ball (energy orb)
function drawBall(ball) {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#3b82f6';
    
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#1e40af');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius / 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Draw all balls
function drawBalls() {
    balls.forEach(ball => drawBall(ball));
}

// Draw bricks (asteroids)
function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const brick = bricks[c][r];
            if (brick.status === 1) {
                ctx.save();
                ctx.shadowBlur = 10;
                ctx.shadowColor = brick.color.glow;
                
                ctx.fillStyle = brick.color.fill;
                ctx.beginPath();
                ctx.moveTo(brick.x + 10, brick.y);
                ctx.lineTo(brick.x + brickWidth - 10, brick.y);
                ctx.lineTo(brick.x + brickWidth, brick.y + 10);
                ctx.lineTo(brick.x + brickWidth, brick.y + brickHeight - 10);
                ctx.lineTo(brick.x + brickWidth - 10, brick.y + brickHeight);
                ctx.lineTo(brick.x + 10, brick.y + brickHeight);
                ctx.lineTo(brick.x, brick.y + brickHeight - 10);
                ctx.lineTo(brick.x, brick.y + 10);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(brick.x + 5, brick.y + 5, brickWidth - 10, 5);
                
                ctx.restore();
            }
        }
    }
}

// Draw power-ups
function drawPowerUps() {
    powerUps.forEach(powerUp => {
        ctx.save();
        ctx.shadowBlur = 20;
        ctx.shadowColor = powerUp.glow;
        
        // Glow circle
        ctx.fillStyle = powerUp.color;
        ctx.beginPath();
        ctx.arc(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Emoji
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUp.emoji, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
        
        ctx.restore();
    });
}

// Move power-ups
function movePowerUps() {
    powerUps.forEach((powerUp, index) => {
        powerUp.y += powerUp.speed;
        
        // Check collision with paddle
        if (powerUp.y + powerUp.height > paddle.y &&
            powerUp.y < paddle.y + paddle.height &&
            powerUp.x + powerUp.width > paddle.x &&
            powerUp.x < paddle.x + paddle.width) {
            
            activatePowerUp(powerUp.type);
            powerUps.splice(index, 1);
        }
        
        // Remove if off screen
        if (powerUp.y > canvas.height) {
            powerUps.splice(index, 1);
        }
    });
}

// Activate power-up
function activatePowerUp(type) {
    switch(type) {
        case 'bomb':
            // Destroy all bricks
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    if (bricks[c][r].status === 1) {
                        bricks[c][r].status = 0;
                        score += 10 * level;
                    }
                }
            }
            updateScore();
            
            // Visual explosion effect
            ctx.save();
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            
            // Check if level complete
            if (checkLevelComplete()) {
                setTimeout(() => levelComplete(), 500);
            }
            break;
            
        case 'life':
            lives++;
            updateLives();
            break;
            
        case 'multiBall':
            // Create 2 extra balls
            const baseBall = balls[0];
            balls.push(createBall(baseBall.x, baseBall.y));
            balls.push(createBall(baseBall.x, baseBall.y));
            
            // Give them different angles
            balls[balls.length - 2].dx = -4;
            balls[balls.length - 1].dx = 2;
            break;
            
        case 'bonus':
            // Give 100 bonus points
            score += 100;
            updateScore();
            
            // Visual effect
            ctx.save();
            ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            break;
            
        case 'skull':
            // Lose a life - BAD power-up!
            lives--;
            updateLives();
            
            // Visual effect
            ctx.save();
            ctx.fillStyle = 'rgba(107, 114, 128, 0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            
            if (lives === 0) {
                gameOver();
            }
            break;
    }
}

// Collision detection
function collisionDetection() {
    balls.forEach(ball => {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                const brick = bricks[c][r];
                if (brick.status === 1) {
                    if (ball.x > brick.x && 
                        ball.x < brick.x + brickWidth && 
                        ball.y > brick.y && 
                        ball.y < brick.y + brickHeight) {
                        ball.dy = -ball.dy;
                        brick.status = 0;
                        score += 10 * level;
                        updateScore();
                        
                        // Random chance to drop power-up
                        const random = Math.random();
                        let cumulativeChance = 0;
                        
                        for (let powerUpType of powerUpTypes) {
                            cumulativeChance += powerUpType.chance;
                            if (random < cumulativeChance) {
                                createPowerUp(brick.x + brickWidth / 2 - 20, brick.y);
                                break;
                            }
                        }
                        
                        // Check if level complete
                        if (checkLevelComplete()) {
                            levelComplete();
                        }
                    }
                }
            }
        }
    });
}

// Check if level is complete
function checkLevelComplete() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                return false;
            }
        }
    }
    return true;
}

// Level complete
function levelComplete() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    document.getElementById('completedLevel').textContent = level;
    document.getElementById('levelCompleteModal').style.display = 'block';
}

// Next level
function nextLevel() {
    level++;
    document.getElementById('level').textContent = level;
    document.getElementById('levelCompleteModal').style.display = 'none';
    
    // Increase difficulty progressively
    // Ball speed increases by 0.3 per level
    balls.forEach(ball => {
        const speedIncrease = 0.3;
        const speedMultiplier = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx = (ball.dx / speedMultiplier) * (4 + (level - 1) * speedIncrease);
        ball.dy = (ball.dy / speedMultiplier) * (4 + (level - 1) * speedIncrease);
    });
    
    // Increase power-up chances slightly
    powerUpTypes.forEach(powerUp => {
        powerUp.chance = Math.min(powerUp.chance * 1.1, 0.3); // Cap at 30%
    });
    
    // Reset positions
    resetBallAndPaddle();
    initBricks();
    powerUps = [];
    gameRunning = true;
    draw();
}

// Move paddle
function movePaddle() {
    paddle.x += paddle.dx;
    
    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// Move ball
function moveBall(ball, index) {
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Wall collision
    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
    }
    
    if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }
    
    // Paddle collision
    if (ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width) {
        
        let hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPos - 0.5) * 8;
        ball.dy = -Math.abs(ball.dy);
    }
    
    // Ball out of bounds
    if (ball.y + ball.radius > canvas.height) {
        balls.splice(index, 1);
        
        // If no balls left, lose a life
        if (balls.length === 0) {
            lives--;
            updateLives();
            
            if (lives === 0) {
                gameOver();
            } else {
                resetBallAndPaddle();
            }
        }
    }
}

// Move all balls
function moveBalls() {
    for (let i = balls.length - 1; i >= 0; i--) {
        moveBall(balls[i], i);
    }
}

// Reset ball and paddle
function resetBallAndPaddle() {
    paddle.x = canvas.width / 2 - 60;
    balls = [createBall()];
    const baseSpeed = 4 + (level - 1) * 0.3;
    balls[0].dx = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
    balls[0].dy = -baseSpeed;
}

// Update score
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Update lives
function updateLives() {
    document.getElementById('lives').textContent = lives;
}

// Load high scores from localStorage
function loadHighScores() {
    const saved = localStorage.getItem('arkanoidHighScores');
    if (saved) {
        highScores = JSON.parse(saved);
    } else {
        highScores = [];
    }
}

// Save high scores to localStorage
function saveHighScores() {
    localStorage.setItem('arkanoidHighScores', JSON.stringify(highScores));
}

// Update high scores
function updateHighScores() {
    if (!playerName) return;
    
    highScores.push({
        name: playerName,
        score: score,
        level: level,
        date: new Date().toLocaleDateString('el-GR')
    });
    
    // Sort by score (highest first)
    highScores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10
    highScores = highScores.slice(0, 10);
    
    saveHighScores();
}

// Display high scores in modal
function displayHighScores() {
    const highScoresList = document.getElementById('highScoresList');
    if (!highScoresList) return;
    
    if (highScores.length === 0) {
        highScoresList.innerHTML = '<p style="color: #94a3b8;">Δεν υπάρχουν ακόμα high scores!</p>';
        return;
    }
    
    let html = '<div style="max-height: 300px; overflow-y: auto;">';
    highScores.forEach((entry, index) => {
        html += `
            <div style="display: flex; justify-content: space-between; padding: 10px; margin: 5px 0; background: rgba(59, 130, 246, 0.1); border-radius: 10px; border: 1px solid rgba(59, 130, 246, 0.3);">
                <span style="color: #3b82f6; font-weight: bold;">#${index + 1}</span>
                <span style="color: #fff;">${entry.name}</span>
                <span style="color: #fbbf24;">${entry.score} πόντοι</span>
                <span style="color: #94a3b8; font-size: 12px;">Lvl ${entry.level}</span>
            </div>
        `;
    });
    html += '</div>';
    
    highScoresList.innerHTML = html;
}

// Game over
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    updateHighScores();
    
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalLevel').textContent = level;
    
    displayHighScores();
    
    document.getElementById('gameOverModal').style.display = 'block';
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawPaddle();
    drawBalls();
    drawPowerUps();
    collisionDetection();
    
    if (gameRunning && !gamePaused) {
        movePaddle();
        moveBalls();
        movePowerUps();
        animationId = requestAnimationFrame(draw);
    }
}

// Keyboard controls
function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = -paddle.speed;
    } else if (e.key === 'Enter') {
        if (!gameRunning) {
            startGame();
        } else if (gameRunning) {
            pauseGame();
        }
    }
}

function keyUp(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right' || 
        e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = 0;
    }
}

// Mouse controls
function mouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    if (mouseX > 0 && mouseX < canvas.width) {
        paddle.x = mouseX - paddle.width / 2;
        
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > canvas.width) {
            paddle.x = canvas.width - paddle.width;
        }
    }
}

// Touch controls
function touchMove(e) {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    
    if (touchX > 0 && touchX < canvas.width) {
        paddle.x = touchX - paddle.width / 2;
        
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > canvas.width) {
            paddle.x = canvas.width - paddle.width;
        }
    }
    e.preventDefault();
}

// Start game
function startGame() {
    if (!gameRunning) {
        // Ask for player name if not set
        if (!playerName) {
            const name = prompt('Γράψε το όνομά σου για το High Score:');
            if (name && name.trim()) {
                playerName = name.trim();
            } else {
                playerName = 'Παίκτης';
            }
            document.getElementById('playerNameDisplay').textContent = playerName;
        }
        
        gameRunning = true;
        gamePaused = false;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        draw();
    }
}

// Pause game
function pauseGame() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        if (gamePaused) {
            document.getElementById('pauseBtn').textContent = '▶️ Συνέχεια';
            cancelAnimationFrame(animationId);
        } else {
            document.getElementById('pauseBtn').textContent = '⏸️ Παύση';
            draw();
        }
    }
}

// Restart game
function restartGame() {
    score = 0;
    lives = 3;
    level = 1;
    
    // Reset power-up chances to original values
    powerUpTypes[0].chance = 0.01; // Bomb - VERY RARE
    powerUpTypes[1].chance = 0.03; // Life - Rare
    powerUpTypes[2].chance = 0.05; // Multi ball - Medium
    powerUpTypes[3].chance = 0.06; // Bonus - Common
    powerUpTypes[4].chance = 0.04; // Skull - BAD
    
    updateScore();
    updateLives();
    document.getElementById('level').textContent = level;
    
    resetBallAndPaddle();
    initBricks();
    powerUps = [];
    
    document.getElementById('gameOverModal').style.display = 'none';
    document.getElementById('levelCompleteModal').style.display = 'none';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    gameRunning = false;
    gamePaused = false;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    draw();
}

// Event listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
canvas.addEventListener('mousemove', mouseMove);
canvas.addEventListener('touchmove', touchMove);

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', pauseGame);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);

// Initialize game
loadHighScores();
initBricks();
balls = [createBall()];
draw();
