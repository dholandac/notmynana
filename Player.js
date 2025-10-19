// Player.js - Classe do jogador (Vovó)

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.speed = CONFIG.PLAYER_SPEED;
        this.lives = CONFIG.PLAYER_MAX_LIVES;
        
        // Powerups do jogador
        this.powerups = {
            fireRate: 1,      // Multiplicador (menor = mais rápido)
            bulletSpeed: 1,   // Multiplicador
            bulletSize: 1,    // Multiplicador
            moveSpeed: 1,     // Multiplicador
            piercing: false   // Boolean
        };
        
        this.vx = 0;
        this.vy = 0;
        this.direction = 'baixo'; // direção que a vovó está olhando
        this.lastDirection = 'baixo'; // última direção válida para atirar quando parado
        this.lastMoveWasHorizontalOnly = false; // rastreia se o último movimento foi só horizontal
        this.lastHorizontalDir = 0; // -1 para esquerda, 1 para direita, 0 para nenhum
        
        // Imagens
        this.images = {};
        this.imagesLoaded = false;
        this.loadImages();
        
        // Controles
        this.keys = {};
        this.setupControls();
        
        // Cooldown de tiro (ajustado por powerups)
        this.shootCooldown = 0;
        this.shootCooldownTime = CONFIG.PLAYER_SHOOT_COOLDOWN;
        
        // Invulnerabilidade temporária após levar dano
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.invulnerabilityDuration = 2000; // ms
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
        // Atualiza cooldown de tiro
        if (this.shootCooldown > 0) {
            this.shootCooldown -= deltaTime;
        }
        
        // Atualiza invulnerabilidade
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Verifica se está atirando
        if (this.keys[' ']) {
            return this.shoot(); // Retorna o bullet se criado
        }
        
        // Movimento
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
        
        // Normaliza velocidade diagonal
        if (this.vx !== 0 && this.vy !== 0) {
            this.vx *= 0.707; // 1/sqrt(2)
            this.vy *= 0.707;
        }
        
        // Atualiza direção
        if (moving) {
            if (vertical && horizontal) {
                this.direction = vertical + horizontal;
                this.lastDirection = this.direction; // Armazena última direção válida
                this.lastMoveWasHorizontalOnly = false;
            } else if (vertical) {
                this.direction = vertical;
                this.lastDirection = this.direction;
                this.lastMoveWasHorizontalOnly = false;
            } else if (horizontal) {
                // Se movendo só horizontalmente, mantém última direção vertical conhecida
                // mas armazena também a direção horizontal pura
                this.lastHorizontal = horizontal;
                this.lastMoveWasHorizontalOnly = true; // Marca que o último movimento foi só horizontal
                this.lastHorizontalDir = (horizontal === 'dir') ? 1 : -1; // Salva a direção horizontal
                
                if (this.direction.includes('cima') && !this.direction.includes('baixo')) {
                    this.direction = 'cima' + horizontal;
                } else if (this.direction.includes('baixo')) {
                    this.direction = 'baixo' + horizontal;
                } else {
                    // Se não tinha direção vertical, assume baixo como padrão
                    this.direction = 'baixo' + horizontal;
                }
                this.lastDirection = this.direction; // Armazena última direção válida
            }
        } else {
            // Quando parado, limpa movimento horizontal temporário
            this.lastHorizontal = null;
        }
        
        // Atualiza posição
        this.x += this.vx;
        this.y += this.vy;
        
        // Limita aos bounds do mundo
        this.x = clamp(this.x, 0, CONFIG.WORLD_WIDTH - this.width);
        this.y = clamp(this.y, 0, CONFIG.WORLD_HEIGHT - this.height);
        
        return null;
    }
    
    shoot() {
        if (this.shootCooldown <= 0) {
            this.shootCooldown = this.shootCooldownTime;
            
            // Calcula direção do tiro baseado no MOVIMENTO ATUAL (teclas pressionadas)
            let dirX = 0, dirY = 0;
            
            // Verifica as teclas pressionadas AGORA para determinar direção do tiro
            const movingUp = this.keys['w'] || this.keys['arrowup'];
            const movingDown = this.keys['s'] || this.keys['arrowdown'];
            const movingLeft = this.keys['a'] || this.keys['arrowleft'];
            const movingRight = this.keys['d'] || this.keys['arrowright'];
            
            // Determina direção baseado nas teclas
            if (movingUp && !movingDown) dirY = -1;
            if (movingDown && !movingUp) dirY = 1;
            if (movingLeft && !movingRight) dirX = -1;
            if (movingRight && !movingLeft) dirX = 1;
            
            // Se não está movendo, usa a última direção válida (direção da sprite)
            if (dirX === 0 && dirY === 0) {
                // Se o último movimento foi só horizontal, atira apenas na horizontal
                if (this.lastMoveWasHorizontalOnly) {
                    dirX = this.lastHorizontalDir; // -1 para esquerda, 1 para direita
                    dirY = 0; // Não atira na vertical
                } else {
                    // Caso contrário, usa a direção da sprite
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
                        // Default para baixo
                        dirY = 1;
                    }
                }
            }
            
            // Normaliza APENAS se for diagonal (ambos dirX e dirY são != 0)
            if (dirX !== 0 && dirY !== 0) {
                dirX *= 0.707;
                dirY *= 0.707;
            }
            // Se for horizontal ou vertical puro, mantém os valores 1 ou -1 sem normalizar
            
            const bullet = new Bullet(
                this.x + this.width / 2,
                this.y + this.height / 2,
                dirX,
                dirY,
                'player',
                this.powerups
            );
            
            return bullet;
        }
        return null;
    }
    
    applyPowerup(powerupType) {
        switch(powerupType) {
            case 'FIRE_RATE':
                this.powerups.fireRate *= 0.85; // Reduz tempo entre tiros (mais rápido)
                this.shootCooldownTime = CONFIG.PLAYER_SHOOT_COOLDOWN * this.powerups.fireRate;
                break;
            case 'BULLET_SPEED':
                this.powerups.bulletSpeed *= 1.15; // Aumenta velocidade da bala
                break;
            case 'BULLET_SIZE':
                this.powerups.bulletSize *= 1.2; // Aumenta tamanho da bala
                break;
            case 'MOVEMENT_SPEED':
                this.powerups.moveSpeed *= 1.1; // Aumenta velocidade de movimento
                this.speed = CONFIG.PLAYER_SPEED * this.powerups.moveSpeed;
                break;
            case 'PIERCING':
                this.powerups.piercing = true; // Ativa perfuração
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
            return true; // Indica que levou dano
        }
        return false;
    }
    
    draw(ctx) {
        // Efeito de piscar quando invulnerável
        if (this.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (this.imagesLoaded && this.images[this.direction] && this.images[this.direction].complete) {
            ctx.drawImage(this.images[this.direction], this.x, this.y, this.width, this.height);
        } else {
            // Fallback: desenha retângulo
            ctx.fillStyle = CONFIG.COLORS.PLAYER;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.globalAlpha = 1.0;
        
        // Debug: desenha hitbox
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}
