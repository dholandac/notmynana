// House.js - Classe da casa/abrigo que aparece após matar lobos

class House {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 120;
        this.height = 100;
        this.active = true;
        this.canEnter = true;
        
        // Efeito de brilho
        this.glowTimer = 0;
        this.glowSpeed = 2;
        
        // Carrega imagem
        this.image = new Image();
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            console.warn('Erro ao carregar imagem: house.png');
            this.imageLoaded = false;
        };
        this.image.src = CONFIG.ASSETS_PATH + 'house.png';
    }
    
    update(deltaTime) {
        // Atualiza animação de brilho
        this.glowTimer += (deltaTime / 1000) * this.glowSpeed;
    }
    
    isColliding(entity) {
        return (
            entity.x < this.x + this.width &&
            entity.x + entity.width > this.x &&
            entity.y < this.y + this.height &&
            entity.y + entity.height > this.y
        );
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Efeito de brilho pulsante mais natural
        if (this.canEnter) {
            const glowIntensity = (Math.sin(this.glowTimer) + 1) / 2; // 0 a 1
            
            // Brilho suave em tons terrosos/dourados
            const baseGlow = 8;
            const pulseGlow = 5;
            const glowSize = baseGlow + glowIntensity * pulseGlow;
            
            // Cor do brilho mais natural (laranja/âmbar)
            const glowAlpha = 0.4 + glowIntensity * 0.3;
            ctx.shadowBlur = glowSize;
            ctx.shadowColor = `rgba(255, 180, 80, ${glowAlpha})`; // Laranja/âmbar
            
            // Adiciona uma segunda camada de brilho mais sutil
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Desenha a casa
        if (this.imageLoaded && this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback: desenha retângulo simples
            ctx.fillStyle = '#8B4513'; // Marrom
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            // Telhado
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.moveTo(this.x - 10, this.y);
            ctx.lineTo(this.x + this.width / 2, this.y - 30);
            ctx.lineTo(this.x + this.width + 10, this.y);
            ctx.closePath();
            ctx.fill();
            
            // Porta
            ctx.fillStyle = '#4A2511';
            ctx.fillRect(this.x + this.width / 2 - 15, this.y + this.height - 40, 30, 40);
            
            // Janela
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(this.x + 20, this.y + 30, 25, 25);
            ctx.fillRect(this.x + this.width - 45, this.y + 30, 25, 25);
        }
        
        // Indicador visual de entrada se o player estiver próximo (REMOVIDO)
        // Não mostra mais o texto "ENTRAR"
        
        ctx.restore();
    }
}
