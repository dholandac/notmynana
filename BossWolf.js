// BossWolf.js - Classe do Boss (Lobo Chefe)

class BossWolf {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.BOSS_WIDTH;
        this.height = CONFIG.BOSS_HEIGHT;
        this.speed = CONFIG.BOSS_SPEED;
        this.health = CONFIG.BOSS_HEALTH;
        this.maxHealth = CONFIG.BOSS_HEALTH;
        this.isBoss = true; // Flag para identificar que é um boss
        
        this.direction = 'dir'; // 'dir' ou 'esq'
        
        // Animação de morte
        this.dying = false;
        this.deathTimer = 0;
        this.deathDuration = 1000; // Boss tem animação de morte mais longa
        this.deathVelocityX = 0;
        this.deathVelocityY = 0;
        this.deathRotation = 0;
        this.deathRotationSpeed = 0;
        
        // Imagens (usa os mesmos assets do lobo normal)
        this.images = {};
        this.imagesLoaded = false;
        this.loadImages();
        
        // Estado de IA melhorada
        this.isChasing = true;
        this.stuckTimer = 0;
        this.lastPosition = { x: this.x, y: this.y };
        this.unstuckDirection = null;
        this.unstuckTimer = 0;
        
        // Feedback visual de dano
        this.hitFlashTime = 0;
        this.hitFlashDuration = 150; // ms
        
        // Sistema de partículas de movimento
        this.movementParticleTimer = 0;
        this.movementParticleRate = 80; // Cria partículas a cada 80ms
        
        // Destruição de árvores
        this.treeDestructionCooldown = 0;
        this.treeDestructionRate = 100; // ms entre destruições
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
    
    update(deltaTime, player, obstacles = [], onTreeDestroy) {
        // Se está morrendo, atualiza animação de morte
        if (this.dying) {
            this.deathTimer += deltaTime;
            
            // Movimento de arremesso para trás
            this.x += this.deathVelocityX;
            this.y += this.deathVelocityY;
            
            // Desacelera gradualmente
            this.deathVelocityX *= 0.95;
            this.deathVelocityY *= 0.95;
            
            // Rotação
            this.deathRotation += this.deathRotationSpeed;
            
            // Quando a animação termina, marca para remoção
            if (this.deathTimer >= this.deathDuration) {
                this.health = -1; // Garante que será removido
            }
            return; // Não atualiza movimento normal
        }
        
        // Atualiza timer de flash de dano
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= deltaTime;
        }
        
        // Atualiza timer de partículas de movimento
        if (this.movementParticleTimer > 0) {
            this.movementParticleTimer -= deltaTime;
        }
        
        // Atualiza cooldown de destruição de árvores
        if (this.treeDestructionCooldown > 0) {
            this.treeDestructionCooldown -= deltaTime;
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
            // Comportamento normal - sempre persegue
            if (distance > 5) {
                this.isChasing = true;
                
                // Calcula direção para o jogador
                let dirX = dx / distance;
                let dirY = dy / distance;
                
                // Boss destrói árvores ao passar por elas!
                if (this.treeDestructionCooldown <= 0 && onTreeDestroy) {
                    for (let obstacle of obstacles) {
                        if (obstacle.constructor.name === 'Tree' && obstacle.active) {
                            // Verifica se o boss está colidindo com a árvore
                            if (checkCollision(this, obstacle)) {
                                // Destrói a árvore
                                onTreeDestroy(obstacle);
                                this.treeDestructionCooldown = this.treeDestructionRate;
                                break; // Uma árvore por vez
                            }
                        }
                    }
                }
                
                // Boss não se importa com obstáculos, apenas passa reto
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
        
        // Cria partículas de movimento se está se movendo
        if (distance > 5 && this.movementParticleTimer <= 0) {
            this.movementParticleTimer = this.movementParticleRate;
            return this.createFootParticles();
        }
        
        return [];
    }
    
    createFootParticles() {
        // Cria mais partículas para o boss (é maior)
        const footX = this.x + this.width / 2;
        const footY = this.y + this.height - 5;
        const particles1 = createMovementParticles(footX - 10, footY, CONFIG.COLORS.GROUND);
        const particles2 = createMovementParticles(footX + 10, footY, CONFIG.COLORS.GROUND);
        return [...particles1, ...particles2];
    }
    
    takeDamage() {
        this.health--;
        this.hitFlashTime = this.hitFlashDuration; // Ativa o flash de dano
        
        // Se morreu, inicia animação de morte
        if (this.health <= 0) {
            this.dying = true;
            this.deathTimer = 0;
            
            // Calcula direção oposta ao centro (efeito de arremesso)
            const angle = Math.random() * Math.PI * 2; // Direção aleatória
            const force = 4 + Math.random() * 3; // Força maior para o boss
            
            this.deathVelocityX = Math.cos(angle) * force;
            this.deathVelocityY = Math.sin(angle) * force;
            
            // Rotação aleatória
            this.deathRotationSpeed = (Math.random() - 0.5) * 0.2;
            
            return true;
        }
        
        return false;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Se está morrendo, aplica transformações de morte
        if (this.dying) {
            const progress = this.deathTimer / this.deathDuration;
            
            // Translada para o centro do boss para rotacionar
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.deathRotation);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
            
            // Fade out
            ctx.globalAlpha = 1 - progress;
        }
        
        // Efeito de brilho vermelho para indicar que é boss
        if (!this.dying) {
            ctx.shadowColor = 'darkred';
            ctx.shadowBlur = 20;
        }
        
        // Efeito de flash vermelho quando recebe dano
        if (this.hitFlashTime > 0 && !this.dying) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 25;
        }
        
        if (this.imagesLoaded && this.images[this.direction] && this.images[this.direction].complete) {
            ctx.drawImage(this.images[this.direction], this.x, this.y, this.width, this.height);
        } else {
            // Fallback: desenha retângulo maior e mais escuro
            ctx.fillStyle = '#5a3a1a'; // Marrom mais escuro para boss
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        // Se está com flash de dano, desenha overlay vermelho
        if (this.hitFlashTime > 0 && !this.dying) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        ctx.restore();
    }
}
