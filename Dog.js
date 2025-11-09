// Dog.js - Classe do cachorro comprável na casa

class Dog {
    constructor(x, y, price = 300, isPet = false) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.price = price;
        this.purchased = false;
        this.active = true;
        this.isPet = isPet; // Se true, comporta-se como pet do jogador
        
        // Efeito de brilho (apenas para loja)
        this.glowTimer = 0;
        this.glowSpeed = 3;
        
        // Animação de interação (apenas para loja)
        this.bounceOffset = 0;
        this.bounceSpeed = 4;
        
        // Comportamento de pet
        this.speed = 3.5; // Velocidade base
        this.followDistance = 120; // Distância ideal do jogador (aumentada para mais liberdade)
        this.attackCooldown = 0;
        this.attackCooldownTime = 2000; // 2 segundos
        this.attackRange = 50; // Distância para atacar lobo (aumentada)
        this.isAttacking = false;
        this.currentTarget = null;
        this.attackSpeed = 5; // Velocidade ao atacar
        
        // Sistema de movimento e direção (igual ao lobo/player)
        this.direction = 'dir'; // 'dir' ou 'esq'
        this.directionChangeTimer = 0;
        this.directionChangeCooldown = 200;
        
        // Sistema de pulinhos ao andar
        this.bounceTimer = 0;
        this.bounceSpeed = 12; // Velocidade do pulo (igual ao lobo)
        this.bounceHeight = 6; // Altura do pulo
        this.bounceOffsetPet = 0; // Offset vertical atual
        
        // Sistema de partículas de movimento
        this.movementParticleTimer = 0;
        this.movementParticleRate = 120;
        
