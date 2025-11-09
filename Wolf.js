// Wolf.js - Classe do inimigo (Lobo)

class Wolf {
    constructor(x, y, isMinionBoss = false) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.WOLF_WIDTH;
        this.height = CONFIG.WOLF_HEIGHT;
        this.speed = CONFIG.WOLF_SPEED;
        this.health = CONFIG.WOLF_HEALTH;
        this.isMinionBoss = isMinionBoss; // Flag para lobos capangas do boss
        
        this.direction = 'dir'; // 'dir' ou 'esq'
        
        // Animação de morte
        this.dying = false;
        this.deathTimer = 0;
        this.deathDuration = 600; // 600ms de animação
        this.deathVelocityX = 0;
        this.deathVelocityY = 0;
        this.deathRotation = 0;
        this.deathRotationSpeed = 0;
        
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
        
        // Controle de mudança de direção do sprite
        this.directionChangeTimer = 0;
        this.directionChangeCooldown = 200; // 200ms entre mudanças de direção
        
        // Sistema de partículas de movimento
        this.movementParticleTimer = 0;
        this.movementParticleRate = 120; // Cria partículas a cada 120ms quando se move
        
        // Feedback visual de dano
        this.hitFlashTime = 0;
        this.hitFlashDuration = 150; // ms
        
        // Sistema de pulinhos ao andar
        this.bounceTimer = 0;
        this.bounceSpeed = 12; // Velocidade do pulo (quanto maior, mais rápido)
        this.bounceHeight = 6; // Altura do pulo em pixels
        this.bounceOffset = 0; // Offset vertical atual
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
        
        // Atualiza timer de mudança de direção
        if (this.directionChangeTimer > 0) {
            this.directionChangeTimer -= deltaTime;
        }
        
        // Atualiza timer de partículas de movimento
        if (this.movementParticleTimer > 0) {
            this.movementParticleTimer -= deltaTime;
        }
        
        // Atualiza animação de pulinhos (sempre está andando/pulando quando está vivo)
        this.bounceTimer += deltaTime / 1000; // Converte para segundos
        this.bounceOffset = Math.abs(Math.sin(this.bounceTimer * this.bounceSpeed)) * this.bounceHeight;
        
        // Calcula distância até o jogador
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Inicializa lastPosition se não existir
        if (!this.lastPosition) {
            this.lastPosition = { x: this.x, y: this.y };
        }
        
        // Sistema de detecção de travamento
        const distMoved = Math.sqrt(
            Math.pow(this.x - this.lastPosition.x, 2) + 
            Math.pow(this.y - this.lastPosition.y, 2)
        );
        
        if (distMoved < 0.3 && distance > 50) {
            this.stuckTimer += deltaTime;
        } else {
            this.stuckTimer = 0;
        }
        
        this.lastPosition = { x: this.x, y: this.y };
        
        // Se está preso, força movimento em direção aleatória
        if (this.stuckTimer > 400) {
            if (!this.unstuckDirection) {
                const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI;
                this.unstuckDirection = {
                    x: Math.cos(angle),
                    y: Math.sin(angle)
                };
                this.unstuckTimer = 500;
            }
        }
        
        // Se está em modo de desvio forçado
        if (this.unstuckTimer > 0 && this.unstuckDirection) {
            this.x += this.unstuckDirection.x * this.speed * 2;
            this.y += this.unstuckDirection.y * this.speed * 2;
            this.unstuckTimer -= deltaTime;
            
            if (this.unstuckTimer <= 0) {
                this.unstuckDirection = null;
                this.stuckTimer = 0;
            }
            
            // Atualiza direção da sprite apenas se passou o tempo do cooldown
            if (this.directionChangeTimer <= 0 && this.unstuckDirection) {
                const newDirection = this.unstuckDirection.x > 0 ? 'dir' : (this.unstuckDirection.x < 0 ? 'esq' : this.direction);
                if (newDirection !== this.direction) {
                    this.direction = newDirection;
                    this.directionChangeTimer = this.directionChangeCooldown;
                }
            }
            
            return; // Pula o pathfinding normal
        }
        
