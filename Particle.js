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
        this.gravity = -0.05; // Gravidade negativa para poeira subir levemente
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

// Função para criar partículas de movimento (poeira dos pés)
function createMovementParticles(x, y, groundColor = '#6b8e6b') {
    const particles = [];
    const particleCount = 2 + Math.floor(Math.random() * 2); // 2-3 partículas
    
    for (let i = 0; i < particleCount; i++) {
        // Usa a cor do chão com leve variação (mais claras para contraste)
        const brightness = 1.2 + Math.random() * 0.3; // 1.2 a 1.5 (mais claras)
        const color = adjustColorBrightness(groundColor, brightness);
        
        // Velocidade pequena em direções aleatórias (mais para os lados)
        const angle = (Math.random() - 0.5) * Math.PI * 0.8; // Menos espalhamento
        const speed = 0.3 + Math.random() * 0.5; // Velocidade reduzida
        const velocityX = Math.cos(angle) * speed;
        const velocityY = -0.5 - Math.random() * 0.8; // Movimento para cima (poeira subindo)
        
        const size = 2 + Math.random() * 2; // Partículas médias (2-4px)
        const lifetime = 200 + Math.random() * 150; // 200-350ms (duração curta)
        
        particles.push(new Particle(x, y, color, velocityX, velocityY, size, lifetime));
    }
    
    return particles;
}

// Função auxiliar para ajustar brilho de uma cor hex
function adjustColorBrightness(hexColor, factor) {
    // Remove o # se existir
    hexColor = hexColor.replace('#', '');
    
    // Converte para RGB
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    
    // Ajusta brilho
    const newR = Math.min(255, Math.floor(r * factor));
    const newG = Math.min(255, Math.floor(g * factor));
    const newB = Math.min(255, Math.floor(b * factor));
    
    // Converte de volta para hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
