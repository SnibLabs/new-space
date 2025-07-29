class Player {
    constructor(x, y) {
        this.width = 38;
        this.height = 28;
        this.x = x;
        this.y = y;
        this.speed = 5;
        this.cooldown = 0;
        this.color = "#3ae8ff";
        this.alive = true;
    }

    move(dx, dy, canvasWidth, canvasHeight) {
        this.x = clamp(this.x + dx * this.speed, 0, canvasWidth - this.width);
        this.y = clamp(this.y + dy * this.speed, 0, canvasHeight - this.height);
    }

    canShoot() {
        return this.cooldown <= 0;
    }

    shoot() {
        this.cooldown = 10;
        return new Bullet(this.x + this.width / 2 - 2, this.y - 12, -8, "#fff");
    }

    update() {
        if (this.cooldown > 0) this.cooldown--;
    }

    draw(ctx) {
        // Ship body
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.beginPath();
        ctx.moveTo(0, -this.height/2);
        ctx.lineTo(this.width/2, this.height/2);
        ctx.lineTo(0, this.height/4);
        ctx.lineTo(-this.width/2, this.height/2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.shadowColor = "#26f9ff";
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
        // Cockpit
        ctx.beginPath();
        ctx.arc(0, -this.height/4, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff9";
        ctx.fill();
        ctx.restore();
    }
}

class Enemy {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 34;
        this.height = 26;
        this.speed = speed;
        this.color = "#e04890";
        this.alive = true;
        this.cooldown = randInt(40, 120);
    }

    update() {
        this.y += this.speed;
        if (this.cooldown > 0) this.cooldown--;
    }

    canShoot() {
        return this.cooldown <= 0;
    }

    shoot() {
        this.cooldown = randInt(80, 160);
        return new Bullet(this.x + this.width / 2 - 2, this.y + this.height, 5, "#fd6");
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.beginPath();
        ctx.moveTo(-this.width/2, -this.height/4);
        ctx.lineTo(0, -this.height/2);
        ctx.lineTo(this.width/2, -this.height/4);
        ctx.lineTo(this.width/4, this.height/2);
        ctx.lineTo(-this.width/4, this.height/2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.shadowColor = "#f06";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, vy, color="#fff") {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 13;
        this.vy = vy;
        this.color = color;
    }

    update() {
        this.y += this.vy;
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    outOfBounds(h) {
        return this.y < -this.height || this.y > h + this.height;
    }
}

class Particle {
    // For explosion effects
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = randInt(2, 5);
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.life = randInt(18, 30);
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 1;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life/30);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}

class GameManager {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        // GAME STATE
        this.state = "MENU"; // MENU, PLAYING, GAMEOVER

        // Entities
        this.player = new Player(this.width/2 - 19, this.height - 60);
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];

        // Input
        this.keys = {};
        this.shootPressed = false;

        // Score
        this.score = 0;
        this.highScore = Number(localStorage.getItem("spaceShooterHighScore") || "0");

        // Bindings
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);

        this.spawnTimer = 0;
        this.level = 1;

        this.initInput();

        // Start rendering immediately
        this.render();
    }

    resetGame() {
        this.player = new Player(this.width/2 - 19, this.height - 60);
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.score = 0;
        this.level = 1;
        this.spawnTimer = 0;
    }

    initInput() {
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
        // For restart and menu
        this.canvas.addEventListener("click", (e) => {
            if (this.state === "MENU") {
                this.state = "PLAYING";
                this.resetGame();
            } else if (this.state === "GAMEOVER") {
                this.state = "MENU";
            }
        });
    }

    handleKeyDown(e) {
        if (this.state === "MENU" || this.state === "GAMEOVER") {
            if (e.code === "Space" || e.code === "Enter") {
                this.state = this.state === "MENU" ? "PLAYING" : "MENU";
                if (this.state === "PLAYING") this.resetGame();
            }
        }
        this.keys[e.code] = true;
    }

    handleKeyUp(e) {
        this.keys[e.code] = false;
    }

    playerInput() {
        let dx = 0, dy = 0;
        if (this.keys["ArrowLeft"] || this.keys["KeyA"]) dx -= 1;
        if (this.keys["ArrowRight"] || this.keys["KeyD"]) dx += 1;
        if (this.keys["ArrowUp"] || this.keys["KeyW"]) dy -= 1;
        if (this.keys["ArrowDown"] || this.keys["KeyS"]) dy += 1;
        this.player.move(dx, dy, this.width, this.height);

        // Shooting (Space or Z)
        let shootKey = this.keys["Space"] || this.keys["KeyZ"];
        if (shootKey && this.player.canShoot() && this.player.alive) {
            this.bullets.push(this.player.shoot());
        }
    }

    spawnEnemies() {
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            const n = clamp(1 + Math.floor(this.level/2), 1, 6);
            for (let i=0; i<n; i++) {
                let x = randInt(20, this.width-54);
                let y = -randInt(30, 80);
                let speed = 1.5 + this.level*0.15 + Math.random();
                this.enemies.push(new Enemy(x, y, speed));
            }
            this.spawnTimer = Math.max(60 - this.level*2, 20);
            this.level += 0.03;
        }
    }

    updateEntities() {
        // Player
        this.player.update();

        // Bullets
        for (let b of this.bullets) b.update();
        for (let b of this.enemyBullets) b.update();

        // Enemies
        for (let e of this.enemies) e.update();

        // Particles
        for (let p of this.particles) p.update();

        // Remove out-of-bounds bullets and dead enemies/particles
        this.bullets = this.bullets.filter(b => !b.outOfBounds(this.height));
        this.enemyBullets = this.enemyBullets.filter(b => !b.outOfBounds(this.height));
        this.enemies = this.enemies.filter(e => e.alive && e.y < this.height + 40);
        this.particles = this.particles.filter(p => p.life > 0);
    }

    enemyActions() {
        // Enemies shoot randomly
        for (let e of this.enemies) {
            if (e.canShoot() && Math.random() < 0.15) {
                this.enemyBullets.push(e.shoot());
            }
        }
    }

    checkCollisions() {
        // Player bullets vs enemies
        for (let b of this.bullets) for (let e of this.enemies) {
            if (e.alive && rectsOverlap(b, e)) {
                e.alive = false;
                this.score += 100;
                this.spawnExplosion(e.x + e.width/2, e.y + e.height/2, e.color);
            }
        }
        // Enemy bullets vs player
        if (this.player.alive) {
            for (let b of this.enemyBullets) {
                if (rectsOverlap(b, this.player)) {
                    this.player.alive = false;
                    this.spawnExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, "#fff");
                    setTimeout(()=>this.gameOver(), 850);
                }
            }
            // Enemy ships vs player
            for (let e of this.enemies) {
                if (e.alive && rectsOverlap(e, this.player)) {
                    this.player.alive = false;
                    this.spawnExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, "#fff");
                    setTimeout(()=>this.gameOver(), 850);
                }
            }
        }
    }

    spawnExplosion(x, y, color) {
        for (let i=0; i<22; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }

    gameOver() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem("spaceShooterHighScore", this.highScore);
        }
        this.state = "GAMEOVER";
    }

    drawBG() {
        // Starfield
        const ctx = this.ctx;
        ctx.save();
        for (let i=0; i<36; i++) {
            ctx.beginPath();
            let sx = ((i*73)%this.width + Math.sin(Date.now()*0.0007+i)*60)%this.width;
            let sy = ((i*211)%this.height + Date.now()*0.05*i)%this.height;
            ctx.arc(sx, sy, (i%3)+1, 0, Math.PI*2);
            ctx.fillStyle = ["#fff3","#fffb","#3ae8ff66","#e0489066"][i%4];
            ctx.fill();
        }
        ctx.restore();
    }

    drawEntities() {
        // Bullets
        for (let b of this.bullets) b.draw(this.ctx);
        for (let b of this.enemyBullets) b.draw(this.ctx);

        // Enemies
        for (let e of this.enemies) e.draw(this.ctx);

        // Player
        if (this.player.alive) this.player.draw(this.ctx);

        // Particles (explosions)
        for (let p of this.particles) p.draw(this.ctx);
    }

    drawUI() {
        const ctx = this.ctx;
        ctx.save();
        // Score
        ctx.font = "20px Segoe UI, Arial";
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#1cfeff";
        ctx.shadowBlur = 6;
        ctx.fillText("Score: " + this.score, 18, 32);
        ctx.fillText("High: " + this.highScore, this.width - 134, 32);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawMenu() {
        // Custom menu with CSS
        let menu = document.getElementById("mainMenu");
        if (!menu) {
            menu = document.createElement("div");
            menu.id = "mainMenu";
            menu.className = "menu";
            menu.innerHTML = `
                <h1>🚀 Space Shooter</h1>
                <p style="margin: 1em 0; font-size: 1.1em;">
                  <b>Arrow keys</b> or <b>WASD</b> to move<br>
                  <b>Space</b> or <b>Z</b> to shoot
                </p>
                <button id="startBtn">Start Game</button>
            `;
            document.body.appendChild(menu);
            document.getElementById("startBtn").onclick = ()=>{
                this.state = "PLAYING";
                this.resetGame();
                menu.remove();
            };
        }
    }

    removeMenu() {
        let menu = document.getElementById("mainMenu");
        if (menu) menu.remove();
    }

    drawGameOver() {
        let over = document.getElementById("gameOverMenu");
        if (!over) {
            over = document.createElement("div");
            over.id = "gameOverMenu";
            over.className = "menu";
            over.innerHTML = `
                <h2>Game Over</h2>
                <div style="font-size:1.2em; margin:1em 0;">Score: ${this.score}</div>
                <div style="margin-bottom:1em;">High Score: ${this.highScore}</div>
                <button id="retryBtn">Return to Menu</button>
            `;
            document.body.appendChild(over);
            document.getElementById("retryBtn").onclick = ()=>{
                this.state = "MENU";
                over.remove();
            };
        }
    }

    removeGameOver() {
        let over = document.getElementById("gameOverMenu");
        if (over) over.remove();
    }

    render() {
        // Main game loop
        requestAnimationFrame(() => this.render());

        // Clear
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBG();

        if (this.state === "MENU") {
            this.drawMenu();
            this.removeGameOver();
        } else if (this.state === "PLAYING") {
            this.removeMenu();
            this.removeGameOver();

            this.playerInput();
            this.spawnEnemies();
            this.enemyActions();
            this.updateEntities();
            this.checkCollisions();
            this.drawEntities();
            this.drawUI();
        } else if (this.state === "GAMEOVER") {
            this.drawEntities();
            this.drawUI();
            this.drawGameOver();
            this.removeMenu();
        }
    }
}

// Helper function for AABB collisions
function rectsOverlap(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x &&
           a.y < b.y + b.height && a.y + a.height > b.y;
}

function initGame() {
    // Setup canvas
    const w = 540, h = 720;
    const container = document.getElementById("gameContainer");
    let canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    new GameManager(canvas, ctx);
}

window.addEventListener('DOMContentLoaded', initGame);