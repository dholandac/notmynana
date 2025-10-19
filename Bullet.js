class Bullet {
    constructor(x, y, dirX, dirY, owner, powerups = null) {
        this.x = x;
        this.y = y;
        this.dirX = dirX;
        this.dirY = dirY;
        this.owner = owner;
        this.active = true;
        
        if (owner === 'player' && powerups) {
            this.width = CONFIG.BULLET_WIDTH * powerups.bulletSize;
            this.height = CONFIG.BULLET_HEIGHT * powerups.bulletSize;
            this.speed = CONFIG.BULLET_SPEED * powerups.bulletSpeed;
            this.piercing = powerups.piercing;
            this.hitEnemies = [];
        } else {
            this.width = CONFIG.BULLET_WIDTH;
            this.height = CONFIG.BULLET_HEIGHT;
            this.speed = CONFIG.BULLET_SPEED;
            this.piercing = false;
        }
        
        this.lifetime = CONFIG.BULLET_LIFETIME;
        this.active = true;
    }
    
    update(deltaTime) {
        this.x += this.dirX * this.speed;
        this.y += this.dirY * this.speed;
        
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.active = false;
        }
        
        if (this.x < 0 || this.x > CONFIG.WORLD_WIDTH ||
            this.y < 0 || this.y > CONFIG.WORLD_HEIGHT) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        const radius = Math.max(this.width, this.height) / 2;
        
        ctx.fillStyle = CONFIG.COLORS.BULLET;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x - radius * 0.3, this.y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.piercing) {
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, radius + 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    canHitEnemy(enemy) {
        if (!this.piercing) return true;
        return !this.hitEnemies.includes(enemy);
    }
    
    markEnemyHit(enemy) {
        if (this.piercing) {
            this.hitEnemies.push(enemy);
        }
    }
    
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }
}
