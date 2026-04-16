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

// Paddle (spaceship)
const paddle = {
    x: canvas.width / 2 - 60,
    y: canvas.height - 40,
    width: 120,
    height: 20,
    speed: 8,
    dx: 0
};

// Ball
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 8,
    speed: 4,
    dx: 4,
    dy: -4
};

// Bricks (asteroids)
const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 80;
const brickHeight = 30;
const brickPadding = 10;
const brickOffsetTop = 60;
const brickOffsetLeft = 45;

let bricks = [];

// Brick colors (space themed)
const brickColors = [
    { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.5)' },  // Pink
    { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.5)' },  // Purple
    { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.5)' },  // Blue
    { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },  // Green
    { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' }   // Orange
];

// Initialize bricks
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            const colorIndex = r % brickColors.length;
            bricks[c][r] = {
                x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                y: r * (brickHeight + brickPadding) + brickOffsetTop,
                status: 1,
                color: brickColors[colorIndex]
            };
        }
    }
}

// Draw paddle (spaceship)
function drawPaddle() {
    // Spaceship body
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
function drawBall() {
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#3b82f6';
    
    // Outer glow
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.5, '#3b82f6');
    gradient.addColorStop(1, '#1e40af');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner core
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius / 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
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
                
                // Asteroid shape
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
                
                // Highlight
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(brick.x + 5, brick.y + 5, brickWidth - 10, 5);
                
                ctx.restore();
            }
        }
    }
}

// Draw stars effect
function drawStars() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
}

// Collision detection
function collisionDetection() {
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
                    
                    // Check if level complete
                    if (checkLevelComplete()) {
                        levelComplete();
                    }
                }
            }
        }
    }
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
    
    // Increase difficulty
    ball.speed += 0.5;
    
    // Reset positions
    resetBallAndPaddle();
    initBricks();
    gameRunning = true;
    draw();
}

// Move paddle
function movePaddle() {
    paddle.x += paddle.dx;
    
    // Wall detection
    if (paddle.x < 0) {
        paddle.x = 0;
    }
    if (paddle.x + paddle.width > canvas.width) {
        paddle.x = canvas.width - paddle.width;
    }
}

// Move ball
function moveBall() {
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
        
        // Add some angle based on where it hits the paddle
        let hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPos - 0.5) * 8;
        ball.dy = -Math.abs(ball.dy);
    }
    
    // Ball out of bounds
    if (ball.y + ball.radius > canvas.height) {
        lives--;
        updateLives();
        
        if (lives === 0) {
            gameOver();
        } else {
            resetBallAndPaddle();
        }
    }
}

// Reset ball and paddle
function resetBallAndPaddle() {
    paddle.x = canvas.width / 2 - 60;
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 60;
    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = -4;
}

// Update score
function updateScore() {
    document.getElementById('score').textContent = score;
}

// Update lives
function updateLives() {
    document.getElementById('lives').textContent = lives;
}

// Game over
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverModal').style.display = 'block';
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBricks();
    drawPaddle();
    drawBall();
    collisionDetection();
    
    if (gameRunning && !gamePaused) {
        movePaddle();
        moveBall();
        animationId = requestAnimationFrame(draw);
    }
}

// Keyboard controls
function keyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'Right') {
        paddle.dx = paddle.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
        paddle.dx = -paddle.speed;
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
    ball.speed = 4;
    
    updateScore();
    updateLives();
    document.getElementById('level').textContent = level;
    
    resetBallAndPaddle();
    initBricks();
    
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
initBricks();
draw();
