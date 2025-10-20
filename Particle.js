// Particle.js - Sistema de partículas

class Particle {
    constructor(x, y, color, velocityX, velocityY, size = 3, lifetime = 500) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.active = true;
        this.gravity = 0.2; // Gravidade para as partículas caírem
    }
    
    update(deltaTime) {
        // Atualiza posição
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Aplica gravidade
        this.velocityY += this.gravity;
        
        // Atualiza tempo de vida
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        const alpha = this.lifetime / this.maxLifetime; // Fade out
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Função auxiliar para criar partículas de folhas/lascas de madeira
function createTreeHitParticles(x, y, isDestroyed = false) {
    const particles = [];
    const particleCount = isDestroyed ? 20 + Math.floor(Math.random() * 10) : 8 + Math.floor(Math.random() * 5); // Mais partículas ao destruir
    
    for (let i = 0; i < particleCount; i++) {
        // Cores de folhas e madeira
        const colors = [
            '#2d5016', '#3a6b1f', '#4a7c2a', // Verdes (folhas)
            '#654321', '#8B4513', '#A0522D'  // Marrons (madeira)
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Velocidade aleatória em todas as direções
        const angle = Math.random() * Math.PI * 2;
        const speed = isDestroyed ? 3 + Math.random() * 5 : 2 + Math.random() * 3; // Mais rápido ao destruir
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed - (isDestroyed ? 3 : 2); // Mais para cima ao destruir
        
        const size = isDestroyed ? 2 + Math.random() * 4 : 2 + Math.random() * 3; // Tamanho variado
        const lifetime = isDestroyed ? 600 + Math.random() * 600 : 400 + Math.random() * 400; // Dura mais ao destruir
        
        particles.push(new Particle(x, y, color, velocityX, velocityY, size, lifetime));
    }
    
    return particles;
}
