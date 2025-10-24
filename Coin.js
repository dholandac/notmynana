// Coin.js - Classe de moeda coletável

class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.startY = y; // Posição inicial Y para a animação de flutuação
        this.width = 12;
        this.height = 12;
        this.active = true;
        
        // Animação de flutuação
        this.floatTimer = Math.random() * Math.PI * 2; // Começa em fase aleatória
        this.floatSpeed = 4; // Velocidade da flutuação
        this.floatAmount = 8; // Altura da flutuação em pixels
        
        // Sistema de atração pelo jogador
        this.magnetRange = 120; // Distância em que começa a ser atraída
        this.magnetSpeed = 0.2; // Velocidade inicial de atração
        this.maxMagnetSpeed = 8; // Velocidade máxima de atração
        this.isBeingPulled = false;
        
        // Velocidade inicial (pequeno impulso ao spawnar)
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.friction = 0.9; // Desacelera rapidamente
        
        // Tempo de vida
        this.lifetime = 15000; // 15 segundos antes de desaparecer
        this.age = 0;
        this.fadeStartTime = 13000; // Começa a piscar aos 13 segundos
        
        // Pontos que essa moeda vale
        this.value = 10;
        
        // Efeito de brilho
        this.glowTimer = Math.random() * Math.PI * 2;
        this.glowSpeed = 3;
    }
    
    update(deltaTime, player) {
        // Atualiza idade
        this.age += deltaTime;
        
        // Remove moeda se passou do tempo de vida
        if (this.age >= this.lifetime) {
            this.active = false;
            return;
        }
        
        // Calcula distância até o jogador
        const dx = (player.x + player.width / 2) - (this.x + this.width / 2);
        const dy = (player.y + player.height / 2) - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Sistema de coleta
        if (distance < 20) { // Coleta quando muito perto
            this.active = false;
            return { collected: true, value: this.value };
        }
        
        // Sistema de atração magnética
        if (distance < this.magnetRange) {
            this.isBeingPulled = true;
            
            // Acelera em direção ao jogador
            const angle = Math.atan2(dy, dx);
            const pullForce = Math.min(this.maxMagnetSpeed, this.magnetSpeed * (1 + (this.magnetRange - distance) / this.magnetRange * 10));
            
            this.vx += Math.cos(angle) * pullForce;
            this.vy += Math.sin(angle) * pullForce;
            
            // Limita velocidade máxima
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > this.maxMagnetSpeed) {
                this.vx = (this.vx / speed) * this.maxMagnetSpeed;
                this.vy = (this.vy / speed) * this.maxMagnetSpeed;
            }
        } else {
            this.isBeingPulled = false;
            // Aplica fricção quando não está sendo atraída
            this.vx *= this.friction;
            this.vy *= this.friction;
        }
        
        // Atualiza posição
        this.x += this.vx;
        this.y += this.vy;
        
        // Mantém dentro dos limites do mundo
        this.x = Math.max(0, Math.min(CONFIG.WORLD_WIDTH - this.width, this.x));
        this.y = Math.max(0, Math.min(CONFIG.WORLD_HEIGHT - this.height, this.y));
        
        // Atualiza animação de flutuação
        this.floatTimer += (deltaTime / 1000) * this.floatSpeed;
        
        // Atualiza brilho
        this.glowTimer += (deltaTime / 1000) * this.glowSpeed;
        
        return { collected: false };
    }
    
    draw(ctx) {
        // Efeito de piscar quando está perto de desaparecer
        if (this.age >= this.fadeStartTime) {
            const blinkRate = 150; // ms
            if (Math.floor(this.age / blinkRate) % 2 === 0) {
                return; // Não desenha (pisca)
            }
        }
        
        // Calcula offset de flutuação
        const floatOffset = Math.sin(this.floatTimer) * this.floatAmount;
        
        // Calcula intensidade do brilho
        const glowIntensity = (Math.sin(this.glowTimer) + 1) / 2; // 0 a 1
        
        ctx.save();
        
        // Desenha sombra no chão PRIMEIRO (para dar sensação de profundidade)
        // A sombra fica sempre na mesma posição Y (no "chão")
        if (!this.isBeingPulled) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            const shadowX = this.x + this.width / 2;
            const shadowY = this.startY + this.height; // Usa startY para manter sombra fixa
            ctx.ellipse(shadowX, shadowY, this.width / 3, this.height / 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        // Sombra/brilho da moeda
        if (this.isBeingPulled) {
            ctx.shadowBlur = 15 + glowIntensity * 10;
            ctx.shadowColor = '#FFD700';
        } else {
            ctx.shadowBlur = 5 + glowIntensity * 5;
            ctx.shadowColor = '#FFD700';
        }
        
        // Desenha moeda (círculo dourado) com flutuação
        const centerX = this.x + this.width / 2;
        const centerY = this.startY + this.height / 2 + floatOffset; // Usa startY como base
        
        // Círculo externo (borda escura)
        ctx.fillStyle = '#B8860B';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo interno (dourado)
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width / 2 - 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Detalhe central (mais claro)
        ctx.fillStyle = '#FFF4A3';
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Símbolo de moeda (opcional - um "$" estilizado ou apenas brilho)
        ctx.fillStyle = '#B8860B';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', centerX, centerY);
        
        ctx.restore();
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}
