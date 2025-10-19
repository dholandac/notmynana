// Tree.js - Classe das árvores (obstáculos decorativos)

class Tree {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60; // Árvore tem altura maior que largura
        this.trunkWidth = 15;
        this.trunkHeight = 25;
        this.crownRadius = 25;
        this.type = 'tree';
        
        // Variação visual
        this.crownColor1 = this.randomGreen();
        this.crownColor2 = this.randomDarkGreen();
        this.swayOffset = Math.random() * Math.PI * 2; // Para animação de balanço
    }
    
    randomGreen() {
        const greens = ['#2d5016', '#3a6b1f', '#4a7c2a', '#2f5a1a'];
        return greens[Math.floor(Math.random() * greens.length)];
    }
    
    randomDarkGreen() {
        const darkGreens = ['#1a3a0f', '#234516', '#2a4f1a', '#1f3d12'];
        return darkGreens[Math.floor(Math.random() * darkGreens.length)];
    }
    
    isColliding(entity) {
        // Colisão apenas com o tronco (mais realista)
        const trunkX = this.x + (this.width - this.trunkWidth) / 2;
        const trunkY = this.y + this.height - this.trunkHeight;
        
        return checkCollision(
            { x: trunkX, y: trunkY, width: this.trunkWidth, height: this.trunkHeight },
            entity
        );
    }
    
    draw(ctx) {
        ctx.save();
        
        const time = Date.now() / 1000;
        const sway = Math.sin(time + this.swayOffset) * 2; // Balanço sutil
        
        const centerX = this.x + this.width / 2;
        const trunkY = this.y + this.height - this.trunkHeight;
        const crownY = this.y + this.height - this.trunkHeight - this.crownRadius + 10; // +10 para descer as folhas
        
        // Sombra da árvore
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(centerX + 3, this.y + this.height + 2, this.width / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tronco
        ctx.fillStyle = '#4a3728';
        const trunkX = centerX - this.trunkWidth / 2;
        ctx.fillRect(trunkX + sway * 0.3, trunkY, this.trunkWidth, this.trunkHeight);
        
        // Detalhes do tronco (textura)
        ctx.strokeStyle = '#3a2718';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const y = trunkY + (this.trunkHeight / 4) * (i + 1);
            ctx.beginPath();
            ctx.moveTo(trunkX + sway * 0.3, y);
            ctx.lineTo(trunkX + this.trunkWidth + sway * 0.3, y);
            ctx.stroke();
        }
        
        // Copa da árvore (3 círculos para dar volume)
        // Círculo traseiro (mais escuro)
        ctx.fillStyle = this.crownColor2;
        ctx.beginPath();
        ctx.arc(centerX - 8 + sway, crownY + 5, this.crownRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo direito
        ctx.fillStyle = this.crownColor1;
        ctx.beginPath();
        ctx.arc(centerX + 10 + sway, crownY, this.crownRadius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        
        // Círculo principal (centro)
        ctx.fillStyle = this.crownColor1;
        ctx.beginPath();
        ctx.arc(centerX + sway, crownY - 5, this.crownRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Borda escura da copa
        ctx.strokeStyle = this.crownColor2;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX + sway, crownY - 5, this.crownRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Highlights (brilho nas folhas)
        ctx.fillStyle = 'rgba(150, 200, 100, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX - 5 + sway, crownY - 10, this.crownRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Debug: desenha hitbox do tronco
        // const trunkHitboxX = centerX - this.trunkWidth / 2;
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(trunkHitboxX, trunkY, this.trunkWidth, this.trunkHeight);
    }
}