        // Comportamento normal - sempre persegue
        if (distance > 5) {
            this.isChasing = true;
            
            // Calcula direção base para o jogador
            let dirX = dx / distance;
            let dirY = dy / distance;
            
            // Sistema de pathfinding - verifica múltiplas distâncias à frente
            const checkDistances = [35, 50]; // Reduzido para 2 verificações mais rápidas
            let bestDirection = null;
            let foundPath = false;
            
            // Primeiro tenta ir direto
            let directPathClear = true;
            for (let checkDist of checkDistances) {
                const futureX = this.x + dirX * checkDist;
                const futureY = this.y + dirY * checkDist;
                
                for (let obstacle of obstacles) {
                    if (obstacle.isColliding && 
                        obstacle.isColliding({ 
                            x: futureX, 
                            y: futureY, 
                            width: this.width, 
                            height: this.height 
                        })) {
                        directPathClear = false;
                        break;
                    }
                }
                if (!directPathClear) break;
            }
            
            // Se caminho direto está livre, vai direto
            if (directPathClear) {
                bestDirection = { x: dirX, y: dirY };
                foundPath = true;
            } else {
                // Testa múltiplas direções ao redor do obstáculo
                const baseAngle = Math.atan2(dirY, dirX);
                const testAngles = [
                    Math.PI / 3,    // 60° direita
                    -Math.PI / 3,   // 60° esquerda
                    Math.PI / 2,    // 90° direita
                    -Math.PI / 2,   // 90° esquerda
                    Math.PI / 1.5,  // 120° direita
                    -Math.PI / 1.5, // 120° esquerda
                    Math.PI / 4,    // 45° direita
                    -Math.PI / 4    // 45° esquerda
                ];
                
                for (let angleOffset of testAngles) {
                    const testAngle = baseAngle + angleOffset;
                    const testDirX = Math.cos(testAngle);
                    const testDirY = Math.sin(testAngle);
                    
                    // Verifica se esta direção está livre
                    let pathClear = true;
                    for (let checkDist of checkDistances) {
                        const futureX = this.x + testDirX * checkDist;
                        const futureY = this.y + testDirY * checkDist;
                        
                        for (let obstacle of obstacles) {
                            if (obstacle.isColliding && 
                                obstacle.isColliding({ 
                                    x: futureX, 
                                    y: futureY, 
                                    width: this.width, 
                                    height: this.height 
                                })) {
                                pathClear = false;
                                break;
                            }
                        }
                        if (!pathClear) break;
                    }
                    
                    // Se encontrou um caminho livre, usa essa direção
                    if (pathClear) {
                        bestDirection = { x: testDirX, y: testDirY };
                        foundPath = true;
                        break;
                    }
                }
            }
            
            // Se encontrou uma direção válida, move nela
            if (foundPath && bestDirection) {
                dirX = bestDirection.x;
                dirY = bestDirection.y;
            } else {
                // Se nenhuma direção está livre, tenta se mover para os lados
                const baseAngle = Math.atan2(dirY, dirX);
                const sideAngle = baseAngle + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
                dirX = Math.cos(sideAngle);
                dirY = Math.sin(sideAngle);
            }
            
            this.x += dirX * this.speed;
            this.y += dirY * this.speed;
            
            // Atualiza direção da sprite apenas se passou o tempo do cooldown
            if (this.directionChangeTimer <= 0) {
                const newDirection = dirX > 0 ? 'dir' : (dirX < 0 ? 'esq' : this.direction);
                if (newDirection !== this.direction) {
                    this.direction = newDirection;
                    this.directionChangeTimer = this.directionChangeCooldown;
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
        // Cria partículas nos pés do lobo
        const footX = this.x + this.width / 2;
        const footY = this.y + this.height - 5; // Perto da base
        return createMovementParticles(footX, footY, CONFIG.COLORS.GROUND);
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
            const force = 3 + Math.random() * 2; // Força aleatória
            
            this.deathVelocityX = Math.cos(angle) * force;
            this.deathVelocityY = Math.sin(angle) * force;
            
            // Rotação aleatória
            this.deathRotationSpeed = (Math.random() - 0.5) * 0.3; // Rotação para esquerda ou direita
            
            return true;
        }
        
        return false;
    }
    
    draw(ctx) {
        ctx.save();
        
        // Desenha aura vermelha para lobos capangas do boss
        if (this.isMinionBoss && !this.dying) {
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.2; // Pulsa
            ctx.strokeRect(this.x - 2, this.y - this.bounceOffset - 2, this.width + 4, this.height + 4);
            ctx.globalAlpha = 1.0;
        }
        
        // Se está morrendo, aplica transformações de morte
        if (this.dying) {
            const progress = this.deathTimer / this.deathDuration;
            
            // Translada para o centro do lobo para rotacionar
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.deathRotation);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
            
            // Fade out
            ctx.globalAlpha = 1 - progress;
        }
        
        // Efeito de flash vermelho quando recebe dano
        if (this.hitFlashTime > 0 && !this.dying) {
            ctx.shadowColor = 'red';
            ctx.shadowBlur = 15;
        }
        
        // Aplica o offset de pulinhos (somente se não está morrendo)
        const drawY = this.dying ? this.y : this.y - this.bounceOffset;
        
        if (this.imagesLoaded && this.images[this.direction] && this.images[this.direction].complete) {
            ctx.drawImage(this.images[this.direction], this.x, drawY, this.width, this.height);
        } else {
            // Fallback: desenha retângulo
            ctx.fillStyle = CONFIG.COLORS.WOLF;
            ctx.fillRect(this.x, drawY, this.width, this.height);
        }
        
        // Desenha sombra no chão (sempre visível, exceto quando está morrendo)
        if (!this.dying) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(
                this.x + this.width / 2, 
                this.y + this.height, 
                this.width / 3, 
                this.height / 8, 
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }
        
        // Se está com flash de dano, desenha overlay vermelho (mas não quando está morrendo)
        if (this.hitFlashTime > 0 && !this.dying) {
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, drawY, this.width, this.height);
        }
        
        ctx.restore();
    }
}
