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
            this.piercing = powerups.piercing; // Nível de perfuração (quantos inimigos pode atravessar)
            this.hitEnemies = [];
            this.maxPiercing = powerups.piercing; // Máximo de inimigos que pode atravessar
        } else {
            this.width = CONFIG.BULLET_WIDTH;
            this.height = CONFIG.BULLET_HEIGHT;
            this.speed = CONFIG.BULLET_SPEED;
            this.piercing = 0;
            this.maxPiercing = 0;
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
            
            // Mostra o nível de perfuração com anéis adicionais
            if (this.piercing > 1) {
                for (let i = 1; i < this.piercing && i < 5; i++) {
                    ctx.strokeStyle = `rgba(255, ${100 - i * 20}, ${100 - i * 20}, ${0.6 - i * 0.1})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, radius + 2 + i * 3, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }
    
    canHitEnemy(enemy) {
        if (this.piercing === 0) return true; // Sem perfuração, sempre pode acertar (mas bala some)
        
        // Com perfuração, verifica se já acertou este inimigo
        if (this.hitEnemies.includes(enemy)) return false;
        
        // Verifica se já atingiu o máximo de inimigos permitidos
        if (this.hitEnemies.length >= this.maxPiercing) return false;
        
        return true;
    }
    
    markEnemyHit(enemy) {
        if (this.piercing > 0) {
            this.hitEnemies.push(enemy);
            
            // Com piercing nível N, pode atravessar N inimigos e acertar mais 1
            // Exemplo: piercing 1 = atravessa 1 + acerta 1 = total 2 lobos
            if (this.hitEnemies.length > this.maxPiercing) {
                this.active = false;
            }
        } else {
            // Sem perfuração, bala desaparece no primeiro acerto
            this.active = false;
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