        // Carrega imagem
        this.image = new Image();
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            console.warn('Erro ao carregar imagem: cachorro.png');
            this.imageLoaded = false;
        };
        this.image.src = CONFIG.ASSETS_PATH + 'cachorro.png';
    }
    
    update(deltaTime, player, wolves, obstacles = []) {
        // Se não é pet e já foi comprado, não faz nada
        if (!this.isPet && this.purchased) return;
        
        // Se não é pet, apenas anima na loja
        if (!this.isPet) {
            // Atualiza animação de brilho
            this.glowTimer += (deltaTime / 1000) * this.glowSpeed;
            
            // Atualiza animação de bounce
            this.bounceOffset = Math.sin(this.glowTimer * 2) * 5;
            return;
        }
        
        // Comportamento de pet
        // Atualiza cooldown de ataque
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Atualiza timer de mudança de direção
        if (this.directionChangeTimer > 0) {
            this.directionChangeTimer -= deltaTime;
        }
        
        // Procura lobo mais próximo do player
        let nearestWolf = null;
        let nearestDistance = Infinity;
        let nearestDistanceToPlayer = Infinity;
        
        if (wolves && wolves.length > 0) {
            wolves.forEach(wolf => {
                // Lobos não têm propriedade 'active', apenas verificamos se não estão dying
                if (!wolf.dying) {
                    const distToPlayer = Math.sqrt(
                        Math.pow(wolf.x - player.x, 2) + Math.pow(wolf.y - player.y, 2)
                    );
                    
                    // Lobo está perto do player (dentro de 250 pixels)
                    if (distToPlayer < 250) {
                        const distToDog = Math.sqrt(
                            Math.pow(wolf.x - this.x, 2) + Math.pow(wolf.y - this.y, 2)
                        );
                        
                        // Pega o lobo mais próximo do cachorro
                        if (distToDog < nearestDistance) {
                            nearestDistance = distToDog;
                            nearestDistanceToPlayer = distToPlayer;
                            nearestWolf = wolf;
                        }
                    }
                }
            });
        }
        
        // Guarda posição anterior para colisões
        const prevX = this.x;
        const prevY = this.y;
        let moved = false;
        let killedWolf = null; // Para informar ao Game sobre lobos mortos
        
        // PRIORIDADE 1: Se há um lobo próximo ao player, ataca (independente da distância do player)
        if (nearestWolf) {
            const dx = nearestWolf.x - this.x;
            const dy = nearestWolf.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Se cooldown acabou e está perto o suficiente, morde
            if (this.attackCooldown <= 0 && distance < this.attackRange) {
                // Causa dano ao lobo usando o método correto
                const wolfDied = nearestWolf.takeDamage();
                
                // Se o lobo morreu, guarda referência
                if (wolfDied) {
                    killedWolf = nearestWolf;
                    audioManager.play('wolf_dead');
                }
                
                // Reseta cooldown
                this.attackCooldown = this.attackCooldownTime;
                
                // Toca som de ataque
                audioManager.play('tap');
            } else if (distance >= this.attackRange) {
                // Move em direção ao lobo para atacar
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.attackSpeed;
                this.y += Math.sin(angle) * this.attackSpeed;
                moved = true;
                
                // Atualiza direção baseado no movimento
                if (Math.abs(dx) > 0.1 && this.directionChangeTimer <= 0) {
                    const newDirection = dx > 0 ? 'dir' : 'esq';
                    if (newDirection !== this.direction) {
                        this.direction = newDirection;
                        this.directionChangeTimer = this.directionChangeCooldown;
                    }
                }
            }
        } else {
            // PRIORIDADE 2: Se não há lobos, segue o jogador (mas não fica grudado)
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Só se move se estiver longe do jogador
            if (distance > this.followDistance) {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
                moved = true;
                
                // Atualiza direção baseado no movimento
                if (Math.abs(dx) > 0.1 && this.directionChangeTimer <= 0) {
                    const newDirection = dx > 0 ? 'dir' : 'esq';
                    if (newDirection !== this.direction) {
                        this.direction = newDirection;
                        this.directionChangeTimer = this.directionChangeCooldown;
                    }
                }
            }
        }
        
        // Verifica colisões com obstáculos
        if (obstacles && obstacles.length > 0) {
            for (let obstacle of obstacles) {
                if (obstacle.isColliding && obstacle.isColliding(this)) {
                    this.x = prevX;
                    this.y = prevY;
                    break;
                }
            }
        }
        
        // Mantém dentro dos limites do mundo
        this.x = Math.max(0, Math.min(CONFIG.WORLD_WIDTH - this.width, this.x));
        this.y = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT - this.height, this.y));
        
        // Atualiza animação de pulinhos (sempre quando está se movendo)
        if (moved) {
            this.bounceTimer += deltaTime / 1000; // Converte para segundos
            this.bounceOffsetPet = Math.abs(Math.sin(this.bounceTimer * this.bounceSpeed)) * this.bounceHeight;
            
            // Cria partículas de movimento
            this.movementParticleTimer += deltaTime;
            if (this.movementParticleTimer >= this.movementParticleRate) {
                this.movementParticleTimer = 0;
                const footX = this.x + this.width / 2;
                const footY = this.y + this.height;
                return {
                    particles: createMovementParticles(footX, footY, CONFIG.COLORS.GROUND),
                    killedWolf: killedWolf
                };
            }
        }
        
        // Retorna informação sobre lobo morto (mesmo sem partículas)
        if (killedWolf) {
            return {
                particles: null,
                killedWolf: killedWolf
            };
        }
        
        return null;
    }
    
    isPlayerNear(player) {
        if (this.purchased) return false;
        
        const distance = Math.sqrt(
            Math.pow(player.x + player.width / 2 - (this.x + this.width / 2), 2) +
            Math.pow(player.y + player.height / 2 - (this.y + this.height / 2), 2)
        );
        
        return distance < 60; // Distância de interação
    }
    
    purchase(game) {
        if (this.purchased) return false;
        if (game.coins < this.price) return false;
        
        // Remove moedas
        game.coins -= this.price;
        this.purchased = true;
        
        // Toca som de compra (pode usar o confirm.wav)
        audioManager.play('confirm');
        
        return true;
    }
    
    draw(ctx, player, game) {
        // Se não é pet e já foi comprado, não desenha
        if (!this.isPet && this.purchased) return;
        if (!this.active) return;
        
        ctx.save();
        
        // Desenha o cachorro na loja (com brilho)
        if (!this.isPet) {
            // Efeito de brilho pulsante apenas na loja
            const glowIntensity = (Math.sin(this.glowTimer) + 1) / 2; // 0 a 1
            
            const baseGlow = 10;
            const pulseGlow = 8;
            const glowSize = baseGlow + glowIntensity * pulseGlow;
            
            const glowAlpha = 0.5 + glowIntensity * 0.3;
            ctx.shadowBlur = glowSize;
            ctx.shadowColor = `rgba(255, 215, 0, ${glowAlpha})`; // Dourado
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // Desenha o cachorro com bounce
            const drawY = this.y + this.bounceOffset;
            
            if (this.imageLoaded && this.image.complete) {
                ctx.drawImage(this.image, this.x, drawY, this.width, this.height);
            } else {
                // Fallback: desenha um retângulo com "cor de cachorro"
                ctx.fillStyle = '#D2691E'; // Marrom claro
                ctx.fillRect(this.x, drawY, this.width, this.height);
                
                // Orelhas
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.arc(this.x + 10, drawY + 5, 8, 0, Math.PI * 2);
                ctx.arc(this.x + 30, drawY + 5, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Olhos
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(this.x + 12, drawY + 15, 3, 0, Math.PI * 2);
                ctx.arc(this.x + 28, drawY + 15, 3, 0, Math.PI * 2);
                ctx.fill();
                
                // Focinho
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(this.x + 20, drawY + 25, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
            
            // Desenha placa de preço
            ctx.save();
            ctx.shadowBlur = 0;
            
            const priceText = `${this.price} moedas`;
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            
            // Fundo da placa
            const textWidth = ctx.measureText(priceText).width;
            const padding = 8;
            const plateX = this.x + this.width / 2 - (textWidth + padding * 2) / 2;
            const plateY = drawY - 25;
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.roundRect(plateX, plateY, textWidth + padding * 2, 22, 5);
            ctx.fill();
            
            // Texto do preço
            ctx.fillStyle = '#FFD700'; // Dourado
            ctx.fillText(priceText, this.x + this.width / 2, drawY - 10);
            
            ctx.restore();
            
            // Desenha indicação de interação se o jogador estiver próximo
            if (player && game && this.isPlayerNear(player)) {
                ctx.save();
                ctx.shadowBlur = 0;
                
                const canAfford = game.coins >= this.price;
                const instructionText = canAfford 
                    ? 'Pressione ESPAÇO para comprar' 
                    : 'Moedas insuficientes';
                
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                
                // Fundo da instrução
                const instrWidth = ctx.measureText(instructionText).width;
                const instrPadding = 6;
                const instrX = this.x + this.width / 2 - (instrWidth + instrPadding * 2) / 2;
                const instrY = drawY + this.height + 5;
                
                ctx.fillStyle = canAfford ? 'rgba(0, 150, 0, 0.8)' : 'rgba(150, 0, 0, 0.8)';
                ctx.roundRect(instrX, instrY, instrWidth + instrPadding * 2, 20, 5);
                ctx.fill();
                
                // Texto da instrução
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(instructionText, this.x + this.width / 2, instrY + 14);
                
                ctx.restore();
            }
            
            return;
        }
        
        // Desenha o pet (SEM brilho, COM bounce e direção)
        const drawY = this.y - this.bounceOffsetPet;
        
        // Se tem imagem, espelha baseado na direção (invertido: dir=espelhado, esq=normal)
        if (this.imageLoaded && this.image.complete) {
            if (this.direction === 'dir') {
                ctx.save();
                ctx.translate(this.x + this.width, drawY);
                ctx.scale(-1, 1);
                ctx.drawImage(this.image, 0, 0, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(this.image, this.x, drawY, this.width, this.height);
            }
        } else {
            // Fallback com emoji de cachorro
            ctx.save();
            ctx.font = `${this.width * 1.2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            if (this.direction === 'dir') {
                ctx.translate(this.x + this.width / 2, drawY + this.height / 2);
                ctx.scale(-1, 1);
                ctx.fillText('🐕', 0, 0);
            } else {
                ctx.fillText('🐕', this.x + this.width / 2, drawY + this.height / 2);
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    }
}
