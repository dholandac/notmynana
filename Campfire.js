// Campfire.js - Classe da fogueira dentro da casa

class Campfire {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        
        // Animação de fogo
        this.fireTimer = 0;
        this.fireSpeed = 8;
        
        // Partículas de fumaça
        this.smokeParticles = [];
        this.smokeTimer = 0;
        this.smokeRate = 200; // ms
        
        // Carrega imagem
        this.image = new Image();
        this.imageLoaded = false;
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            console.warn('Erro ao carregar imagem: campfire.png');
            this.imageLoaded = false;
        };
        this.image.src = CONFIG.ASSETS_PATH + 'campfire.png';
    }
    
    update(deltaTime) {
        this.fireTimer += (deltaTime / 1000) * this.fireSpeed;
        
        // Atualiza timer de fumaça
        this.smokeTimer += deltaTime;
        if (this.smokeTimer >= this.smokeRate) {
            this.smokeTimer = 0;
            this.createSmokeParticle();
        }
        
        // Atualiza partículas de fumaça
        this.smokeParticles = this.smokeParticles.filter(particle => {
            particle.y -= particle.speed;
            particle.opacity -= 0.01;
            particle.x += Math.sin(particle.y * 0.1) * 0.5;
            return particle.opacity > 0;
        });
    }
    
    createSmokeParticle() {
        this.smokeParticles.push({
            x: this.x + this.width / 2 + (Math.random() - 0.5) * 20,
            y: this.y,
            speed: 0.5 + Math.random() * 0.5,
            opacity: 0.6,
            size: 10 + Math.random() * 10
        });
    }
    
    draw(ctx) {
        ctx.save();
        
        // Desenha partículas de fumaça
        this.smokeParticles.forEach(particle => {
            ctx.save(); // Save individual para cada partícula
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = '#666666';
            // Desenha quadrado ao invés de círculo
            ctx.fillRect(
                particle.x - particle.size, 
                particle.y - particle.size, 
                particle.size * 2, 
                particle.size * 2
            );
            ctx.restore(); // Restore individual
        });
        
        ctx.globalAlpha = 1;
        
        // Efeito de luz alaranjada
        const lightIntensity = (Math.sin(this.fireTimer * 2) + 1) / 2;
        ctx.shadowBlur = 30 + lightIntensity * 20;
        ctx.shadowColor = '#FF6600';
        
        if (this.imageLoaded && this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            // Fallback: desenha fogueira simples
            // Base de pedras
            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height - 10, 25, 0, Math.PI * 2);
            ctx.fill();
            
            // Lenha
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x + 10, this.y + this.height - 15, 30, 8);
            ctx.fillRect(this.x + 15, this.y + this.height - 20, 20, 8);
            
            // Chamas (animadas)
            const flame1Height = 20 + Math.sin(this.fireTimer) * 5;
            const flame2Height = 25 + Math.cos(this.fireTimer * 1.3) * 5;
            const flame3Height = 18 + Math.sin(this.fireTimer * 0.8) * 5;
            
            // Chama 1 (laranja)
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2 - 10, this.y + this.height - 20);
            ctx.lineTo(this.x + this.width / 2 - 5, this.y + this.height - 20 - flame1Height);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height - 20);
            ctx.closePath();
            ctx.fill();
            
            // Chama 2 (amarela)
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height - 20);
            ctx.lineTo(this.x + this.width / 2, this.y + this.height - 20 - flame2Height);
            ctx.lineTo(this.x + this.width / 2 + 5, this.y + this.height - 20);
            ctx.closePath();
            ctx.fill();
            
            // Chama 3 (laranja)
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2 + 5, this.y + this.height - 20);
            ctx.lineTo(this.x + this.width / 2 + 10, this.y + this.height - 20 - flame3Height);
            ctx.lineTo(this.x + this.width / 2 + 15, this.y + this.height - 20);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
}
