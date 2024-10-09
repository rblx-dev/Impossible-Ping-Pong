const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.getElementById('scoreBoard');

const paddleWidth = 10;
const paddleHeight = 100;
const ballSize = 10;

let playerY = canvas.height / 2 - paddleHeight / 2;
let computerY = canvas.height / 2 - paddleHeight / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballVelocityX = 5;
let ballVelocityY = 3;

const minSpeed = 5;
const speedIncrease = 0.2;
const maxSpeed = 15;
const randomBounceChance = 0.3;
const maxRandomAngle = Math.PI / 4;

let playerScore = 0;
let computerScore = 0;

const paddleHitSound = document.getElementById('paddleHitSound');
const wallHitSound = document.getElementById('wallHitSound');
const scoreSound = document.getElementById('scoreSound');
const gameOverSound = document.getElementById('gameOverSound');

// Computer AI variables
let computerTargetY = computerY;
const computerSpeed = 60; // Adjust this value to change the computer's responsiveness

function playSound(audio) {
    audio.currentTime = 0;
    audio.play();
}

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();
}

function updateScore() {
    scoreBoard.textContent = `Player: ${playerScore} | Computer: ${computerScore}`;
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    const angle = (Math.random() - 0.5) * Math.PI / 2; // Random angle between -45 and 45 degrees
    ballVelocityX = Math.cos(angle) * minSpeed * (Math.random() > 0.5 ? 1 : -1);
    ballVelocityY = Math.sin(angle) * minSpeed;
}

function applyRandomBounce() {
    const currentSpeed = Math.sqrt(ballVelocityX * ballVelocityX + ballVelocityY * ballVelocityY);
    const randomAngle = (Math.random() - 0.5) * 2 * maxRandomAngle;
    ballVelocityX = Math.cos(randomAngle) * currentSpeed * Math.sign(ballVelocityX);
    ballVelocityY = Math.sin(randomAngle) * currentSpeed;
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function updateComputerPaddle() {
    // Update target position
    computerTargetY = ballY - paddleHeight / 2;

    // Clamp target position to keep it on screen
    computerTargetY = Math.max(0, Math.min(canvas.height - paddleHeight, computerTargetY));

    // Calculate the distance to the target
    const diff = computerTargetY - computerY;

    // Apply easing to the movement
    const easedDiff = diff * easeOutCubic(computerSpeed);

    // Move towards target position
    computerY += easedDiff;

    // Ensure the paddle stays within the canvas bounds
    computerY = Math.max(0, Math.min(canvas.height - paddleHeight, computerY));
}

function updateGame() {
    updateComputerPaddle();

    // Ensure minimum speed
    const currentSpeed = Math.sqrt(ballVelocityX * ballVelocityX + ballVelocityY * ballVelocityY);
    if (currentSpeed < minSpeed) {
        const factor = minSpeed / currentSpeed;
        ballVelocityX *= factor;
        ballVelocityY *= factor;
    }

    // Move the ball
    ballX += ballVelocityX;
    ballY += ballVelocityY;

    // Ball collision with top and bottom walls
    if (ballY < ballSize / 2 || ballY > canvas.height - ballSize / 2) {
        ballVelocityY = -ballVelocityY;
        ballY = ballY < ballSize / 2 ? ballSize / 2 : canvas.height - ballSize / 2;
        
        playSound(wallHitSound);
        
        if (Math.random() < randomBounceChance) {
            applyRandomBounce();
        }
    }

    // Ball collision with paddles
    if (
        (ballX - ballSize / 2 < paddleWidth && ballY > playerY && ballY < playerY + paddleHeight) ||
        (ballX + ballSize / 2 > canvas.width - paddleWidth && ballY > computerY && ballY < computerY + paddleHeight)
    ) {
        const paddle = ballX < canvas.width / 2 ? playerY : computerY;
        const relativeIntersectY = (paddle + paddleHeight / 2) - ballY;
        const normalizedRelativeIntersectionY = relativeIntersectY / (paddleHeight / 2);
        const bounceAngle = normalizedRelativeIntersectionY * (Math.PI / 4);

        let speed = Math.sqrt(ballVelocityX * ballVelocityX + ballVelocityY * ballVelocityY);
        speed = Math.min(speed + speedIncrease, maxSpeed);

        ballVelocityX = speed * Math.cos(bounceAngle);
        ballVelocityY = speed * -Math.sin(bounceAngle);

        if (ballX < canvas.width / 2) {
            ballVelocityX = Math.abs(ballVelocityX);
            ballX = paddleWidth + ballSize / 2;
        } else {
            ballVelocityX = -Math.abs(ballVelocityX);
            ballX = canvas.width - paddleWidth - ballSize / 2;
        }

        playSound(paddleHitSound);

        if (Math.random() < randomBounceChance) {
            applyRandomBounce();
        }
    }

    // Score points
    if (ballX < 0) {
        computerScore++;
        playSound(scoreSound);
        resetBall();
    } else if (ballX > canvas.width) {
        // Ensure the computer always wins
        if (computerScore < 9) {
            computerScore++;
        } else {
            playerScore++;
        }
        playSound(scoreSound);
        resetBall();
    }

    // Check for game over
    if (playerScore === 10 || computerScore === 10) {
        const winner = "Computer"; // Computer always wins
        playSound(gameOverSound);
        setTimeout(() => {
            alert(`Game Over! ${winner} wins!`);
            playerScore = 0;
            computerScore = 0;
        }, 100);
    }

    updateScore();
}

function drawGame() {
    // Clear the canvas
    drawRect(0, 0, canvas.width, canvas.height, '#222');

    // Draw paddles
    drawRect(0, playerY, paddleWidth, paddleHeight, '#00ff00');
    drawRect(canvas.width - paddleWidth, computerY, paddleWidth, paddleHeight, '#ff0000');

    // Draw the ball
    drawCircle(ballX, ballY, ballSize, '#ffff00');

    // Draw the net
    for (let i = 0; i < canvas.height; i += 40) {
        drawRect(canvas.width / 2 - 1, i, 2, 20, '#fff');
    }
}

function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = event.clientY - rect.top;
    playerY = mouseY - paddleHeight / 2;

    // Keep the paddle within the canvas
    if (playerY < 0) {
        playerY = 0;
    } else if (playerY > canvas.height - paddleHeight) {
        playerY = canvas.height - paddleHeight;
    }
});

gameLoop();