// Crate.js - Classe das caixas de powerup

class Crate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.CRATE_WIDTH;
        this.height = CONFIG.CRATE_HEIGHT;
        this.active = true;
        this.broken = false; // Se a caixa foi quebrada
        this.powerupRevealed = false; // Se o power up foi revelado
        
        // Escolhe powerup aleatório
        const powerupTypes = Object.values(CONFIG.POWERUPS);
        this.powerupType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        
        // Animação
        this.floatTimer = Math.random() * Math.PI * 2;
        this.floatSpeed = 2;
        this.floatAmount = 5;
        
        // Carrega imagem da caixa
        this.image = new Image();
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            console.warn('Erro ao carregar imagem: caixa.png');
            this.imageLoaded = false;
        };
        this.image.src = CONFIG.ASSETS_PATH + 'caixa.png';
    }
    
    getPowerupEmoji() {
        switch(this.powerupType) {
            case CONFIG.POWERUPS.FIRE_RATE:
                return '⚡'; // Raio - cadência de tiro
            case CONFIG.POWERUPS.BULLET_SPEED:
                return '▶'; // Seta grossa - velocidade de bala
            case CONFIG.POWERUPS.BULLET_SIZE:
                return '●'; // Círculo grande - tamanho de bala
            case CONFIG.POWERUPS.MOVEMENT_SPEED:
                return '▲'; // Seta grossa para cima - velocidade de movimento
            case CONFIG.POWERUPS.PIERCING:
                return '◆'; // Diamante - perfuração
            case CONFIG.POWERUPS.HEALTH:
                return '♥'; // Coração - vida
            default:
                return '★';
        }
    }
    
    break() {
        if (this.broken) return null;
        
        this.broken = true;
        this.powerupRevealed = true;
        
        // Retorna informações para criar partículas
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            createParticles: true
        };
    }
    
    isCollidingWithBullet(bullet) {
        if (this.broken) return false;
        
        return (
            bullet.x < this.x + this.width &&
            bullet.x + bullet.width > this.x &&
            bullet.y < this.y + this.height &&
            bullet.y + bullet.height > this.y
        );
    }
    
    collect() {
        if (!this.broken) return null; // Só pode coletar se estiver quebrada
        
        this.active = false;
        return this.powerupType;
    }
    
    update(deltaTime) {
        // Atualiza animação de flutuação
        this.floatTimer += (deltaTime / 1000) * this.floatSpeed;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const floatOffset = Math.sin(this.floatTimer) * this.floatAmount;
        const drawY = this.y + floatOffset;
        
        // Se a caixa não foi quebrada, desenha a caixa
        if (!this.broken) {
            ctx.save();
            
            // Brilho suave
            const time = Date.now() / 1000;
            const glowIntensity = (Math.sin(time * 2) + 1) / 2;
            ctx.shadowBlur = 8 + glowIntensity * 4;
            ctx.shadowColor = 'rgba(255, 200, 100, 0.5)';
            
            if (this.imageLoaded && this.image.complete) {
                ctx.drawImage(this.image, this.x, drawY, this.width, this.height);
            } else {
                // Fallback: desenha caixa marrom
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(this.x, drawY, this.width, this.height);
                
                // Bordas
                ctx.strokeStyle = '#654321';
                ctx.lineWidth = 3;
                ctx.strokeRect(this.x, drawY, this.width, this.height);
                
                // Detalhes
                ctx.strokeStyle = '#4A2511';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.x, drawY + this.height / 2);
                ctx.lineTo(this.x + this.width, drawY + this.height / 2);
                ctx.stroke();
            }
            
            ctx.restore();
        } 
        // Se foi quebrada, desenha o power up como símbolo
        else {
            ctx.save();
            
            // Brilho pulsante para o power up
            const time = Date.now() / 500;
            const pulse = Math.sin(time) * 0.15 + 1;
            
            // Cor baseada no tipo de power up
            let powerupColor = '#FFD700'; // Dourado padrão
            switch(this.powerupType) {
                case CONFIG.POWERUPS.FIRE_RATE:
                    powerupColor = '#FF6B6B'; // Vermelho
                    break;
                case CONFIG.POWERUPS.BULLET_SPEED:
                    powerupColor = '#4ECDC4'; // Ciano
                    break;
                case CONFIG.POWERUPS.BULLET_SIZE:
                    powerupColor = '#FFE66D'; // Amarelo
                    break;
                case CONFIG.POWERUPS.MOVEMENT_SPEED:
                    powerupColor = '#95E1D3'; // Verde água
                    break;
                case CONFIG.POWERUPS.PIERCING:
                    powerupColor = '#C44569'; // Rosa
                    break;
                case CONFIG.POWERUPS.HEALTH:
                    powerupColor = '#FF3838'; // Vermelho brilhante
                    break;
            }
            
            // Brilho externo colorido
            ctx.shadowBlur = 20 + Math.sin(time) * 8;
            ctx.shadowColor = powerupColor;
            
            // Desenha símbolo do power up
            const centerX = this.x + this.width / 2;
            const centerY = drawY + this.height / 2;
            
            ctx.fillStyle = powerupColor;
            ctx.font = `bold ${35 * pulse}px Arial`; // 50 * 0.7 = 35
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.getPowerupEmoji(), centerX, centerY);
            
            ctx.restore();
        }
    }
}
