class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.speed = CONFIG.PLAYER_SPEED;
        this.lives = CONFIG.PLAYER_MAX_LIVES;
        
        this.powerups = {
            fireRate: 1,
            bulletSpeed: 1,
            bulletSize: 1,
            moveSpeed: 1,
            piercing: false
        };
        
        this.vx = 0;
        this.vy = 0;
        this.direction = 'baixo';
        this.lastDirection = 'baixo';
        this.lastMoveWasHorizontalOnly = false;
        this.lastHorizontalDir = 0;
        
        this.images = {};
        this.imagesLoaded = false;
        this.loadImages();
        
        this.keys = {};
        this.setupControls();
        
        this.shootCooldown = 0;
        this.shootCooldownTime = CONFIG.PLAYER_SHOOT_COOLDOWN;
        
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.invulnerabilityDuration = 2000;
        
        // Sistema de partículas de movimento
        this.movementParticleTimer = 0;
        this.movementParticleRate = 100; // Cria partículas a cada 100ms quando se move
    }
    
    loadImages() {
        const directions = ['cima', 'baixo', 'cimadir', 'cimaesq', 'baixodir', 'baixoesq'];
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
                console.warn(`Erro ao carregar imagem: velha${dir}.png`);
                loadedCount++;
                if (loadedCount === directions.length) {
                    this.imagesLoaded = true;
                }
            };
            img.src = CONFIG.ASSETS_PATH + `velha${dir}.png`;
            this.images[dir] = img;
        });
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    update(deltaTime) {
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Atualiza timer de partículas de movimento
        if (this.movementParticleTimer > 0) {
            this.movementParticleTimer -= deltaTime;
        }
        
        if (this.keys[' ']) {
            return this.shoot();
        }
        
        this.vx = 0;
        this.vy = 0;
        
        let moving = false;
        let horizontal = '';
        let vertical = '';
        
        if (this.keys['w'] || this.keys['arrowup']) {
            this.vy = -this.speed;
            vertical = 'cima';
            moving = true;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.vy = this.speed;
            vertical = 'baixo';
            moving = true;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.vx = -this.speed;
            horizontal = 'esq';
            moving = true;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.vx = this.speed;
            horizontal = 'dir';
            moving = true;
        }
        
        if (this.vx !== 0 && this.vy !== 0) {
            this.vx *= 0.707;
            this.vy *= 0.707;
        }
        
        if (moving) {
            if (vertical && horizontal) {
                this.direction = vertical + horizontal;
                this.lastDirection = this.direction;
                this.lastMoveWasHorizontalOnly = false;
            } else if (vertical) {
                this.direction = vertical;
                this.lastDirection = this.direction;
                this.lastMoveWasHorizontalOnly = false;
            } else if (horizontal) {
                this.lastHorizontal = horizontal;
                this.lastMoveWasHorizontalOnly = true;
                this.lastHorizontalDir = (horizontal === 'dir') ? 1 : -1;
                
                if (this.direction.includes('cima') && !this.direction.includes('baixo')) {
                    this.direction = 'cima' + horizontal;
                } else if (this.direction.includes('baixo')) {
                    this.direction = 'baixo' + horizontal;
                } else {
                    this.direction = 'baixo' + horizontal;
                }
                this.lastDirection = this.direction;
            }
        } else {
            this.lastHorizontal = null;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.x = clamp(this.x, 0, CONFIG.WORLD_WIDTH - this.width);
        this.y = clamp(this.y, 0, CONFIG.WORLD_HEIGHT - this.height);
        
        // Retorna array de partículas se está se movendo e é hora de criar
        if (moving && this.movementParticleTimer <= 0) {
            this.movementParticleTimer = this.movementParticleRate;
            // Retorna objeto com bullet e particles
            return { bullet: null, particles: this.createFootParticles() };
        }
        
        return { bullet: null, particles: [] };
    }
    
    createFootParticles() {
        // Cria partículas nos pés do personagem
        const footX = this.x + this.width / 2;
        const footY = this.y + this.height - 5; // Perto da base
        return createMovementParticles(footX, footY, CONFIG.COLORS.GROUND);
    }
    
    shoot() {
        if (this.shootCooldown <= 0) {
            this.shootCooldown = this.shootCooldownTime;
            
            let dirX = 0, dirY = 0;
            
            const movingUp = this.keys['w'] || this.keys['arrowup'];
            const movingDown = this.keys['s'] || this.keys['arrowdown'];
            const movingLeft = this.keys['a'] || this.keys['arrowleft'];
            const movingRight = this.keys['d'] || this.keys['arrowright'];
            
            if (movingUp && !movingDown) dirY = -1;
            if (movingDown && !movingUp) dirY = 1;
            if (movingLeft && !movingRight) dirX = -1;
            if (movingRight && !movingLeft) dirX = 1;
            
            if (dirX === 0 && dirY === 0) {
                if (this.lastMoveWasHorizontalOnly) {
                    dirX = this.lastHorizontalDir;
                    dirY = 0;
                } else {
                    const lastDir = this.lastDirection;
                    
                    if (lastDir === 'cimadir') {
                        dirX = 1;
                        dirY = -1;
                    } else if (lastDir === 'cimaesq') {
                        dirX = -1;
                        dirY = -1;
                    } else if (lastDir === 'baixodir') {
                        dirX = 1;
                        dirY = 1;
                    } else if (lastDir === 'baixoesq') {
                        dirX = -1;
                        dirY = 1;
                    } else if (lastDir === 'cima') {
                        dirY = -1;
                    } else if (lastDir === 'baixo') {
                        dirY = 1;
                    } else {
                        dirY = 1;
                    }
                }
            }
            
            if (dirX !== 0 && dirY !== 0) {
                dirX *= 0.707;
                dirY *= 0.707;
            }
            
            const bullet = new Bullet(
                this.x + this.width / 2,
                this.y + this.height / 2,
                dirX,
                dirY,
                'player',
                this.powerups
            );
            
            return { bullet: bullet, particles: [] };
        }
        return { bullet: null, particles: [] };
    }
    
    applyPowerup(powerupType) {
        switch(powerupType) {
            case 'FIRE_RATE':
                this.powerups.fireRate *= 0.85;
                this.shootCooldownTime = CONFIG.PLAYER_SHOOT_COOLDOWN * this.powerups.fireRate;
                break;
            case 'BULLET_SPEED':
                this.powerups.bulletSpeed *= 1.15;
                break;
            case 'BULLET_SIZE':
                this.powerups.bulletSize *= 1.2;
                break;
            case 'MOVEMENT_SPEED':
                this.powerups.moveSpeed *= 1.1;
                this.speed = CONFIG.PLAYER_SPEED * this.powerups.moveSpeed;
                break;
            case 'PIERCING':
                this.powerups.piercing = true;
                break;
            default:
                console.warn('Powerup desconhecido:', powerupType);
        }
    }
    
    takeDamage() {
        if (!this.invulnerable) {
            this.lives--;
            this.invulnerable = true;
            this.invulnerabilityTime = this.invulnerabilityDuration;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (this.imagesLoaded && this.images[this.direction] && this.images[this.direction].complete) {
            ctx.drawImage(this.images[this.direction], this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = CONFIG.COLORS.PLAYER;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.globalAlpha = 1.0;
    }
}
