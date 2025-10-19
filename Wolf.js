// Wolf.js - Classe do inimigo (Lobo)

class Wolf {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.WOLF_WIDTH;
        this.height = CONFIG.WOLF_HEIGHT;
        this.speed = CONFIG.WOLF_SPEED;
        this.health = CONFIG.WOLF_HEALTH;
        
        this.direction = 'dir'; // 'dir' ou 'esq'
        
        // Imagens
        this.images = {};
        this.imagesLoaded = false;
        this.loadImages();
        
        // Estado de IA melhorada
        this.isChasing = true; // Sempre persegue no estilo Vampire Survivors
        this.stuckTimer = 0;
        this.lastPosition = { x: this.x, y: this.y };
        this.unstuckDirection = null;
        this.unstuckTimer = 0;
        
        // Feedback visual de dano
        this.hitFlashTime = 0;
        this.hitFlashDuration = 150; // ms
    }
    
    loadImages() {
        const directions = ['dir', 'esq'];
        let loadedCount = 0;
        
        directions.forEach(dir => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === directions.length) {
                    this.imagesLoaded = true;
                }
            };
            img.onerror = () => {
                console.warn(`Erro ao carregar imagem: lobo${dir}.png`);
                loadedCount++;
                if (loadedCount === directions.length) {
                    this.imagesLoaded = true;
                }
            };
            img.src = CONFIG.ASSETS_PATH + `lobo${dir}.png`;
            this.images[dir] = img;
        });
    }
    
    update(deltaTime, player, obstacles = []) {
        // Atualiza timer de flash de dano
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= deltaTime;
        }
        
        // Calcula distância até o jogador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Verifica se está preso (não se moveu muito)
        const distMoved = Math.sqrt(
            Math.pow(this.x - this.lastPosition.x, 2) + 
            Math.pow(this.y - this.lastPosition.y, 2)
        );
        
        if (distMoved < 0.5 && distance > 50) {
            this.stuckTimer += deltaTime;
        } else {
            this.stuckTimer = 0;
        }
        
        this.lastPosition = { x: this.x, y: this.y };
        
        // Se está preso por muito tempo, tenta se desvencilhar
        if (this.stuckTimer > 500) {
            if (!this.unstuckDirection) {
                // Escolhe direção perpendicular aleatória
                const angle = Math.atan2(dy, dx) + (Math.random() > 0.5 ? Math.PI/2 : -Math.PI/2);
                this.unstuckDirection = {
                    x: Math.cos(angle),
                    y: Math.sin(angle)
                };
                this.unstuckTimer = 300; // Tenta por 300ms
            }
        }
        
        // Se está tentando se desvencilhar
        if (this.unstuckTimer > 0) {
            this.x += this.unstuckDirection.x * this.speed * 1.5;
            this.y += this.unstuckDirection.y * this.speed * 1.5;
            this.unstuckTimer -= deltaTime;
            
            if (this.unstuckTimer <= 0) {
                this.unstuckDirection = null;
                this.stuckTimer = 0;
            }
        } else {
            // Comportamento normal - sempre persegue (estilo Vampire Survivors)
            if (distance > 5) {
                this.isChasing = true;
                
                // Calcula direção para o jogador
                let dirX = dx / distance;
                let dirY = dy / distance;
                
                // Tenta evitar obstáculos com raycasting simples
                const checkAheadDist = 30;
                const futureX = this.x + dirX * checkAheadDist;
                const futureY = this.y + dirY * checkAheadDist;
                
                let blocked = false;
                for (let obstacle of obstacles) {
                    if (obstacle.isColliding && 
                        obstacle.isColliding({ 
                            x: futureX, 
                            y: futureY, 
                            width: this.width, 
                            height: this.height 
                        })) {
                        blocked = true;
                        break;
                    }
                }
                
                // Se detectar obstáculo à frente, tenta contornar
                if (blocked) {
                    // Tenta direções perpendiculares
                    const perpAngle = Math.atan2(dirY, dirX) + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
                    dirX = Math.cos(perpAngle);
                    dirY = Math.sin(perpAngle);
                }
                
                this.x += dirX * this.speed;
                this.y += dirY * this.speed;
                
                // Atualiza direção da sprite
                if (dirX > 0) {
                    this.direction = 'dir';
                } else if (dirX < 0) {
                    this.direction = 'esq';
                }
            }
        }
        
        // Limita aos bounds do mundo
        this.x = clamp(this.x, 0, CONFIG.WORLD_WIDTH - this.width);
        this.y = clamp(this.y, 0, CONFIG.WORLD_HEIGHT - this.height);
    }
    
    takeDamage() {
        this.health--;
        this.hitFlashTime = this.hitFlashDuration; // Ativa o flash de dano
        return this.health <= 0;
    }
    
    draw(ctx) {
        // Efeito de flash vermelho quando recebe dano
        if (this.hitFlashTime > 0) {
            ctx.save();
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 1.0;
        }
        
        if (this.imagesLoaded && this.images[this.direction] && this.images[this.direction].complete) {
            ctx.drawImage(this.images[this.direction], this.x, this.y, this.width, this.height);
        } else {
            // Fallback: desenha retângulo
            ctx.fillStyle = CONFIG.COLORS.WOLF;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Se está com flash de dano, desenha overlay vermelho
        if (this.hitFlashTime > 0) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
        
        // Debug: desenha hitbox
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
